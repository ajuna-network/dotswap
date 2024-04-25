import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import Decimal from "decimal.js";
import { t } from "i18next";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { LpTokenAsset, PoolCardProps } from "../../app/types";
import { ActionType, ServiceResponseStatus, ToasterType } from "../../app/types/enum";
import { formatDecimalsFromToken, isApiAvailable } from "../../app/util/helper";
import dotAcpToast from "../../app/util/toast";
import NativeTokenIcon from "../../assets/img/dot-token.svg";
import AssetTokenIcon from "../../assets/img/test-token.svg";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";
import { whitelist } from "../../whitelist";
import { convertMicroKSMToKSM } from "../swapServices";
import { NotificationAction } from "../../store/notifications/interface";
import { TokenBalanceData } from "../../app/types/index";
import { setTokenBalanceUpdate } from "../../services/polkadotWalletServices";

const { parents, nativeTokenSymbol, assethubSubscanUrl } = useGetNetwork();

const exactAddedLiquidityInPool = (
  itemEvents: any,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction>
) => {
  const liquidityAddedEvent = itemEvents.events.filter((item: any) => item.event.method === "LiquidityAdded");

  const nativeTokenIn = formatDecimalsFromToken(
    parseFloat(liquidityAddedEvent[0].event.data.amount1Provided.replace(/[, ]/g, "")),
    nativeTokenDecimals
  );
  const assetTokenIn = formatDecimalsFromToken(
    parseFloat(liquidityAddedEvent[0].event.data.amount2Provided.replace(/[, ]/g, "")),
    assetTokenDecimals
  );

  dispatch({ type: ActionType.SET_EXACT_NATIVE_TOKEN_ADD_LIQUIDITY, payload: nativeTokenIn });
  dispatch({ type: ActionType.SET_EXACT_ASSET_TOKEN_ADD_LIQUIDITY, payload: assetTokenIn });

  return { nativeTokenIn, assetTokenIn };
};

const exactWithdrawnLiquidityFromPool = (
  itemEvents: any,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction>
) => {
  const liquidityRemovedEvent = itemEvents.events.filter((item: any) => item.event.method === "LiquidityRemoved");

  const nativeTokenOut = formatDecimalsFromToken(
    parseFloat(liquidityRemovedEvent[0].event.data.amount1.replace(/[, ]/g, "")),
    nativeTokenDecimals
  );
  const assetTokenOut = formatDecimalsFromToken(
    parseFloat(liquidityRemovedEvent[0].event.data.amount2.replace(/[, ]/g, "")),
    assetTokenDecimals
  );

  dispatch({ type: ActionType.SET_EXACT_NATIVE_TOKEN_WITHDRAW, payload: nativeTokenOut });
  dispatch({ type: ActionType.SET_EXACT_ASSET_TOKEN_WITHDRAW, payload: assetTokenOut });

  return { nativeTokenOut, assetTokenOut };
};

export const getAllPools = async (api: ApiPromise, dispatch: Dispatch<PoolAction>) => {
  const isApiReady = await isApiAvailable(api);
  if (!isApiReady) {
    dotAcpToast.error(t("error.api.notReady"));
    return;
  }
  try {
    const pools = await api.query.assetConversion.pools.entries();
    if (!pools) return [];
    const poolsArray = pools.map(([key, value]) => [key.args?.[0].toHuman(), value.toHuman()]);
    dispatch({ type: ActionType.SET_POOLS, payload: poolsArray });
    return poolsArray;
  } catch (error) {
    dotAcpToast.error(`Error getting pools: ${error}`);
  }
};

export const getPoolReserves = async (api: ApiPromise, assetTokenId: string) => {
  const multiLocation2 = api
    .createType("MultiLocation", {
      parents: parents,
      interior: {
        here: null,
      },
    })
    .toU8a();

  const multiLocation = api
    .createType("MultiLocation", {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: 50 }, { GeneralIndex: assetTokenId }],
      },
    })
    .toU8a();

  const encodedInput = new Uint8Array(multiLocation.length + multiLocation2.length);
  encodedInput.set(multiLocation2, 0);
  encodedInput.set(multiLocation, multiLocation2.length);

  const encodedInputHex = u8aToHex(encodedInput);

  const reservers = await api.rpc.state.call("AssetConversionApi_get_reserves", encodedInputHex);

  const decoded = api.createType("Option<(u128, u128)>", reservers);

  return decoded.toHuman();
};

