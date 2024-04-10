import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { t } from "i18next";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { ActionType, ServiceResponseStatus } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import dotAcpToast from "../../app/util/toast";
import { SwapAction } from "../../store/swap/interface";
import { WalletAction } from "../../store/wallet/interface";

const { parents } = useGetNetwork();

const checkIfExactError = (errorValue: string) => {
  return errorValue === t("swapPage.palletSlippageError");
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

const handleInBlockResponse = () => {
  dotAcpToast.pending("Submitted. Waiting finalization");
};

const handleDispatchError = (
  response: SubmittableResult,
  api: ApiPromise,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  if (response.dispatchError?.isModule) {
    const { docs } = api.registry.findMetaError(response.dispatchError.asModule);
    dotAcpToast.error(checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`);
  } else if (response.dispatchError?.toString() === t("pageError.tokenCanNotCreate")) {
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
  } else {
    dotAcpToast.error(response.dispatchError?.toString() ?? "Error occured. Try again.");
  }
  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
};

const handleSuccessfulSwap = (
  response: SubmittableResult,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  dotAcpToast.success(
    "Swap completed.",
    undefined,
    `${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${response.status.asFinalized.toString()}`
  );
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
  dispatch: Dispatch<SwapAction | WalletAction>
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
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  if (response.status.isInBlock) {
    handleInBlockResponse();
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
  dispatch: Dispatch<SwapAction | WalletAction>,
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
    .signAndSend(account.address, { signer: wallet?.signer }, (response) => {
      handleSwapTransactionResponse(response, api, tokenADecimals, tokenBDecimals, dispatch);
    })
    .catch((error) => {
      dotAcpToast.error(`Transaction failed: ${error}`);
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
  dispatch: Dispatch<SwapAction | WalletAction>,
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
    .signAndSend(account.address, { signer: wallet?.signer }, (response) => {
      handleSwapTransactionResponse(response, api, tokenADecimals, tokenBDecimals, dispatch);
    })
    .catch((error) => {
      dotAcpToast.error(`Transaction failed: ${error}`);
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

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
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

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};
