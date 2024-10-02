import React from 'react';
import { Avatar, BoxProps, Skeleton, Stack, Typography, styled } from '@mui/material';
import { PaymentType } from '../../types/PaymentType';
import { useSocialData } from '../../utils/hooks/useSocials';
import { FarcasterProfileSection } from '../FarcasterProfileSection';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useMobile } from '../../utils/hooks/useMobile';
import { PaymentCard } from '../cards/PaymentCard';
import { useMintData } from '../../utils/hooks/useMintData';

const StyledTypography = styled(Typography)(() => ({
  textAlign: 'start',
  variant: 'subtitle2',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  wordBreak: 'break-word'
}));

const PAYMENT_TITLES: { [key: string]: string } = {
  fc_storage: 'Buy Storage',
  mint: 'Mint',
  fan: 'Buy Token',
  default: 'Payment'
};

interface PaymentContentWrapperProps {
  payment: PaymentType;
  children: React.ReactNode;
  loading: boolean;
}

const PaymentContentWrapper: React.FC<PaymentContentWrapperProps> = ({
  payment,
  children,
  loading
}) => {
  const title =
    PAYMENT_TITLES[payment.category ?? 'default'] ||
    (payment.type === 'INTENT_TOP_REPLY' ? 'Top Reply' : PAYMENT_TITLES.default);

  return (
    <PaymentCard payment={payment} title={title}>
      <PaymentContent loading={loading}>{children}</PaymentContent>
    </PaymentCard>
  );
};

interface PaymentContentProps {
  children: React.ReactNode;
  loading: boolean;
}

const PaymentContent: React.FC<PaymentContentProps> = ({ children, loading }) => {
  return loading ? (
    <Skeleton variant="rounded" sx={{ width: '100%', height: '100%', minHeight: 80 }} />
  ) : (
    <Stack spacing={1}>{children}</Stack>
  );
};

interface UsePaymentDataResult {
  social: any; // Replace 'any' with the actual type of social data
  mintData: any; // Replace 'any' with the actual type of mint data
  isMobile: boolean;
  token: Token | undefined;
  loading: boolean;
}

const usePaymentData = (payment: PaymentType): UsePaymentDataResult => {
  const { social, isLoading: loadingSocials } = useSocialData(payment.receiverFid?.toString());
  const { mintData, loading: loadingMintData } = useMintData(payment);
  const isMobile = useMobile();
  const token = ERC20_CONTRACTS.find(
    (t) => t.chainId === payment.chainId && t.id === payment.token
  );

  return {
    social,
    mintData,
    isMobile,
    token,
    loading: loadingSocials || loadingMintData
  };
};

const RecipientInfo: React.FC<{ payment: PaymentType; social: any }> = ({ payment, social }) => {
  const Content = () => {
    if (payment.receiverFid && social) {
      return <FarcasterProfileSection social={social} />;
    } else if (payment.receiver) {
      return <ProfileSection profile={payment.receiver} />;
    } else {
      return <AddressSection identity={{ address: payment.receiverAddress }} />;
    }
  };

  return (
    <div style={{ height: 50 }}>
      <Content />
    </div>
  );
};

const PaymentDetails: React.FC<{
  payment: PaymentType;
  token: Token | undefined;
  isMobile: boolean;
}> = ({ payment, token, isMobile }) => (
  <Stack
    alignSelf="center"
    direction="row"
    alignItems="center"
    justifyContent="flex-start"
    spacing={0.5}
    useFlexGap
    flexWrap="wrap">
    <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
      <b>
        {payment.tokenAmount
          ? formatAmountWithSuffix(normalizeNumberPrecision(payment.tokenAmount))
          : `$${payment.usdAmount}`}
      </b>{' '}
    </Typography>
    <Typography variant="caption" fontSize={isMobile ? 12 : 13} textTransform="uppercase">
      <b>{payment.token}</b>
    </Typography>
    <TokenAvatar token={token as Token} sx={{ width: 15, height: 15 }} />
    <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
      on
    </Typography>
    <NetworkAvatar chainId={payment.chainId} sx={{ width: 15, height: 15 }} />
  </Stack>
);

interface PaymentComponentProps extends BoxProps {
  payment: PaymentType;
}

export const GiftStoragePayment: React.FC<PaymentComponentProps> = ({ payment }) => {
  const { social, isMobile, loading } = usePaymentData(payment);
  const numberOfUnits = payment.tokenAmount ?? 1;

  return (
    <PaymentContentWrapper payment={payment} loading={loading}>
      {social && (
        <>
          <RecipientInfo payment={payment} social={social} />
          <Typography
            textAlign="start"
            variant="subtitle2"
            fontWeight="bold"
            fontSize={isMobile ? 12 : 13}>
            {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
          </Typography>
        </>
      )}
    </PaymentContentWrapper>
  );
};

export const FanTokenPayment: React.FC<PaymentComponentProps> = ({ payment }) => {
  const { social, isMobile, token, loading } = usePaymentData(payment);

  return (
    <PaymentContentWrapper payment={payment} loading={loading}>
      {social && (
        <>
          <RecipientInfo payment={payment} social={social} />
          <Typography
            textAlign="center"
            variant="subtitle2"
            fontWeight="bold"
            fontSize={isMobile ? 12 : 13}>
            {payment.tokenAmount
              ? `${formatAmountWithSuffix(payment.tokenAmount.toString())} `
              : ''}
            {payment.token.split(';')[0]}
          </Typography>
        </>
      )}
    </PaymentContentWrapper>
  );
};

export const MintPayment: React.FC<PaymentComponentProps> = ({ payment }) => {
  const { social, mintData, isMobile, loading } = usePaymentData(payment);
  const mintCount = payment.tokenAmount ?? 1;

  return (
    <PaymentContentWrapper payment={payment} loading={loading}>
      {social && mintData && (
        <>
          <Stack
            height={50}
            direction="row"
            alignItems="center"
            justifyContent="flex-start"
            spacing={0.5}>
            <Avatar
              variant="rounded"
              src={mintData.metadata.image}
              sx={{ width: 40, height: 40 }}
            />
            <StyledTypography>{mintData.metadata.name}</StyledTypography>
          </Stack>
          <Typography
            textAlign="center"
            variant="subtitle2"
            fontWeight="bold"
            fontSize={isMobile ? 12 : 13}
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              wordBreak: 'break-all'
            }}>
            {mintData.collectionName}
          </Typography>
          {mintCount > 1 && (
            <Typography
              textAlign="start"
              variant="subtitle2"
              fontWeight="bold"
              fontSize={isMobile ? 12 : 13}>
              Mint Count: {mintCount}
            </Typography>
          )}
        </>
      )}
    </PaymentContentWrapper>
  );
};

export const GenericPayment: React.FC<PaymentComponentProps> = ({ payment }) => {
  const { social, isMobile, token, loading } = usePaymentData(payment);

  return (
    <PaymentContentWrapper payment={payment} loading={loading}>
      <RecipientInfo payment={payment} social={social} />
      <PaymentDetails payment={payment} token={token} isMobile={isMobile} />
    </PaymentContentWrapper>
  );
};

export const PaymentItem: React.FC<PaymentComponentProps> = ({ payment, ...props }) => {
  const PaymentComponent = (() => {
    switch (payment.category) {
      case 'fc_storage':
        return GiftStoragePayment;
      case 'mint':
        return MintPayment;
      case 'fan':
        return FanTokenPayment;
      default:
        return GenericPayment;
    }
  })();

  return <PaymentComponent payment={payment} {...props} />;
};
