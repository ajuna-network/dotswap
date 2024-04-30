/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_RPC_URL: string;
  readonly VITE_NETWORK_NAME: string;
  readonly VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GIT_URL: string;
  readonly VITE_TWITTER_URL: string;
  readonly VITE_TELEGRAM_URL: string;
  readonly VITE_ANALYTICS_URL: string;
  readonly VITE_ASSETHUB_LINK: string;
  readonly VITE_COINSTATS_API_KEY: string;
  readonly VITE_VERSION: "dedswap" | "dotswap";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
