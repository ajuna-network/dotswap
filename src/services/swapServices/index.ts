import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { t } from "i18next";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { ActionType, ServiceResponseStatus, ToasterType } from "../../app/types/enum";
import { errorMessageHandler, formatDecimalsFromToken } from "../../app/util/helper";
import { SwapAction } from "../../store/swap/interface";
import { WalletAction } from "../../store/wallet/interface";
import { NotificationAction } from "../../store/notifications/interface";
import { setTokenBalanceAfterAssetsSwapUpdate, setTokenBalanceUpdate } from "../polkadotWalletServices";
import { TokenBalanceData } from "../../app/types";

const { parents } = useGetNetwork();

export const convertMicroDOTToDOT = (microDOT: string) => {
  const microDOTValue = parseFloat(microDOT.replace(" µDOT", ""));
  const conversionFactor = 1e-6;
  const dotValue = microDOTValue * conversionFactor;
  return `${dotValue.toFixed(9)} DOT`;
};

const { assethubSubscanUrl, nativeTokenSymbol } = useGetNetwork();

const exactSwapAmounts = (
  itemEvents: any,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction>
) => {
  const swapExecutedEvent = itemEvents.events.filter((item: any) => item.event.method === "SwapExecuted");

  const amountIn = formatDecimalsFromToken(
    parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
    tokenADecimals
  );
  const amountOut = formatDecimalsFromToken(
    parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
    tokenBDecimals
  );

  dispatch({ type: ActionType.SET_SWAP_EXACT_IN_TOKEN_AMOUNT, payload: amountIn });
  dispatch({ type: ActionType.SET_SWAP_EXACT_OUT_TOKEN_AMOUNT, payload: amountOut });

  return swapExecutedEvent;
};

// Local helper functions for swap

const prepareNativeMultiLocationArguments = (api: ApiPromise, assetTokenId: string | null, reverse: boolean) => {
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

  return reverse ? [secondArg, firstArg] : [firstArg, secondArg];
};

const prepareAssetMultiLocationArguments = (
  api: ApiPromise,
  assetTokenAId: string | null,
  assetTokenBId: string | null
) => {
  const firstArg = api
    .createType("MultiLocation", {
      parents: 0,
      interior: {
        x2: [{ palletInstance: 50 }, { generalIndex: assetTokenAId }],
      },
    })
    .toU8a();

  const secondArg = api
    .createType("MultiLocation", {
      parents: parents,
      interior: {
        here: null,
      },
    })
    .toU8a();

  const thirdArg = api
    .createType("MultiLocation", {
      parents: 0,
      interior: {
        x2: [{ palletInstance: 50 }, { generalIndex: assetTokenBId }],
      },
    })
    .toU8a();

  return [firstArg, secondArg, thirdArg];
};

const handleIsBroadcastResponse = (response: SubmittableResult, dispatch: Dispatch<NotificationAction>) => {
  if (response.isInBlock || response.isFinalized) {
    return;
  }
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "swap",
      props: {
        notificationType: ToasterType.PENDING,
        notificationTitle: t("modal.notifications.transactionBroadcastedTitle"),
        notificationMessage: t("modal.notifications.transactionBroadcastedNotification"),
        notificationPercentage: 25,
      },
    },
  });
};

const handleInBlockResponse = (response: SubmittableResult, dispatch: Dispatch<NotificationAction>) => {
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "swap",
      props: {
        notificationType: ToasterType.PENDING,
        notificationMessage: t("modal.notifications.transactionIsProcessingNotification"),
        notificationTitle: t("modal.notifications.transactionIsProcessingTitle"),
        notificationPercentage: 40,
        notificationLink: {
          text: t("modal.notifications.includedInBlock"),
          href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asInBlock.toString()}`,
        },
      },
    },
  });

  let percentage = 50;
  const interval = setInterval(() => {
    const notification =
      percentage <= 70 ? t("modal.notifications.isProcessingBelow70") : t("modal.notifications.isProcessingAbove70");
    const title =
      percentage <= 70
        ? t("modal.notifications.transactionIsProcessingTitleBelow70")
        : t("modal.notifications.transactionIsProcessingTitleAbove70");
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "swap",
        props: {
          notificationType: ToasterType.PENDING,
          notificationTitle: title,
          notificationMessage: notification,
          notificationPercentage: percentage,
          notificationLink: {
            text: t("modal.notifications.viewInBlockExplorer"),
            href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asInBlock.toString()}`,
          },
        },
      },
    });
    percentage += Math.floor(Math.random() * 5) + 1;
    if (percentage >= 94) {
      clearInterval(interval);
    }
  }, 900);
};

