package ua.sinaver.web3.payflow.service;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.farcaster.Cast;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;

import java.util.Collections;

@Service
@Slf4j
public class NotificationService {

	@Autowired
	private FarcasterPaymentBotService paymentBotService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private ReceiptService receiptService;

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

		val senderFname = sender != null ? sender.username() :
				identityService.getIdentityFname(senderIdentity);
		val receiverFname = receiver != null ? receiver.username() :
				identityService.getIdentityFname(receiverIdentity);
		val receiptUrl = receiptService.getReceiptUrl(payment);
		val embeds = Collections.singletonList(new Cast.Embed(receiptUrl));

		val castText = String.format("""
						@%s, you've been paid %s %s by @%s 🎉

						p.s. join /payflow channel for updates 👀""",
				receiverFname,
				StringUtils.isNotBlank(payment.getTokenAmount()) ? PaymentService.formatNumberWithSuffix(payment.getTokenAmount())
						: String.format("$%s", payment.getUsdAmount()),
				payment.getToken().toUpperCase(),
				senderFname);

		var processed = paymentBotService.reply(castText,
				payment.getSourceHash(),
				embeds);

		if (!processed) {
			log.error("Failed to reply with {} for payment intent completion", castText);
		}
	}
}
