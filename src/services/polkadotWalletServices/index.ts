import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";
import { formatBalance } from "@polkadot/util";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import type { AnyJson } from "@polkadot/types/types/codec";
import { getWallets } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { TokenBalanceData } from "../../app/types";
import { ActionType } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import LocalStorage from "../../app/util/localStorage";
import dotAcpToast from "../../app/util/toast";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";
import { getAllLiquidityPoolsTokensMetadata } from "../poolServices";
import { whitelist } from "../../whitelist";

export const setupPolkadotApi = async () => {
  const { rpcUrl } = useGetNetwork();
  const wsProvider = new WsProvider(rpcUrl);
  const api = await ApiPromise.create({ provider: wsProvider });
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

  return api;
};

export const getWalletTokensBalance = async (api: ApiPromise, walletAddress: string) => {
  const now = await api.query.timestamp.now();
  const { nonce, data: balance } = await api.query.system.account(walletAddress);
  const nextNonce = await api.rpc.system.accountNextIndex(walletAddress);
  const tokenMetadata = api.registry.getChainProperties();
  const existentialDeposit = await api.consts.balances.existentialDeposit;

  const allAssets = await api.query.assets.asset.entries();

  const allChainAssets: { tokenData: AnyJson; tokenId: any }[] = [];

  allAssets.forEach((item) => {
    const id = item?.[0].toHuman();
    if (id?.toString()?.replace(/[, ]/g, "")) {
      allChainAssets.push({ tokenData: item?.[1].toHuman(), tokenId: item?.[0].toHuman() });
    }
  });

  const myAssetTokenData = [];
  const assetTokensDataPromises = [];

  for (const item of allChainAssets) {
    const cleanedTokenId = item?.tokenId?.[0]?.replace(/[, ]/g, "");
    assetTokensDataPromises.push(
      Promise.all([
        api.query.assets.account(cleanedTokenId, walletAddress),
        api.query.assets.metadata(cleanedTokenId),
      ]).then(([tokenAsset, assetTokenMetadata]) => {
        if (whitelist.includes(cleanedTokenId)) {
          const resultObject = {
            tokenId: cleanedTokenId,
            assetTokenMetadata: assetTokenMetadata.toHuman(),
            tokenAsset: tokenAsset.toHuman()
              ? tokenAsset.toHuman()
              : {
                  balance: "",
                  extra: "",
                  reason: "",
                  status: "",
                },
          };
          return resultObject;
        }
        return null;
      })
    );
  }

  const results = await Promise.all(assetTokensDataPromises);

  myAssetTokenData.push(...results.filter((result) => result !== null));

  const ss58Format = tokenMetadata?.ss58Format.toHuman();
  const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
  const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();

  console.log(`${now}: balance of ${balance?.free} and a current nonce of ${nonce} and next nonce of ${nextNonce}`);

  const balanceFormatted = formatDecimalsFromToken(balance?.free.toString(), tokenDecimals as string);

  const tokensInfo = {
    balance: balanceFormatted,
    ss58Format,
    existentialDeposit: existentialDeposit.toHuman(),
    tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
    tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
    assets: myAssetTokenData,
  };

  return tokensInfo;
};

export const assetTokenData = async (id: string, api: ApiPromise) => {
  const assetTokenMetadata = await api.query.assets.metadata(id);

  const resultObject = {
    tokenId: id,
    assetTokenMetadata: assetTokenMetadata.toHuman(),
  };
  return resultObject;
};

export const getSupportedWallets = () => {
  const supportedWallets: Wallet[] = getWallets();

  return supportedWallets;
};

export const setTokenBalance = async (
  dispatch: Dispatch<WalletAction | PoolAction>,
  api: any,
  selectedAccount: WalletAccount
) => {
  if (api) {
    try {
      const walletTokens: any = await getWalletTokensBalance(api, selectedAccount?.address);
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: walletTokens });

      LocalStorage.set("wallet-connected", selectedAccount);

      dotAcpToast.success("Wallet successfully connected!");

      const poolsTokenMetadata = await getAllLiquidityPoolsTokensMetadata(api);
      dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: poolsTokenMetadata });
    } catch (error) {
      dotAcpToast.error(`Wallet connection error: ${error}`);
    } finally {
      dispatch({ type: ActionType.SET_ASSET_LOADING, payload: false });
    }
  }
};

