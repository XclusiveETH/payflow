package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TokenService.SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS;

@RestController
@RequestMapping("/farcaster/frames/mint")
@Transactional
@Slf4j
public class MintController {

	private static final String STORAGE_FRAME_API_BASE = "/api/farcaster/frames/storage";
	@Autowired
	private IFarcasterNeynarService neynarService;
	@Autowired
	private PaymentRepository paymentRepository;
	@Value("${payflow.frames.url}")
	private String framesServiceUrl;
	@Value("${payflow.api.url}")
	private String apiServiceUrl;
	@Value("${payflow.dapp.url}")
	private String dAppServiceUrl;

	@Autowired
	private UserService userService;

	private static Payment getMintPayment(ValidatedFrameResponseMessage validateMessage,
	                                      User user,
	                                      Integer chainId,
	                                      String token) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				validateMessage.action().cast().author().username(), castHash.substring(0, 10));

		val receiverFid = validateMessage.action().interactor().fid();

		val payment = new Payment(Payment.PaymentType.INTENT, null, chainId, token);
		payment.setCategory("mint");
		payment.setToken(token);
		payment.setReceiverFid(receiverFid);
		payment.setSender(user);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		return payment;
	}

	@PostMapping("/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage,
	                                @RequestParam String provider,
	                                @RequestParam Integer chainId,
	                                @RequestParam String contract,
	                                @RequestParam(required = false) Integer tokenId,
	                                @RequestParam String original) {

		log.debug("Received submit mint message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val interactor = validateMessage.action().interactor();

		User clickedProfile;
		try {
			clickedProfile = userService.getOrCreateUserFromFarcasterProfile(interactor,
					false, false);
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Missing verified identity! Contact @sinaver.eth"));
		} catch (ConstraintViolationException exception) {
			log.error("Failed to create a user for {}", interactor.username(), exception);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Identity conflict! Contact @sinaver.eth"));
		}

		if (clickedProfile == null) {
			log.error("Clicked fid {} is not on payflow", interactor);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage("Sign up on Payflow first!"));
		}

		if (!SUPPORTED_FRAME_PAYMENTS_CHAIN_IDS.contains(chainId)) {
			log.error("Chain not supported for minting on payflow: {}", chainId);
			return ResponseEntity.badRequest().body(
					new FrameResponse.FrameMessage(String.format("`%s` chain not supported!", chainId)));
		}

		String token;
		if (tokenId != null) {
			token = String.format("%s:%s:%s", provider, contract, tokenId);
		} else {
			token = String.format("%s:%s", provider, contract);
		}
		val payment = getMintPayment(validateMessage, clickedProfile, chainId, token);
		paymentRepository.save(payment);

		log.debug("Mint payment intent saved: {}", payment);

		val paymentMintUrl = UriComponentsBuilder.fromHttpUrl(dAppServiceUrl)
				.path("/payment/{refId}")
				.buildAndExpand(payment.getReferenceId()).toUri();

		log.debug("Redirecting to {}", paymentMintUrl);
		return ResponseEntity.status(HttpStatus.FOUND).location(paymentMintUrl).build();
	}
}