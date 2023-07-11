declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ZKS_PRIVATE_KEY: string;
      ALCHEMY_API_KEY: string;
      AA_FACTORY_ADDRESS: string;
      MULTISIG_OWNER_ADDRESS_1: string;
      MULTISIG_OWNER_ADDRESS_2: string;
      GOERLI_ETHERSCAN_API_KEY: string;
    }
  }
}
export {};
