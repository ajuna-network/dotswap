import { NetworkKeys } from "./app/types/enum";

type NetworkConfig = {
  nativeTokenSymbol: string;
  rpcUrlRelay: string;
  rpcUrl: string;
  parents: number;
  assethubSubscanUrl?: string;
  relaySubscanUrl?: string;
};

export const NETWORKS: Record<NetworkKeys, NetworkConfig> = {
  [NetworkKeys.Westend]: {
    nativeTokenSymbol: "WND",
    rpcUrlRelay: "",
    rpcUrl: "wss://westmint-rpc.polkadot.io/",
    parents: 1,
    assethubSubscanUrl: "https://westmint.statescan.io/#",
    relaySubscanUrl: "https://westend.subscan.io",
  },
  [NetworkKeys.Rococo]: {
    nativeTokenSymbol: "ROC",
    rpcUrlRelay: "wss://rococo-rpc.polkadot.io/",
    rpcUrl: "wss://rococo-asset-hub-rpc.polkadot.io/",
    parents: 1,
    assethubSubscanUrl: "https://assethub-rococo.subscan.io",
    relaySubscanUrl: "https://rococo.subscan.io",
  },
  [NetworkKeys.Kusama]: {
    nativeTokenSymbol: "KSM",
    rpcUrlRelay: "wss://kusama-rpc.polkadot.io/",
    rpcUrl: "wss://kusama-asset-hub-rpc.polkadot.io/",
    parents: 1,
    assethubSubscanUrl: "https://assethub-kusama.subscan.io",
    relaySubscanUrl: "https://kusama.subscan.io",
  },
};
