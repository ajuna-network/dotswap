import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { getWalletBySource, getWallets } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { TokenBalanceData } from "../../app/types";
import { ActionType } from "../../app/types/enum";
import { formatDecimalsFromToken, getSpotPrice } from "../../app/util/helper";
import LocalStorage from "../../app/util/localStorage";
import dotAcpToast from "../../app/util/toast";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";
import { getAllLiquidityPoolsTokensMetadata } from "../poolServices";
import { whitelist } from "../../whitelist";
import { CrosschainAction } from "../../store/crosschain/interface";

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

export const setupPolkadotRelayApi = async () => {
  const { rpcUrlRelay } = useGetNetwork();
  const api = await ApiPromise.create({ provider: new WsProvider(rpcUrlRelay) });
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);
  console.log(`Successfully connected to ${chain} using ${nodeName} v${nodeVersion}`);
  return api;
};

export const getWalletTokensBalance = async (api: ApiPromise, relayApi: ApiPromise, walletAddress: string) => {
  try {
    // Fetch assets
    const tokenMetadata = api.registry.getChainProperties();
    const allAssets = await api.query.assets.asset.entries();

    if (!allAssets || !allAssets.length || tokenMetadata === undefined) {
      return null;
    }

    // Process assets
    const myAssetTokenData = await Promise.all(
      allAssets.map(async ([assetId, assetDetails]) => {
        const cleanedTokenId = assetId.toHuman()?.toString()?.replace(/[, ]/g, "");
        if (!cleanedTokenId || (!whitelist.includes(cleanedTokenId) && !assetDetails.toHuman())) {
          return null;
        }

        const [tokenAsset, assetTokenMetadata] = await Promise.all([
          api.query.assets.account(cleanedTokenId, walletAddress),
          api.query.assets.metadata(cleanedTokenId),
        ]);

        const tokenAssetData = tokenAsset.toHuman()
          ? (tokenAsset.toHuman() as any)
          : { balance: "", extra: "", reason: "", status: "" };

        if (whitelist.includes(cleanedTokenId) || tokenAssetData?.balance !== "") {
          return {
            tokenId: cleanedTokenId,
            assetTokenMetadata: assetTokenMetadata.toHuman(),
            tokenAsset: tokenAssetData,
          };
        }
        return null;
      })
    );

    // Format data
    const ss58Format = tokenMetadata?.ss58Format.toHuman();
    const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman()?.toString();
    const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman()?.toString();

    // Fetch balance
    const { data: balance } = await api.query.system.account(walletAddress);
    const existentialDeposit = api.consts.balances.existentialDeposit;

    const balanceAsset = {
      free: formatDecimalsFromToken(balance?.free.toString() || "0", tokenDecimals as string) || "0",
      reserved: formatDecimalsFromToken(balance?.reserved.toString() || "0", tokenDecimals as string) || "0",
      frozen: formatDecimalsFromToken(balance?.frozen.toString() || "0", tokenDecimals as string) || "0",
    };

    // fetch relay balance and spot price
    const [balances, spotPrice] = await Promise.all([
      fetchNativeTokenBalances(walletAddress, tokenDecimals as string, relayApi),
      getSpotPrice(tokenSymbol as string) || "0",
    ]);

    const balanceRelay = {
      free: balances?.free || "0",
      reserved: balances?.reserved || "0",
      frozen: balances?.frozen || "0",
    };

    // Return data
    return {
      balanceAsset: balanceAsset,
      balanceRelay: balanceRelay,
      spotPrice: spotPrice,
      ss58Format,
      existentialDeposit: existentialDeposit.toHuman(),
      tokenDecimals,
      tokenSymbol,
      assets: myAssetTokenData.filter((asset) => asset !== null),
    };
  } catch (error) {
    console.error("Error in getWalletTokensBalance:", error);
    throw error;
  }
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
  dispatch: Dispatch<WalletAction | PoolAction | CrosschainAction>,
  api: any,
  relayApi: any,
  selectedAccount: WalletAccount
) => {
  if (api && relayApi && selectedAccount?.address) {
    try {
      const walletTokens: any = await getWalletTokensBalance(api, relayApi, selectedAccount?.address);
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: walletTokens });

      const lpFee = await api.consts.assetConversion.lpFee;
      dispatch({ type: ActionType.SET_LP_FEE, payload: lpFee.toHuman() });

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
  const tokenDecimals = tokenMetadata?.tokenDecimals?.toHuman()?.toString() as string;
  const nativeTokenNewBalance = formatDecimalsFromToken(balance?.free.toString() || "0", tokenDecimals) || "0";
  const existentialDeposit = api.consts.balances.existentialDeposit;

  const tokenAsset = await api.query.assets.account(assetId, walletAddress);

  const assetsUpdated = oldWalletBalance.assets;

  if (tokenAsset.toHuman()) {
    const assetTokenMetadata = await api.query.assets.metadata(assetId);

    const resultObject = {
      tokenId: assetId,
      assetTokenMetadata: assetTokenMetadata.toHuman(),
      tokenAsset: tokenAsset.toHuman() || { balance: "", extra: "", reason: "", status: "" },
    };

    const assetInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObject.tokenId);

    if (assetInPossession !== -1) {
      assetsUpdated[assetInPossession] = resultObject;
    } else {
      assetsUpdated.push(resultObject);
    }
  }

  const updatedTokensInfo = {
    ...oldWalletBalance,
    balanceAsset: {
      ...oldWalletBalance.balanceAsset,
      free: nativeTokenNewBalance,
    },
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
  const tokenDecimals = tokenMetadata?.tokenDecimals?.toHuman()?.toString() as string;
  const nativeTokenNewBalance = formatDecimalsFromToken(balance?.free.toString() || "0", tokenDecimals) || "0";

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
    ...oldWalletBalance,
    balanceAsset: {
      ...oldWalletBalance.balanceAsset,
      free: nativeTokenNewBalance,
    },
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
  dispatch({ type: ActionType.SET_ASSETS_LIST, payload: [] });
  dispatch({ type: ActionType.SET_OTHER_ASSETS, payload: [] });
  dispatch({ type: ActionType.SET_ASSET_LOADING, payload: true });
  dispatch({ type: ActionType.SET_NATIVE_TOKEN_SPOT_PRICE, payload: "0" });
  dispatch({ type: ActionType.SET_WALLET_BALANCE_USD, payload: 0 });
};

