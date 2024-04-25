import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";
import { formatBalance, isNumber } from "@polkadot/util";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { getWalletBySource, getWallets } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { TokenBalanceData } from "../../app/types";
import { ActionType } from "../../app/types/enum";
import { formatDecimalsFromToken, getSpotPrice, isApiAvailable } from "../../app/util/helper";
import LocalStorage from "../../app/util/localStorage";
import dotAcpToast from "../../app/util/toast";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";
import { CrosschainAction } from "../../store/crosschain/interface";
import { getAllLiquidityPoolsTokensMetadata } from "../poolServices";
import { whitelist } from "../../whitelist";
import { defaults as addressDefaults } from "@polkadot/util-crypto/address/defaults";
import { base64Encode } from "@polkadot/util-crypto";
import { getSpecTypes } from "@polkadot/types-known";
import { t } from "i18next";

export const setupPolkadotApi = async (
  rpcUrl: string,
  stateProvider: WsProvider | null,
  stateApi: ApiPromise | null
) => {
  try {
    const provider = stateProvider || new WsProvider(rpcUrl);
    await provider.isReady;

    const api = stateApi || new ApiPromise({ provider });
    await api.isReadyOrError;

    return { provider, api };
  } catch (error) {
    console.error("Failed to connect to API:", error);
    throw error; // Re-throwing the error for handling at a higher level if needed
  }
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

      const lpFee = api.consts.assetConversion.lpFee;
      dispatch({ type: ActionType.SET_LP_FEE, payload: lpFee.toHuman() });

      await getAllLiquidityPoolsTokensMetadata(api, dispatch);
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

const getChainMetadata = (api: ApiPromise) => {
  const DEFAULT_SS58 = api.registry.createType("u32", addressDefaults.prefix);
  const DEFAULT_DECIMALS = api.registry.createType("u32", 12);

  return {
    icon: "polkadot" as const,
    ss58Format: isNumber(api.registry.chainSS58) ? api.registry.chainSS58 : DEFAULT_SS58.toNumber(),
    tokenDecimals: api.registry.chainDecimals || [DEFAULT_DECIMALS.toNumber()][0],
    tokenSymbol: (api.registry.chainTokens || formatBalance.getDefaults().unit)[0],
  };
};

export const checkWalletMetadata = async (api: ApiPromise, account: WalletAccount): Promise<boolean> => {
  const wallet = getWalletBySource(account.wallet?.extensionName);
  await wallet?.enable("DOT-ACP");
  const extension = wallet?.extension;
  if (extension) {
    const metadataCurrentArray = await wallet.extension.metadata.get();
    const metadataCurrent = metadataCurrentArray.find(
      (genesisHash: any) => api.genesisHash.toHex() === genesisHash.genesisHash
    );
    if (metadataCurrentArray.length === 0 || !metadataCurrent) {
      return true;
    } else {
      const shouldUpdate = !api.genesisHash.eq(metadataCurrent.genesisHash);
      const specVersionUpdate = api.runtimeVersion.specVersion.gtn(metadataCurrent.specVersion);

      return shouldUpdate || specVersionUpdate;
    }
  } else {
    return false;
  }
};

export const updateWalletMetadata = async (api: ApiPromise, account: WalletAccount) => {
  const wallet = getWalletBySource(account.wallet?.extensionName);
  const extension = wallet?.extension;
  if (extension && api) {
    const chain = ((await api.rpc.system.chain()) || "<unknown>").toString();
    const chainType = "substrate";
    const newMetadata = getChainMetadata(api);
    const result = await extension.metadata?.provide({
      ...newMetadata,
      chain,
      chainType,
      genesisHash: api.genesisHash.toHex(),
      metaCalls: base64Encode(api.runtimeMetadata.asCallsOnly.toU8a()),
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      types: getSpecTypes(api.registry, chain, api.runtimeVersion.specName.toString(), api.runtimeVersion.specVersion),
    });

    if (!result) throw new Error("Failed to update metadata");
  }
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
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: account });
  LocalStorage.set("wallet-connected", account);
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
  const isApiReady = await isApiAvailable(api);
  if (!isApiReady) {
    dotAcpToast.error(t("error.api.notReady"), undefined, null);
    return;
  }
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
