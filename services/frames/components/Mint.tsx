import { IdentityType } from '../types/ProfleType';
import { shortenWalletAddressLabel2 } from '../utils/address';
import { assetImageSrc } from '../utils/image';
import Card from './Card';

export const mintHtml = (
  identity: IdentityType,
  provider: string,
  collectionName: string,
  name: string,
  url: string
) => (
  <Mint
    identity={identity}
    provider={provider}
    collectionName={collectionName}
    name={name}
    url={url}
  />
);

function Mint({
  identity,
  provider,
  collectionName,
  name,
  url
}: {
  identity: IdentityType;
  provider: string;
  collectionName: string;
  name: string;
  url: string;
}) {
  const farcasterSocial = identity?.meta?.socials?.find((s) => s.dappName === 'farcaster');
  const profileUsername =
    identity.profile?.username ??
    farcasterSocial?.profileName ??
    identity.meta?.ens ??
    shortenWalletAddressLabel2(identity.address);
  const profileImage = identity.profile?.profileImage ?? farcasterSocial?.profileImage;
  return (
    <Card>
      <div
        style={{
          margin: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 10
        }}>
        <span style={{ fontSize: 32 }}>{collectionName} </span>
        <span style={{ fontSize: 40, fontWeight: 'bold' }}>{name}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80%',
          height: '80%',
          margin: 10,
          overflow: 'hidden'
        }}>
        <img
          src={url}
          alt="mint"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            border: '3px',
            borderRadius: 10,
            boxSizing: 'content-box'
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5
          }}>
          {profileImage && (
            <img
              src={profileImage}
              alt="profile"
              style={{ height: 28, width: 28, borderRadius: '50%' }}
            />
          )}
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>{profileUsername}</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5
          }}>
          <img
            src={assetImageSrc(
              `/assets/apps/${provider === 'zora.co' ? 'zora.png' : 'rodeo_club.png'}`
            )}
            alt="provider"
            style={{ height: 28, width: 28, borderRadius: '50%' }}
          />
          <span style={{ fontSize: 24, fontWeight: 'bold' }}>{provider}</span>
        </div>
      </div>
    </Card>
  );
}