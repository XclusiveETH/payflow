import { Stack, Box, Typography, Skeleton, DialogProps } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useMemo, useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import { useStoragePaymentTx } from '../../utils/hooks/useStoragePaymentTx';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import { Hash } from 'viem';

export type BuyStorageDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    recipientSocial: Social;
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function BuyStorageDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  recipientSocial,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: BuyStorageDialogProps) {
  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const numberOfUnits = payment.tokenAmount ?? 1;

  const { isLoading: isPaymentTxLoading, data: paymentTx } = useStoragePaymentTx(
    numberOfUnits,
    payment.receiverFid
  );

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx), {
    ...(paymentTx as any),
    account: senderFlow.wallets[0].address
  });

  const paymentOption = useMemo(
    () => getPaymentOption(paymentOptions, paymentToken),
    [paymentOptions, paymentToken]
  );

  console.log('Payment Options: ', paymentOptions);

  const compatibleWallets = useCompatibleWallets({
    sender: senderFlow,
    payment,
    paymentOptions: !isPaymentOptionsLoading ? paymentOptions : undefined
  });

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setPaymentWallet(undefined);
      return;
    }
    setPaymentWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

  const isLoading = isPaymentTxLoading || isPaymentOptionsLoading;
  const hasPaymentOption = !isLoading && paymentOption && paymentToken;

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );
  const successMessage = `Successfully bought ${numberOfUnits} unit${
    numberOfUnits > 1 ? 's' : ''
  } of storage for @${recipientSocial.profileName}`;

  return (
    <>
      {!paymentSuccessData && (
        <BasePaymentDialog
          alwaysShowBackButton={alwaysShowBackButton}
          title={props.title ?? 'Farcaster Storage'}
          closeStateCallback={closeStateCallback}
          {...props}
          footerContent={
            <PayButton
              paymentToken={paymentToken}
              buttonText="Pay For Storage"
              disabled={!hasPaymentOption}
              paymentTx={paymentTx}
              paymentWallet={paymentWallet!}
              paymentOption={paymentOption!}
              payment={payment}
              senderFlow={senderFlow}
              onSuccess={setPaymentSuccessData}
              onError={(error) => {
                toast.error(`Failed to pay for storage!`);
                console.error('Failed to pay for storage with error', error);
              }}
            />
          }>
          <Box ml={1}>
            <FarcasterRecipientField variant="text" social={recipientSocial} />
          </Box>
          <Stack flex={1} alignItems="center" justifyContent="center" spacing={1} overflow="auto">
            <Typography fontSize={18} fontWeight="bold">
              {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
            </Typography>

            {isLoading ? (
              <Skeleton
                title="fetching price"
                variant="rectangular"
                sx={{ borderRadius: 3, height: 45, width: 100 }}
              />
            ) : hasPaymentOption ? (
              <Typography fontSize={30} fontWeight="bold" textAlign="center">
                {formatAmountWithSuffix(
                  normalizeNumberPrecision(parseFloat(paymentOption.paymentAmount))
                )}{' '}
                {paymentToken?.id.toUpperCase()}
              </Typography>
            ) : (
              <Typography textAlign="center" fontSize={14} fontWeight="bold" color={red.A400}>
                {isPaymentOptionsError
                  ? 'Failed to fetch payment options. Please try again.'
                  : "You don't have any balance to cover storage cost. Switch to a different payment flow!"}
              </Typography>
            )}
          </Stack>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box width="50%">
              <FlowSelector
                variant="text"
                sender={sender}
                flows={flows!}
                selectedFlow={selectedFlow!}
                setSelectedFlow={setSelectedFlow!}
              />
            </Box>
            <Box width="50%">
              <NetworkTokenSelector
                crossChainMode
                payment={payment}
                paymentWallet={paymentWallet}
                setPaymentWallet={setPaymentWallet}
                paymentToken={paymentToken}
                setPaymentToken={setPaymentToken}
                compatibleWallets={compatibleWallets}
                enabledChainCurrencies={
                  paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? []
                }
                gasFee={gasFee}
              />
            </Box>
          </Box>
        </BasePaymentDialog>
      )}
      {paymentSuccessData && (
        <PaymentSuccessDialog
          open={true}
          onClose={() => {
            window.location.href = '/';
          }}
          message={successMessage}
          receiptUrl={getReceiptUrl({ ...payment, hash: paymentSuccessData.txHash }, false)}
        />
      )}
    </>
  );
}