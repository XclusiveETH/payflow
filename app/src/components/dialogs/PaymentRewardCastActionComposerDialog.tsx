import { DialogProps, Stack, Button, TextField, InputAdornment, IconButton } from '@mui/material';
import { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { RewardAdvancedSection } from '../RewardAdvancedSection';
import { PaymentCategory, Type } from '../../types/PaymentType';
import ResponsiveDialog from './ResponsiveDialog';

import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { ProfileContext } from '../../contexts/UserContext';
import { FlowWalletType } from '../../types/FlowType';
import { Token } from '../../utils/erc20contracts';
import { useChainId } from 'wagmi';
import { base } from 'viem/chains';
import { FaCoins, FaDollarSign } from 'react-icons/fa';

export default function PaymentRewardCastActionComposerDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const { profile } = useContext(ProfileContext);

  const chainId = useChainId();
  const [rewardUsdAmount, setRewardUsdAmount] = useState<number | undefined>(1);
  const [rewardTokenAmount, setRewardTokenAmount] = useState<number | undefined>(1);
  const [type, setType] = useState<PaymentCategory>('reward');
  const [numberOfRewards, setNumberOfRewards] = useState<number>(1);
  const [extraParams, setExtraParams] = useState<Record<string, string>>({});

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const [isFiatMode, setIsFiatMode] = useState<boolean>(true);

  const compatibleWallets = profile?.defaultFlow?.wallets ?? [];
  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setSelectedWallet(undefined);
      return;
    }
    setSelectedWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.open) {
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [props.open]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty input or any positive number (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      const numericValue = value === '' ? undefined : parseFloat(value);

      if (isFiatMode) {
        setRewardUsdAmount(numericValue);
      } else {
        setRewardTokenAmount(numericValue);
      }
    }
  };

  const actionUrl = useMemo(() => {
    const actionUrl = 'https://api.payflow.me/api/farcaster/actions/pay/reward';

    const params = new URLSearchParams({
      amount: isFiatMode ? rewardUsdAmount?.toString() ?? '' : '',
      tokenAmount: !isFiatMode ? rewardTokenAmount?.toString() ?? '' : '',
      token: selectedToken?.id ?? '',
      chainId: (selectedToken?.chainId ?? base.id).toString(),
      type: type ?? 'INTENT',
      rewards: numberOfRewards.toString()
    });

    console.log('extraParams', extraParams);

    // Add enabled criteria to params
    Object.entries(extraParams)
      .filter(([_, value]) => value !== '')
      .forEach(([id, value]) => {
        params.append(id, value);
      });

    return `${actionUrl}?${params.toString()}`;
  }, [
    isFiatMode,
    rewardUsdAmount,
    rewardTokenAmount,
    selectedToken,
    type,
    numberOfRewards,
    extraParams
  ]);

  const warpcastInstallActionUrl = useMemo(() => {
    const baseUrl = 'https://warpcast.com/~/add-cast-action';
    const encodedActionUrl = encodeURIComponent(actionUrl);
    return `${baseUrl}?url=${encodedActionUrl}`;
  }, [actionUrl]);

  return (
    <ResponsiveDialog
      title="Custom Reward Action"
      open={props.open}
      onClose={closeStateCallback}
      zIndex={1450}>
      <Stack p={1} direction="column" spacing={2} justifyContent="space-between" width="100%">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack alignItems="flex-start">
            <TextField
              variant="standard"
              autoFocus
              focused
              placeholder="0"
              value={inputValue}
              onChange={handleInputChange}
              inputRef={inputRef}
              /* label={
                <Typography color="text.secondary" pl={0.5}>
                  {isFiatMode ? 'USD Amount' : 'Token Amount'}
                </Typography>
              } */
              slotProps={{
                input: {
                  disableUnderline: true,
                  style: {
                    fontWeight: 'bold',
                    fontSize: 30,
                    padding: 0
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        onClick={() => setIsFiatMode(!isFiatMode)}
                        sx={{ color: 'text.secondary' }}>
                        {isFiatMode ? <FaDollarSign /> : <FaCoins />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Stack>

          <NetworkTokenSelector
            paymentWallet={selectedWallet}
            setPaymentWallet={setSelectedWallet}
            paymentToken={selectedToken}
            setPaymentToken={setSelectedToken}
            compatibleWallets={compatibleWallets}
            showBalance={false}
          />
        </Stack>

        <RewardAdvancedSection
          type={type}
          setType={setType}
          numberOfRewards={numberOfRewards}
          setNumberOfRewards={setNumberOfRewards}
          setExtraParams={setExtraParams}
        />

        <Button
          variant="outlined"
          disabled={!selectedToken}
          color="inherit"
          fullWidth
          size="large"
          sx={{ borderRadius: 5 }}
          href={warpcastInstallActionUrl}
          target="_blank">
          Add To Warpcast
        </Button>
      </Stack>
    </ResponsiveDialog>
  );
}