export const setTokenBalanceUpdate = async (
  api: ApiPromise,
  walletAddress: string,
  assetId: string,
  oldWalletBalance: any
) => {
  const { data: balance } = await api.query.system.account(walletAddress);
  const tokenMetadata = api.registry.getChainProperties();
  const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();
  const ss58Format = tokenMetadata?.ss58Format.toHuman();
  const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
  const nativeTokenNewBalance = formatBalance(balance?.free.toString(), {
    withUnit: tokenSymbol as string,
    withSi: false,
  });
  const existentialDeposit = await api.consts.balances.existentialDeposit;

  const tokenAsset = await api.query.assets.account(assetId, walletAddress);

  const assetsUpdated = oldWalletBalance.assets;

  if (tokenAsset.toHuman()) {
    const assetTokenMetadata = await api.query.assets.metadata(assetId);

    const resultObject = {
      tokenId: assetId,
      assetTokenMetadata: assetTokenMetadata.toHuman(),
      tokenAsset: tokenAsset.toHuman(),
    };

    const assetInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObject.tokenId);

    if (assetInPossession !== -1) {
      assetsUpdated[assetInPossession] = resultObject;
    } else {
      assetsUpdated.push(resultObject);
    }
  }

  const updatedTokensInfo = {
    balance: nativeTokenNewBalance,
    ss58Format,
    tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
    tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
    assets: assetsUpdated,
    existentialDeposit: existentialDeposit.toHuman(),
  };

  return updatedTokensInfo;
};

export const setTokenBalanceAfterAssetsSwapUpdate = async (
  api: ApiPromise,
  walletAddress: string,
  assetAId: string,
  assetBId: string,
  oldWalletBalance: any
) => {
  const { data: balance } = await api.query.system.account(walletAddress);
  const tokenMetadata = api.registry.getChainProperties();
  const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();
  const ss58Format = tokenMetadata?.ss58Format.toHuman();
  const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
  const nativeTokenNewBalance = formatBalance(balance?.free.toString(), {
    withUnit: tokenSymbol as string,
    withSi: false,
  });

  const tokenAssetA = await api.query.assets.account(assetAId, walletAddress);
  const tokenAssetB = await api.query.assets.account(assetBId, walletAddress);

  const assetsUpdated = oldWalletBalance.assets;

  if (tokenAssetA.toHuman() && tokenAssetB.toHuman()) {
    const assetTokenAMetadata = await api.query.assets.metadata(assetAId);
    const assetTokenBMetadata = await api.query.assets.metadata(assetBId);

    const resultObjectA = {
      tokenId: assetAId,
      assetTokenMetadata: assetTokenAMetadata.toHuman(),
      tokenAsset: tokenAssetA.toHuman(),
    };
    const resultObjectB = {
      tokenId: assetBId,
      assetTokenMetadata: assetTokenBMetadata.toHuman(),
      tokenAsset: tokenAssetB.toHuman(),
    };

    const assetAInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObjectA.tokenId);
    const assetBInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObjectB.tokenId);

    if (assetAInPossession !== -1) {
      assetsUpdated[assetAInPossession] = resultObjectA;
    }

    if (assetBInPossession !== -1) {
      assetsUpdated[assetBInPossession] = resultObjectB;
    } else {
      assetsUpdated.push(resultObjectB);
    }
  }

  const updatedTokensInfo = {
    balance: nativeTokenNewBalance,
    ss58Format,
    tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
    tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
    assets: assetsUpdated,
  };

  return updatedTokensInfo;
};

export const handleDisconnect = (dispatch: Dispatch<WalletAction | PoolAction>) => {
  LocalStorage.remove("wallet-connected");
  dispatch({ type: ActionType.SET_ACCOUNTS, payload: [] });
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: {} as WalletAccount });
  dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: {} as TokenBalanceData });
  dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: [] });
};

export const connectWalletAndFetchBalance = async (
  dispatch: Dispatch<WalletAction | PoolAction>,
  api: any,
  account: WalletAccount
) => {
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: account });
  LocalStorage.set("wallet-connected", account);
  try {
    await setTokenBalance(dispatch, api, account);
  } catch (error) {
    dotAcpToast.error(`Wallet connection error: ${error}`);
  }
};

