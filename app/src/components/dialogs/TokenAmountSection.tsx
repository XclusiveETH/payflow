import {
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  styled,
  Skeleton
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useBalance } from 'wagmi';
import { PriorityHigh, SwapVert } from '@mui/icons-material';
import { formatUnits, parseUnits } from 'viem';
import { FlowWalletType } from '../../types/FlowType';
import { grey, red } from '@mui/material/colors';
import { Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useTokenPrices } from '../../utils/queries/prices';
import { PaymentType } from '../../types/PaymentType';
import { MdMultipleStop } from 'react-icons/md';
import { useDarkMode } from '../../utils/hooks/useDarkMode';

const TokenAmountTextField = styled(TextField)(() => ({
  '& .MuiInputBase-input::placeholder': {
    paddingLeft: '15px'
  }
}));

export function TokenAmountSection({
  payment,
  crossChainMode = false,
  setCrossChainMode,
  setPaymentEnabled,
  selectedWallet,
  selectedToken,
  paymentAmount,
  setPaymentAmount,
  paymentAmountUSD,
  setPaymentAmountUSD,
  balanceCheck = true
}: {
  payment?: PaymentType;
  crossChainMode?: boolean;
  setCrossChainMode?: React.Dispatch<React.SetStateAction<boolean>>;
  setPaymentEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedWallet: FlowWalletType | undefined;
  selectedToken?: Token;
  paymentAmount?: number;
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  paymentAmountUSD?: number;
  setPaymentAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
  crossChainPaymentAmount?: number;
  setCrossChainPaymentAmount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  balanceCheck?: boolean;
}) {
  const prefersDarkMode = useDarkMode();

  const { data: tokenPrices } = useTokenPrices();

  const [balanceEnough, setBalanceEnough] = useState<boolean>();

  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(Boolean(payment?.usdAmount));

  const crossChainModeSupported = Boolean(payment?.token);

  // replace with balance as well
  const { isFetching: isBalanceFetching, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: selectedToken?.chainId,
    token: selectedToken?.tokenAddress,
    query: {
      enabled: balanceCheck && Boolean(selectedWallet && selectedToken),
      staleTime: 60000
    }
  });

  useMemo(async () => {
    if (selectedToken && tokenPrices) {
      const price = tokenPrices[selectedToken.id];
      setSelectedTokenPrice(price);
    } else {
      setSelectedTokenPrice(undefined);
    }
  }, [selectedToken, tokenPrices]);

  useEffect(() => {
    if (crossChainMode) {
      return;
    }

    console.log(
      'updating amount: ',
      crossChainMode,
      usdAmountMode,
      paymentAmount,
      paymentAmountUSD
    );

    let balanceEnough: boolean | undefined;
    if (selectedToken && selectedTokenPrice && (!balanceCheck || balance)) {
      if (usdAmountMode === true && paymentAmountUSD !== undefined) {
        const amount = parseUnits(
          (paymentAmountUSD / selectedTokenPrice).toString(),
          selectedToken.decimals
        );
        balanceEnough = !balanceCheck || crossChainMode ? true : amount <= (balance?.value ?? 0);
        setPaymentAmount(parseFloat(formatUnits(amount, selectedToken.decimals)));
      }
      if (usdAmountMode === false && paymentAmount !== undefined) {
        const usdAmount = paymentAmount * selectedTokenPrice;
        balanceEnough =
          !balanceCheck || crossChainMode
            ? true
            : parseUnits(paymentAmount.toString(), selectedToken.decimals) <= (balance?.value ?? 0);
        setPaymentAmountUSD(parseFloat(normalizeNumberPrecision(usdAmount)));
      }
    }
    setBalanceEnough(balanceEnough);
  }, [
    crossChainMode,
    balanceCheck,
    usdAmountMode,
    paymentAmountUSD,
    paymentAmount,
    selectedToken,
    balance,
    selectedTokenPrice
  ]);

  useMemo(() => {
    if (setPaymentEnabled) {
      setPaymentEnabled(
        Boolean(
          balanceEnough &&
            paymentAmount &&
            paymentAmount > 0 &&
            paymentAmountUSD &&
            paymentAmountUSD > 0
        )
      );
    }
  }, [balanceEnough, paymentAmount, paymentAmountUSD]);

  return (
    <Stack mt={1} alignItems="center" spacing={0}>
      {selectedToken ? (
        <>
          {!crossChainMode && !payment?.token && (
            <TokenAmountTextField
              // don't auto focus if it's pending payment
              {...(!paymentAmount && { autoFocus: true, focused: true })}
              variant="standard"
              placeholder="0"
              type="number"
              value={usdAmountMode ? paymentAmountUSD : paymentAmount}
              error={
                Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) && balanceEnough === false
              }
              inputProps={{
                style: {
                  maxWidth: 100,
                  fontWeight: 'bold',
                  fontSize: 30,
                  textAlign: 'center'
                }
              }}
              InputProps={{
                ...(usdAmountMode
                  ? {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography fontSize={24} fontWeight="bold">
                            $
                          </Typography>
                        </InputAdornment>
                      )
                    }
                  : {
                      endAdornment: (
                        <InputAdornment position="start">
                          <Typography ml={0.5} fontSize={24} fontWeight="bold">
                            {selectedToken.id.toUpperCase()}
                          </Typography>
                        </InputAdornment>
                      )
                    }),
                disableUnderline: true
              }}
              onChange={async (event) => {
                if (event.target.value) {
                  const amount = parseFloat(event.target.value);
                  if (!isNaN(amount) && amount >= 0) {
                    if (usdAmountMode) {
                      setPaymentAmountUSD(amount);
                    } else {
                      setPaymentAmount(amount);
                    }
                  }
                } else {
                  setPaymentAmountUSD(undefined);
                  setPaymentAmount(undefined);
                }
              }}
              sx={{ minWidth: 'auto' }}
            />
          )}

          {(crossChainMode || payment?.token) && (
            <Typography fontSize={30} fontWeight="bold" textAlign="center">
              {usdAmountMode
                ? `$ ${paymentAmountUSD}`
                : `${formatAmountWithSuffix(
                    normalizeNumberPrecision(paymentAmount ?? 0)
                  )} ${selectedToken.id.toUpperCase()}`}{' '}
              ≈{' '}
              {usdAmountMode
                ? `${formatAmountWithSuffix(
                    normalizeNumberPrecision(paymentAmount ?? 0)
                  )} ${selectedToken.id.toUpperCase()}`
                : `$ ${normalizeNumberPrecision(paymentAmountUSD ?? 0)}`}
            </Typography>
          )}

          {!crossChainMode && !payment?.token && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {!payment?.token && (
                <IconButton
                  size="small"
                  sx={{ color: grey[prefersDarkMode ? 400 : 700] }}
                  onClick={async () => {
                    setUsdAmountMode(!usdAmountMode);
                  }}>
                  <SwapVert fontSize="small" />
                </IconButton>
              )}
              {isBalanceFetching ? (
                <Skeleton
                  title="fetching price"
                  variant="rectangular"
                  sx={{ borderRadius: 3, height: 35, width: 80 }}
                />
              ) : (
                <Typography fontSize={20} fontWeight="bold">
                  {usdAmountMode
                    ? `${formatAmountWithSuffix(
                        normalizeNumberPrecision(paymentAmount ?? 0)
                      )} ${selectedToken.id.toUpperCase()}`
                    : `$ ${normalizeNumberPrecision(paymentAmountUSD ?? 0)}`}
                </Typography>
              )}

              {!payment?.token && balanceCheck && (
                <Button
                  onClick={async () => {
                    if (balance && selectedTokenPrice) {
                      const maxAmount = parseFloat(
                        formatUnits(balance.value, selectedToken.decimals)
                      );
                      if (usdAmountMode) {
                        setPaymentAmountUSD(
                          parseFloat(normalizeNumberPrecision(maxAmount * selectedTokenPrice))
                        );
                      } else {
                        setPaymentAmount(parseFloat(normalizeNumberPrecision(maxAmount)));
                      }
                    } else {
                      setPaymentAmount(undefined);
                    }
                  }}
                  sx={{
                    minWidth: 'auto',
                    borderRadius: 5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    color: grey[prefersDarkMode ? 400 : 700]
                  }}>
                  MAX
                </Button>
              )}
            </Stack>
          )}

          {!crossChainMode &&
            Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) &&
            balanceEnough === false && (
              <>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
                  <Typography fontSize={14} fontWeight="bold" color={red.A400}>
                    balance not enough
                  </Typography>
                </Stack>
                {crossChainModeSupported &&
                  !crossChainMode &&
                  paymentAmountUSD &&
                  paymentAmountUSD <= 100 && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        borderRadius: 5,
                        border: 2,
                        borderColor: 'divider',
                        borderStyle: 'dotted'
                      }}
                      onClick={async () => {
                        setCrossChainMode?.(true);
                      }}
                      startIcon={<MdMultipleStop />}>
                      Pay with different token
                    </Button>
                  )}
              </>
            )}
        </>
      ) : (
        <Skeleton
          title="loading token"
          variant="rounded"
          sx={{ borderRadius: 5, height: 80, width: 150 }}
        />
      )}
    </Stack>
  );
}
