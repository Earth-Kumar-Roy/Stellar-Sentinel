export const STELLAR_CONFIG = {
  CONTRACT_ID: 'CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2',
  NETWORK: 'TESTNET',
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  NATIVE_TOKEN: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzo1DoSre_FzqHux_aBb7yFjD7o_Xu_IYUlKq93TjH-MwcoK78ntKiW8fEnGEItPLM/exec',
};

export const GAS_WEBHOOK_URL = STELLAR_CONFIG.APPS_SCRIPT_URL;

export interface TokenAsset {
  symbol: string;
  name: string;
  contractId: string;
  decimals: number;
  isNative?: boolean;
}

export const SUPPORTED_TOKENS: Record<string, TokenAsset> = {
  XLM: {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    contractId: 'CBPD6XGRX4VF5CIBDLLYQCBV7UG6ZW7CTZE3FSWKD73JMNIJJ73MDJKK',
    decimals: 7,
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    contractId: 'CCEWDNGDQZRTSBQLDZZEPNFPL3R7NZTVBNRDKT6AZ436L6X6V5OL56QN',
    decimals: 7,
  },
};

export const resolveTokenByAddress = (address?: string): TokenAsset => {
  if (!address) return SUPPORTED_TOKENS.XLM;
  const match = Object.values(SUPPORTED_TOKENS).find(
    (t) => t.contractId.toUpperCase() === address.toUpperCase()
  );
  return match || {
    symbol: 'TOKEN',
    name: 'Custom Asset',
    contractId: address,
    decimals: 7,
  };
};