const prepareMultiLocationArguments = (api: ApiPromise, assetTokenId: string) => {
  const firstArg = api
    .createType("MultiLocation", {
      parents: parents,
      interior: {
        here: null,
      },
    })
    .toU8a();

  const secondArg = api
    .createType("MultiLocation", {
      parents: 0,
      interior: {
        x2: [{ palletInstance: 50 }, { generalIndex: assetTokenId }],
      },
    })
    .toU8a();
  return { firstArg, secondArg };
};

const handleInBlockResponse = (response: SubmittableResult, dispatch: Dispatch<NotificationAction>) => {
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "liquidity",
      props: {
        notificationMessage: null,
        notificationLink: {
          text: "Transaction included in block",
          href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asInBlock.toString()}`,
        },
      },
    },
  });
};

const handleDispatchError = (
  response: SubmittableResult,
  api: ApiPromise,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>
) => {
  if (response.dispatchError?.isModule) {
    const { docs } = api.registry.findMetaError(response.dispatchError.asModule);
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "liquidity",
        props: {
          notificationType: ToasterType.ERROR,
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: `${docs.join(" ")}`,
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/extrinsic/${response.txHash}`,
          },
        },
      },
    });
  } else if (response.dispatchError?.toString() === t("pageError.tokenCanNotCreate")) {
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS, payload: true });
  } else {
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "liquidity",
        props: {
          notificationType: ToasterType.ERROR,
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: response.dispatchError?.toString() ?? t("modal.notifications.genericError"),
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/extrinsic/${response.txHash}`,
          },
        },
      },
    });
  }
  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
};

const handleSuccessfulPool = (
  response: SubmittableResult,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>,
  poolType: "add" | "remove"
) => {
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "liquidity",
      props: {
        notificationType: ToasterType.SUCCESS,
        notificationTitle: t("modal.notifications.success"),
        notificationMessage: null,
        notificationLink: {
          text: "View in block explorer",
          href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asFinalized.toString()}`,
        },
      },
    },
  });
  if (poolType === "add") {
    const { nativeTokenIn, assetTokenIn } = exactAddedLiquidityInPool(
      response.toHuman(),
      nativeTokenDecimals,
      assetTokenDecimals,
      dispatch
    );
    dispatch({
      type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM_AMOUNT,
      payload: { id: "liquidity", amount: parseFloat(nativeTokenIn) },
    });
    dispatch({
      type: ActionType.SET_NOTIFICATION_TRANSACTION_TO_AMOUNT,
      payload: { id: "liquidity", amount: parseFloat(assetTokenIn) },
    });
  } else if (poolType === "remove") {
    const { nativeTokenOut, assetTokenOut } = exactWithdrawnLiquidityFromPool(
      response.toHuman(),
      nativeTokenDecimals,
      assetTokenDecimals,
      dispatch
    );
    dispatch({
      type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM_AMOUNT,
      payload: { id: "liquidity", amount: parseFloat(nativeTokenOut) },
    });
    dispatch({
      type: ActionType.SET_NOTIFICATION_TRANSACTION_TO_AMOUNT,
      payload: { id: "liquidity", amount: parseFloat(assetTokenOut) },
    });
  }

  dispatch({ type: ActionType.SET_BLOCK_HASH_FINALIZED, payload: response.status.asFinalized.toString() });
  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
};

const handleFinalizedResponse = (
  response: SubmittableResult,
  api: ApiPromise,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>,
  poolType: "add" | "remove"
) => {
  if (response.dispatchError) {
    handleDispatchError(response, api, dispatch);
  } else {
    handleSuccessfulPool(response, nativeTokenDecimals, assetTokenDecimals, dispatch, poolType);
  }
};

const handlePoolTransactionResponse = async (
  response: SubmittableResult,
  api: ApiPromise,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>,
  account: WalletAccount,
  poolType: "add" | "remove"
) => {
  if (response.status.isReady) {
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "liquidity",
        props: {
          notificationMessage: t("modal.notifications.transactionInitiatedNotification"),
        },
      },
    });
  }
  if (response.status.isInBlock) {
    handleInBlockResponse(response, dispatch);
  } else if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
    handleFinalizedResponse(response, api, nativeTokenDecimals, assetTokenDecimals, dispatch, poolType);
    const allPools = await getAllPools(api, dispatch);
    if (allPools) {
      await createPoolCardsArray(api, dispatch, allPools, account);
    }
  }
};

