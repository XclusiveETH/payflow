import {
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  Typography,
  Stack,
  Avatar,
  Box,
  IconButton,
  TextField,
  Button,
  Divider,
  InputAdornment,
  Chip
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { useMemo, useRef, useState } from 'react';
import { useBalance, useNetwork, usePublicClient, useSwitchNetwork } from 'wagmi';
import { ExpandMore } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Hash, TransactionReceipt, formatEther, parseEther } from 'viem';

import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { safeTransferEth } from '../utils/safeTransactions';
import { shortenWalletAddressLabel } from '../utils/address';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { ChooseWalletMenu } from './ChooseWalletMenu';
import SearchProfileDialog from './SearchProfileDialog';
import { SelectedProfileWithSocialsType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import LoadingButton from '@mui/lab/LoadingButton';

export type AccountSendDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

export default function AccountSendDialog({
  closeStateCallback,
  ...props
}: AccountSendDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { flow } = props;

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>(flow.wallets[0]);

  const [sendToAddress, setSendToAddress] = useState<SelectedProfileWithSocialsType>();

  const [sendAmount, setSendAmount] = useState<bigint>();

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { chains, switchNetwork } = useSwitchNetwork();
  const { chain } = useNetwork();

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id
  });

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const [txHash, setTxHash] = useState<Hash>();

  const sendToastId = useRef<Id>();

  function isProfileType(profile: SelectedProfileWithSocialsType): boolean {
    return profile.type === 'profile';
  }

  const sendTransaction = async () => {
    if (sendToAddress && sendAmount && ethersSigner) {
      const toAddress = isProfileType(sendToAddress)
        ? sendToAddress.data.profile?.defaultFlow?.wallets.find(
            (w) => w.network === selectedWallet.network
          )?.address
        : sendToAddress.data.meta?.addresses[0];

      if (!toAddress) {
        toast.error("can't send to this profiel");
        return;
      }

      sendToastId.current = toast.loading(
        `Sending ${formatEther(sendAmount)} to ${shortenWalletAddressLabel(toAddress)} 💸`
      );

      switchNetwork?.(chains.find((c) => c?.name === selectedWallet?.network)?.id);

      if (!toAddress) {
        toast.error("can't send to this profiel");
        return;
      }

      const txData = {
        from: selectedWallet.address,
        to: toAddress,
        amount: sendAmount
      };

      const txHash = await safeTransferEth(ethersSigner, txData);

      if (!txHash) {
        toast.update(sendToastId.current, {
          render: `Transfer to ${shortenWalletAddressLabel(toAddress)} failed! 😕`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        sendToastId.current = undefined;
      } else {
        setTxHash(txHash);
      }
    }
  };

  useMemo(async () => {
    const chainId = chains.find((c) => c.name === selectedWallet.network)?.id;
    switchNetwork?.(chainId);
  }, [selectedWallet]);

  useMemo(async () => {
    if (txHash && sendToAddress) {
      const receipt = (await publicClient.waitForTransactionReceipt({
        hash: txHash
      })) as TransactionReceipt;

      console.log('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(
              isProfileType(sendToAddress)
                ? sendToAddress.data.profile?.defaultFlow?.wallets.find(
                    (w) => w.network === selectedWallet.network
                  )?.address
                : sendToAddress.data.meta?.addresses[0]
            )} processed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
        handleCloseSendDialog();
      } else {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(
              isProfileType(sendToAddress)
                ? sendToAddress.data.profile?.defaultFlow?.wallets.find(
                    (w) => w.network === selectedWallet.network
                  )?.address
                : sendToAddress.data.meta?.addresses[0]
            )} failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
      }
    }
  }, [txHash]);

  function handleCloseSendDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseSendDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack direction="column" alignItems="center">
          <Typography justifySelf="center" variant="h6">
            Send
          </Typography>
          <Typography justifySelf="center" variant="caption">
            from: "{flow.title}" flow
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ minWidth: 350 }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Divider />

          <Box
            display="flex"
            flexDirection="row"
            alignSelf="stretch"
            alignItems="center"
            justifyContent="space-between"
            component={Button}
            color="inherit"
            onClick={async () => setOpenSearchProfile(true)}
            sx={{
              height: 56,
              border: 1,
              borderRadius: 5,
              p: 1,
              textTransform: 'none'
            }}>
            {sendToAddress &&
              (sendToAddress.type === 'profile'
                ? sendToAddress.data.profile && (
                    <ProfileSection profile={sendToAddress.data.profile} />
                  )
                : sendToAddress.data.meta && <AddressSection meta={sendToAddress.data.meta} />)}

            {!sendToAddress && (
              <Typography alignSelf="center" flexGrow={1}>
                Choose Recipient
              </Typography>
            )}

            <Stack direction="row">
              {sendToAddress && sendToAddress.type === 'profile' && (
                <Chip
                  size="small"
                  variant="filled"
                  label="payflow"
                  sx={{ background: 'lightgreen' }}
                />
              )}
              <ExpandMore />
            </Stack>
          </Box>
          {sendToAddress && (
            <TextField
              fullWidth
              variant="outlined"
              label={`Amount (max: ${
                isSuccess ? balance && parseFloat(formatEther(balance?.value)).toPrecision(1) : 0
              })`}
              id="sendAmount"
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
                      onClick={(event) => {
                        setWalletAnchorEl(event.currentTarget);
                        setOpenSelectWallet(true);
                      }}>
                      <Avatar
                        src={'/networks/' + selectedWallet.network + '.png'}
                        sx={{ width: 28, height: 28 }}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                inputMode: 'decimal',
                sx: { borderRadius: 5 }
              }}
              onChange={(event) => {
                const amount = parseEther(event.target.value);
                if (balance && amount <= balance?.value) {
                  setSendAmount(amount);
                }
              }}
            />
          )}
          {/*          <Box
            alignSelf="stretch"
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Typography variant="caption">Gas Fee: </Typography>
            <Typography variant="caption">0.00001 ETH</Typography>
          </Box> */}

          <Divider />
          <LoadingButton
            disabled={!(sendToAddress && sendAmount)}
            fullWidth
            variant="outlined"
            size="medium"
            color="primary"
            onClick={sendTransaction}
            sx={{ mt: 1, borderRadius: 5 }}>
            Send
          </LoadingButton>
        </Stack>
      </DialogContent>
      <ChooseWalletMenu
        anchorEl={walletAnchorEl}
        open={openSelectWallet}
        onClose={async () => setOpenSelectWallet(false)}
        wallets={flow.wallets}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
      />
      <SearchProfileDialog
        open={openSearchProfile}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
        selectProfileWithSocialsCallback={(selectedProfileWithSocials) => {
          setSendToAddress(selectedProfileWithSocials);
        }}
      />
    </Dialog>
  );
}
