package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.PaymentMessage;
import ua.sinaver.web3.payflow.message.PaymentReferenceMessage;
import ua.sinaver.web3.payflow.message.PaymentUpdateMessage;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.DirectCastMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.*;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.text.DecimalFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
public class PaymentController {
	@Autowired
	private IUserService userService;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private FarcasterPaymentBotService farcasterPaymentBotService;

	@Autowired
	private FarcasterMessagingService farcasterMessagingService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Autowired
	private IFarcasterNeynarService neynarService;

	@Autowired
	private ReceiptService receiptService;

	@Autowired
	private ContactBookService contactBookService;

	@Value("${payflow.frames.url}")
	private String framesServiceUrl;

	public static String formatDouble(Double value) {
		val df = new DecimalFormat("#.#####");
		return df.format(value);
	}

	@GetMapping
	public List<PaymentMessage> payments(@RequestParam(value = "hashes") List<String> hashes,
	                                     Principal principal) {

		val username = principal != null ? principal.getName() : null;
		log.debug("{} fetching payments info for {}", username, hashes);

		if (hashes.isEmpty()) {
			return Collections.emptyList();
		}

		val user = username != null ? userService.findByIdentity(username) : null;
		val payments = paymentRepository.findByHashIn(hashes, user);

		log.debug("Fetched payments: {}", payments);

		return payments.stream()
				.map(payment -> PaymentMessage.convert(payment, false, true))
				.toList();
	}

	@PostMapping
	public ResponseEntity<PaymentReferenceMessage> submitPayment(@RequestBody PaymentMessage paymentMessage,
	                                                             Principal principal) {
		val username = principal != null ? principal.getName() : null;

		log.debug("Saving completed payment {} for {}", paymentMessage, username);

		if (StringUtils.isBlank(username)) {
			log.error("User not authenticated!");
			return ResponseEntity.badRequest().build();
		}

		val user = userService.findByUsername(username);
		if (user == null) {
			log.error("User not found!");
			return ResponseEntity.badRequest().build();
		}

		val receiver = paymentMessage.receiver() != null ?
				userService.findByIdentity(paymentMessage.receiver().identity()) : null;
		val payment = new Payment(paymentMessage.type(), receiver,
				paymentMessage.chainId(), paymentMessage.token());
		payment.setReceiverAddress(paymentMessage.receiverAddress());
		payment.setSender(user);
		payment.setTokenAmount(paymentMessage.tokenAmount().toString());
		payment.setHash(paymentMessage.hash());
		payment.setStatus(paymentMessage.status());
		payment.setCompletedDate(new Date());
		paymentRepository.save(payment);

		contactBookService.cleanContactsCache(user);
		log.debug("Saved payment: {}", payment);
		return ResponseEntity.ok(new PaymentReferenceMessage(payment.getReferenceId()));
	}

	@GetMapping("/pending")
	public List<PaymentMessage> pendingPayments(Principal principal) {
		val username = principal != null ? principal.getName() : null;
		log.debug("Fetching pending payments for {} ", username);

		val user = userService.findByIdentity(username);
		if (user == null) {
			return Collections.emptyList();
		}
		val verifications = identityService.getIdentityAddresses(user.getIdentity()).stream()
				.map(String::toLowerCase).toList();

		return paymentRepository.findBySenderOrSenderAddressInAndStatusInAndTypeInOrderByCreatedDateDesc(
						user, verifications, List.of(Payment.PaymentStatus.PENDING,
								Payment.PaymentStatus.INPROGRESS,
								Payment.PaymentStatus.COMPLETED, Payment.PaymentStatus.REFUNDED),
						List.of(Payment.PaymentType.APP, Payment.PaymentType.INTENT,
								Payment.PaymentType.INTENT_TOP_REPLY,
								Payment.PaymentType.FRAME))
				.stream()
				.map(payment -> PaymentMessage.convert(payment, true, true))
				.toList();
	}