const handleDispatchError = (
  response: SubmittableResult,
  api: ApiPromise,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>
) => {
  if (response.dispatchError?.isModule) {
    const { docs } = api.registry.findMetaError(response.dispatchError.asModule);
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "swap",
        props: {
          notificationType: ToasterType.ERROR,
          notificationPercentage: null,
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: errorMessageHandler(docs.join(" ")),
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/extrinsic/${response.txHash}`,
          },
        },
      },
    });
  } else if (response.dispatchError?.toString() === t("pageError.tokenCanNotCreate")) {
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
  } else {
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "swap",
        props: {
          notificationType: ToasterType.ERROR,
          notificationPercentage: null,
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: response.dispatchError?.toString()
            ? errorMessageHandler(response.dispatchError.toString())
            : t("modal.notifications.genericError"),
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/extrinsic/${response.txHash}`,
          },
        },
      },
    });
  }
  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
};

const handleSuccessfulSwap = (
  response: SubmittableResult,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>
) => {
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "swap",
      props: {
        notificationType: ToasterType.SUCCESS,
        notificationTitle: t("modal.notifications.swapSuccess"),
        notificationMessage: null,
        notificationPercentage: 100,
        notificationLink: {
          text: "View in block explorer",
          href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asFinalized.toString()}`,
        },
      },
    },
  });

  exactSwapAmounts(response.toHuman(), tokenADecimals, tokenBDecimals, dispatch);
  dispatch({ type: ActionType.SET_BLOCK_HASH_FINALIZED, payload: response.status.asFinalized.toString() });
  dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: "",
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: "",
  });
  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
};

const handleFinalizedResponse = (
  response: SubmittableResult,
  api: ApiPromise,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>
) => {
  if (response.dispatchError) {
    handleDispatchError(response, api, dispatch);
  } else {
    handleSuccessfulSwap(response, tokenADecimals, tokenBDecimals, dispatch);
  }
};

const handleSwapTransactionResponse = (
  response: SubmittableResult,
  api: ApiPromise,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>
) => {
  if (response.status.isReady) {
    dispatch({
      type: ActionType.UPDATE_NOTIFICATION,
      payload: {
        id: "swap",
        props: {
          notificationType: ToasterType.PENDING,
          notificationTitle: t("modal.notifications.transactionInitiatedTitle"),
          notificationPercentage: 10,
          notificationMessage: t("modal.notifications.transactionInitiatedNotification"),
        },
      },
    });
  }
  if (response.status.isBroadcast) {
    handleIsBroadcastResponse(response, dispatch);
  } else if (response.status.isInBlock) {
    handleInBlockResponse(response, dispatch);
  } else if (response.status.type === ServiceResponseStatus.Finalized) {
    handleFinalizedResponse(response, api, tokenADecimals, tokenBDecimals, dispatch);
  }
};

// Main swap functions

export const performSwapNativeForAsset = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  reverse: boolean,
  tokenBalances: TokenBalanceData,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>,
  isExactIn: boolean
) => {
  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });

  const [amountIn, amountOut] = isExactIn ? [nativeTokenValue, assetTokenValue] : [assetTokenValue, nativeTokenValue];

  const result = isExactIn
    ? api.tx.assetConversion.swapExactTokensForTokens(
        prepareNativeMultiLocationArguments(api, assetTokenId, reverse),
        reverse ? amountOut : amountIn,
        reverse ? amountIn : amountOut,
        account.address,
        false
      )
    : api.tx.assetConversion.swapTokensForExactTokens(
        prepareNativeMultiLocationArguments(api, assetTokenId, reverse),
        reverse ? amountOut : amountIn,
        reverse ? amountIn : amountOut,
        account.address,
        false
      );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      handleSwapTransactionResponse(response, api, tokenADecimals, tokenBDecimals, dispatch);
      if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
        const balances = await setTokenBalanceUpdate(api, account.address, assetTokenId, tokenBalances);
        balances && dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: balances });
      }
    })
    .catch((error) => {
      const errorMessage = errorMessageHandler(error);

      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "swap",
          props: {
            notificationType: ToasterType.ERROR,
            notificationPercentage: null,
            notificationTitle: t("modal.notifications.error"),
            notificationMessage: `Transaction failed: ${errorMessage}`,
          },
        },
      });

      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
    });

  return result;
};

export const performSwapAssetForAsset = async (
  api: ApiPromise,
  assetTokenAId: string,
  assetTokenBId: string,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  tokenBalances: TokenBalanceData,
  dispatch: Dispatch<SwapAction | WalletAction | NotificationAction>,
  isExactIn: boolean
) => {
  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });

  const result = isExactIn
    ? api.tx.assetConversion.swapExactTokensForTokens(
        prepareAssetMultiLocationArguments(api, assetTokenAId, assetTokenBId),
        assetTokenAValue,
        assetTokenBValue,
        account.address,
        false
      )
    : api.tx.assetConversion.swapTokensForExactTokens(
        prepareAssetMultiLocationArguments(api, assetTokenAId, assetTokenBId),
        assetTokenBValue,
        assetTokenAValue,
        account.address,
        false
      );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      handleSwapTransactionResponse(response, api, tokenADecimals, tokenBDecimals, dispatch);
      if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
        const balances = await setTokenBalanceAfterAssetsSwapUpdate(
          api,
          account.address,
          assetTokenAId,
          assetTokenBId,
          tokenBalances
        );
        balances && dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: balances });
      }
    })
    .catch((error) => {
      const errorMessage = errorMessageHandler(error);
      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "swap",
          props: {
            notificationType: ToasterType.ERROR,
            notificationPercentage: null,
            notificationTitle: t("modal.notifications.error"),
            notificationMessage: `Transaction failed: ${errorMessage}`,
          },
        },
      });
      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
    });

  return result;
};

export const checkSwapNativeForAssetGasFee = async (
  api: ApiPromise,
  assetTokenId: string | null,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  reverse: boolean,
  dispatch: Dispatch<SwapAction>,
  isExactIn: boolean
) => {
  const [amountIn, amountOut] = isExactIn ? [nativeTokenValue, assetTokenValue] : [assetTokenValue, nativeTokenValue];

  const result = isExactIn
    ? api.tx.assetConversion.swapExactTokensForTokens(
        prepareNativeMultiLocationArguments(api, assetTokenId, reverse),
        reverse ? amountOut : amountIn,
        reverse ? amountIn : amountOut,
        account.address,
        false
      )
    : api.tx.assetConversion.swapTokensForExactTokens(
        prepareNativeMultiLocationArguments(api, assetTokenId, reverse),
        reverse ? amountOut : amountIn,
        reverse ? amountIn : amountOut,
        account.address,
        false
      );

  const { partialFee } = await result.paymentInfo(account.address);
  const dotFeeString = convertMicroDOTToDOT(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${dotFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: dotFeeString,
  });
};

export const checkSwapAssetForAssetGasFee = async (
  api: ApiPromise,
  assetTokenAId: string | null,
  assetTokenBId: string | null,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  dispatch: Dispatch<SwapAction>,
  isExactIn: boolean
) => {
  const result = isExactIn
    ? api.tx.assetConversion.swapExactTokensForTokens(
        prepareAssetMultiLocationArguments(api, assetTokenAId, assetTokenBId),
        assetTokenAValue,
        assetTokenBValue,
        account.address,
        false
      )
    : api.tx.assetConversion.swapTokensForExactTokens(
        prepareAssetMultiLocationArguments(api, assetTokenAId, assetTokenBId),
        assetTokenBValue,
        assetTokenAValue,
        account.address,
        false
      );

  const { partialFee } = await result.paymentInfo(account.address);
  const dotFeeString = convertMicroDOTToDOT(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${dotFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: dotFeeString,
  });
};
