import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { t } from "i18next";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { ActionType, ServiceResponseStatus, ToasterType } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import { SwapAction } from "../../store/swap/interface";
import { WalletAction } from "../../store/wallet/interface";
import { NotificationAction } from "../../store/notifications/interface";
import { setTokenBalanceAfterAssetsSwapUpdate, setTokenBalanceUpdate } from "../../services/polkadotWalletServices";
import { TokenBalanceData } from "../../app/types";

const { parents } = useGetNetwork();

const checkIfExactError = (errorValue: string) => {
  return errorValue === t("swapPage.palletSlippageError");
};

export const convertMicroKSMToKSM = (microKSM: string) => {
  const microKSMValue = parseFloat(microKSM.replace(" µKSM", ""));
  const conversionFactor = 1e-6;
  const ksmValue = microKSMValue * conversionFactor;
  return `${ksmValue.toFixed(9)} KSM`;
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

const handleInBlockResponse = (response: SubmittableResult, dispatch: Dispatch<NotificationAction>) => {
  dispatch({
    type: ActionType.UPDATE_NOTIFICATION,
    payload: {
      id: "swap",
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
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`,
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asInBlock.toString()}`,
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
          notificationTitle: t("modal.notifications.error"),
          notificationMessage: response.dispatchError?.toString() ?? t("modal.notifications.genericError"),
          notificationLink: {
            text: "View in block explorer",
            href: `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asInBlock.toString()}`,
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
        notificationTitle: t("modal.notifications.success"),
        notificationMessage: null,
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
          notificationMessage: t("modal.notifications.transactionInitiatedNotification"),
        },
      },
    });
  }
  if (response.status.isInBlock) {
    handleInBlockResponse(response, dispatch);
  } else if (response.status.type === ServiceResponseStatus.Finalized && response.status.isFinalized) {
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
        reverse ? amountIn : amountOut,
        reverse ? amountOut : amountIn,
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
        reverse ? amountIn : amountOut,
        reverse ? amountOut : amountIn,
        account.address,
        false
      );

  const { partialFee } = await result.paymentInfo(account.address);
  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: ksmFeeString,
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
  const ksmFeeString = convertMicroKSMToKSM(partialFee.toHuman());

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${ksmFeeString} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: ksmFeeString,
  });
};
