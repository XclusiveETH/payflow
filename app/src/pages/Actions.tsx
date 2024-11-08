import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Stack, Typography, Grid2, Box, Tooltip } from '@mui/material';
import PaymentRewardCastActionComposerDialog from '../components/dialogs/PaymentRewardCastActionComposerDialog';
import { AutoAwesome, Interests, PersonAdd, Star } from '@mui/icons-material';
import { PiTipJar } from 'react-icons/pi';
import { GrStorage } from 'react-icons/gr';
import CastActionButton from '../components/buttons/CastActionButton';
import FarcasterAvatar from '../components/avatars/FarcasterAvatar';
import { FaRegClock } from 'react-icons/fa';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { GoZap } from 'react-icons/go';

const BASE_URL =
  'https://warpcast.com/~/add-cast-action?url=https://api.payflow.me/api/farcaster/actions';

interface Action {
  title: string;
  description: string;
  installUrl?: string;
  onClick?: () => void;
  startIcon: React.ReactNode;
  earlyFeature?: boolean;
}

interface ActionCategoryProps {
  title: string;
  icon: React.ReactNode;
  actions: Action[];
}

const ActionCategory: React.FC<ActionCategoryProps> = ({ title, icon, actions }) => (
  <Stack alignItems="center" spacing={2}>
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Stack>
    <Grid2
      container
      rowSpacing={{ xs: 1, sm: 2 }}
      columnSpacing={{ xs: 1, sm: 2 }}
      justifyContent="center">
      {actions.map((action, index) => (
        <Grid2 component="span" key={index} size={{ xs: 6 }} display="flex" justifyContent="center">
          <CastActionButton {...action} />
        </Grid2>
      ))}
    </Grid2>
  </Stack>
);

export default function Actions() {
  const [openPaymentActionDialog, setOpenPaymentActionDialog] = useState<boolean>(false);

  const farcasterActions = [
    {
      title: 'Pay',
      description: 'Social feed payments',
      installUrl: `${BASE_URL}/profile`,
      startIcon: <GoZap size={25} />
    },
    {
      title: 'Reward',
      description: 'Submit custom rewards',
      onClick: () => setOpenPaymentActionDialog(true),
      startIcon: <Interests sx={{ width: 25, height: 25 }} />
    },
    {
      title: 'Storage',
      description: 'Buy farcaster storage',
      installUrl: `${BASE_URL}/products/storage`,
      startIcon: <GrStorage size={25} />
    },
    {
      title: 'Mint',
      description: 'Mint from cast embeds',
      installUrl: `${BASE_URL}/products/mint`,
      startIcon: <AutoAwesome sx={{ width: 25, height: 25 }} />
    },
    {
      title: 'Fan Token',
      description: 'Buy fan tokens from cast',
      installUrl: `${BASE_URL}/products/fan`,
      startIcon: <Star sx={{ width: 25, height: 25 }} />
    },
    {
      title: 'Subscribe',
      description: 'Buy Hypersub subscription',
      installUrl: `${BASE_URL}/products/hypersub`,
      startIcon: <FaRegClock size={25} />
    },
    {
      earlyFeature: true,
      title: 'Jar',
      description: 'Collect contributions',
      installUrl: `${BASE_URL}/jar`,
      startIcon: <PiTipJar size={25} />
    },
    {
      title: 'Invite',
      description: 'Invite to Payflow',
      installUrl: `${BASE_URL}/invite`,
      startIcon: <PersonAdd sx={{ width: 25, height: 25 }} />
    }
  ];

  return (
    <>
      <Helmet>
        <title> Payflow | Actions </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Stack
          alignItems="center"
          mt={3}
          mb={2}
          p={2}
          spacing={3}
          borderRadius={5}
          borderColor="divider">
          <ActionCategory
            title="Cast Actions"
            icon={<FarcasterAvatar size={30} />}
            actions={farcasterActions}
          />
          <Box display="flex" alignItems="center">
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                display: 'inline-block',
                mr: 1
              }}
            />
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              Early feature
            </Typography>
            <Tooltip title="These features are in early development and may be subject to changes or limitations.">
              <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </Stack>
      </Container>
      <PaymentRewardCastActionComposerDialog
        open={openPaymentActionDialog}
        closeStateCallback={() => setOpenPaymentActionDialog(false)}
        onClose={() => setOpenPaymentActionDialog(false)}
      />
    </>
  );
}
