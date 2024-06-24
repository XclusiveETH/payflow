/* eslint-disable jsx-a11y/alt-text */
import { IdentityType } from '../types/ProfleType';
import { shortenWalletAddressLabel } from '../utils/address';

export const giftStorageHtml = (identity: IdentityType) => <GiftStorage identity={identity} />;

function GiftStorage({ identity }: { identity: IdentityType }) {
  const title = '🎁 Gift Storage';

  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileDisplayName = identity?.profile?.displayName ?? farcasterSocial?.profileDisplayName;
  const profileUsername = identity?.profile?.username ?? farcasterSocial?.profileName;
  const profileImage = identity?.profile?.profileImage ?? farcasterSocial?.profileImage;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#f8fafc',
        fontFamily: 'Roboto',
        fontSize: 28,
        padding: 16
      }}>
      <p style={{ fontSize: 60, fontWeight: 'bold', fontStyle: 'italic' }}>{title}</p>
      <div
        style={{
          marginTop: 30,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
        {profileImage && (
          <img
            src={profileImage}
            alt="profile"
            style={{ height: 250, width: 250, margin: 10, borderRadius: 25 }}
          />
        )}
        {profileUsername && profileDisplayName ? (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 64, fontWeight: 'bold' }}>{profileDisplayName}</span>
            <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
              @{profileUsername}
            </span>
          </div>
        ) : (
          <div style={{ margin: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginTop: 10, fontSize: 64, fontWeight: 'normal' }}>
              {shortenWalletAddressLabel(identity?.address)}
            </span>
          </div>
        )}
        {/* {step !== 'create' && step !== 'start' && step !== 'command' && (
          <div
            style={{
              margin: 10,
              minWidth: 250,
              maxWidth: 300,
              height: 230,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: 16,
              fontSize: 36,
              backgroundColor: '#e0e0e0',
              borderRadius: 25,
              gap: 10
            }}>
            {payment.chainId && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10
                }}>
                <img
                  src={assetImageSrc(getNetworkImageSrc(payment.chainId as number))}
                  style={{ width: 36, height: 36, borderRadius: '50%' }}
                />
                <span style={{ fontWeight: 'bold' }}>{getNetworkDisplayName(payment.chainId)}</span>
              </div>
            )}
            {payment.token && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10
                }}>
                <img src={tokenImgSrc} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <b>{payment.token}</b>
                </span>
              </div>
            )}
            {payment.usdAmount && payment.tokenAmount && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <span>
                  <b>${payment.usdAmount} ≈ </b>
                </span>
                <span>
                  <b>{formatAmountWithSuffix(payment.tokenAmount)}</b>
                </span>
              </div>
            )}
            <span>
              <b>
                {payment.status
                  ? payment.status === 'success'
                    ? '✅ Success'
                    : '❌ Failed'
                  : '⏳ Pending'}
              </b>
            </span>
          </div>
        )} */}
      </div>
    </div>
  );
}
