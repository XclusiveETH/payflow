import { DAPP_URL } from './urlConstants';

export const XMPT_DAPP = 'xmtp';
export const ENS_DAPP = 'ens';
export const FARCASTER_DAPP = 'farcaster';
export const LENS_DAPP = 'lens';
export const ADDRESS = 'address';
export const PAYFLOW = 'payflow';

export type dAppType =
  | typeof XMPT_DAPP
  | typeof ENS_DAPP
  | typeof FARCASTER_DAPP
  | typeof LENS_DAPP
  | typeof ADDRESS
  | typeof PAYFLOW;

export const XMTP_INBOX = 'inbox';
export const XMTP_CONVERSE = 'converse';
export const XMTP_COINBASE = 'coinbase';

export type XmtpAppType = typeof XMTP_INBOX | typeof XMTP_CONVERSE | typeof XMTP_COINBASE;

export function socialLink(dappName: dAppType, profileName?: string) {
  switch (dappName) {
    case 'ens':
    case 'address':
      return `https://etherscan.io/address/${profileName}`;
    case 'farcaster':
      return `https://warpcast.com/${profileName}`;
    case 'lens':
      return `https://hey.xyz/u/${profileName}`;
    case 'payflow':
      return `${DAPP_URL}/${profileName}`;
  }
}
