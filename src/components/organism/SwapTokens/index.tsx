import classNames from "classnames";
import Decimal from "decimal.js";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import { InputEditedProps, PoolCardProps, TokenDecimalsErrorProps, TokenProps } from "../../../app/types";
import {
  ActionType,
  ButtonVariants,
  InputEditedType,
  ToasterType,
  TokenPosition,
  TokenSelection,
  TransactionTypes,
} from "../../../app/types/enum";
import {
  calculateSlippageAdd,
  calculateSlippageReduce,
  convertToBaseUnit,
  formatDecimalsFromToken,
  formatInputTokenValue,
  getAssetTokenSpotPrice,
  liquidityProviderFee,
} from "../../../app/util/helper";
import SwitchArrow from "../../../assets/img/switch-arrow.svg?react";
import SwitchArrowRounded from "../../../assets/img/switch-arrow-rounded.svg?react";
import ArrowDownIcon from "../../../assets/img/down-arrow.svg?react";
import HubIcon from "../../../assets/img/asset-hub-icon.svg?react";
import { LottieMedium } from "../../../assets/loader";
import { getPoolReserves } from "../../../services/poolServices";
import {
  checkSwapAssetForAssetGasFee,
  checkSwapNativeForAssetGasFee,
  performSwapAssetForAsset,
  performSwapNativeForAsset,
} from "../../../services/swapServices";
import {
  PriceCalcType,
  SellMaxToken,
  getAssetTokenAFromAssetTokenB,
  getAssetTokenBFromAssetTokenA,
  getAssetTokenFromNativeToken,
  getNativeTokenFromAssetToken,
  sellMax,
} from "../../../services/tokenServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button";
import WarningMessage from "../../atom/WarningMessage";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import ReviewTransactionModal from "../ReviewTransactionModal";
import SwapSelectTokenModal from "../SwapSelectTokenModal";
import { whitelist } from "../../../whitelist";
import TokenIcon from "../../atom/TokenIcon";
import SlippageControl from "../../molecule/SlippageControl/SlippageControl";
import { formatNumberEnUs, isApiAvailable, errorMessageHandler } from "../../../app/util/helper";
import dotAcpToast from "../../../app/util/toast";

type SwapTokenProps = {
  tokenA: TokenProps;
  tokenB: TokenProps;
};

type TokenValueProps = {
  tokenValue: string;
};

type TokenSelectedProps = {
  tokenSelected: TokenPosition;
};

type SwapTokensProps = {
  tokenId?: string;
  from?: string;
  to?: string;
};