/**
 * Fetches the balance of a given address on a provided api instance.
 *
 * @param api - The ApiPromise instance used to query blockchain data.
 * @param address - The address to fetch the balance for.
 *
 * @returns The balance of the address.
 *
 */

export const fetchNativeTokenBalances = async (
  address: string,
  tokenDecimals: string,
  api?: ApiPromise,
  rpcUrl?: string
) => {
  if (!address) return;
  if (!api && rpcUrl) {
    const { ApiPromise, WsProvider } = await import("@polkadot/api");

    try {
      const provider = new WsProvider(rpcUrl);
      const api = await ApiPromise.create({ provider });

      const {
        data: { free: currentBalance, reserved: currentReserved, frozen: currentFrozen },
      } = await api.query.system.account(address);

      await provider.disconnect();

      return {
        free: formatDecimalsFromToken(currentBalance.toString(), tokenDecimals),
        reserved: formatDecimalsFromToken(currentReserved.toString(), tokenDecimals),
        frozen: formatDecimalsFromToken(currentFrozen.toString(), tokenDecimals),
        chainName: api.runtimeChain.toString(),
      };
    } catch (error) {
      console.error("Error fetching balance:", error);
      return undefined;
    }
  } else if (api) {
    try {
      const {
        data: { free: currentBalance, reserved: currentReserved, frozen: currentFrozen },
      } = await api.query.system.account(address);
      return {
        free: formatDecimalsFromToken(currentBalance.toString(), tokenDecimals),
        reserved: formatDecimalsFromToken(currentReserved.toString(), tokenDecimals),
        frozen: formatDecimalsFromToken(currentFrozen.toString(), tokenDecimals),
        chainName: api.runtimeChain.toString(),
      };
    } catch (error) {
      console.error("Error fetching balance:", error);
      return undefined;
    }
  } else {
    return undefined;
  }
};

/**
 * Fetches the balance of a given address on a relay chain.
 *
 * @param address - The address to fetch the balance for.
 * @param tokenBalancesDecimals - The number of decimals for token balances.
 * @param setSelectedChain - A function to update the state with the fetched chain and balance information.
 * @param rpcUrl - The RPC URL of the chain to connect to.
 */

type ChainDetail = {
  chainName: string;
  chainType: string;
};

type SelectedChainState = {
  chainA: ChainDetail;
  chainB: ChainDetail;
  balance: string;
};

type SetSelectedChainFunction = React.Dispatch<React.SetStateAction<SelectedChainState>>;

export const fetchRelayBalance = async (
  address: string,
  tokenBalancesDecimals: string,
  setSelectedChain: SetSelectedChainFunction,
  rpcUrl: string
) => {
  if (!address) return;

  fetchNativeTokenBalances(address, tokenBalancesDecimals, undefined, rpcUrl).then((data) => {
    if (!data) return;

    const { free, chainName } = data;

    const tokenDecimals = tokenBalancesDecimals as string;

    if (free && chainName) {
      setSelectedChain((prev: SelectedChainState) => ({
        ...prev,
        chainA: {
          chainName: chainName,
          chainType: chainName.indexOf("Asset Hub") !== 1 ? "Asset Hub" : "Relay Chain",
        },
        balance: formatDecimalsFromToken(free.toString(), tokenDecimals),
      }));
    }
  });
};

/**
 * Fetches and updates the chain information for the Asset Hub.
 * This function is used to determine and set the current active chain's name and type.
 *
 * @param api - The ApiPromise instance used to query blockchain data. It can be null, indicating no API instance is available.
 * @param setSelectedChain - A function to update the state with the fetched chain information. This function modifies the 'chainB' part of the state to reflect the current chain's details.
 */

export const fetchAssetHubBalance = async (api: ApiPromise | null, setSelectedChain: SetSelectedChainFunction) => {
  if (!api) return;

  const chainInfo = await api.rpc.system.chain();

  const chainName =
    chainInfo.indexOf("Asset Hub") !== -1 ? chainInfo.toString().replace(" Asset Hub", "") : chainInfo.toString();

  try {
    setSelectedChain((prev: SelectedChainState) => ({
      ...prev,
      chainB: {
        chainName: chainName,
        chainType: api.runtimeChain.toString().indexOf("Asset Hub") == 1 ? "Asset Hub" : "Relay Chain",
      },
    }));
  } catch (error) {
    console.error("Error fetching chain info:", error);
  }
};