export const createPool = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  tokenBalance: TokenBalanceData,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: true });

  const result = api.tx.assetConversion.createPool(firstArg, secondArg);

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, (response) => {
      if (response.status.type === ServiceResponseStatus.Finalized) {
        addLiquidity(
          api,
          assetTokenId,
          account,
          nativeTokenValue,
          assetTokenValue,
          minNativeTokenValue,
          minAssetTokenValue,
          nativeTokenDecimals,
          assetTokenDecimals,
          tokenBalance,
          dispatch
        );
      }

      if (response.status.isInBlock) {
        handleInBlockResponse(response, dispatch);
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(`${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
          } else {
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
          dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
        }
      }
    })
    .catch((error: any) => {
      dotAcpToast.error(`Transaction failed ${error}`);
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
    });
};

export const addLiquidity = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  tokenBalances: TokenBalanceData,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: true });

  const result = api.tx.assetConversion.addLiquidity(
    firstArg,
    secondArg,
    nativeTokenValue,
    assetTokenValue,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  const { partialFee } = await result.paymentInfo(account.address);

  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      await handlePoolTransactionResponse(
        response,
        api,
        nativeTokenDecimals,
        assetTokenDecimals,
        dispatch,
        account,
        "add"
      );
      if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
        const balances = await setTokenBalanceUpdate(api, account.address, assetTokenId, tokenBalances);
        balances && dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: balances });
      }
    })
    .catch((error: any) => {
      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "swap",
          props: {
            notificationType: ToasterType.ERROR,
            notificationTitle: t("modal.notifications.error"),
            notificationMessage: `Transaction failed: ${error}`,
          },
        },
      });
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
    });
};

export const removeLiquidity = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  lpTokensAmountToBurn: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  tokenBalances: TokenBalanceData,
  dispatch: Dispatch<PoolAction | WalletAction | NotificationAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: true });

  const result = api.tx.assetConversion.removeLiquidity(
    firstArg,
    secondArg,
    lpTokensAmountToBurn,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      await handlePoolTransactionResponse(
        response,
        api,
        nativeTokenDecimals,
        assetTokenDecimals,
        dispatch,
        account,
        "remove"
      );
      if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
        const balances = await setTokenBalanceUpdate(api, account.address, assetTokenId, tokenBalances);
        balances && dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: balances });
      }
    })
    .catch((error: any) => {
      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "swap",
          props: {
            notificationType: ToasterType.ERROR,
            notificationTitle: t("modal.notifications.error"),
            notificationMessage: `Transaction failed: ${error}`,
          },
        },
      });
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
    });
};

export const checkCreatePoolGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  dispatch: Dispatch<PoolAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  const result = api.tx.assetConversion.createPool(firstArg, secondArg);
  const { partialFee } = await result.paymentInfo(account.address);

  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_POOL_GAS_FEE,
    payload: ksmFeeString,
  });
};

export const checkAddPoolLiquidityGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  dispatch: Dispatch<PoolAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  const result = api.tx.assetConversion.addLiquidity(
    firstArg,
    secondArg,
    nativeTokenValue,
    assetTokenValue,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );
  const { partialFee } = await result.paymentInfo(account.address);
  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());
  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE,
    payload: ksmFeeString,
  });
};

export const getAllLiquidityPoolsTokensMetadata = async (api: ApiPromise, dispatch: Dispatch<PoolAction>) => {
  const poolsTokenData = [];

  const pools = await getAllPools(api, dispatch);
  if (pools) {
    const poolsAssetTokenIds = pools?.map((pool: any) => {
      if (pool?.[0]?.[1].interior?.X2) {
        const poolsTokenIds = pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex.replace(/[, ]/g, "").toString();
        return poolsTokenIds;
      }
    });

    for (const item of poolsAssetTokenIds) {
      if (item) {
        const poolReserves: any = await getPoolReserves(api, item);
        if (poolReserves?.length > 0) {
          const poolsTokenMetadata = await api.query.assets.metadata(item);
          const resultObject = {
            tokenId: item,
            assetTokenMetadata: poolsTokenMetadata.toHuman(),
            tokenAsset: {
              balance: 0,
            },
          };
          poolsTokenData.push(resultObject);
        }
      }
    }
  }

  dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: poolsTokenData });
  return poolsTokenData;
};

export const checkWithdrawPoolLiquidityGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  lpTokensAmountToBurn: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  dispatch: Dispatch<PoolAction>
) => {
  const { firstArg, secondArg } = prepareMultiLocationArguments(api, assetTokenId);

  const result = api.tx.assetConversion.removeLiquidity(
    firstArg,
    secondArg,
    lpTokensAmountToBurn,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  const { partialFee } = await result.paymentInfo(account.address);

  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());
  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE,
    payload: ksmFeeString,
  });
};

export const createPoolCardsArray = async (
  api: ApiPromise,
  dispatch: Dispatch<PoolAction>,
  pools: any,
  selectedAccount?: WalletAccount
) => {
  const apiPool = api as ApiPromise;
  try {
    const poolCardsArray: PoolCardProps[] = [];

    const tokenMetadata = api.registry.getChainProperties();
    const nativeTokenDecimals = tokenMetadata?.tokenDecimals.toHuman()?.toString().replace(/[, ]/g, "");

    await Promise.all(
      pools.map(async (pool: any) => {
        const lpTokenId = pool?.[1]?.lpToken;

        let lpToken = null;
        if (selectedAccount?.address) {
          const lpTokenAsset = await apiPool.query.poolAssets.account(lpTokenId, selectedAccount?.address);
          lpToken = lpTokenAsset.toHuman() as LpTokenAsset;
        }

        if (pool?.[0]?.[1]?.interior?.X2) {
          const poolReserve: any = await getPoolReserves(
            apiPool,
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
          );

          if (poolReserve?.length > 0) {
            const assetTokenMetadata: any = await apiPool.query.assets.metadata(
              pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
            );

            const assetToken = poolReserve?.[1]?.replace(/[, ]/g, "");
            let assetTokenFormated = formatDecimalsFromToken(assetToken, assetTokenMetadata.toHuman()?.decimals);
            if (new Decimal(assetTokenFormated).gte(1)) {
              assetTokenFormated = new Decimal(assetTokenFormated).toFixed(4);
            }
            const assetTokenDecimals = assetTokenMetadata.toHuman()?.decimals;
            const assetTokenFormattedWithDecimals = formatDecimalsFromToken(
              poolReserve?.[1]?.replace(/[, ]/g, ""),
              assetTokenDecimals
            );
            if (new Decimal(assetToken).gte(1)) {
              assetTokenFormated = new Decimal(assetTokenFormattedWithDecimals).toFixed(4);
            }

            const nativeToken = poolReserve?.[0]?.replace(/[, ]/g, "");
            let nativeTokenFormatted = formatDecimalsFromToken(nativeToken, nativeTokenDecimals || "0");
            if (new Decimal(nativeTokenFormatted).gte(1)) {
              nativeTokenFormatted = new Decimal(nativeTokenFormatted).toFixed(4);
            }

            if (whitelist.includes(pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, ""))) {
              poolCardsArray.push({
                name: `${nativeTokenSymbol}–${assetTokenMetadata.toHuman()?.symbol}`,
                lpTokenAsset: lpToken ? lpToken : null,
                lpTokenId: lpTokenId,
                assetTokenId: pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, ""),
                totalTokensLocked: {
                  nativeToken: {
                    decimals: nativeTokenDecimals || "0",
                    icon: NativeTokenIcon,
                    formattedValue: nativeTokenFormatted,
                    value: nativeToken,
                  },
                  assetToken: {
                    decimals: assetTokenDecimals,
                    icon: AssetTokenIcon,
                    formattedValue: assetTokenFormated,
                    value: assetToken,
                  },
                },
              });
            }
          }
        }
      })
    );

    poolCardsArray.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    poolCardsArray.sort((a, b) => {
      if (a.lpTokenAsset === null) return 1;
      if (b.lpTokenAsset === null) return -1;

      return parseInt(a?.lpTokenAsset?.balance) - parseInt(b?.lpTokenAsset?.balance);
    });

    dispatch({ type: ActionType.SET_POOLS_CARDS, payload: poolCardsArray });
  } catch (error) {
    dotAcpToast.error(t("poolsPage.errorFetchingPools", { error: error }));
  }
};
