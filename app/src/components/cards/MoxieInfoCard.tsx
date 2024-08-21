import { Circle } from '@mui/icons-material';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Stack,
  Typography,
  Chip,
  Skeleton,
  Button,
  useMediaQuery
} from '@mui/material';
import { countdown } from '../../utils/date';
import { useFanTokens } from '../../utils/queries/fanTokens';
import { AddressSection } from '../AddressSection';
import { ProfileSection } from '../ProfileSection';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { normalizeNumberPrecision } from '../../utils/formats';
import { useAvailableMoxieRewards } from '../../utils/queries/moxie';
import { useIdentity } from '../../utils/queries/profiles';
import { grey } from '@mui/material/colors';
import { ClaimMoxieRewardsDialog } from '../dialogs/ClaimMoxieRewardsDialog';

export function MoxieInfoCard() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const { profile } = useContext(ProfileContext);

  const { data: identity } = useIdentity(profile?.identity);

  const fid =
    Number(identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId) ||
    undefined;

  const {
    isFetching: isFetchingRewards,
    data: claimableRewards,
    error: rewardsError
  } = useAvailableMoxieRewards(fid);

  const [openClaimRewardsDialog, setOpenClaimRewardsDialog] = useState<boolean>(false);

  const { isFetching: isFetchingAuctions, data: contactsWithAuction } = useFanTokens({
    enabled: true
  });

  const currentTime = new Date();

  return (
    <Card
      elevation={12}
      sx={{
        p: 1,
        borderRadius: '25px',
        width: '100%'
      }}>
      <CardHeader
        title="Ⓜ️ Moxie Center"
        titleTypographyProps={{
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center'
        }}
        sx={{ p: 0, pb: 0.5 }}
      />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: 1,
          '&:last-child': {
            padding: 0.5
          }
        }}>
        <Stack p={0.5} pt={1} border={1} borderRadius={5} borderColor="divider">
          <Typography
            fontSize={12}
            fontWeight="bold"
            color={grey[prefersDarkMode ? 400 : 700]}
            textTransform="uppercase"
            textAlign="center">
            Auctions among contacts
          </Typography>
          {isFetchingAuctions ? (
            <Skeleton variant="rectangular" height={100} sx={{ margin: 1, borderRadius: '15px' }} />
          ) : contactsWithAuction && contactsWithAuction.length > 0 ? (
            <Box
              display="flex"
              gap={1}
              sx={{
                overflowX: 'scroll',
                scrollbarWidth: 'none',
                '&-ms-overflow-style:': {
                  display: 'none'
                },
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
              {contactsWithAuction.map((contactWithAuction) => (
                <Card
                  elevation={3}
                  key={`contact_auction_card:${contactWithAuction.contact.data.address}`}
                  sx={{
                    borderRadius: '15px',
                    minWidth: 160,
                    maxHeight: 100,
                    m: 1,
                    p: 0.5
                  }}>
                  <CardContent
                    sx={{
                      p: 0.5,
                      '&:last-child': {
                        paddingBottom: 0.5
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                    <Stack justifyContent="flex-start" spacing={1}>
                      <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center">
                        <Typography variant="caption">
                          Supply: <b>{contactWithAuction.auction.auctionSupply}</b>
                        </Typography>
                        <Chip
                          size="small"
                          clickable
                          component="a"
                          href={
                            contactWithAuction.auction.launchCastUrl ??
                            `https://www.airstack.xyz/users/fc_fname:${contactWithAuction.auction.farcasterUsername}`
                          }
                          target="_blank"
                          {...(new Date(contactWithAuction.auction.estimatedStartTimestamp) <=
                          currentTime
                            ? {
                                icon: <Circle color="success" sx={{ width: 10, height: 10 }} />,
                                label: (
                                  <Typography variant="caption">
                                    <b>live</b>
                                  </Typography>
                                )
                              }
                            : {
                                icon: <Circle color="warning" sx={{ width: 10, height: 10 }} />,
                                label: (
                                  <Typography variant="caption">
                                    in{' '}
                                    <b>
                                      {countdown(
                                        contactWithAuction.auction.estimatedStartTimestamp
                                      )}
                                    </b>
                                  </Typography>
                                )
                              })}
                        />
                      </Box>
                      {contactWithAuction.contact.data.profile ? (
                        <ProfileSection
                          maxWidth={200}
                          profile={contactWithAuction.contact.data.profile}
                        />
                      ) : (
                        <AddressSection maxWidth={200} identity={contactWithAuction.contact.data} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography fontSize={14} textAlign="center">
              No auctions available among contacts
            </Typography>
          )}
        </Stack>
        <Stack
          p={1}
          spacing={1}
          minHeight={50}
          sx={{
            border: 1,
            borderRadius: 5,
            borderColor: 'divider',
            alignItems: 'center'
          }}>
          <Typography
            fontSize={12}
            fontWeight="bold"
            color={grey[prefersDarkMode ? 400 : 700]}
            textTransform="uppercase">
            Claimable Everyday Rewards
          </Typography>
          {isFetchingRewards || !fid ? (
            <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
          ) : claimableRewards && claimableRewards > 1 ? (
            <Typography
              m={1}
              variant="h4"
              fontWeight="bold"
              component={Button}
              sx={{ borderRadius: 5, textTransform: 'none', color: 'inherit' }}
              onClick={() => setOpenClaimRewardsDialog(true)}>
              {normalizeNumberPrecision(claimableRewards)}
            </Typography>
          ) : (
            <Typography fontSize={14} color="inherit">
              {!rewardsError ? (
                'No pending rewards to claim'
              ) : (
                <>
                  {rewardsError.message}
                  {'! '}
                  <a
                    href="https://warpcast.com/~/inbox/create/19129"
                    target="_blank"
                    style={{ color: 'inherit' }}>
                    Contact Support
                  </a>{' '}
                  💬
                </>
              )}
            </Typography>
          )}
        </Stack>
      </CardContent>
      {openClaimRewardsDialog && fid && claimableRewards && (
        <ClaimMoxieRewardsDialog
          fid={fid}
          claimableRewardsAmount={claimableRewards}
          open={openClaimRewardsDialog}
          onClose={() => {
            setOpenClaimRewardsDialog(false);
          }}
        />
      )}
    </Card>
  );
}