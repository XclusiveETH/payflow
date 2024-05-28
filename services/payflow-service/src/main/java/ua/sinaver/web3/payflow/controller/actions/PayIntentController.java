package ua.sinaver.web3.payflow.controller.actions;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.message.CastActionMeta;
import ua.sinaver.web3.payflow.message.FrameMessage;
import ua.sinaver.web3.payflow.message.IdentityMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.IdentityService;
import ua.sinaver.web3.payflow.service.api.IFarcasterHubService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.util.Comparator;

import static ua.sinaver.web3.payflow.service.TransactionService.PAYMENT_CHAIN_IDS;
import static ua.sinaver.web3.payflow.service.TransactionService.SUPPORTED_FRAME_PAYMENTS_TOKENS;

@RestController
@RequestMapping("/farcaster/actions/pay")
@Transactional
@Slf4j
public class PayIntentController {

	@Autowired
	private IFarcasterHubService farcasterHubService;

	@Autowired
	private IdentityService identityService;

	@Autowired
	private PaymentRepository paymentRepository;

	@GetMapping("/intent")
	public CastActionMeta metadata(
			@RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
			@RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
			@RequestParam(name = "token", required = false, defaultValue = "degen") String token,
			@RequestParam(name = "chain", required = false, defaultValue = "base") String chain) {
		log.debug("Received metadata request for cast action: pay intent with params: " +
						"amount = {},  tokenAmount = {}, token = {}, chain = {}", amount,
				tokenAmount, token, chain);
		// TODO: skip chain/token/amount validation
		val castActionMeta = new CastActionMeta(
				String.format("%s %s Intent (%s)", tokenAmount != null ? tokenAmount :
								String.format("$%s", amount),
						StringUtils.upperCase(token), StringUtils.capitalize(chain)),
				"heart",
				"Use this action to submit payment intent for farcaster users in " +
						"Payflow app",
				"https://payflow.me",
				new CastActionMeta.Action("post"));

		log.debug("Returning payment intent cast action meta: {}", castActionMeta);
		return castActionMeta;
	}

	@PostMapping("/intent")
	public ResponseEntity<FrameResponse.FrameMessage> intent(@RequestBody FrameMessage castActionMessage,
	                                                         @RequestParam(name = "amount", required = false, defaultValue = "1.0") Double amount,
	                                                         @RequestParam(name = "tokenAmount", required = false) Double tokenAmount,
	                                                         @RequestParam(name = "token", required = false, defaultValue = "degen") String token,
	                                                         @RequestParam(name = "chain", required = false, defaultValue = "base") String chain) {
		log.debug("Received cast action: pay intent {}", castActionMessage);
		val validateMessage = farcasterHubService.validateFrameMessageWithNeynar(
				castActionMessage.trustedData().messageBytes());
		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Cast action not verified!"));
		}

		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		if (!SUPPORTED_FRAME_PAYMENTS_TOKENS.contains(token)) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Token not supported!"));
		}

		val clickedFid = validateMessage.action().interactor().fid();
		val casterFid = validateMessage.action().cast().fid();

		val clickedProfile = identityService.getFidProfiles(clickedFid).stream().findFirst().orElse(null);
		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", clickedFid);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		// check if profile exist
		val paymentProfile = identityService.getFidProfiles(casterFid).stream().findFirst().orElse(null);
		String paymentAddress = null;
		if (paymentProfile == null || paymentProfile.getDefaultFlow() == null) {
			val paymentAddresses = identityService.getFidAddresses(casterFid);
			// pay first with higher social score now invite first
			val paymentIdentity = identityService.getIdentitiesInfo(paymentAddresses)
					.stream().max(Comparator.comparingInt(IdentityMessage::score))
					.orElse(null);
			if (paymentIdentity != null) {
				paymentAddress = paymentIdentity.address();
			} else {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Recipient address not found!"));
			}
		}

		if (tokenAmount != null) {
			if (tokenAmount <= 0) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Payment token amount should be more than 0"));
			}
		} else if (amount.isNaN() && amount <= 0 && amount >= 10) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Payment amount should be between $0-10"));
		}


		val chainId = PAYMENT_CHAIN_IDS.get(chain);

		if (chainId == null) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Chain not supported"));
		}

		// check if profile accepts payment on the chain
		if (paymentProfile != null && paymentProfile.getDefaultFlow() != null) {
			val isWalletPresent = paymentProfile.getDefaultFlow().getWallets().stream()
					.anyMatch(w -> w.getNetwork().equals(chainId));
			if (!isWalletPresent) {
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Chain not accepted!"));
			}
		}

		val sourceApp = validateMessage.action().signer().client().displayName();
		val casterFcName = identityService.getFidFname(casterFid);
		val castHash = validateMessage.action().cast().hash();
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				casterFcName, castHash.substring(0,
						10));

		val payment = new Payment(Payment.PaymentType.INTENT,
				(paymentProfile != null && paymentProfile.getDefaultFlow() != null) ?
						paymentProfile : null,
				chainId, token);
		payment.setReceiverAddress(paymentAddress);
		payment.setSender(clickedProfile);
		if (tokenAmount != null) {
			payment.setTokenAmount(tokenAmount.toString());
		} else {
			payment.setUsdAmount(amount.toString());
		}
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		paymentRepository.save(payment);

		log.debug("Payment intent saved: {}", payment);

		return ResponseEntity.ok().body(
				new FrameResponse.FrameMessage(String.format("Payment intent for @%s submitted. Pay in the app!",
						casterFcName)));
	}
}