export const connectWalletAndFetchBalance = async (
  dispatch: Dispatch<WalletAction | PoolAction | CrosschainAction>,
  api: ApiPromise,
  relayApi: ApiPromise,
  account: WalletAccount
) => {
  dispatch({ type: ActionType.SET_ASSET_LOADING, payload: true });
  const wallet = getWalletBySource(account.wallet?.extensionName);
  if (!account.wallet?.signer) {
    await wallet?.enable("DOT-ACP");
  }
  LocalStorage.set("wallet-connected", account);
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: account });
  try {
    await setTokenBalance(dispatch, api, relayApi, account);
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

export const fetchNativeTokenBalances = async (address: string, tokenDecimals: string, api: ApiPromise) => {
  if (!address && !api) return;
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
};

/**
 * Fetches the balance of a given address on a relay chain.
 *
 * @param address - The address to fetch the balance for.
 * @param tokenBalancesDecimals - The number of decimals for token balances.
 * @param setSelectedChain - A function to update the state with the fetched chain and balance information.
 */

export const fetchChainBalance = async (address: string, tokenBalancesDecimals: string, api: ApiPromise) => {
  try {
    if (!address) return;

    const data = await fetchNativeTokenBalances(address, tokenBalancesDecimals, api);

    if (!data) {
      return {
        chainName: "",
        chainType: "",
        balances: {
          free: "0",
          reserved: "0",
          frozen: "0",
        },
      };
    }

    if (data) {
      return {
        chainName: data.chainName,
        chainType: data.chainName.indexOf("Asset Hub") !== 1 ? "Asset Hub" : "Relay Chain",
        balances: {
          free: data.free.toString(),
          reserved: data.reserved.toString(),
          frozen: data.frozen.toString(),
        },
      };
    }
  } catch (error) {
    console.error("Error fetching relay balance:", error);
    return null; // Return null or handle the error appropriately
  }
};