const SwapTokens = ({ tokenId, from, to }: SwapTokensProps) => {
  const { state, dispatch } = useAppContext();
  const { nativeTokenSymbol, assethubSubscanUrl } = useGetNetwork();

  const {
    tokenBalances,
    poolsTokenMetadata,
    pools,
    api,
    selectedAccount,
    // swapGasFeesMessage,
    swapGasFee,
    swapLoading,
    poolsCards,
    assetLoading,
    isTokenCanNotCreateWarningSwap,
    lpFee,
  } = state;

  const [tokenSelectionModal, setTokenSelectionModal] = useState<TokenSelection>(TokenSelection.None);
  const [selectedTokens, setSelectedTokens] = useState<SwapTokenProps>({
    tokenA: {
      tokenSymbol: "",
      tokenId: "0",
      decimals: "",
      tokenBalance: "",
    },
    tokenB: {
      tokenSymbol: "",
      tokenId: "0",
      decimals: "",
      tokenBalance: "",
    },
  });

  const [inputEdited, setInputEdited] = useState<InputEditedProps>({ inputType: InputEditedType.exactIn });
  const [selectedTokenAValue, setSelectedTokenAValue] = useState<TokenValueProps>({ tokenValue: "" });
  const [selectedTokenBValue, setSelectedTokenBValue] = useState<TokenValueProps>({ tokenValue: "" });
  const [tokenAValueForSwap, setTokenAValueForSwap] = useState<TokenValueProps>({
    tokenValue: "0",
  });
  const [tokenBValueForSwap, setTokenBValueForSwap] = useState<TokenValueProps>({
    tokenValue: "0",
  });
  const [slippageAuto, setSlippageAuto] = useState<boolean>(true);
  const [slippageValue, setSlippageValue] = useState<number>(10);
  const [walletHasEnoughNativeToken, setWalletHasEnoughNativeToken] = useState<boolean>(false);
  const [availablePoolTokenA, setAvailablePoolTokenA] = useState<TokenProps[]>([]);
  const [availablePoolTokenB, setAvailablePoolTokenB] = useState<TokenProps[]>([]);
  const [tokenSelected, setTokenSelected] = useState<TokenSelectedProps>({ tokenSelected: TokenPosition.tokenA });
  const [assetTokensInPool, setAssetTokensInPool] = useState<string>("");
  const [nativeTokensInPool, setNativeTokensInPool] = useState<string>("");
  const [liquidityLow, setLiquidityLow] = useState<boolean>(false);
  const [lowTradingMinimum, setLowTradingMinimum] = useState<boolean>(false);
  const [lowMinimalAmountAssetToken, setLowMinimalAmountAssetToken] = useState<boolean>(false);
  const [minimumBalanceAssetToken, setMinimumBalanceAssetToken] = useState<string>("0");
  const [swapSuccessfulReset, setSwapSuccessfulReset] = useState<boolean>(false);
  const [switchTokensEnabled, setSwitchTokensEnabled] = useState<boolean>(false);
  const [tooManyDecimalsError, setTooManyDecimalsError] = useState<TokenDecimalsErrorProps>({
    tokenSymbol: "",
    isError: false,
    decimalsAllowed: 0,
  });

  const [isTransactionTimeout, setIsTransactionTimeout] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [waitingForTransaction, setWaitingForTransaction] = useState<NodeJS.Timeout>();
  const [priceImpact, setPriceImpact] = useState<string>("");
  const [assetBPriceOfOneAssetA, setAssetBPriceOfOneAssetA] = useState<string>("");
  const [swapInfo, setSwapInfo] = useState<boolean>(false);

  const [isMaxValueLessThenMinAmount, setIsMaxValueLessThenMinAmount] = useState<boolean>(false);

  const nativeToken = tokenBalances && {
    tokenId: "",
    assetTokenMetadata: {
      symbol: tokenBalances.tokenSymbol,
      name: tokenBalances.tokenSymbol,
      decimals: tokenBalances.tokenDecimals,
    },
    tokenAsset: {
      balance: new Decimal(tokenBalances.balanceAsset?.free || 0)
        .minus(tokenBalances.balanceAsset?.frozen || 0)
        .toString(),
    },
  };

  const tokenADecimal = new Decimal(selectedTokenAValue.tokenValue || 0);
  const tokenBDecimal = new Decimal(selectedTokenBValue.tokenValue || 0);

  const handleSwapGasFee = async (isNativeAssetSwap: boolean) => {
    if (!api) return;

    const tokenA = formatInputTokenValue(tokenAValueForSwap.tokenValue, selectedTokens.tokenA.decimals);
    const tokenB = formatInputTokenValue(tokenBValueForSwap.tokenValue, selectedTokens.tokenB.decimals);
    const isExactIn = inputEdited.inputType === InputEditedType.exactIn;

    if (isNativeAssetSwap) {
      const assetTokenId =
        selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol
          ? selectedTokens.tokenB.tokenId
          : selectedTokens.tokenA.tokenId;
      await checkSwapNativeForAssetGasFee(
        api,
        assetTokenId,
        selectedAccount,
        tokenA,
        tokenB,
        false,
        dispatch,
        isExactIn
      );
    } else {
      await checkSwapAssetForAssetGasFee(
        api,
        selectedTokens.tokenA.tokenId,
        selectedTokens.tokenB.tokenId,
        selectedAccount,
        tokenA,
        tokenB,
        dispatch,
        isExactIn
      );
    }
  };

  const getPriceOfAssetTokenFromNativeToken = async (value: string, inputType: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(
        value,
        selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
          ? selectedTokens.tokenA.decimals
          : selectedTokens.tokenB.decimals
      );

      const assetTokenPrice = await getAssetTokenFromNativeToken(
        api,
        selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
          ? selectedTokens?.tokenB?.tokenId
          : selectedTokens?.tokenA?.tokenId,
        valueWithDecimals
      );

      if (assetTokenPrice) {
        assetTokenPrice === "0" ? setLowTradingMinimum(true) : setLowTradingMinimum(false);
        const assetTokenNoSemicolons = assetTokenPrice.toString()?.replace(/[, ]/g, "");
        const assetTokenNoDecimals = formatDecimalsFromToken(
          parseFloat(assetTokenNoSemicolons),
          selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
            ? selectedTokens.tokenB.decimals
            : selectedTokens.tokenA.decimals
        );

        const assetTokenWithSlippage =
          inputType === InputEditedType.exactIn
            ? calculateSlippageReduce(assetTokenNoDecimals, slippageValue)
            : calculateSlippageAdd(assetTokenNoDecimals, slippageValue);

        if (inputType === InputEditedType.exactIn) {
          setTokenAValueForSwap({ tokenValue: value });
          setTokenBValueForSwap({ tokenValue: assetTokenWithSlippage });
          setSelectedTokenBValue({ tokenValue: assetTokenNoDecimals.toString() });
        } else if (inputType === InputEditedType.exactOut) {
          setTokenAValueForSwap({ tokenValue: assetTokenWithSlippage });
          setTokenBValueForSwap({ tokenValue: value });
          setSelectedTokenAValue({ tokenValue: assetTokenNoDecimals.toString() });
        }
      }
    }
  };

  const getPriceOfNativeTokenFromAssetToken = async (value: string, inputType: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(
        value,
        selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
          ? selectedTokens.tokenB.decimals
          : selectedTokens.tokenA.decimals
      );

      const nativeTokenPrice = await getNativeTokenFromAssetToken(
        api,
        selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
          ? selectedTokens?.tokenB?.tokenId
          : selectedTokens?.tokenA.tokenId,
        valueWithDecimals
      );

      if (nativeTokenPrice) {
        nativeTokenPrice === "0" ? setLowTradingMinimum(true) : setLowTradingMinimum(false);
        const nativeTokenNoSemicolons = nativeTokenPrice.toString()?.replace(/[, ]/g, "");
        const nativeTokenNoDecimals = formatDecimalsFromToken(
          parseFloat(nativeTokenNoSemicolons),
          selectedTokens?.tokenA?.tokenSymbol === nativeTokenSymbol
            ? selectedTokens.tokenA.decimals
            : selectedTokens.tokenB.decimals
        );

        const nativeTokenWithSlippage =
          inputType === InputEditedType.exactIn
            ? calculateSlippageReduce(nativeTokenNoDecimals, slippageValue)
            : calculateSlippageAdd(nativeTokenNoDecimals, slippageValue);

        if (tokenBalances?.balanceAsset?.free) {
          if (inputType === InputEditedType.exactIn) {
            setTokenAValueForSwap({ tokenValue: value });
            setTokenBValueForSwap({ tokenValue: nativeTokenWithSlippage });
            setSelectedTokenBValue({ tokenValue: nativeTokenNoDecimals.toString() });
          } else if (inputType === InputEditedType.exactOut) {
            setTokenAValueForSwap({ tokenValue: nativeTokenWithSlippage });
            setTokenBValueForSwap({ tokenValue: value });
            setSelectedTokenAValue({ tokenValue: nativeTokenNoDecimals.toString() });
          }
        }
      }
    }
  };

  const getPriceOfAssetTokenAFromAssetTokenB = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokens.tokenB.decimals);
      if (selectedTokens.tokenA.tokenId && selectedTokens.tokenB.tokenId) {
        const assetTokenPrice = await getAssetTokenAFromAssetTokenB(
          api,
          valueWithDecimals,
          selectedTokens.tokenA.tokenId,
          selectedTokens.tokenB.tokenId
        );
        if (assetTokenPrice) {
          assetTokenPrice === "0" ? setLowTradingMinimum(true) : setLowTradingMinimum(false);
          const assetTokenNoSemicolons = assetTokenPrice.toString()?.replace(/[, ]/g, "");
          const assetTokenNoDecimals = formatDecimalsFromToken(assetTokenNoSemicolons, selectedTokens.tokenA.decimals);
          const assetTokenWithSlippage = calculateSlippageAdd(assetTokenNoDecimals, slippageValue);

          setTokenAValueForSwap({ tokenValue: assetTokenWithSlippage });
          setTokenBValueForSwap({ tokenValue: value });
          setSelectedTokenAValue({ tokenValue: assetTokenNoDecimals });
        }
      }
    }
  };

  const getPriceOfAssetTokenBFromAssetTokenA = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokens.tokenA.decimals);
      if (selectedTokens.tokenA.tokenId && selectedTokens.tokenB.tokenId) {
        const assetTokenPrice = await getAssetTokenBFromAssetTokenA(
          api,
          valueWithDecimals,
          selectedTokens.tokenA.tokenId,
          selectedTokens.tokenB.tokenId
        );

        if (assetTokenPrice) {
          assetTokenPrice === "0" ? setLowTradingMinimum(true) : setLowTradingMinimum(false);
          const assetTokenNoSemicolons = assetTokenPrice.toString()?.replace(/[, ]/g, "");
          const assetTokenNoDecimals = formatDecimalsFromToken(
            parseFloat(assetTokenNoSemicolons),
            selectedTokens.tokenB.decimals
          );

          const assetTokenWithSlippage = calculateSlippageReduce(assetTokenNoDecimals, slippageValue);

          setTokenAValueForSwap({ tokenValue: value });
          setTokenBValueForSwap({ tokenValue: assetTokenWithSlippage });
          setSelectedTokenBValue({ tokenValue: assetTokenNoDecimals.toString() });
        }
      }
    }
  };

  const tokenAValue = async (value?: string) => {
    if (value) {
      value = new Decimal(value).toFixed();

      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokens.tokenA.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokens.tokenA.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokens.tokenA.decimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      setSelectedTokenAValue({ tokenValue: value });
      setInputEdited({ inputType: InputEditedType.exactIn });

      if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol) {
        getPriceOfAssetTokenFromNativeToken(value, InputEditedType.exactIn);
      } else if (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol) {
        getPriceOfNativeTokenFromAssetToken(value, InputEditedType.exactIn);
      } else {
        getPriceOfAssetTokenBFromAssetTokenA(value);
      }
    } else {
      setSelectedTokenAValue({ tokenValue: "" });
      setSelectedTokenBValue({ tokenValue: "" });
    }
  };

  const tokenBValue = async (value?: string) => {
    if (value) {
      value = new Decimal(value).toFixed();

      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokens.tokenB.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokens.tokenB.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokens.tokenB.decimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      setSelectedTokenBValue({ tokenValue: value });
      setInputEdited({ inputType: InputEditedType.exactOut });

      if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol) {
        getPriceOfNativeTokenFromAssetToken(value, InputEditedType.exactOut);
      } else if (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol) {
        getPriceOfAssetTokenFromNativeToken(value, InputEditedType.exactOut);
        if (tokenBalances?.balanceAsset?.free) {
          const fee = convertToBaseUnit(swapGasFee);
          const balanceMinusFee = new Decimal(tokenBalances.balanceAsset.free).minus(fee);
          setWalletHasEnoughNativeToken(new Decimal(value).lte(balanceMinusFee));
        }
      } else {
        getPriceOfAssetTokenAFromAssetTokenB(value);
      }
    } else {
      setSelectedTokenAValue({ tokenValue: "" });
      setSelectedTokenBValue({ tokenValue: "" });
    }
  };

  const getSwapButtonProperties = useMemo(() => {
    const tokenBalanceDecimal = new Decimal(tokenBalances?.balanceAsset?.free || 0);
    if (tokenBalances?.assets) {
      if (selectedTokens.tokenA.tokenSymbol === "" || selectedTokens.tokenB.tokenSymbol === "") {
        return { label: t("button.selectToken"), disabled: true };
      }
      if (
        tokenADecimal.lte(0) ||
        tokenBDecimal.lte(0) ||
        selectedTokenAValue?.tokenValue === "" ||
        selectedTokenBValue?.tokenValue === ""
      ) {
        return { label: t("button.enterAmount"), disabled: true };
      }
      if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol && tokenADecimal.gt(tokenBalanceDecimal)) {
        return {
          label: t("button.insufficientTokenAmount", { token: nativeTokenSymbol }),
          disabled: true,
        };
      }
      if (Number(tokenBValueForSwap.tokenValue) < 1 && selectedTokens.tokenB.decimals === "0") {
        return {
          label: t("button.toLowForSwap", { token: selectedTokens.tokenB.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol &&
        tokenADecimal.gt(
          formatDecimalsFromToken(
            selectedTokens.tokenA.tokenBalance.replace(/[, ]/g, ""),
            selectedTokens.tokenA.decimals
          )
        )
      ) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokens.tokenA.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol &&
        nativeTokensInPool &&
        tokenBDecimal.gt(nativeTokensInPool)
      ) {
        return {
          label: t("button.insufficientTokenLiquidity", { token: selectedTokens.tokenB.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol &&
        assetTokensInPool &&
        tokenBDecimal.gt(assetTokensInPool)
      ) {
        return {
          label: t("button.insufficientTokenLiquidity", { token: selectedTokens.tokenB.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol &&
        tokenADecimal.lt(tokenBalanceDecimal) &&
        !tooManyDecimalsError.isError
      ) {
        return { label: t("button.swap"), disabled: false };
      }
      if (
        selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol &&
        selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol &&
        tokenADecimal.gt(0) &&
        tokenBDecimal.gt(0) &&
        !tooManyDecimalsError.isError
      ) {
        return { label: t("button.swap"), disabled: false };
      }
      if (tokenADecimal.gt(0) && tokenBDecimal.gt(0) && !tooManyDecimalsError.isError) {
        return { label: t("button.swap"), disabled: false };
      }
      if (tokenADecimal.gt(0) && tokenBDecimal.gt(0) && tooManyDecimalsError.isError) {
        return { label: t("button.swap"), disabled: true };
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: t("button.selectToken"), disabled: true };
  }, [
    selectedAccount?.address,
    tooManyDecimalsError.isError,
    tokenBalances?.balanceAsset,
    selectedTokens.tokenA.decimals,
    selectedTokens.tokenB.decimals,
    selectedTokenAValue?.tokenValue,
    selectedTokenBValue?.tokenValue,
    walletHasEnoughNativeToken,
  ]);

  const getSwapTokenA = async () => {
    const poolLiquidTokens: any = [nativeToken]
      .concat(poolsTokenMetadata as any)
      ?.filter((item: any) => item.tokenId !== selectedTokens.tokenB?.tokenId && whitelist.includes(item.tokenId));
    if (tokenBalances !== null) {
      for (const item of poolLiquidTokens) {
        for (const walletAsset of tokenBalances.assets) {
          if (item.tokenId === walletAsset.tokenId) {
            item.tokenAsset.balance = walletAsset.tokenAsset.balance;
          }
        }
      }
      setAvailablePoolTokenA(poolLiquidTokens);
    }
    return poolLiquidTokens;
  };

  const getSwapTokenB = () => {
    const poolLiquidTokens: any = [nativeToken]
      .concat(poolsTokenMetadata as any)
      ?.filter((item: any) => item.tokenId !== selectedTokens.tokenA?.tokenId && whitelist.includes(item.tokenId));
    if (tokenBalances !== null) {
      for (const item of poolLiquidTokens) {
        for (const walletAsset of tokenBalances.assets) {
          if (item.tokenId === walletAsset.tokenId) {
            item.tokenAsset.balance = walletAsset.tokenAsset.balance;
          }
        }
      }
      setAvailablePoolTokenB(poolLiquidTokens);
    }
    return poolLiquidTokens;
  };

  const handleSwap = async () => {
    const isApiReady = api && (await isApiAvailable(api));
    if (!isApiReady) {
      dotAcpToast.error(t("error.api.notReady"), undefined, null);
      return;
    }
    setReviewModalOpen(false);
    waitingForTransaction && clearTimeout(waitingForTransaction);
    setSwapSuccessfulReset(false);
    setIsTransactionTimeout(false);
    setIsMaxValueLessThenMinAmount(false);
    dispatch({
      type: ActionType.REMOVE_NOTIFICATION,
      payload: "swap",
    });
    dispatch({
      type: ActionType.ADD_NOTIFICATION,
      payload: {
        id: "swap",
        notificationModalOpen: true,
        notificationPercentage: 1,
        notificationAction: "Swap",
        notificationType: ToasterType.PENDING,
        notificationTitle: t("modal.notifications.transactionInitiatedTitle", {
          platform: import.meta.env.VITE_VERSION === "dotswap" ? "DOTswap" : "DEDswap",
        }),
        notificationMessage: "Please proceed in your wallet",
        notificationChainDetails: null,
        notificationTransactionDetails: {
          fromToken: {
            symbol: selectedTokens.tokenA.tokenSymbol,
            amount: parseFloat(selectedTokenAValue.tokenValue),
          },
          toToken: {
            symbol: selectedTokens.tokenB.tokenSymbol,
            amount: parseFloat(selectedTokenBValue.tokenValue),
          },
        },
        notificationLink: null,
      },
    });

    if (!api || !tokenBalances) return;

    const tokenAValue = formatInputTokenValue(tokenAValueForSwap.tokenValue, selectedTokens.tokenA.decimals);
    const tokenBValue = formatInputTokenValue(tokenBValueForSwap.tokenValue, selectedTokens.tokenB.decimals);

    const isExactIn = inputEdited.inputType === InputEditedType.exactIn;

    const isNativeToAssetSwap =
      selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol &&
      selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol;
    const isAssetToAssetSwap =
      selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol &&
      selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol;
    try {
      if (isNativeToAssetSwap) {
        await performSwapNativeForAsset(
          api,
          selectedTokens.tokenB.tokenId,
          selectedAccount,
          tokenAValue,
          tokenBValue,
          selectedTokens.tokenA.decimals,
          selectedTokens.tokenB.decimals,
          false,
          tokenBalances,
          dispatch,
          isExactIn
        );
      } else if (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol) {
        await performSwapNativeForAsset(
          api,
          selectedTokens.tokenA.tokenId,
          selectedAccount,
          tokenBValue,
          tokenAValue,
          selectedTokens.tokenA.decimals,
          selectedTokens.tokenB.decimals,
          true,
          tokenBalances,
          dispatch,
          isExactIn
        );
      } else if (isAssetToAssetSwap) {
        await performSwapAssetForAsset(
          api,
          selectedTokens.tokenA.tokenId,
          selectedTokens.tokenB.tokenId,
          selectedAccount,
          tokenAValue,
          tokenBValue,
          selectedTokens.tokenA.decimals,
          selectedTokens.tokenB.decimals,
          tokenBalances,
          dispatch,
          isExactIn
        );
      }
    } catch (error) {
      const errorMessage = errorMessageHandler(error as any);
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
    }
  };

  const fillTokenPairsAndOpenModal = (tokenInputSelected: TokenSelection) => {
    if (tokenInputSelected === "tokenA") getSwapTokenA();
    if (tokenInputSelected === "tokenB") getSwapTokenB();

    setTokenSelectionModal(tokenInputSelected);
  };

  const onSwapSelectModal = (tokenData: any) => {
    setSelectedTokens((prev) => {
      return {
        ...prev,
        [tokenSelectionModal]: tokenData,
      };
    });
  };

  const checkIfEnoughTokensInPool = () => {
    if (selectedTokens && poolsCards) {
      if (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol) {
        if (poolsCards) {
          const poolNative = poolsCards.find((pool) => pool.assetTokenId === selectedTokens.tokenA.tokenId);
          if (poolNative)
            setNativeTokensInPool(
              formatDecimalsFromToken(
                poolNative.totalTokensLocked.nativeToken.value,
                poolNative.totalTokensLocked.nativeToken.decimals
              )
            );
        }
      }
      if (selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol) {
        if (poolsCards) {
          const poolAsset = poolsCards.find((pool) => pool.assetTokenId === selectedTokens.tokenB.tokenId);
          if (poolAsset)
            setAssetTokensInPool(
              formatDecimalsFromToken(
                poolAsset.totalTokensLocked.assetToken.value,
                poolAsset.totalTokensLocked.assetToken.decimals
              )
            );
        }
      }
    }
  };

  const checkIsEnoughNativeTokenInPool = () => {
    if (selectedTokens && poolsCards) {
      if (
        selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol &&
        selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol
      ) {
        if (poolsCards) {
          const poolAssetTokenB = poolsCards.find((pool) => pool.assetTokenId === selectedTokens.tokenB.tokenId);
          const poolAssetTokenA = poolsCards.find((pool) => pool.assetTokenId === selectedTokens.tokenA.tokenId);

          if (poolAssetTokenB && poolAssetTokenA) {
            if (
              parseFloat(poolAssetTokenB?.totalTokensLocked.nativeToken.formattedValue) < 1 ||
              parseFloat(poolAssetTokenA?.totalTokensLocked.nativeToken.formattedValue) < 1
            ) {
              setLiquidityLow(true);
            } else {
              setLiquidityLow(false);
            }
          }
        }
      } else {
        setLiquidityLow(false);
      }
    }
  };

  const checkAssetTokenMinAmountToSwap = async () => {
    const token = tokenBalances?.assets?.filter((item: any) => selectedTokens.tokenB.tokenId === item.tokenId);
    if (token?.length === 0) {
      if (selectedTokenBValue.tokenValue && api) {
        const assetTokenInfo: any = await api.query.assets.asset(selectedTokens.tokenB.tokenId);
        const assetTokenMinBalance = assetTokenInfo.toHuman()?.minBalance;
        if (
          parseInt(formatInputTokenValue(tokenBValueForSwap.tokenValue, selectedTokens.tokenB.decimals)) <
          parseInt(assetTokenMinBalance?.replace(/[, ]/g, ""))
        ) {
          setMinimumBalanceAssetToken(
            formatDecimalsFromToken(assetTokenMinBalance?.replace(/[, ]/g, ""), selectedTokens.tokenB.decimals)
          );
          setLowMinimalAmountAssetToken(true);
        } else {
          setLowMinimalAmountAssetToken(false);
        }
      }
    }
  };

  type TransactionValues = {
    formattedValueA: string;
    formattedValueB: string;
    priceCalcType: PriceCalcType;
    valueA: string;
    valueB: string;
    minAmountA: string;
    minAmountB: string;
  };

  /**
   * Calculates maximum token values for a swap, handling different scenarios based on the type of swap.
   * This function unifies the logic of what were originally three separate functions:
   * 1. getMaxClickNativeFromAssetValues: For swaps involving a native token and an asset token, where the native token is being sold.
   * 2. getMaxClickAssetFromNativeValues: For swaps involving a native token and an asset token, where the asset token is being sold.
   * 3. getMaxAssetFromAssetValues: For swaps involving two asset tokens.
   *
   * @param {Object} params - The parameters for the function.
   * @param {string} params.firstMinBalance - The minimum balance for the first token,
   *                                          which varies based on the swap type.
   * @param {string} params.secondMinBalance - The minimum balance for the second token,
   *                                           which varies based on the swap type.
   * @param {PoolCardProps} params.poolAsset - The pool asset data.
   * @param {PriceCalcType} params.priceCalcType - The type of price calculation,
   *                                               determining the swap scenario.
   * @returns {TransactionValues | null} - The calculated values for the transaction,
   *                                       including formatted and raw values,
   *                                       or null if the type is unrecognized.
   *
   * Usage Notes:
   * - For NativeFromAsset and AssetFromNative types, the firstMinBalance and secondMinBalance
   *   refer to the min balances of the asset and native tokens respectively, but their roles
   *   are switched between these two types. Previously, firstMinBalance was assetTokenMinBalance, and secondMinBalance was nativeTokenExistentialDeposit
   * - For AssetFromAsset type, the min balances correspond to each asset token involved in the swap. Previously, these were called assetTokenMinAmountA and assetTokenMinAmountB
   */
  const getMaxClick = ({
    firstMinBalance,
    secondMinBalance,
    poolAsset,
    priceCalcType,
  }: {
    firstMinBalance: string;
    secondMinBalance: string;
    poolAsset: PoolCardProps;
    priceCalcType: PriceCalcType;
  }): TransactionValues | null => {
    switch (priceCalcType) {
      case PriceCalcType.NativeFromAsset: {
        const valueA = new Decimal(selectedTokens.tokenA.tokenBalance.replace(/[, ]/g, "") || 0)
          .minus(firstMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();
        const formattedValueA = formatDecimalsFromToken(valueA, selectedTokens.tokenA.decimals);

        const valueB = new Decimal(poolAsset.totalTokensLocked.nativeToken.value)
          .minus(secondMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();

        const formattedValueB = formatDecimalsFromToken(valueB, poolAsset.totalTokensLocked.nativeToken.decimals);
        return {
          formattedValueA,
          formattedValueB,
          valueA,
          valueB,
          priceCalcType,
          minAmountA: firstMinBalance,
          minAmountB: secondMinBalance,
        };
      }
      case PriceCalcType.AssetFromNative: {
        const valueA = new Decimal(
          formatInputTokenValue(selectedTokens.tokenA.tokenBalance.replace(/[, ]/g, ""), selectedTokens.tokenA.decimals)
        )
          .minus(secondMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();
        const formattedValueA = formatDecimalsFromToken(valueA, selectedTokens.tokenA.decimals);

        const valueB = new Decimal(poolAsset.totalTokensLocked.assetToken.value)
          .minus(firstMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();

        const formattedValueB = formatDecimalsFromToken(valueB, selectedTokens.tokenB.decimals);

        return {
          formattedValueA,
          formattedValueB,
          valueA,
          valueB,
          priceCalcType,
          minAmountA: secondMinBalance,
          minAmountB: firstMinBalance,
        };
      }
      case PriceCalcType.AssetFromAsset: {
        const valueA = new Decimal(selectedTokens.tokenA.tokenBalance.replace(/[, ]/g, ""))
          .minus(firstMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();
        const formattedValueA = formatDecimalsFromToken(valueA, selectedTokens.tokenA.decimals);

        const valueB = new Decimal(poolAsset.totalTokensLocked.assetToken.value)
          .minus(secondMinBalance) // TODO: substract this later if it is required, eg after calculation
          .toFixed();
        const formattedValueB = poolAsset.totalTokensLocked.assetToken.formattedValue;

        return {
          formattedValueA,
          formattedValueB,
          valueA,
          valueB,
          priceCalcType,
          minAmountA: firstMinBalance,
          minAmountB: secondMinBalance,
        };
      }
      default:
        return null;
    }
  };

  // some of tokens can be full drain for either from pool or from user balance
  // if it is native token selling and it is drain we need to substrate fee and existential deposit
  // if it is asset token selling and it is drain (from user wallet or pool) we need to substrate min balance
  // if it is native token drain from the pool we need to substrate existential deposit
  const onMaxClick = async () => {
    if (!selectedTokens.tokenA.tokenSymbol || !selectedTokens.tokenB.tokenSymbol || swapLoading) {
      return;
    }
    setIsMaxValueLessThenMinAmount(false);

    const poolAsset = poolsCards.find(
      (pool) =>
        pool.assetTokenId ===
        (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol
          ? selectedTokens.tokenA.tokenId
          : selectedTokens.tokenB.tokenId)
    );

    if (!poolAsset) {
      throw new Error("Pool asset not found");
    }

    const nativeTokenExistentialDeposit = tokenBalances!.existentialDeposit.replace(/[, ]/g, "");
    let firstMinBalance, secondMinBalance;
    const priceCalcType =
      selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol
        ? PriceCalcType.AssetFromNative
        : selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol
          ? PriceCalcType.NativeFromAsset
          : PriceCalcType.AssetFromAsset;

    if (priceCalcType !== PriceCalcType.AssetFromAsset) {
      const assetTokenId =
        priceCalcType === PriceCalcType.AssetFromNative ? selectedTokens.tokenB.tokenId : selectedTokens.tokenA.tokenId;

      const assetTokenInfo: any = await api!.query.assets.asset(assetTokenId);
      firstMinBalance = assetTokenInfo.toHuman()?.minBalance.replace(/[, ]/g, "");
      secondMinBalance = nativeTokenExistentialDeposit;
    } else {
      const assetTokenInfoA: any = await api!.query.assets.asset(selectedTokens.tokenA.tokenId);
      const assetTokenInfoB: any = await api!.query.assets.asset(selectedTokens.tokenB.tokenId);
      firstMinBalance = assetTokenInfoA.toHuman()?.minBalance.replace(/[, ]/g, "");
      secondMinBalance = assetTokenInfoB.toHuman()?.minBalance.replace(/[, ]/g, "");
    }

    const transactionValues = getMaxClick({
      firstMinBalance,
      secondMinBalance,
      poolAsset,
      priceCalcType,
    });

    if (!transactionValues) {
      throw new Error("Failed to calculate transaction values");
    }

    const tokenA: SellMaxToken = {
      id: selectedTokens.tokenA.tokenId,
      decimals: selectedTokens.tokenA.decimals,
      value: transactionValues.valueA,
      formattedValue: transactionValues.formattedValueA,
      minAmount: transactionValues.minAmountA,
    };

    const tokenBinPool: SellMaxToken = {
      id: selectedTokens.tokenB.tokenId,
      decimals: selectedTokens.tokenB.decimals,
      value: transactionValues.valueB,
      formattedValue: transactionValues.formattedValueB,
      minAmount: transactionValues.minAmountB,
    };

    dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
    const maxValueA = await sellMax({
      api: api!,
      tokenA,
      tokenBinPool,
      priceCalcType,
    });
    dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });

    const minAmountFormattedA = formatDecimalsFromToken(transactionValues.minAmountA, selectedTokens.tokenA.decimals);
    if (new Decimal(maxValueA).lt(minAmountFormattedA)) {
      setIsMaxValueLessThenMinAmount(true);
      return;
    }

    tokenAValue(maxValueA);

    if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol && tokenBalances) {
      const fee = convertToBaseUnit(swapGasFee);
      const maxValueWithFee = new Decimal(maxValueA).plus(fee);
      const nativeTokenBalance = new Decimal(tokenBalances.balanceAsset.free);
      if (nativeTokenBalance.lt(maxValueWithFee)) {
        tokenAValue(nativeTokenBalance.minus(fee).toFixed());
      }
    }
  };

  const handleSwitchTokens = () => {
    const selectedTokenA: TokenProps = selectedTokens.tokenA;
    const selectedTokenB: TokenProps = selectedTokens.tokenB;

    setSwitchTokensEnabled(true);

    setSelectedTokens({
      tokenA: selectedTokenB,
      tokenB: selectedTokenA,
    });
  };

  useEffect(() => {
    if (switchTokensEnabled && tokenSelected) {
      tokenBValue(selectedTokenAValue.tokenValue);
      tokenAValue(selectedTokenBValue.tokenValue);
    }

    return () => {
      setSwitchTokensEnabled(false);
    };
  }, [selectedTokens]);

  useEffect(() => {
    if (
      selectedTokenAValue?.tokenValue &&
      selectedTokenBValue?.tokenValue &&
      inputEdited.inputType === InputEditedType.exactIn &&
      parseFloat(selectedTokenBValue.tokenValue) > 0
    ) {
      tokenAValue(selectedTokenAValue?.tokenValue);
    } else if (
      selectedTokenAValue?.tokenValue &&
      selectedTokenBValue?.tokenValue &&
      inputEdited.inputType === InputEditedType.exactOut &&
      parseFloat(selectedTokenAValue.tokenValue) > 0
    ) {
      tokenBValue(selectedTokenBValue?.tokenValue);
    }
  }, [slippageValue]);

  useEffect(() => {
    const isNativeAssetSwap =
      selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol ||
      selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol;
    const isAssetAssetSwap =
      selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol &&
      selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol &&
      selectedTokens.tokenA.tokenSymbol !== "" &&
      selectedTokens.tokenB.tokenSymbol !== "";

    if (
      (isNativeAssetSwap || isAssetAssetSwap) &&
      selectedTokenAValue.tokenValue !== "" &&
      selectedTokenBValue.tokenValue !== ""
    ) {
      handleSwapGasFee(isNativeAssetSwap);
    }
    checkAssetTokenMinAmountToSwap();
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: false });
  }, [
    selectedTokens.tokenA.tokenSymbol && selectedTokens.tokenB.tokenSymbol,
    tokenAValueForSwap.tokenValue && tokenBValueForSwap.tokenValue,
  ]);

  useEffect(() => {
    setIsMaxValueLessThenMinAmount(false);
    setIsTransactionTimeout(false);
    if (selectedTokenBValue.tokenValue === "") {
      setTokenAValueForSwap({ tokenValue: "0" });
      setTokenBValueForSwap({ tokenValue: "0" });
      setLowMinimalAmountAssetToken(false);
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
        payload: "",
      });
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEE,
        payload: "",
      });
    }
  }, [
    selectedTokenAValue.tokenValue,
    selectedTokenBValue.tokenValue,
    selectedTokens.tokenA.tokenSymbol,
    selectedTokens.tokenB.tokenSymbol,
  ]);

  useEffect(() => {
    checkIfEnoughTokensInPool();
    checkIsEnoughNativeTokenInPool();
  }, [selectedTokens.tokenA.tokenSymbol, selectedTokens.tokenB.tokenSymbol]);

  useEffect(() => {
    if (swapSuccessfulReset) {
      setSelectedTokenAValue({ tokenValue: "" });
      setSelectedTokenBValue({ tokenValue: "" });
    }
  }, [swapSuccessfulReset]);

  useEffect(() => {
    if (Object.keys(selectedAccount).length === 0) {
      setSelectedTokenAValue({ tokenValue: "" });
      setSelectedTokenBValue({ tokenValue: "" });
      setSelectedTokens({
        tokenA: {
          tokenSymbol: "",
          tokenId: "0",
          decimals: "",
          tokenBalance: "",
        },
        tokenB: {
          tokenSymbol: "",
          tokenId: "0",
          decimals: "",
          tokenBalance: "",
        },
      });
    }
  }, [selectedAccount]);

  useEffect(() => {
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
      payload: "",
    });
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEE,
      payload: "",
    });
  }, []);

  useEffect(() => {
    if (swapLoading) {
      setWaitingForTransaction(
        setTimeout(() => {
          if (swapLoading) {
            setIsTransactionTimeout(true);
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
          }
        }, 180000)
      ); // 3 minutes 180000
    } else {
      if (waitingForTransaction) {
        clearTimeout(waitingForTransaction);
      }
    }
  }, [swapLoading]);

  const calculatePriceImpact = async () => {
    if (api) {
      if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol && selectedTokenBValue.tokenValue !== "") {
        const poolSelected: any = pools?.find(
          (pool: any) =>
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "") === selectedTokens.tokenB.tokenId
        );
        if (poolSelected) {
          const poolReserve: any = await getPoolReserves(
            api,
            poolSelected?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
          );

          const assetTokenReserve = formatDecimalsFromToken(
            poolReserve?.[1]?.replace(/[, ]/g, ""),
            selectedTokens.tokenB.decimals
          );

          const nativeTokenReserve = formatDecimalsFromToken(
            poolReserve?.[0]?.replace(/[, ]/g, ""),
            selectedTokens.tokenA.decimals
          );

          const priceBeforeSwap = new Decimal(nativeTokenReserve).div(assetTokenReserve);

          const priceOfAssetBForOneAssetA = new Decimal(assetTokenReserve).div(nativeTokenReserve);
          setAssetBPriceOfOneAssetA(priceOfAssetBForOneAssetA.toFixed(5));

          const valueA = new Decimal(selectedTokenAValue.tokenValue).add(nativeTokenReserve);
          const valueB = new Decimal(assetTokenReserve).minus(selectedTokenBValue.tokenValue);

          const priceAfterSwap = valueA.div(valueB);

          const priceImpact = new Decimal(1).minus(priceBeforeSwap.div(priceAfterSwap));

          setPriceImpact(priceImpact.mul(100).toFixed(2));
        }
      } else if (
        selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol &&
        selectedTokenBValue.tokenValue !== "" &&
        selectedTokenAValue.tokenValue !== ""
      ) {
        const poolSelected: any = pools?.find(
          (pool: any) =>
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "") === selectedTokens.tokenA.tokenId
        );

        if (poolSelected) {
          const poolReserve: any = await getPoolReserves(
            api,
            poolSelected?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
          );
          const assetTokenReserve = formatDecimalsFromToken(
            poolReserve?.[1]?.replace(/[, ]/g, ""),
            selectedTokens.tokenA.decimals
          );

          const nativeTokenReserve = formatDecimalsFromToken(
            poolReserve?.[0]?.replace(/[, ]/g, ""),
            selectedTokens.tokenB.decimals
          );

          const priceBeforeSwap = new Decimal(nativeTokenReserve).div(assetTokenReserve);

          const priceOfAssetBForOneAssetA = new Decimal(nativeTokenReserve).div(assetTokenReserve);

          setAssetBPriceOfOneAssetA(priceOfAssetBForOneAssetA.toFixed(5));

          const valueA = new Decimal(assetTokenReserve).minus(selectedTokenAValue.tokenValue);
          const valueB = new Decimal(nativeTokenReserve).add(selectedTokenBValue.tokenValue);

          const priceAfterSwap = valueB.div(valueA);

          const priceImpact = new Decimal(1).minus(priceBeforeSwap.div(priceAfterSwap));

          setPriceImpact(priceImpact.mul(100).toFixed(2));
        }
      }
      if (
        selectedTokens.tokenB.tokenSymbol !== nativeTokenSymbol &&
        selectedTokens.tokenA.tokenSymbol !== nativeTokenSymbol &&
        selectedTokenBValue.tokenValue !== "" &&
        selectedTokenAValue.tokenValue !== ""
      ) {
        const poolSelectedA: any = pools?.find(
          (pool: any) =>
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "") === selectedTokens.tokenA.tokenId
        );

        const poolSelectedB: any = pools?.find(
          (pool: any) =>
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "") === selectedTokens.tokenB.tokenId
        );

        if (poolSelectedA && poolSelectedB) {
          const poolReserveA: any = await getPoolReserves(
            api,
            poolSelectedA?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
          );

          const assetTokenReserveA = formatDecimalsFromToken(
            poolReserveA?.[1]?.replace(/[, ]/g, ""),
            selectedTokens.tokenA.decimals
          );

          const nativeTokenDecimals =
            selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol
              ? selectedTokens.tokenA.decimals
              : selectedTokens.tokenB.decimals;

          const nativeTokenReserveA = formatDecimalsFromToken(
            poolReserveA?.[0]?.replace(/[, ]/g, ""),
            nativeTokenDecimals
          );

          const priceBeforeSwapA = new Decimal(assetTokenReserveA).div(nativeTokenReserveA);

          const valueAWithDecimals = formatInputTokenValue(
            new Decimal(selectedTokenAValue.tokenValue).toNumber(),
            selectedTokens.tokenA.decimals
          );

          const nativeTokenAmount = await getNativeTokenFromAssetToken(
            api,
            selectedTokens?.tokenA?.tokenId,
            valueAWithDecimals
          );

          if (nativeTokenAmount) {
            const nativeTokenAmountFormatted = formatDecimalsFromToken(
              new Decimal(nativeTokenAmount?.toString().replace(/[, ]/g, "")).toNumber(),
              nativeTokenDecimals
            );
            const valueA = new Decimal(assetTokenReserveA).add(selectedTokenAValue.tokenValue);
            const valueB = new Decimal(nativeTokenReserveA).minus(nativeTokenAmountFormatted);

            const priceAfterSwapA = valueA.div(valueB);

            const priceImpactTokenA = new Decimal(1).minus(priceBeforeSwapA.div(priceAfterSwapA));

            const poolReserveB: any = await getPoolReserves(
              api,
              poolSelectedB?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
            );

            const assetTokenReserveB = formatDecimalsFromToken(
              poolReserveA?.[1]?.replace(/[, ]/g, ""),
              selectedTokens.tokenB.decimals
            );

            const oneAssetTokenBAmount = await getAssetTokenBFromAssetTokenA(
              api,
              formatInputTokenValue(1, selectedTokens.tokenA.decimals),
              selectedTokens?.tokenA?.tokenId,
              selectedTokens?.tokenB?.tokenId
            );
            if (oneAssetTokenBAmount) {
              const oneAssetTokenBFormatted = formatDecimalsFromToken(
                new Decimal(oneAssetTokenBAmount?.toString().replace(/[, ]/g, "")).toNumber(),
                selectedTokens.tokenB.decimals
              );

              setAssetBPriceOfOneAssetA(oneAssetTokenBFormatted.toString());
            }

            const nativeTokenReserveB = formatDecimalsFromToken(
              poolReserveB?.[0]?.replace(/[, ]/g, ""),
              nativeTokenDecimals
            );

            const priceBeforeSwapB = new Decimal(nativeTokenReserveB).div(assetTokenReserveB);

            const tokenBValue = new Decimal(assetTokenReserveB).minus(selectedTokenBValue.tokenValue);
            const nativeTokenBValue = new Decimal(nativeTokenReserveB).add(nativeTokenAmountFormatted);

            const priceAfterSwapB = nativeTokenBValue.div(tokenBValue);

            const priceImpactTokenB = new Decimal(1).minus(priceBeforeSwapB.div(priceAfterSwapB));

            let totalPriceImpact: Decimal;

            if (new Decimal(priceImpactTokenA).lessThan(priceImpactTokenB)) {
              totalPriceImpact = new Decimal(priceImpactTokenB).times(priceImpactTokenA.add(1));
            } else {
              totalPriceImpact = new Decimal(priceImpactTokenA).times(priceImpactTokenB.add(1));
            }

            setPriceImpact(totalPriceImpact.mul(100).toFixed(2));
          }
        }
      }
    }
  };

  useEffect(() => {
    calculatePriceImpact();
  }, [
    selectedTokens.tokenA.tokenSymbol,
    selectedTokens.tokenB.tokenSymbol,
    selectedTokenBValue.tokenValue,
    selectedTokenAValue.tokenValue,
  ]);

  useEffect(() => {
    if (!window.location.href.includes("swap")) return;
    const url = new URL(window.location.href);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (selectedTokens.tokenA.tokenSymbol && selectedTokens.tokenA.tokenSymbol !== from) {
      url.searchParams.set("from", selectedTokens.tokenA.tokenSymbol);
      history.replaceState(null, "", url.toString());
    }
    if (selectedTokens.tokenB.tokenSymbol && selectedTokens.tokenB.tokenSymbol !== to) {
      url.searchParams.set("to", selectedTokens.tokenB.tokenSymbol);
      history.replaceState(null, "", url.toString());
    }
  }, [selectedTokens.tokenA.tokenSymbol, selectedTokens.tokenB.tokenSymbol]);

  const [urlTokens, setUrlTokens] = useState<{ from: string; to: string }>({ from: "", to: "" });

  useEffect(() => {
    if (!tokenBalances || !Object.keys(tokenBalances).length || assetLoading) {
      if (from && from !== "") {
        setUrlTokens((prev) => {
          return {
            ...prev,
            from: from,
          };
        });
      }

      if (to && to !== "") {
        setUrlTokens((prev) => {
          return {
            ...prev,
            to: to,
          };
        });
      }

      return;
    }

    const getTokenData = (tokenSymbol: string, tokenPosition: TokenPosition) => {
      const token =
        tokenSymbol === nativeTokenSymbol
          ? nativeToken
          : tokenBalances.assets.find((item: any) => item.assetTokenMetadata.symbol === tokenSymbol);

      if (!token) return;

      const tokenData = {
        tokenSymbol: token.assetTokenMetadata.symbol || "",
        tokenId: token.tokenId || "",
        decimals: token.assetTokenMetadata.decimals || "",
        tokenBalance: token.tokenAsset.balance?.replace(/[, ]/g, "") || "",
      };

      setSelectedTokens((prev) => {
        return {
          ...prev,
          [tokenPosition === TokenPosition.tokenA ? "tokenA" : "tokenB"]: tokenData,
        };
      });
      setTokenSelected({ tokenSelected: tokenPosition });
    };

    if (from && from !== "") {
      getTokenData(from, TokenPosition.tokenA);
    }

    if (to && to !== "") {
      getTokenData(to, TokenPosition.tokenB);
    }

    if (!tokenId) return;
    if (tokenId === "0") {
      getTokenData(nativeTokenSymbol, TokenPosition.tokenA);
    } else {
      const token = tokenBalances.assets.find((item: any) => item.tokenId === tokenId);
      if (token) {
        setSelectedTokens((prev) => {
          return {
            ...prev,
            tokenA: {
              tokenSymbol: token.assetTokenMetadata.symbol,
              tokenId: token.tokenId,
              decimals: token.assetTokenMetadata.decimals,
              tokenBalance: token.tokenAsset.balance?.replace(/[, ]/g, ""),
            },
          };
        });

        setTokenSelected({ tokenSelected: TokenPosition.tokenA });
      }
    }
  }, [tokenBalances, from, to, tokenId, nativeTokenSymbol, assetLoading]);

  useEffect(() => {
    if (!tokenBalances) return;

    setSelectedTokens((prev) => {
      const tokenBalanceA =
        prev.tokenA.tokenSymbol === nativeTokenSymbol
          ? tokenBalances.balanceAsset?.free
          : tokenBalances.assets
              ?.find((item: any) => item.tokenId === prev.tokenA.tokenId)
              ?.tokenAsset.balance?.replace(/[, ]/g, "");
      const tokenBalanceB =
        prev.tokenB.tokenSymbol === nativeTokenSymbol
          ? tokenBalances.balanceAsset?.free
          : tokenBalances.assets
              ?.find((item: any) => item.tokenId === prev.tokenB.tokenId)
              ?.tokenAsset.balance?.replace(/[, ]/g, "");
      return {
        ...prev,
        tokenA: {
          ...prev.tokenA,
          tokenBalance: tokenBalanceA,
        },
        tokenB: {
          ...prev.tokenB,
          tokenBalance: tokenBalanceB,
        },
      };
    });
  }, [tokenBalances]);

  const [assetTokenASpotPrice, setAssetTokenASpotPrice] = useState<string>("0");
  const [assetTokenBSpotPrice, setAssetTokenBSpotPrice] = useState<string>("0");

  useEffect(() => {
    if (!tokenBalances || !api) return;
    if (selectedTokens.tokenA.tokenSymbol === nativeTokenSymbol) {
      setAssetTokenASpotPrice(tokenBalances?.spotPrice);
    } else {
      getAssetTokenSpotPrice(api, selectedTokens.tokenA.tokenId, selectedTokens.tokenA.decimals, tokenBalances).then(
        (price) => {
          if (price) setAssetTokenASpotPrice(price);
        }
      );
    }
  }, [api, tokenBalances, selectedTokens.tokenA.tokenId]);

  useEffect(() => {
    if (!tokenBalances || !api) return;
    if (selectedTokens.tokenB.tokenSymbol === nativeTokenSymbol) {
      setAssetTokenBSpotPrice(tokenBalances?.spotPrice);
    } else {
      getAssetTokenSpotPrice(api, selectedTokens.tokenB.tokenId, selectedTokens.tokenB.decimals, tokenBalances).then(
        (price) => {
          if (price) setAssetTokenBSpotPrice(price);
        }
      );
    }
  }, [api, tokenBalances, selectedTokens.tokenB.tokenId]);

  useEffect(() => {
    if (tokenSelected.tokenSelected === TokenPosition.tokenB && selectedTokenAValue.tokenValue) {
      tokenAValue(selectedTokenAValue.tokenValue);
    } else if (tokenSelected.tokenSelected === TokenPosition.tokenA && selectedTokenBValue.tokenValue) {
      tokenBValue(selectedTokenBValue.tokenValue);
    }
  }, [tokenSelected]);

  return (
    <div className="flex max-w-[460px] flex-col gap-4 dedswap:mt-[35px] dedswap:max-w-[604px]">
      <div className="relative flex w-full flex-col items-center gap-1.5 rounded-2xl bg-white p-5 dedswap:rounded-sm dedswap:border-8 dedswap:border-black dedswap:bg-opacity-80">
        <div className="relative flex w-full items-center justify-between">
          <h3 className="heading-6 font-unbounded-variable font-normal dedswap:font-omnes-bold dedswap:text-[40px] dedswap:font-bold">
            {t("swapPage.swap")}
          </h3>
          <SlippageControl
            slippageValue={slippageValue}
            setSlippageValue={setSlippageValue}
            slippageAuto={slippageAuto}
            setSlippageAuto={setSlippageAuto}
            loadingState={swapLoading || assetLoading}
          />
        </div>
        <hr className="mb-3 mt-3 w-full border-[0.7px] border-gray-50 dedswap:hidden" />
        <TokenAmountInput
          tokenText={selectedTokens.tokenA?.tokenSymbol || urlTokens.from}
          tokenBalance={selectedTokens.tokenA?.tokenBalance}
          showUSDValue={selectedTokens.tokenA?.tokenBalance !== undefined && selectedTokens.tokenA?.tokenBalance !== ""}
          spotPrice={selectedTokens.tokenA.tokenId !== "" ? assetTokenASpotPrice : tokenBalances?.spotPrice}
          tokenId={selectedTokens.tokenA?.tokenId}
          tokenDecimals={selectedTokens.tokenA?.decimals}
          labelText={t("tokenAmountInput.youPay")}
          tokenIcon={
            <TokenIcon
              tokenSymbol={selectedTokens.tokenA?.tokenSymbol || urlTokens.from}
              width={"24px"}
              height={"24px"}
            />
          }
          tokenValue={selectedTokenAValue?.tokenValue}
          onClick={() => fillTokenPairsAndOpenModal(TokenSelection.TokenA)}
          onSetTokenValue={(value) => tokenAValue(value)}
          disabled={!selectedAccount || swapLoading || !tokenBalances?.assets || poolsTokenMetadata.length === 0}
          assetLoading={assetLoading}
          onMaxClick={onMaxClick}
          maxVisible={!!selectedTokens.tokenB.tokenSymbol}
        />

        <TokenAmountInput
          tokenText={selectedTokens.tokenB?.tokenSymbol || urlTokens.to}
          tokenBalance={selectedTokens.tokenB?.tokenBalance}
          showUSDValue={selectedTokens.tokenB?.tokenBalance !== undefined && selectedTokens.tokenB?.tokenBalance !== ""}
          spotPrice={selectedTokens.tokenB.tokenId !== "" ? assetTokenBSpotPrice : tokenBalances?.spotPrice}
          tokenId={selectedTokens.tokenB?.tokenId}
          tokenDecimals={selectedTokens.tokenB?.decimals}
          labelText={t("tokenAmountInput.youReceive")}
          tokenIcon={
            <TokenIcon
              tokenSymbol={selectedTokens.tokenB?.tokenSymbol || urlTokens.to}
              width={"24px"}
              height={"24px"}
            />
          }
          tokenValue={selectedTokenBValue?.tokenValue}
          onClick={() => fillTokenPairsAndOpenModal(TokenSelection.TokenB)}
          onSetTokenValue={(value) => tokenBValue(value)}
          disabled={!selectedAccount || swapLoading || !tokenBalances?.assets || poolsTokenMetadata.length === 0}
          assetLoading={assetLoading}
        />
        <button
          className="absolute top-[190px]"
          onClick={() => {
            !swapLoading && handleSwitchTokens();
          }}
        >
          <SwitchArrow className="cursor-pointer hover:rotate-180 dedswap:hidden" />
          <SwitchArrowRounded fill="#fff" className="hidden cursor-pointer hover:rotate-180 dedswap:block" />
        </button>
        <Button
          onClick={() => (getSwapButtonProperties.disabled ? null : setReviewModalOpen(true))}
          variant={ButtonVariants.btnInteractivePink}
          disabled={getSwapButtonProperties.disabled || swapLoading}
        >
          {swapLoading ? <LottieMedium /> : getSwapButtonProperties.label}
        </Button>
        {selectedTokenAValue.tokenValue !== "" && selectedTokenBValue.tokenValue !== "" && (
          <>
            {" "}
            <div
              className={classNames(
                "translate-all easy-and-out flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-2 py-4 text-medium font-normal text-dark-450 duration-300 dedswap:rounded-sm dedswap:font-open-sans dedswap:font-bold",
                {
                  "h-[52px]": !swapInfo,
                  "h-[185px]": swapInfo,
                }
              )}
            >
              <div className="flex w-full flex-row">
                <div className="flex w-full items-center justify-between dedswap:font-extrabold">
                  <span>
                    1 {selectedTokens.tokenA.tokenSymbol} ={" "}
                    {formatNumberEnUs(Number(assetBPriceOfOneAssetA), Number(selectedTokens.tokenB.decimals))}{" "}
                    {selectedTokens.tokenB.tokenSymbol}
                  </span>
                  <button onClick={() => setSwapInfo(!swapInfo)} className="relative z-10">
                    {
                      <ArrowDownIcon
                        className={classNames("transform transition-transform duration-300", {
                          "rotate-[-180deg]": swapInfo,
                        })}
                      />
                    }
                  </button>
                </div>
              </div>
              <div
                className={classNames("translate-all easy-and-out flex flex-col justify-between gap-2 duration-300", {
                  "bottom-[-170px] opacity-0": !swapInfo,
                  "top-[150px] opacity-100": swapInfo,
                })}
              >
                <div className="flex w-full flex-row justify-between">
                  <div className="flex">
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? t("swapPage.minReceived")
                      : t("swapPage.maxPaid")}
                  </div>
                  <span className="text-dark-500">
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? formatNumberEnUs(
                          Number(
                            formatDecimalsFromToken(
                              formatInputTokenValue(tokenBValueForSwap.tokenValue, selectedTokens.tokenB.decimals),
                              selectedTokens.tokenB.decimals
                            )
                          ),
                          Number(selectedTokens.tokenB.decimals)
                        ) +
                        " " +
                        selectedTokens.tokenB.tokenSymbol
                      : formatNumberEnUs(
                          Number(
                            formatDecimalsFromToken(
                              formatInputTokenValue(tokenAValueForSwap.tokenValue, selectedTokens.tokenA.decimals),
                              selectedTokens.tokenA.decimals
                            )
                          ),
                          Number(selectedTokens.tokenA.decimals)
                        ) +
                        " " +
                        selectedTokens.tokenA.tokenSymbol}
                  </span>
                </div>
                <div className="flex w-full flex-row justify-between">
                  <div className="flex">{t("swapPage.priceImpact")}</div>
                  <span className="text-dark-500">~ {priceImpact}%</span>
                </div>
                <div className="flex w-full flex-row justify-between">
                  <div className="flex">{t("swapPage.liquidityFee")}</div>
                  <span className="text-dark-500">
                    {formatNumberEnUs(
                      Number(
                        formatDecimalsFromToken(
                          liquidityProviderFee(
                            formatInputTokenValue(tokenAValueForSwap.tokenValue, selectedTokens.tokenA.decimals),
                            lpFee
                          ),
                          selectedTokens.tokenA.decimals
                        )
                      ),
                      Number(selectedTokens.tokenA.decimals)
                    ) +
                      " " +
                      selectedTokens.tokenA.tokenSymbol}
                  </span>
                </div>
                <div className="flex w-full flex-row justify-between">
                  <div className="flex">{t("swapPage.transactionCost")}</div>
                  <span className="text-dark-500">{swapGasFee}</span>
                </div>
                <div className="flex w-full flex-row justify-between">
                  <div className="flex">{t("swapPage.route")}</div>
                  <div className="flex items-center gap-[3px] rounded-lg bg-gray-500 px-[8px] py-[2px]">
                    <HubIcon /> <span className="text-dark-500">{t("swapPage.assetHub")}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <SwapSelectTokenModal
          open={tokenSelectionModal === TokenSelection.TokenA}
          title={t("modal.selectToken")}
          tokensData={availablePoolTokenA}
          onClose={() => setTokenSelectionModal(TokenSelection.None)}
          onSelect={(tokenData) => {
            setTokenSelected({ tokenSelected: TokenPosition.tokenA });
            onSwapSelectModal(tokenData);
          }}
          selected={selectedTokens.tokenA}
        />

        <SwapSelectTokenModal
          open={tokenSelectionModal === TokenSelection.TokenB}
          title={t("modal.selectToken")}
          tokensData={availablePoolTokenB}
          onClose={() => setTokenSelectionModal(TokenSelection.None)}
          onSelect={(tokenData) => {
            setTokenSelected({ tokenSelected: TokenPosition.tokenB });
            onSwapSelectModal(tokenData);
          }}
          selected={selectedTokens.tokenB}
        />
        <ReviewTransactionModal
          open={reviewModalOpen}
          title={t("modal.swap.reviewSwap")}
          priceImpact={priceImpact}
          swapGasFee={swapGasFee}
          transactionType={TransactionTypes.swap}
          inputValueA={selectedTokenAValue.tokenValue}
          inputValueB={selectedTokenBValue.tokenValue}
          spotPriceA={assetTokenASpotPrice}
          spotPriceB={assetTokenBSpotPrice}
          tokenDecimalsA={selectedTokens.tokenA.decimals}
          tokenDecimalsB={selectedTokens.tokenB.decimals}
          tokenValueA={
            inputEdited.inputType === InputEditedType.exactIn
              ? selectedTokenBValue.tokenValue
              : selectedTokenAValue.tokenValue
          }
          tokenValueB={
            inputEdited.inputType === InputEditedType.exactIn
              ? formatDecimalsFromToken(
                  formatInputTokenValue(tokenBValueForSwap.tokenValue, selectedTokens.tokenB.decimals),
                  selectedTokens.tokenB.decimals
                )
              : formatDecimalsFromToken(
                  formatInputTokenValue(tokenAValueForSwap.tokenValue, selectedTokens.tokenA.decimals),
                  selectedTokens.tokenA.decimals
                )
          }
          tokenSymbolA={selectedTokens.tokenA.tokenSymbol}
          tokenSymbolB={selectedTokens.tokenB.tokenSymbol}
          onClose={() => {
            setReviewModalOpen(false);
          }}
          inputType={inputEdited.inputType}
          onConfirmTransaction={() => {
            handleSwap().then();
          }}
        />
      </div>
      <WarningMessage show={lowTradingMinimum} message={t("pageError.tradingMinimum")} />
      <WarningMessage
        show={lowMinimalAmountAssetToken}
        message={t("pageError.lowMinimalAmountAssetToken", {
          tokenSymbol: selectedTokens.tokenB.tokenSymbol,
          minimalAmount: minimumBalanceAssetToken,
        })}
      />
      <WarningMessage
        show={tooManyDecimalsError.isError}
        message={t("pageError.tooManyDecimals", {
          token: tooManyDecimalsError.tokenSymbol,
          decimals: tooManyDecimalsError.decimalsAllowed,
        })}
      />
      <WarningMessage show={liquidityLow} message={t("pageError.lowLiquidity")} />
      <WarningMessage show={isTokenCanNotCreateWarningSwap} message={t("pageError.tokenCanNotCreateWarning")} />
      <WarningMessage
        show={isTransactionTimeout}
        message={t("pageError.transactionTimeout", {
          url: `${assethubSubscanUrl}/account${nativeTokenSymbol == "WND" ? "s" : ""}/${selectedAccount.address}`,
        })}
      />
      <WarningMessage show={isMaxValueLessThenMinAmount} message={t("pageError.maxValueLessThanMinAmount")} />
    </div>
  );
};

export default SwapTokens;
