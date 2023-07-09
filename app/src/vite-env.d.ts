/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_INIT_CONNECT: string;
  readonly VITE_ALCHEMY_API_KEY: string;

  readonly VITE_PAYFLOW_SERVICE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const APP_VERSION: string;
