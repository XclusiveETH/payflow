package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.config.PayflowConfig;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.nft.ParsedMintUrlMessage;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.utils.MintUrlUtils;

import java.text.DecimalFormat;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class NotificationService {
	@Autowired
	private PayflowConfig payflowConfig;

	@Autowired
	private FarcasterNeynarService hubService;

	@Value("${payflow.farcaster.bot.cast.signer}")
	private String botSignerUuid;

	@Value("${payflow.farcaster.bot.reply.enabled:true}")
	private boolean isBotReplyEnabled;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Autowired
	private ReceiptService receiptService;


	@Value("${payflow.frames.url}")
	private String framesServiceUrl;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	public void paymentReply(Payment payment, FarcasterUser sender, FarcasterUser receiver) {
		val senderIdentity = payment.getSender() != null ? payment.getSender().getIdentity()
				: payment.getSenderAddress();
		val receiverIdentity = payment.getReceiver() != null ? payment.getReceiver().getIdentity()
				: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
				: "fc_fid:" + payment.getReceiverFid();

		if (StringUtils.isBlank(senderIdentity) || StringUtils.isBlank((receiverIdentity))) {
			log.error("Sender or receiver can't be unknown for payment: {}", payment);
			return;
		}

		val senderFname = sender != null ? sender.username() : identityService.getIdentityFname(senderIdentity);
		val receiverFname = receiver != null ? receiver.username() : identityService.getIdentityFname(receiverIdentity);
		val receiptUrl = receiptService.getReceiptUrl(payment);
		val embeds = Collections.singletonList(new Cast.Embed(receiptUrl));

		val castText = String.format("""
						@%s, you've been paid %s %s by @%s 💸""",
				receiverFname,
				StringUtils.isNotBlank(payment.getTokenAmount())
						? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
						: String.format("$%s", payment.getUsdAmount()),
				payment.getToken().toUpperCase(),
				senderFname);

		var processed = this.reply(castText,
				payment.getSourceHash(),
				embeds);

		if (!processed) {
			log.error("Failed to reply with {} for payment intent completion", castText);
		}
	}

	public boolean preferredTokensReply(String parentHash, FarcasterUser user,
	                                    List<String> preferredTokenIds) {

		val formattedTokenIds = String.join(", ", preferredTokenIds).toUpperCase();
		val castText = String.format("""
						@%s, your preferred receiving tokens have been updated:
						%s ✅""",
				user.username(), formattedTokenIds);

		val embeds = Collections.singletonList(new Cast.Embed(
				UriComponentsBuilder.fromHttpUrl(
						payflowConfig.getFramesServiceUrl()).path(user.username()).build().toUriString()));
		var processed = this.reply(castText, parentHash, embeds);
		if (!processed) {
			log.error("Failed to reply with {} for preferredTokens configuration", castText);
			return false;

		}
		return true;
	}

	public boolean reply(String text, String parentHash, List<Cast.Embed> embeds) {
		if (isBotReplyEnabled) {
			var response = hubService.cast(botSignerUuid, text, parentHash, embeds);
			if (response != null && response.success()) {
				log.debug("Successfully processed bot cast with reply: {}",
						response.cast());
				return true;
			} else {
				response = hubService.cast(botSignerUuid, text, null, embeds);
				if (response != null && response.success()) {
					log.debug("Successfully processed bot cast without reply: {}",
							response.cast());
					return true;
				}
			}
		} else {
			log.debug("Bot reply disabled, skipping casting the reply");
			return true;
		}

		return false;
	}

	public void notifyPaymentCompletion(Payment payment, User user) {
		if (!StringUtils.isBlank(payment.getHash())) {
			val receiverFname = identityService
					.getIdentityFname(payment.getReceiver() != null ? payment.getReceiver().getIdentity()
							: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
							: "fc_fid:" + payment.getReceiverFid());
			if (StringUtils.isBlank(receiverFname)) {
				log.warn("Can't notify user, since farcaster name wasn't found: {}", payment);
				return;
			}

			val senderFname = identityService.getIdentityFname(user.getIdentity());
			val receiptUrl = receiptService.getReceiptUrl(payment);
			var embeds = Collections.singletonList(new Cast.Embed(receiptUrl));
			val sourceRefText = StringUtils.isNotBlank(payment.getSourceHash()) ? String.format(
					"🔗 Source: https://warpcast.com/%s/%s",
					receiverFname, payment.getSourceHash().substring(0, 10)) : "";

			val crossChainText = payment.getFulfillmentId() != null ? " (cross-chain)" : "";

			val isSelfPurchase = StringUtils.equalsIgnoreCase(senderFname, receiverFname);

			if (StringUtils.isBlank(payment.getCategory())) {
				handleP2PPaymentNotification(payment, senderFname, receiverFname, embeds, crossChainText,
						sourceRefText);
			} else if (payment.getCategory().equals("fc_storage")) {
				handleStoragePaymentNotification(payment, senderFname, receiverFname, embeds, crossChainText,
						sourceRefText);
			} else if (payment.getCategory().equals("mint")) {
				handleMintPaymentNotification(payment, senderFname, receiverFname, embeds, sourceRefText,
						isSelfPurchase);
			} else if (payment.getCategory().equals("fan")) {
				handleFanTokenPaymentNotification(payment, senderFname, receiverFname, embeds, crossChainText,
						sourceRefText, isSelfPurchase);
			}
		}
	}

	private void sendCastReply(String castText, String sourceHash, List<Cast.Embed> embeds) {
		val processed = reply(castText, sourceHash, embeds);
		if (!processed) {
			log.error("Failed to reply with {} for payment completion", castText);
		}
	}

	private void sendDirectMessage(String messageText, String receiverFid) {
		try {
			val response = farcasterMessagingService.message(
					new DirectCastMessage(receiverFid, messageText, UUID.randomUUID()));

			if (!response.result().success()) {
				log.error("Failed to send direct cast with {} for payment completion", messageText);
			}
		} catch (Throwable t) {
			log.error("Failed to send direct cast with exception: ", t);
		}
	}

	private void handleP2PPaymentNotification(Payment payment, String senderFname, String receiverFname,
	                                          List<Cast.Embed> embeds, String crossChainText, String sourceRefText) {
		if (payment.getType().equals(Payment.PaymentType.INTENT_TOP_REPLY)) {
			var scvText = "";
			val cast = socialGraphService.getReplySocialCapitalValue(payment.getSourceHash());
			if (cast != null) {
				scvText = String.format("with cast score: %s ",
						formatDouble(cast.getSocialCapitalValue().getFormattedValue()));
			}

			val castText = String.format("""
							@%s, you've been paid %s %s%s by @%s for your top comment %s 🏆""",
					receiverFname,
					StringUtils.isNotBlank(payment.getTokenAmount())
							? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
							: String.format("$%s", payment.getUsdAmount()),
					payment.getToken().toUpperCase(),
					crossChainText,
					senderFname,
					scvText);

			sendCastReply(castText, payment.getSourceHash(), embeds);
		} else {
			val castText = String.format("""
							@%s, you've been paid %s %s%s by @%s 💸""",
					receiverFname,
					StringUtils.isNotBlank(payment.getTokenAmount())
							? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
							: String.format("$%s", payment.getUsdAmount()),
					payment.getToken().toUpperCase(),
					crossChainText,
					senderFname);

			sendCastReply(castText, payment.getSourceHash(), embeds);

			if (payment.getReceiver() != null) {
				val receiverFid = identityService.getIdentityFid(payment.getReceiver().getIdentity());
				if (StringUtils.isNotBlank(receiverFid)) {
					val messageText = String.format("""
									@%s, you've been paid %s %s%s by @%s 💸

									%s
									🧾 Receipt: %s""",
							receiverFname,
							StringUtils.isNotBlank(payment.getTokenAmount())
									? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
									: String.format("$%s", payment.getUsdAmount()),
							payment.getToken().toUpperCase(),
							crossChainText,
							senderFname,
							sourceRefText,
							receiptService.getReceiptUrl(payment));

					sendDirectMessage(messageText, receiverFid);
				}
			}
		}
	}

	private void handleStoragePaymentNotification(Payment payment, String senderFname, String receiverFname,
	                                              List<Cast.Embed> embeds, String crossChainText, String sourceRefText) {
		val storageFrameUrl = UriComponentsBuilder.fromHttpUrl(framesServiceUrl)
				.path("/fid/{fid}/storage?v3")
				.buildAndExpand(payment.getReceiverFid())
				.toUriString();

		val castText = String.format("""
						@%s, you've been paid %s unit(s) of storage%s by @%s 🗄""",
				receiverFname,
				payment.getTokenAmount(),
				crossChainText,
				senderFname);

		embeds = List.of(new Cast.Embed(storageFrameUrl), new Cast.Embed(receiptService.getReceiptUrl(payment)));
		sendCastReply(castText, payment.getSourceHash(), embeds);

		if (payment.getReceiver() != null) {
			val messageText = String.format("""
							@%s, you've been paid %s units of storage%s by @%s 🗄

							%s
							🧾 Receipt: %s
							📊 Your storage usage now: %s""",
					receiverFname,
					payment.getTokenAmount(),
					crossChainText,
					senderFname,
					sourceRefText,
					receiptService.getReceiptUrl(payment),
					storageFrameUrl);

			sendDirectMessage(messageText, payment.getReceiverFid().toString());
		}
	}

	private void handleMintPaymentNotification(Payment payment, String senderFname, String receiverFname,
	                                           List<Cast.Embed> embeds, String sourceRefText, boolean isSelfPurchase) {
		val mintUrlMessage = ParsedMintUrlMessage.fromCompositeToken(payment.getToken(),
				payment.getNetwork().toString());

		val frameMintUrl = MintUrlUtils.calculateFrameMintUrlFromToken(
				framesServiceUrl,
				payment.getToken(),
				payment.getNetwork().toString(),
				payment.getSender().getIdentity());

		var authorPart = "";
		if (mintUrlMessage != null && mintUrlMessage.author() != null) {
			val author = identityService.getIdentityFname(mintUrlMessage.author());
			if (author != null) {
				authorPart = String.format("@%s's ", author);
			}
		}

		val tokenAmount = Double.parseDouble(payment.getTokenAmount());
		val tokenAmountText = tokenAmount > 1 ? tokenAmount + "x " : "";

		String castText;
		if (isSelfPurchase) {
			castText = String.format("""
							@%s, you've successfully minted %s%scollectible from the cast above ✨""",
					senderFname,
					tokenAmountText,
					authorPart);
		} else {
			castText = String.format("""
							@%s, you've been gifted %s%scollectible by @%s from the cast above  ✨""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname);
		}

		embeds = List.of(new Cast.Embed(frameMintUrl), new Cast.Embed(receiptService.getReceiptUrl(payment)));
		sendCastReply(castText, payment.getSourceHash(), embeds);

		if (payment.getReceiver() != null) {
			String messageText;
			if (isSelfPurchase) {
				messageText = String.format("""
								@%s, you've successfully minted %s%scollectible from the cast above ✨

								%s
								🧾 Receipt: %s""",
						senderFname,
						tokenAmountText,
						authorPart,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			} else {
				messageText = String.format("""
								@%s, you've been gifted %s%scollectible by @%s from the cast above ✨

								%s
								🧾 Receipt: %s""",
						receiverFname,
						tokenAmountText,
						authorPart,
						senderFname,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			}

			sendDirectMessage(messageText, payment.getReceiverFid().toString());
		}
	}

	private void handleHypersubPaymentNotification(Payment payment, String senderFname,
	                                               String receiverFname,
	                                               List<Cast.Embed> embeds, String sourceRefText, boolean isSelfPurchase) {
		val tokenAmount = Double.parseDouble(payment.getTokenAmount());
		val tokenAmountText = tokenAmount + " month(s) ";

		val authorPart = "";

		String castText;
		if (isSelfPurchase) {
			castText = String.format("""
							@%s, you've successfully subscribed to %s of %shypersub from the cast above 🕐""",
					senderFname,
					tokenAmountText,
					authorPart);
		} else {
			castText = String.format("""
							@%s, you've been gifted %s of %shypersub subscription by @%s from the cast above 🕐""",
					receiverFname,
					tokenAmountText,
					authorPart,
					senderFname);
		}

		sendCastReply(castText, payment.getSourceHash(), embeds);

		if (payment.getReceiver() != null) {
			String messageText;
			if (isSelfPurchase) {
				messageText = String.format("""
								@%s, you've successfully subscribed to %s of %shypersub from the cast above 🕐

								%s
								🧾 Receipt: %s""",
						senderFname,
						tokenAmountText,
						authorPart,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			} else {
				messageText = String.format("""
								@%s, you've been gifted %s of %shypersub subscription by @%s from the cast above 🕐

								%s
								🧾 Receipt: %s""",
						receiverFname,
						tokenAmountText,
						authorPart,
						senderFname,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			}

			sendDirectMessage(messageText, payment.getReceiverFid().toString());
		}
	}

	private void handleFanTokenPaymentNotification(Payment payment, String senderFname, String receiverFname,
	                                               List<Cast.Embed> embeds, String crossChainText, String sourceRefText, boolean isSelfPurchase) {
		val fanTokenParts = payment.getToken().split(";");
		var fanTokenName = fanTokenParts[0];

		if (!fanTokenName.startsWith("/") && !fanTokenName.toLowerCase().startsWith("network:")) {
			fanTokenName = "@" + fanTokenName;
		}

		String castText;
		if (isSelfPurchase) {
			castText = String.format("""
							@%s, you've successfully purchased %s %s fan token(s)%s Ⓜ️""",
					senderFname,
					payment.getTokenAmount(),
					fanTokenName,
					crossChainText);
		} else {
			castText = String.format("""
							@%s, you've been gifted %s %s fan token(s) by @%s%s Ⓜ️""",
					receiverFname,
					payment.getTokenAmount(),
					fanTokenName,
					senderFname,
					crossChainText);
		}

		sendCastReply(castText, payment.getSourceHash(), embeds);

		if (payment.getReceiver() != null) {
			String messageText;
			if (isSelfPurchase) {
				messageText = String.format("""
								@%s, you've successfully purchased %s %s fan token(s)%s Ⓜ️

								%s
								🧾 Receipt: %s""",
						senderFname,
						payment.getTokenAmount(),
						fanTokenName,
						crossChainText,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			} else {
				messageText = String.format("""
								@%s, you've been gifted %s %s fan token(s) by @%s%s Ⓜ️

								%s
								🧾 Receipt: %s""",
						receiverFname,
						payment.getTokenAmount(),
						fanTokenName,
						senderFname,
						crossChainText,
						sourceRefText,
						receiptService.getReceiptUrl(payment));
			}

			sendDirectMessage(messageText, payment.getReceiverFid().toString());
		}
	}
}
