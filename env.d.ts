/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_RPC_URL: string;
  readonly VITE_NETWORK_NAME: string;
  readonly VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
