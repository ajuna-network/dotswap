const useGetNetwork = () => {
  return {
    nativeTokenSymbol: "KSM",
    rpcUrl: "wss://kusama-asset-hub-rpc.polkadot.io/",
    parents: 1,
    assethubSubscanUrl: "https://assethub-kusama.subscan.io",
  };
};

export default useGetNetwork;
