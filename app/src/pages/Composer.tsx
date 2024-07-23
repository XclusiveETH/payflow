import { useContext, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { CropDin, Send } from '@mui/icons-material';
import CastActionButton from '../components/buttons/CastActionButton';
import { useSearchParams } from 'react-router-dom';
import PaymentFrameComposerDialog from '../components/dialogs/PaymentFrameComposerDialog';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { ProfileContext } from '../contexts/UserContext';
import PaymentDialog, { PaymentSenderType } from '../components/dialogs/PaymentDialog';
import { SelectedIdentityType } from '../types/ProfleType';
import { Address } from 'viem';
import PayComposerActionDialog from '../components/dialogs/PayComposerActionDialog';

export default function Composer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');

  const [openComposerAction, setOpenComposerAction] = useState<string | undefined>(
    action as string
  );

  const { profile } = useContext(ProfileContext);
  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(
    openComposerAction === 'pay'
  );

  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  return (
    <>
      <Helmet>
        <title> Payflow | Composer Actions </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          sx={{ p: 3 }}>
          <Stack
            p={3}
            spacing={3}
            alignItems="center"
            border={1.5}
            borderRadius={5}
            borderColor="divider">
            <Avatar src="/farcaster.svg" variant="rounded" />
            <Typography variant="h6" align="center">
              Farcaster Composer Actions
            </Typography>
            <Stack spacing={1} alignItems="center">
              <CastActionButton
                title="Pay"
                description="Use this composer action to create a payment frame"
                onClick={async () => {
                  setOpenComposerAction('pay');
                  setOpenSearchIdentity(true);
                }}
                startIcon={<Send />}
              />
            </Stack>
            <Stack spacing={1} alignItems="center">
              <CastActionButton
                title="Receive Payment"
                description="Use this composer action to create a custom payment frame to receive payments"
                onClick={async () => {
                  setOpenComposerAction('frame');
                }}
                startIcon={<CropDin />}
              />
            </Stack>
          </Stack>
        </Box>
      </Container>
      {openComposerAction === 'frame' && (
        <PaymentFrameComposerDialog
          open={true}
          closeStateCallback={() => {
            setOpenComposerAction(undefined);
          }}
          onClose={() => {
            setOpenComposerAction(undefined);
          }}
        />
      )}
      {openComposerAction === 'pay' && recipient && profile && (
        <PayComposerActionDialog
          open={recipient != null}
          sender={{
            type: 'profile',
            identity: {
              address: profile.identity as Address,
              profile: profile
            }
          }}
          recipient={recipient}
          setOpenSearchIdentity={setOpenSearchIdentity}
          closeStateCallback={async () => {
            setRecipient(undefined);
          }}
        />
      )}

      {openSearchIdentity && profile && (
        <SearchIdentityDialog
          address={profile.identity}
          open={openSearchIdentity}
          closeStateCallback={async () => {
            setOpenSearchIdentity(false);
          }}
          selectIdentityCallback={async (recipient) => {
            setRecipient(recipient);
          }}
        />
      )}
    </>
  );
}
