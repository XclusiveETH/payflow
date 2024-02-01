package ua.sinaver.web3.payflow.service;

import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;
import ua.sinaver.web3.payflow.message.ConnectedAddresses;

import java.util.List;

public interface ISocialGraphService {
	List<String> getSocialFollowings(String identity);

	ConnectedAddresses getIdentityConnectedAddresses(String identity);

	Wallet getSocialMetadata(String identity, String me);
}
