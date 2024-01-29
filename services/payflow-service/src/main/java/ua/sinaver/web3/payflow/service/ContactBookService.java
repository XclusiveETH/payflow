package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.repository.ContactRepository;
import ua.sinaver.web3.payflow.repository.InvitationRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;

import java.time.Duration;
import java.time.Period;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@Transactional
public class ContactBookService implements IContactBookService {

	@Value("${payflow.airstack.contacts.update.duration:24h}")
	private Duration contactsUpdateDuration;
	@Value("${payflow.airstack.contacts.update.last-seen-period:3d}")
	private Period contactsUpdateLastSeenPeriod;
	@Value("${payflow.favourites.limit:0}")
	private int defaultFavouriteContactLimit;
	@Autowired
	private ContactRepository contactRepository;

	@Autowired
	private InvitationRepository invitationRepository;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ISocialGraphService socialGraphService;

	@Value("${payflow.airstack.contacts.limit:10}")
	private int contactsLimit;

	@Value("${payflow.airstack.contacts.fetch.timeout:30s}")
	private Duration contactsFetchTimeout;

	// reuse property to increase the contacts limit
	@Value("${payflow.invitation.whitelisted.default.users}")
	private Set<String> whitelistedUsers;

	@Override
	@CacheEvict(value = "contacts", key = "#user.identity")
	public void update(ContactMessage contactMessage, User user) {
		var contact = contactRepository.findByUserAndIdentity(user, contactMessage.address());
		if (contact == null) {
			contact = new Contact(user, contactMessage.address());
		}

		var availableFavouriteLimit = user.getUserAllowance().getFavouriteContactLimit();

		if (availableFavouriteLimit == null) {
			availableFavouriteLimit = defaultFavouriteContactLimit;
		}

		// update only fields passed
		if (contactMessage.favouriteAddress() != null
				&& contact.isAddressChecked() != contactMessage.favouriteAddress()) {
			if (contactMessage.favouriteAddress()) {
				if (availableFavouriteLimit == 0) {
					log.error("Favourite limit reached for user {}: {}", user.getUsername(), availableFavouriteLimit);
					throw new Error("Favourite limit reached");
				}
				contact.setAddressChecked(true);
				availableFavouriteLimit--;
			} else {
				contact.setAddressChecked(false);
				availableFavouriteLimit++;
			}
		}

		if (contactMessage.favouriteProfile() != null
				&& contact.isProfileChecked() != contactMessage.favouriteProfile()) {
			if (contactMessage.favouriteProfile()) {
				if (availableFavouriteLimit == 0) {
					log.error("Favourite limit reached for user {}: {}", user.getUsername(), availableFavouriteLimit);
					throw new Error("Favourite limit reached");
				}
				contact.setProfileChecked(true);
				availableFavouriteLimit--;
			} else {
				contact.setProfileChecked(false);
				availableFavouriteLimit++;
			}
		}

		user.getUserAllowance().setFavouriteContactLimit(availableFavouriteLimit);
		contactRepository.save(contact);
	}

	@Override
	@Cacheable(value = "contacts", key = "#user.identity", unless = "#result.isEmpty()")
	public List<ContactMessage> getAllContacts(User user) {
		log.debug("VIRTUAL {} {} {} {}", Schedulers.DEFAULT_BOUNDED_ELASTIC_ON_VIRTUAL_THREADS,
				Schedulers.DEFAULT_POOL_SIZE, Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
				Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE);

		val contactsLimitAdjusted = contactsLimit * (whitelistedUsers.contains(user.getIdentity()) ?
				5 : 2);
		try {
			val contactMessages = Flux
					.fromIterable(contactRepository.findAllByUser(user)
							.stream().limit(contactsLimitAdjusted).toList())
					.flatMap(contact -> Mono.zip(
											Mono.just(contact),
											Mono.fromCallable(
															() -> Optional.ofNullable(userRepository.findByIdentityAndAllowedTrue(contact.getIdentity())))
													.onErrorResume(exception -> {
														log.error("Error fetching user {} - {}",
																contact.getIdentity(),
																exception.getMessage());
														return Mono.empty();
													}),
											Mono.fromCallable(
															() -> socialGraphService.getSocialMetadata(contact.getIdentity(), user.getIdentity()))
													.subscribeOn(Schedulers.boundedElastic())
													.onErrorResume(exception -> {
														log.error("Error fetching social graph for {} - " +
																		"{}",
																contact.getIdentity(),
																exception.getMessage());
														return Mono.empty();
													}),
											// TODO: fetch only if social graph fetched
											Mono.fromCallable(
															() -> whitelistedUsers.contains(contact.getIdentity())
																	|| invitationRepository.existsByIdentityAndValid(contact.getIdentity()))
													.onErrorResume(exception -> {
														log.error("Error checking invitation status for user {} - {}",
																contact.getIdentity(),
																exception.getMessage());
														return Mono.empty();
													}))
									.map(tuple -> ContactMessage.convert(
											tuple.getT1(),
											tuple.getT2().orElse(null),
											tuple.getT3(),
											tuple.getT4()))
							// TODO: fail fast, seems doesn't to work properly with threads
					)
					.timeout(contactsFetchTimeout, Mono.empty())
					.collectList()
					.block();

			if (log.isTraceEnabled()) {
				log.trace("Fetched {} contacts for {}: {}", contactMessages.size(), user.getUsername(),
						contactMessages.stream().map(ContactMessage::address).toList());
			} else {
				log.debug("Fetched {} contacts for {}", contactMessages.size(), user.getUsername());
			}
			return contactMessages;
		} catch (Throwable t) {
			log.error("Failed to fetch contacts", t);
			return Collections.emptyList();
		}
	}

	@Scheduled(fixedRate = 60 * 1000)
	public void updateContactsAtFixedRate() {
		val lastUpdateDate = new Date(System.currentTimeMillis() - contactsUpdateDuration.toMillis());
		val lastSeenDate = new Date(
				System.currentTimeMillis() - TimeUnit.DAYS.toMillis(contactsUpdateLastSeenPeriod.getDays()));
		// find all allowed users which were active after some date
		// and contacts weren't updated since another date
		val users = userRepository.findByAllowedTrueAndLastUpdatedContactsBeforeAndLastSeenAfter(lastUpdateDate,
				lastSeenDate);

		if (log.isDebugEnabled()) {
			log.debug("Updating contacts list for profiles: {}",
					users.stream().map(User::getUsername).toList());
		}

		// TODO: for now update all, in future spin off a separate thread, batch, or via
		// events
		for (val user : users) {
			try {
				val existingContactIdentities = contactRepository.findAllIdentitiesByUser(user);
				val followContacts = socialGraphService.getAllFollowingContacts(user.getIdentity()).stream()
						.filter(address -> !existingContactIdentities.contains(address))
						.map(address -> new Contact(user, address)).toList();
				contactRepository.saveAll(followContacts);
				user.setLastUpdatedContacts(new Date());

				if (log.isDebugEnabled()) {
					log.debug("Updated {} contacts for profile: {}",
							followContacts.size(), user.getUsername());
				}

			} catch (Throwable t) {
				log.error("Couldn't fetch following contacts for {}, error: {}", user.getUsername(),
						t.getMessage(), log.isTraceEnabled() ? t : null);
			}
		}
	}
}