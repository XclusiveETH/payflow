package ua.sinaver.web3.payflow.controller.frames;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import ua.sinaver.web3.payflow.data.Payment;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.FrameButton;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FrameMessage;
import ua.sinaver.web3.payflow.message.farcaster.ValidatedFrameResponseMessage;
import ua.sinaver.web3.payflow.repository.PaymentRepository;
import ua.sinaver.web3.payflow.service.UserService;
import ua.sinaver.web3.payflow.service.api.IFarcasterNeynarService;
import ua.sinaver.web3.payflow.utils.FrameResponse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static ua.sinaver.web3.payflow.controller.frames.FramesController.DEFAULT_HTML_RESPONSE;
import static ua.sinaver.web3.payflow.service.TokenService.ETH_TOKEN;
import static ua.sinaver.web3.payflow.service.TokenService.OP_CHAIN_ID;

@RestController
@RequestMapping("/farcaster/frames/storage")
@Transactional
@Slf4j
public class StorageController {

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

	private static Payment getPayment(ValidatedFrameResponseMessage validateMessage,
	                                  FarcasterUser gifteeUser, User clickedProfile,
	                                  int numberOfUnits) {
		val sourceApp = validateMessage.action().signer().client().displayName();
		val castHash = validateMessage.action().cast().hash();
		// maybe would make sense to reference top cast instead (if it's a bot cast)
		val sourceRef = String.format("https://warpcast.com/%s/%s",
				gifteeUser.username(), castHash.substring(0,
						10));

		// TODO: save instead as fulfillmentChainId + fulfillmentTokenId
		val payment = new Payment(Payment.PaymentType.INTENT,
				null, OP_CHAIN_ID, ETH_TOKEN);
		payment.setCategory("fc_storage");
		// use token amount as storage unit number
		payment.setTokenAmount(String.valueOf(numberOfUnits));
		payment.setReceiverFid(gifteeUser.fid());
		payment.setSender(clickedProfile);
		payment.setSourceApp(sourceApp);
		payment.setSourceRef(sourceRef);
		payment.setSourceHash(castHash);
		return payment;
	}

	@PostMapping("/{fid}/submit")
	public ResponseEntity<?> submit(@RequestBody FrameMessage frameMessage,
	                                @PathVariable Integer fid) {
		log.debug("Received submit gift storage message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val gifteeUser = neynarService.fetchFarcasterUser(fid);
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

		val inputText = validateMessage.action().input() != null ? validateMessage.action().input().text().toLowerCase()
				: null;

		int numberOfUnits = 1;
		if (StringUtils.isNotBlank(inputText)) {
			try {
				numberOfUnits = Integer.parseInt(inputText);
			} catch (Throwable t) {
				log.warn("Couldn't parse input text of storage units {} by {}", inputText, interactor);
				return ResponseEntity.badRequest().body(
						new FrameResponse.FrameMessage("Enter units in numeric format, e.g. 1-5"));
			}
		}

		val payment = getPayment(validateMessage, gifteeUser, clickedProfile, numberOfUnits);
		paymentRepository.save(payment);

		log.debug("Gift storage payment intent saved: {}", payment);

		val storagePaymentUrl = UriComponentsBuilder.fromHttpUrl(dAppServiceUrl)
				.path("/payment/{refId}")
				.buildAndExpand(payment.getReferenceId()).toUri();

		log.debug("Redirecting to {}", storagePaymentUrl);
		return ResponseEntity.status(HttpStatus.FOUND).location(storagePaymentUrl).build();
	}

	@PostMapping("/check")
	public ResponseEntity<?> check(@RequestBody FrameMessage frameMessage) {
		log.debug("Received check storage message request: {}", frameMessage);
		val validateMessage = neynarService.validateFrameMessageWithNeynar(
				frameMessage.trustedData().messageBytes());

		if (!validateMessage.valid()) {
			log.error("Frame message failed validation {}", validateMessage);
			return DEFAULT_HTML_RESPONSE;
		}
		log.debug("Validation frame message response {} received on url: {}  ", validateMessage,
				validateMessage.action().url());

		val castInteractorFid = validateMessage.action().interactor().fid();
		val storageImage = UriComponentsBuilder.fromHttpUrl(framesServiceUrl)
				.path("images/profile/fid/{fid}/storage.png") // add your path variables here
				.buildAndExpand(castInteractorFid)
				.toUriString();

		String submitUrl = UriComponentsBuilder.fromHttpUrl(apiServiceUrl)
				.path(STORAGE_FRAME_API_BASE)
				.path("/{fid}/submit")
				.buildAndExpand(castInteractorFid)
				.toUriString();

		String checkUrl = UriComponentsBuilder.fromHttpUrl(apiServiceUrl)
				.path(STORAGE_FRAME_API_BASE)
				.path("/check")
				.toUriString();

		val addActionUrl = "https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fproducts%2Fstorage";

		val baseUrl = "https://warpcast.com/~/compose";
		val castText = URLEncoder.encode("""
						Buy Farcaster Storage via @payflow frame
						cc: @sinaver.eth /payflow""",
				StandardCharsets.UTF_8);
		val embedUrl = String.format("https://frames.payflow.me/fid/%s/storage?v3", castInteractorFid);
		val shareComposeDeeplink = String.format("%s?text=%s&embeds[]=%s", baseUrl, castText, embedUrl);

		return FrameResponse.builder().imageUrl(storageImage)
				.textInput("Enter storage units, default: 1")
				.button(new FrameButton(
						"Buy",
						FrameButton.ActionType.POST_REDIRECT,
						submitUrl))
				.button(new FrameButton(
						"My usage",
						FrameButton.ActionType.POST,
						checkUrl))
				.button(new FrameButton(
						"Add action",
						FrameButton.ActionType.LINK,
						addActionUrl))
				.button(new FrameButton(
						"Share",
						FrameButton.ActionType.LINK,
						shareComposeDeeplink))
				.build().toHtmlResponse();
	}
}
