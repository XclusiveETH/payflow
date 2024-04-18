import { Address, zeroAddress } from 'viem';
import { base, optimism, degen } from 'viem/chains';

export const USDC_TOKEN = 'USDC';
export const DEGEN_TOKEN = 'DEGEN';
export const ETH_TOKEN = 'ETH';
export const ATH_TOKEN = 'ATH';
export const JAAD_TOKEN = 'JAAD';

export const ERC20_CONTRACTS = {
  [base.id]: [
    { name: USDC_TOKEN, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { name: DEGEN_TOKEN, address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' }
  ],
  [optimism.id]: [{ name: USDC_TOKEN, address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85' }],
  [degen.id]: [
    { name: DEGEN_TOKEN } as Token,
    { name: ATH_TOKEN, address: '0xeb1c32ea4e392346795aed3607f37646e2a9c13f' },
    { name: JAAD_TOKEN, address: '0x373e256c754bf82f09071141b92beafb83c38c68' }
  ]
} as {
  [id: number]: Token[];
};

export interface Token {
  address: Address;
  name: string;
}

export interface TokenPrices {
  [name: string]: number;
}

export function getSupportedTokens(chainId: number | undefined): Token[] {
  if (!chainId) {
    return [];
  }

  if (ERC20_CONTRACTS[chainId]) {
    return chainId !== degen.id ? [ETH].concat(ERC20_CONTRACTS[chainId]) : ERC20_CONTRACTS[chainId];
  } else {
    return [ETH];
  }
}

export const ETH: Token = { name: ETH_TOKEN, address: zeroAddress };

export default function getTokenName(token: string): string {
  let name;
  switch (token) {
    case 'eth':
      name = 'Ether';
      break;
    case 'usdc':
      name = 'USD Coin';
      break;
    case 'degen':
      name = 'Degen';
      break;
    default:
      name = 'Unknown';
  }
  return name;
}
