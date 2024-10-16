import { Container } from '@mui/material';
import { lazy, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { FlowType } from '../types/FlowType';
import { useNavigate, useParams } from 'react-router-dom';
import { PaymentType } from '../types/PaymentType';
import { fetchPayment } from '../services/payments';
import { fetchQuery } from '@airstack/airstack-react';
import {
  QUERY_FARCASTER_PROFILE,
  QUERY_FARCASTER_PROFILE_BY_IDENTITY
} from '../utils/airstackQueries';
import {
  GetFarcasterProfileByIdentityQuery,
  GetFarcasterProfileQuery,
  Social
} from '../generated/graphql/types';
import { IdentityType, SelectedIdentityType } from '../types/ProfileType';
import { toast } from 'react-toastify';
import { statusToToastType } from '../components/Toasts';
import { fetchMintData, MintMetadata, parseMintToken } from '../utils/mint';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { fetchHypersubData, HypersubData } from '../utils/hooks/useHypersubData';

const LazyMintDialog = lazy(() => import('../components/payment/MintDialog'));
const LazyBuyFanTokenDialog = lazy(() => import('../components/payment/BuyFanTokenDialog'));
const LazySubscribeToHypersubDialog = lazy(
  () => import('../components/payment/HypersubDialog')
);
const LazyGiftStorageDialog = lazy(() => import('../components/payment/BuyStorageDialog'));
const LazyPaymentDialog = lazy(() => import('../components/payment/PaymentDialog'));

export default function Payment() {
  const navigate = useNavigate();

  const { refId } = useParams();
  const { profile } = useContext(ProfileContext);

  const { flows } = profile ?? { flows: [] };
  const [selectedFlow, setSelectedFlow] = useState<FlowType>();

  const [payment, setPayment] = useState<PaymentType>();
  const [senderSocial, setSenderSocial] = useState<Social>();
  const [recipientSocial, setRecipientSocial] = useState<Social>();
  const [mintData, setMintData] = useState<MintMetadata>();
  const [hypersubData, setHypersubData] = useState<HypersubData | null>(null);

  useEffect(() => {
    if (!profile) {
      navigate(`/connect?redirect=/payment/${refId}`);
    }
  }, []);

  useEffect(() => {
    if (!selectedFlow && flows && flows.length > 0) {
      setSelectedFlow(flows.find((f) => f.uuid === profile?.defaultFlow?.uuid) ?? flows[0]);
    }
  }, [selectedFlow, flows]);

  useEffect(() => {
    const fetchData = async () => {
      if (refId && !payment) {
        try {
          // Fetch payment data
          const paymentData = await fetchPayment(refId);

          if (paymentData) {
            if (paymentData.status !== 'PENDING' && !paymentData.category) {
              toast(`Payment ${paymentData.status}!`, {
                autoClose: 3000,
                type: statusToToastType[paymentData.status] || 'default'
              });
              return;
            }

            if (paymentData.receiverFid) {
              // TODO: fetch from server instead
              const { data: recipientData } = await fetchQuery<GetFarcasterProfileQuery>(
                QUERY_FARCASTER_PROFILE,
                { fid: paymentData.receiverFid.toString() },
                { cache: true }
              );

              const recipientSocial = recipientData?.Socials?.Social?.[0];
              if (recipientSocial) {
                setRecipientSocial(recipientSocial as Social);
              }

              const { data: senderData } = await fetchQuery<GetFarcasterProfileByIdentityQuery>(
                QUERY_FARCASTER_PROFILE_BY_IDENTITY,
                { identity: profile?.identity },
                { cache: true }
              );

              const senderSocial = senderData?.Socials?.Social?.[0];
              if (senderSocial) {
                setSenderSocial(senderSocial as Social);
              }

              if (paymentData.category === 'mint') {
                const parsedMintData = parseMintToken(paymentData.token);
                const mintData = await fetchMintData(
                  parsedMintData.provider,
                  paymentData.chainId,
                  parsedMintData.contract,
                  parsedMintData.tokenId,
                  parsedMintData.referral
                );
                setMintData(mintData);
              }

              if (paymentData.category === 'hypersub') {
                const hypersubData = await fetchHypersubData(paymentData);
                setHypersubData(hypersubData);
              }
            }

            // Update payment state
            setPayment(paymentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    fetchData();
  }, [refId, payment]);

  // specify height, otherwise the privy dialog won't be properly displayed
  return (
    <>
      <Helmet>
        <title> Payflow | Payment </title>
      </Helmet>
      <Container maxWidth="md" sx={{ height: '100vh' }}>
        <LoadingPayflowEntryLogo />
        {profile &&
          payment &&
          flows &&
          selectedFlow &&
          (!payment.category ? (
            <LazyPaymentDialog
              alwaysShowBackButton
              title="Complete Payment"
              open={payment != null}
              paymentType="payflow"
              payment={payment}
              sender={{
                identity: {
                  profile: { ...profile, defaultFlow: selectedFlow },
                  address: profile.identity
                },
                type: 'profile'
              }}
              recipient={
                {
                  identity: {
                    ...(payment.receiver
                      ? {
                          profile: {
                            ...payment.receiver,
                            ...(payment.receiverFlow && { defaultFlow: payment.receiverFlow })
                          }
                        }
                      : {
                          address: payment.receiverAddress
                        })
                  } as IdentityType,
                  type: payment.receiver ? 'profile' : 'address'
                } as SelectedIdentityType
              }
              closeStateCallback={async () => {
                navigate('/');
              }}
              flows={flows}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
            />
          ) : (
            senderSocial &&
            recipientSocial &&
            ((payment.category === 'fc_storage' && (
              <LazyGiftStorageDialog
                alwaysShowBackButton
                title="Complete Storage Payment"
                open={payment != null}
                payment={payment}
                sender={{
                  identity: {
                    profile: { ...profile, defaultFlow: selectedFlow },
                    address: profile.identity
                  },
                  type: 'profile'
                }}
                recipientSocial={recipientSocial}
                closeStateCallback={async () => {
                  navigate('/');
                }}
                flows={flows}
                selectedFlow={selectedFlow}
                setSelectedFlow={setSelectedFlow}
              />
            )) ||
              (payment.category === 'mint' && mintData && (
                <LazyMintDialog
                  alwaysShowBackButton
                  title="Complete Mint Payment"
                  open={payment != null}
                  payment={payment}
                  sender={{
                    identity: {
                      profile: { ...profile, defaultFlow: selectedFlow },
                      address: profile.identity
                    },
                    type: 'profile'
                  }}
                  senderSocial={senderSocial}
                  recipientSocial={recipientSocial}
                  mint={mintData}
                  closeStateCallback={async () => {
                    navigate('/');
                  }}
                  flows={flows}
                  selectedFlow={selectedFlow}
                  setSelectedFlow={setSelectedFlow}
                />
              )) ||
              (payment.category === 'fan' && senderSocial && recipientSocial && (
                <LazyBuyFanTokenDialog
                  alwaysShowBackButton
                  title="Complete Token Purchase"
                  open={payment != null}
                  payment={payment}
                  sender={{
                    identity: {
                      profile: { ...profile, defaultFlow: selectedFlow },
                      address: profile.identity
                    },
                    type: 'profile'
                  }}
                  senderSocial={senderSocial}
                  recipientSocial={recipientSocial}
                  closeStateCallback={async () => {
                    navigate('/');
                  }}
                  flows={flows}
                  selectedFlow={selectedFlow}
                  setSelectedFlow={setSelectedFlow}
                />
              )) ||
              (payment.category === 'hypersub' &&
                hypersubData &&
                senderSocial &&
                recipientSocial && (
                  <LazySubscribeToHypersubDialog
                    alwaysShowBackButton
                    title="Complete Subscription"
                    open={payment != null}
                    payment={payment}
                    sender={{
                      identity: {
                        profile: { ...profile, defaultFlow: selectedFlow },
                        address: profile.identity
                      },
                      type: 'profile'
                    }}
                    senderSocial={senderSocial}
                    recipientSocial={recipientSocial}
                    hypersub={hypersubData}
                    closeStateCallback={async () => {
                      navigate('/');
                    }}
                    flows={flows}
                    selectedFlow={selectedFlow}
                    setSelectedFlow={setSelectedFlow}
                  />
                )))
          ))}
      </Container>
    </>
  );
}