	@GetMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<PaymentMessage> payment(@PathVariable String referenceId, Principal principal) {
		val username = principal != null ? principal.getName() : null;
		log.debug("Fetching payment by refId {} by user {}", referenceId, username);
		val user = userService.findByIdentity(username);

		val payment = paymentRepository.findByReferenceId(referenceId);
		if (payment == null) {
			log.error("Payment doesn't exist: {}", referenceId);
			return ResponseEntity.notFound().build();
		}

		if (!(payment.getType().equals(Payment.PaymentType.FRAME)
				|| payment.getType().equals(Payment.PaymentType.INTENT)
				|| payment.getType().equals(Payment.PaymentType.INTENT_TOP_REPLY))
				&& (user == null || !payment.getSender().getIdentity().equals(user.getIdentity()))) {
			log.error("{} is not allowed to fetch payment: {}", principal, payment);
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		return ResponseEntity.ok(PaymentMessage.convert(payment, true, false));
	}

	@PutMapping("/{referenceId}")
	@ResponseStatus(HttpStatus.OK)
	public void updatePayment(@PathVariable String referenceId,
	                          @RequestBody PaymentUpdateMessage paymentUpdateMessage, Principal principal) {
		log.debug("Received update {} for payment {} by user {}",
				paymentUpdateMessage,
				referenceId,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null && !payment.getStatus().equals(Payment.PaymentStatus.COMPLETED) &&
				!payment.getStatus().equals(Payment.PaymentStatus.CANCELLED) &&
				!payment.getStatus().equals(Payment.PaymentStatus.REFUNDED)) {

			if (payment.getStatus().equals(Payment.PaymentStatus.PENDING)
					&& StringUtils.isNotBlank(paymentUpdateMessage.fulfillmentId())) {
				payment.setFulfillmentId(paymentUpdateMessage.fulfillmentId());
				if (StringUtils.isNotBlank(paymentUpdateMessage.hash())) {
					payment.setHash(paymentUpdateMessage.hash());
					payment.setStatus(Payment.PaymentStatus.INPROGRESS);
				}
				log.debug("Updated payment: {}", payment);
				return;
			}

			// if it's fulfillment type of payment, save only fulfillment hash
			// otherwise treat as regular payment
			if (payment.getStatus().equals(Payment.PaymentStatus.INPROGRESS)) {
				payment.setFulfillmentChainId(paymentUpdateMessage.fulfillmentChainId());
				payment.setFulfillmentHash(paymentUpdateMessage.fulfillmentHash());
			} else {
				if (paymentUpdateMessage.chainId() != null) {
					payment.setNetwork(paymentUpdateMessage.chainId());
				}
				if (paymentUpdateMessage.token() != null) {
					payment.setToken(paymentUpdateMessage.token());
				}
				payment.setHash(paymentUpdateMessage.hash());
			}

			payment.setStatus(Payment.PaymentStatus.COMPLETED);
			payment.setCompletedDate(new Date());

			// TODO: move to event system
			if (payment.getSender() != null) {
				contactBookService.cleanContactsCache(payment.getSender());
			}

			// notify only for empty category as p2p payment
			// handle with different messages for other kind of payments
			if (!StringUtils.isBlank(payment.getSourceHash()) && !StringUtils.isBlank(payment.getHash())) {
				val senderFname = identityService.getIdentityFname(user.getIdentity());
				val receiverFname = identityService
						.getIdentityFname(payment.getReceiver() != null ? payment.getReceiver().getIdentity()
								: payment.getReceiverAddress() != null ? payment.getReceiverAddress()
								: "fc_fid:" + payment.getReceiverFid());
				val receiptUrl = receiptService.getReceiptUrl(payment);
				var embeds = Collections.singletonList(new Cast.Embed(receiptUrl));
				val sourceRef = String.format("https://warpcast.com/%s/%s",
						receiverFname, payment.getSourceHash().substring(0, 10));

				if (StringUtils.isBlank(payment.getCategory())) {
					if (payment.getType().equals(Payment.PaymentType.INTENT_TOP_REPLY)) {
						var scvText = "";

						val cast = socialGraphService.getReplySocialCapitalValue(payment.getSourceHash());
						if (cast != null) {
							scvText = String.format("with cast score: %s ",
									formatDouble(cast.getSocialCapitalValue().getFormattedValue()));
						}

						val castText = String.format("""
										@%s, you've been paid %s %s by @%s for your top comment %s🎉

										p.s. join /payflow channel for updates 👀""",
								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ?
										PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
										: String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname,
								scvText);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}
					} else {
						// send both reply + intent for recipient who's on payflow
						val castText = String.format("""
										@%s, you've been paid %s %s by @%s 🎉

										p.s. join /payflow channel for updates 👀""",
								receiverFname,
								StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
										: String.format("$%s", payment.getUsdAmount()),
								payment.getToken().toUpperCase(),
								senderFname);

						val processed = farcasterPaymentBotService.reply(castText,
								payment.getSourceHash(),
								embeds);

						if (!processed) {
							log.error("Failed to reply with {} for payment intent completion", castText);
						}

						if (payment.getReceiver() != null) {
							val receiverFid = identityService.getIdentityFid(payment.getReceiver().getIdentity());
							if (StringUtils.isBlank(receiverFid)) {
								return;
							}

							try {
								val messageText = String.format("""
												 @%s, you've been paid %s %s by @%s 🎉

												%s
												🧾 Receipt: %s

												p.s. join /payflow channel for updates 👀""",
										receiverFname,
										StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
												: String.format("$%s", payment.getUsdAmount()),
										payment.getToken().toUpperCase(),
										senderFname,
										payment.getSourceRef() != null ? String.format("🔗 Source: %s",
												payment.getSourceRef()) : "",
										receiptUrl);
								val response = farcasterMessagingService.message(
										new DirectCastMessage(receiverFid, messageText, UUID.randomUUID()));

								if (!response.result().success()) {
									log.error("Failed to send direct cast with {} for payment intent " +
											"completion", messageText);
								}
							} catch (Throwable t) {
								log.error("Failed to send direct cast with exception: ", t);
							}
						}
					}
				} else if (payment.getCategory().equals("fc_storage")) {
					val storageFrameUrl = UriComponentsBuilder.fromHttpUrl(framesServiceUrl)
							.path("/fid/{fid}/storage?v3") // add your path variables
							.buildAndExpand(payment.getReceiverFid())
							.toUriString();

					val castText = String.format("""
									@%s, you've been paid %s unit(s) of storage by @%s 🎉
																		
									📊Check your storage usage in the frame below 👇🏻
																							
									p.s. join /payflow channel for updates 👀""",
							receiverFname,
							payment.getTokenAmount(),
							senderFname);

					// update embeds to include storage frame as well!
					embeds = List.of(new Cast.Embed(storageFrameUrl), new Cast.Embed(receiptUrl));
					val processed = farcasterPaymentBotService.reply(castText,
							payment.getSourceHash(),
							embeds);

					if (!processed) {
						log.error("Failed to reply with {} for payment intent completion", castText);
					}

					if (payment.getReceiver() != null) {
						try {
							val messageText = String.format("""
											 @%s, you've been paid %s units of storage by @%s 🎉
																						
											🔗 Source: %s
											🧾 Receipt: %s
											📊 Your storage usage now: %s

											p.s. join /payflow channel for updates 👀""",
									receiverFname,
									payment.getTokenAmount(),
									senderFname,
									sourceRef,
									receiptUrl,
									storageFrameUrl);
							val response = farcasterMessagingService.message(
									new DirectCastMessage(payment.getReceiverFid().toString(), messageText,
											UUID.randomUUID()));

							if (!response.result().success()) {
								log.error("Failed to send direct cast with {} for gift storage intent " +
										"completion", messageText);
							}
						} catch (Throwable t) {
							log.error("Failed to send direct cast with exception: ", t);
						}
					}
				}
			}
			log.debug("Payment was updated: {}", payment);
		}
	}

	@PutMapping("/{referenceId}/cancel")
	@ResponseStatus(HttpStatus.OK)
	public void cancelPayment(@PathVariable String referenceId, Principal principal) {
		log.debug("Marking pending payment {} as cancelled by user {}", referenceId,
				principal.getName());

		val user = userService.findByIdentity(principal.getName());

		if (user == null) {
			return;
		}

		val payment = paymentRepository.findByReferenceIdAndSender(referenceId, user);
		if (payment != null) {
			payment.setStatus(Payment.PaymentStatus.CANCELLED);
			payment.setCompletedDate(new Date());
			log.debug("Payment was marked as cancelled: {}", payment);
		}
	}
}
