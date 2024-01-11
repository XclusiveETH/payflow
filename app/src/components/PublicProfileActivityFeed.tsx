import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';
import { Chain } from '@rainbow-me/rainbowkit';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedSection';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useState } from 'react';
import { AnonymousUserContext } from '../contexts/UserContext';

export type AssetsProps = {
  selectedNetwork: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function PublicProfileActivityFeed(props: AssetsProps) {
  const { profile } = useContext(AnonymousUserContext);
  const { address } = useAccount();

  const { selectedNetwork } = props;
  const { loading, fetched, transactions } = props.activityFetchResult;

  const [feedOption, setFeedOption] = useState<number>(1);

  useMemo(async () => {
    if (!address && !profile) {
      setFeedOption(1);
    }
  }, [address, profile]);

  return (
    <>
      <Box
        mt={3}
        ml={2}
        mr={1}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between">
        <Typography variant="subtitle2">Activity feed</Typography>
        <NativeSelect
          variant="outlined"
          disableUnderline
          value={feedOption}
          style={{ borderRadius: '50' }}
          onChange={(event) => {
            setFeedOption(parseInt(event.target.value));
          }}
          sx={{ textAlign: 'end', fontSize: 14, fontWeight: 500 }}>
          <option value={1}>All payments</option>
          {(address || profile) && <option value={2}>Between you</option>}
        </NativeSelect>
      </Box>
      <Stack p={1} spacing={2} width="100%" maxHeight={375} overflow="auto">
        {loading ? (
          <ActivitySkeletonSection />
        ) : fetched ? (
          transactions.length === 0 ? (
            <Typography variant="subtitle2" textAlign="center">
              Profile hasn't transacted yet.
            </Typography>
          ) : (
            transactions
              .filter((tx) => {
                return (
                  (selectedNetwork ? tx.chainId === selectedNetwork.id : true) &&
                  (feedOption !== 1
                    ? tx.to === address ||
                      tx.from === address ||
                      (profile &&
                        (tx.fromProfile?.identity === profile.identity ||
                          tx.toProfile?.identity === profile.identity))
                    : true)
                );
              })
              .map((txInfo) => (
                <PublicProfileActivityFeedSection
                  key={`activity_section_${txInfo.hash}`}
                  txInfo={txInfo}
                />
              ))
          )
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
    </>
  );
}
