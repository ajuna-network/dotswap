import Decimal from "decimal.js";
import { t } from "i18next";
import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import { SWAP_ROUTE } from "../../../app/router/routes";
import { InputEditedProps, TokenDecimalsErrorProps } from "../../../app/types";
import { ActionType, ButtonVariants, InputEditedType, ToasterType, TransactionTypes } from "../../../app/types/enum";
import {
  calculateSlippageReduce,
  checkIfPoolAlreadyExists,
  convertToBaseUnit,
  formatDecimalsFromToken,
  formatInputTokenValue,
  getAssetTokenSpotPrice,
} from "../../../app/util/helper";
import BackArrow from "../../../assets/img/back-arrow.svg?react";
import { LottieMedium } from "../../../assets/loader";
import { addLiquidity, checkAddPoolLiquidityGasFee, getPoolReserves } from "../../../services/poolServices";
import { getAssetTokenFromNativeToken, getNativeTokenFromAssetToken } from "../../../services/tokenServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button";
import WarningMessage from "../../atom/WarningMessage";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import CreatePool from "../CreatePool";
import PoolSelectTokenModal from "../PoolSelectTokenModal";
import ReviewTransactionModal from "../ReviewTransactionModal";
import { SwapOrPools } from "../../../app/types/enum";
import { urlTo } from "../../../app/util/helper";
import TokenIcon from "../../atom/TokenIcon";
import SlippageControl from "../../molecule/SlippageControl/SlippageControl";
import { formatNumberEnUs, isApiAvailable } from "../../../app/util/helper";
import classNames from "classnames";
import ArrowDownIcon from "../../../assets/img/down-arrow.svg?react";
import HubIcon from "../../../assets/img/asset-hub-icon.svg?react";
import dotAcpToast from "../../../app/util/toast";

type AssetTokenProps = {
  tokenSymbol: string;
  assetTokenId: string;
  decimals: string;
  assetTokenBalance: string;
};
type NativeTokenProps = {
  nativeTokenSymbol: string;
  nativeTokenDecimals: string;
  tokenId: string;
  tokenBalance: string;
};
type TokenValueProps = {
  tokenValue: string;
};

type AddPoolLiquidityProps = {
  tokenBId?: { id: string };
};

const AddPoolLiquidity: FC<AddPoolLiquidityProps> = ({ tokenBId }) => {
  const { state, dispatch } = useAppContext();
  const { assethubSubscanUrl } = useGetNetwork();

  const navigate = useNavigate();
  const params = tokenBId ? tokenBId : useParams();

  const {
    tokenBalances,
    api,
    selectedAccount,
    pools,
    poolGasFee,
    addLiquidityGasFee,
    addLiquidityLoading,
    assetLoading,
    isTokenCanNotCreateWarningPools,
  } = state;

  const [selectedTokenA, setSelectedTokenA] = useState<NativeTokenProps>({
    nativeTokenSymbol: "",
    nativeTokenDecimals: "",
    tokenId: "",
    tokenBalance: "",
  });
  const [selectedTokenB, setSelectedTokenB] = useState<AssetTokenProps>({
    tokenSymbol: "",
    assetTokenId: "",
    decimals: "",
    assetTokenBalance: "",
  });
  const [selectedTokenNativeValue, setSelectedTokenNativeValue] = useState<TokenValueProps>();
  const [selectedTokenAssetValue, setSelectedTokenAssetValue] = useState<TokenValueProps>();
  const [nativeTokenWithSlippage, setNativeTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: "" });
  const [assetTokenWithSlippage, setAssetTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: "" });
  const [slippageAuto, setSlippageAuto] = useState<boolean>(true);
  const [slippageValue, setSlippageValue] = useState<number>(1);
  const [inputEdited, setInputEdited] = useState<InputEditedProps>({ inputType: InputEditedType.exactIn });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [poolExists, setPoolExists] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [tooManyDecimalsError, setTooManyDecimalsError] = useState<TokenDecimalsErrorProps>({
    tokenSymbol: "",
    isError: false,
    decimalsAllowed: 0,
  });

  const [isTransactionTimeout, setIsTransactionTimeout] = useState<boolean>(false);
  const [waitingForTransaction, setWaitingForTransaction] = useState<NodeJS.Timeout>();
  const [assetBPriceOfOneAssetA, setAssetBPriceOfOneAssetA] = useState<string>("");
  const [priceImpact, setPriceImpact] = useState<string>("");

  const selectedNativeTokenNumber = new Decimal(selectedTokenNativeValue?.tokenValue || 0);
  const selectedAssetTokenNumber = new Decimal(selectedTokenAssetValue?.tokenValue || 0);

  const [poolInfo, setPoolInfo] = useState(false);

  const navigateToPools = () => {
    navigate(urlTo("/" + SWAP_ROUTE), {
      state: { pageType: SwapOrPools.pools },
    });
  };

  const populateAssetToken = () => {
    pools?.forEach((pool: any) => {
      if (pool?.[0]?.[1]?.interior?.X2) {
        if (pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "").toString() === params?.id) {
          if (params?.id) {
            const tokenAlreadySelected = tokenBalances?.assets?.find((token: any) => {
              if (params?.id) {
                return token.tokenId === params?.id.toString();
              }
            });
            if (tokenAlreadySelected) {
              setSelectedTokenB({
                tokenSymbol: tokenAlreadySelected.assetTokenMetadata?.symbol,
                assetTokenId: params?.id,
                decimals: tokenAlreadySelected.assetTokenMetadata?.decimals,
                assetTokenBalance: tokenAlreadySelected.tokenAsset?.balance,
              });
            }
          }
        }
      }
    });
  };

  const handlePool = async () => {
    const isApiReady = api && (await isApiAvailable(api));
    if (!isApiReady) {
      dotAcpToast.error(t("error.api.notReady"), undefined, null);
      return;
    }
    if (!tokenBalances) return;
    setReviewModalOpen(false);
    if (waitingForTransaction) {
      clearTimeout(waitingForTransaction);
    }
    setIsTransactionTimeout(false);
    if (api && selectedTokenNativeValue && selectedTokenAssetValue && tokenBalances) {
      const nativeTokenValue = formatInputTokenValue(selectedNativeTokenNumber, selectedTokenA?.nativeTokenDecimals)
        .toLocaleString()
        ?.replace(/[, ]/g, "");

      const assetTokenValue = formatInputTokenValue(selectedAssetTokenNumber, selectedTokenB.decimals)
        .toLocaleString()
        ?.replace(/[, ]/g, "");

      dispatch({
        type: ActionType.REMOVE_NOTIFICATION,
        payload: "liquidity",
      });
      dispatch({
        type: ActionType.ADD_NOTIFICATION,
        payload: {
          id: "liquidity",
          notificationModalOpen: true,
          notificationAction: t("modal.notifications.addLiquidity"),
          notificationType: ToasterType.PENDING,
          notificationPercentage: 15,
          notificationTitle: t("modal.notifications.addLiquidity"),
          notificationMessage: t("modal.notifications.proceed"),
          notificationChainDetails: null,
          notificationTransactionDetails: {
            fromToken: {
              symbol: selectedTokenA.nativeTokenSymbol,
              amount: parseFloat(selectedTokenNativeValue?.tokenValue),
            },
            toToken: {
              symbol: selectedTokenB.tokenSymbol,
              amount: parseFloat(selectedTokenAssetValue?.tokenValue),
            },
          },
          notificationLink: null,
        },
      });

      try {
        await addLiquidity(
          api,
          selectedTokenB.assetTokenId,
          selectedAccount,
          nativeTokenValue,
          assetTokenValue,
          nativeTokenWithSlippage.tokenValue.toString(),
          assetTokenWithSlippage.tokenValue.toString(),
          selectedTokenA.nativeTokenDecimals,
          selectedTokenB.decimals,
          tokenBalances,
          dispatch
        );
      } catch (error) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "liquidity",
            props: {
              notificationType: ToasterType.ERROR,
              notificationPercentage: null,
              notificationTitle: t("modal.notifications.error"),
              notificationMessage: `Transaction failed: ${error}`,
              notificationLink: null,
            },
          },
        });
      }
    }
  };

  const handleAddPoolLiquidityGasFee = async () => {
    if (api && selectedTokenNativeValue && selectedTokenAssetValue) {
      const nativeTokenValue = formatInputTokenValue(selectedNativeTokenNumber, selectedTokenA?.nativeTokenDecimals);

      const assetTokenValue = formatInputTokenValue(selectedAssetTokenNumber, selectedTokenB.decimals);

      await checkAddPoolLiquidityGasFee(
        api,
        selectedTokenB.assetTokenId,
        selectedAccount,
        nativeTokenValue,
        assetTokenValue,
        nativeTokenWithSlippage.tokenValue.toString(),
        assetTokenWithSlippage.tokenValue.toString(),
        dispatch
      );
    }
  };

  const getPriceOfAssetTokenFromNativeToken = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokenA?.nativeTokenDecimals);

      const assetTokenPrice = await getAssetTokenFromNativeToken(api, selectedTokenB?.assetTokenId, valueWithDecimals);

      if (assetTokenPrice && slippageValue) {
        const assetTokenNoSemicolons = assetTokenPrice.toString()?.replace(/[, ]/g, "");

        const assetTokenNoDecimals = formatDecimalsFromToken(assetTokenNoSemicolons, selectedTokenB?.decimals);

        const tokenWithSlippage = calculateSlippageReduce(assetTokenNoDecimals, slippageValue);
        const tokenWithSlippageFormatted = formatInputTokenValue(tokenWithSlippage, selectedTokenB?.decimals);

        setSelectedTokenAssetValue({ tokenValue: assetTokenNoDecimals });
        setAssetTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      }
    }
  };

  const getPriceOfNativeTokenFromAssetToken = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokenB?.decimals);

      const nativeTokenPrice = await getNativeTokenFromAssetToken(api, selectedTokenB?.assetTokenId, valueWithDecimals);

      if (nativeTokenPrice && slippageValue) {
        const nativeTokenNoSemicolons = nativeTokenPrice.toString()?.replace(/[, ]/g, "");

        const nativeTokenNoDecimals = formatDecimalsFromToken(
          nativeTokenNoSemicolons,
          selectedTokenA?.nativeTokenDecimals
        );

        const tokenWithSlippage = calculateSlippageReduce(nativeTokenNoDecimals, slippageValue);
        const tokenWithSlippageFormatted = formatInputTokenValue(
          tokenWithSlippage,
          selectedTokenA?.nativeTokenDecimals
        );

        setSelectedTokenNativeValue({ tokenValue: nativeTokenNoDecimals.toString() });
        setNativeTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      }
    }
  };

  const setSelectedTokenAValue = (value: string) => {
    setInputEdited({ inputType: InputEditedType.exactIn });
    if (slippageValue && value !== "") {
      value = new Decimal(value).toFixed();
      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokenA.nativeTokenDecimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokenA.nativeTokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokenA.nativeTokenDecimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      const nativeTokenSlippageValue = calculateSlippageReduce(value, slippageValue);
      const tokenWithSlippageFormatted = formatInputTokenValue(
        nativeTokenSlippageValue,
        selectedTokenA?.nativeTokenDecimals
      );
      setSelectedTokenNativeValue({ tokenValue: value });
      setNativeTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      getPriceOfAssetTokenFromNativeToken(value);
    } else {
      setSelectedTokenAssetValue({ tokenValue: "" });
    }
  };

  const setSelectedTokenBValue = (value: string) => {
    setInputEdited({ inputType: InputEditedType.exactOut });
    if (slippageValue && value !== "") {
      value = new Decimal(value).toFixed();
      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokenB.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokenB.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokenB.decimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      const assetTokenSlippageValue = calculateSlippageReduce(value, slippageValue);
      const tokenWithSlippageFormatted = formatInputTokenValue(assetTokenSlippageValue, selectedTokenB?.decimals);
      setSelectedTokenAssetValue({ tokenValue: value });
      setAssetTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      getPriceOfNativeTokenFromAssetToken(value);
    } else {
      setSelectedTokenNativeValue({ tokenValue: "" });
    }
  };

  const getButtonProperties = useMemo(() => {
    if (tokenBalances?.assets) {
      if (selectedTokenA.nativeTokenSymbol === "" || selectedTokenB.assetTokenId === "") {
        return { label: t("button.selectToken"), disabled: true };
      }

      if (
        selectedNativeTokenNumber.lte(0) ||
        selectedAssetTokenNumber.lte(0) ||
        selectedTokenNativeValue?.tokenValue === "" ||
        selectedTokenAssetValue?.tokenValue === ""
      ) {
        return { label: t("button.enterAmount"), disabled: true };
      }

      if (selectedNativeTokenNumber.gt(selectedTokenA.tokenBalance)) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokenA.nativeTokenSymbol }),
          disabled: true,
        };
      }

      const fee = convertToBaseUnit(poolGasFee);
      if (selectedNativeTokenNumber.plus(fee).gt(selectedTokenA.tokenBalance)) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokenA.nativeTokenSymbol }),
          disabled: true,
        };
      }

      const assetTokenBalance = new Decimal(selectedTokenB.assetTokenBalance?.replace(/[, ]/g, ""));
      const assetTokenBalanceFormatted = formatDecimalsFromToken(assetTokenBalance, selectedTokenB.decimals);
      if (selectedAssetTokenNumber.gt(assetTokenBalanceFormatted)) {
        return { label: t("button.insufficientTokenAmount", { token: selectedTokenB.tokenSymbol }), disabled: true };
      }

      if (selectedNativeTokenNumber.gt(0) && selectedAssetTokenNumber.gt(0) && !tooManyDecimalsError.isError) {
        return { label: t("button.deposit"), disabled: false };
      }

      if (selectedNativeTokenNumber.gt(0) && selectedAssetTokenNumber.gt(0) && tooManyDecimalsError.isError) {
        return { label: t("button.deposit"), disabled: true };
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: t("button.enterAmount"), disabled: true };
  }, [
    selectedTokenA.nativeTokenDecimals,
    selectedTokenB.assetTokenBalance,
    selectedTokenA.nativeTokenSymbol,
    selectedTokenB.tokenSymbol,
    selectedTokenB.decimals,
    selectedTokenNativeValue?.tokenValue,
    selectedTokenAssetValue?.tokenValue,
    tooManyDecimalsError.isError,
    tokenBalances,
  ]);

  const calculatePriceImpact = async () => {
    if (api) {
      if (selectedTokenNativeValue?.tokenValue !== "" && selectedTokenAssetValue?.tokenValue !== "") {
        const poolSelected: any = pools?.find(
          (pool: any) =>
            pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "") === selectedTokenB.assetTokenId
        );
        if (poolSelected && selectedTokenNativeValue?.tokenValue && selectedTokenAssetValue?.tokenValue) {
          const poolReserve: any = await getPoolReserves(
            api,
            poolSelected?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "")
          );

          const assetTokenReserve = formatDecimalsFromToken(
            poolReserve?.[1]?.replace(/[, ]/g, ""),
            selectedTokenB.decimals
          );

          const nativeTokenReserve = formatDecimalsFromToken(
            poolReserve?.[0]?.replace(/[, ]/g, ""),
            selectedTokenA.nativeTokenDecimals
          );

          const priceBeforeSwap = new Decimal(nativeTokenReserve).div(assetTokenReserve);

          const priceOfAssetBForOneAssetA = new Decimal(assetTokenReserve).div(nativeTokenReserve);
          setAssetBPriceOfOneAssetA(priceOfAssetBForOneAssetA.toFixed(5));

          const valueA = new Decimal(selectedTokenNativeValue?.tokenValue).add(nativeTokenReserve);
          const valueB = new Decimal(assetTokenReserve).minus(selectedTokenAssetValue?.tokenValue);

          const priceAfterSwap = valueA.div(valueB);

          const priceImpact = new Decimal(1).minus(priceBeforeSwap.div(priceAfterSwap));

          setPriceImpact(priceImpact.mul(100).toFixed(2));
        }
      }
    }
  };

  useEffect(() => {
    calculatePriceImpact().then();
  }, [selectedTokenB.tokenSymbol, selectedTokenAssetValue?.tokenValue, selectedTokenNativeValue?.tokenValue]);

  useEffect(() => {
    if (tokenBalances) {
      setSelectedTokenA({
        nativeTokenSymbol: tokenBalances.tokenSymbol,
        nativeTokenDecimals: tokenBalances.tokenDecimals,
        tokenId: "",
        tokenBalance: new Decimal(tokenBalances?.balanceAsset?.free || 0)
          .minus(tokenBalances?.balanceAsset?.frozen || 0)
          .toString(),
      });
    }
  }, [tokenBalances]);

  useEffect(() => {
    if (Number(nativeTokenWithSlippage.tokenValue) > 0 && Number(assetTokenWithSlippage.tokenValue) > 0) {
      handleAddPoolLiquidityGasFee().then();
    }
  }, [nativeTokenWithSlippage.tokenValue, assetTokenWithSlippage.tokenValue]);

  useEffect(() => {
    dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
  }, []);

  useEffect(() => {
    if (params?.id && tokenBalances) {
      populateAssetToken();
    }
  }, [params?.id, tokenBalances]);

  useEffect(() => {
    if (
      selectedTokenNativeValue &&
      inputEdited.inputType === InputEditedType.exactIn &&
      selectedNativeTokenNumber.gt(0)
    ) {
      setSelectedTokenAValue(selectedTokenNativeValue.tokenValue);
    } else if (
      selectedTokenAssetValue &&
      inputEdited.inputType === InputEditedType.exactOut &&
      selectedAssetTokenNumber.gt(0)
    ) {
      setSelectedTokenBValue(selectedTokenAssetValue.tokenValue);
    }
  }, [slippageValue]);

  useEffect(() => {
    if (tokenBId?.id) {
      const checkPoolExists = checkIfPoolAlreadyExists(tokenBId.id, pools);
      setPoolExists(checkPoolExists);
    }
  }, [tokenBId?.id]);

  useEffect(() => {
    if (tokenBId?.id) {
      const checkPoolExists = checkIfPoolAlreadyExists(selectedTokenB.assetTokenId, pools);
      setPoolExists(checkPoolExists);
    }
  }, [selectedTokenB.assetTokenId]);

  useEffect(() => {
    if (Object.keys(selectedAccount).length === 0) {
      navigateToPools();
    }
  }, [selectedAccount]);

  useEffect(() => {
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS, payload: false });
  }, [selectedTokenB.assetTokenId, selectedTokenNativeValue, selectedTokenAssetValue]);

  useEffect(() => {
    if (addLiquidityLoading) {
      setWaitingForTransaction(
        setTimeout(() => {
          if (addLiquidityLoading) {
            setIsTransactionTimeout(true);
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
          }
        }, 180000)
      ); // 3 minutes 180000
    } else {
      if (waitingForTransaction) {
        clearTimeout(waitingForTransaction);
      }
    }
  }, [addLiquidityLoading]);

  const [assetTokenBSpotPrice, setAssetTokenBSpotPrice] = useState<string>("0");

  useEffect(() => {
    if (!tokenBalances || !api) return;
    getAssetTokenSpotPrice(api, selectedTokenB.assetTokenId, selectedTokenB.decimals, tokenBalances).then((price) => {
      if (price) setAssetTokenBSpotPrice(price);
    });
  }, [api, tokenBalances, selectedTokenB.assetTokenId]);

  return (
    <div className="flex max-w-[460px] flex-col gap-4">
      {tokenBId?.id && poolExists === false ? (
        <CreatePool tokenBSelected={selectedTokenB} />
      ) : (
        <div className="relative flex w-full flex-col items-center gap-1.5 rounded-2xl bg-white p-5 dark:rounded-sm dark:border-8 dark:border-black dark:bg-opacity-80">
          <div className="grid w-full grid-cols-4">
            <button className="col-span-1 flex justify-start" onClick={navigateToPools}>
              <BackArrow width={24} height={24} />
            </button>
            <h3 className="heading-6 col-span-2 flex justify-center font-unbounded-variable font-normal dark:font-omnes-bold dark:text-lg">
              {t("poolsPage.addLiquidity")}
            </h3>
            <div className="col-span-1 flex justify-end">
              <SlippageControl
                slippageValue={slippageValue}
                setSlippageValue={setSlippageValue}
                slippageAuto={slippageAuto}
                setSlippageAuto={setSlippageAuto}
                loadingState={assetLoading}
                poolExists={poolExists}
              />
            </div>
          </div>
          <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50" />
          <TokenAmountInput
            tokenText={selectedTokenA?.nativeTokenSymbol}
            tokenIcon={<TokenIcon tokenSymbol={selectedTokenA.nativeTokenSymbol} width="24" height="24" />}
            showUSDValue={selectedTokenA.tokenBalance !== undefined && selectedTokenA.tokenBalance !== ""}
            spotPrice={selectedTokenA.tokenId !== "" ? "" : tokenBalances?.spotPrice}
            tokenBalance={selectedTokenA.tokenBalance}
            tokenId={selectedTokenA.tokenId}
            tokenDecimals={selectedTokenA.nativeTokenDecimals}
            tokenValue={selectedTokenNativeValue?.tokenValue}
            onClick={() => null}
            onSetTokenValue={(value) => setSelectedTokenAValue(value)}
            selectDisabled={true}
            disabled={addLiquidityLoading}
            assetLoading={assetLoading}
          />
          <TokenAmountInput
            tokenText={selectedTokenB?.tokenSymbol}
            tokenIcon={<TokenIcon tokenSymbol={selectedTokenB.tokenSymbol} width="24" height="24" />}
            showUSDValue={selectedTokenB.assetTokenBalance !== undefined && selectedTokenB.assetTokenBalance !== ""}
            spotPrice={selectedTokenB?.assetTokenId !== "" ? assetTokenBSpotPrice : tokenBalances?.spotPrice}
            tokenBalance={selectedTokenB.assetTokenBalance ? selectedTokenB.assetTokenBalance : "0"}
            tokenId={selectedTokenB.assetTokenId}
            tokenDecimals={selectedTokenB.decimals}
            tokenValue={selectedTokenAssetValue?.tokenValue}
            onClick={() => setIsModalOpen(true)}
            onSetTokenValue={(value) => setSelectedTokenBValue(value)}
            selectDisabled={!tokenBId?.id}
            disabled={addLiquidityLoading}
            assetLoading={assetLoading}
          />

          <Button
            onClick={() => (getButtonProperties.disabled ? null : setReviewModalOpen(true))}
            variant={ButtonVariants.btnInteractivePink}
            disabled={getButtonProperties.disabled || addLiquidityLoading}
          >
            {addLiquidityLoading ? <LottieMedium /> : getButtonProperties.label}
          </Button>

          {selectedTokenNativeValue?.tokenValue && selectedTokenAssetValue?.tokenValue && (
            <>
              <div
                className={classNames(
                  "translate-all easy-and-out flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-2 py-4 text-medium font-normal text-dark-450 duration-300 dark:rounded-sm dark:font-open-sans dark:font-bold",
                  {
                    "h-[52px]": !poolInfo,
                    "h-[185px]": poolInfo,
                  }
                )}
              >
                <div className="flex w-full flex-row text-medium font-normal">
                  <div className="flex w-full items-center justify-between dark:font-extrabold">
                    <span>
                      1 {selectedTokenA.nativeTokenSymbol} ={" "}
                      {formatNumberEnUs(Number(assetBPriceOfOneAssetA), Number(selectedTokenB.decimals))}{" "}
                      {selectedTokenB.tokenSymbol}
                    </span>
                    <button onClick={() => setPoolInfo(!poolInfo)} className="relative z-10">
                      {
                        <ArrowDownIcon
                          className={classNames("transform transition-transform duration-300", {
                            "rotate-[-180deg]": poolInfo,
                          })}
                        />
                      }
                    </button>
                  </div>
                </div>
                <div
                  className={classNames("translate-all easy-and-out flex flex-col justify-between gap-2 duration-300", {
                    "bottom-[-170px] opacity-0": !poolInfo,
                    "top-[150px] opacity-100": poolInfo,
                  })}
                >
                  <div className="flex w-full flex-row justify-between">
                    <div className="flex">{t("poolsPage.priceImpact")}</div>
                    <span className="text-dark-500">~ {priceImpact}%</span>
                  </div>
                  <div className="flex w-full flex-row justify-between">
                    <div className="flex">
                      {inputEdited.inputType === InputEditedType.exactIn
                        ? `${t("poolsPage.minimumDeposited")} (${selectedTokenA.nativeTokenSymbol})`
                        : `${t("poolsPage.maximumDeposited")} (${selectedTokenA.nativeTokenSymbol})`}
                    </div>
                    <span className="text-dark-500">
                      {inputEdited.inputType === InputEditedType.exactIn
                        ? formatNumberEnUs(
                            Number(
                              formatDecimalsFromToken(
                                nativeTokenWithSlippage?.tokenValue,
                                selectedTokenA.nativeTokenDecimals
                              )
                            ),
                            Number(selectedTokenA.nativeTokenDecimals)
                          ) +
                          " " +
                          selectedTokenA.nativeTokenSymbol
                        : formatNumberEnUs(
                            Number(
                              formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals)
                            ),
                            Number(selectedTokenB.decimals)
                          ) +
                          " " +
                          selectedTokenB.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex w-full flex-row justify-between">
                    <div className="flex">
                      {inputEdited.inputType === InputEditedType.exactIn
                        ? `${t("poolsPage.minimumDeposited")} (${selectedTokenB.tokenSymbol})`
                        : `${t("poolsPage.maximumDeposited")} (${selectedTokenB.tokenSymbol})`}
                    </div>
                    <span className="text-dark-500">
                      {inputEdited.inputType === InputEditedType.exactIn
                        ? formatNumberEnUs(
                            Number(
                              formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals)
                            ),
                            Number(selectedTokenB.decimals)
                          ) +
                          " " +
                          selectedTokenB.tokenSymbol
                        : formatNumberEnUs(
                            Number(
                              formatDecimalsFromToken(
                                nativeTokenWithSlippage?.tokenValue,
                                selectedTokenA.nativeTokenDecimals
                              )
                            ),
                            Number(selectedTokenA.nativeTokenDecimals)
                          ) +
                          " " +
                          selectedTokenA.nativeTokenSymbol}
                    </span>
                  </div>
                  <div className="flex w-full flex-row justify-between">
                    <div className="flex">{t("poolsPage.transactionCost")}</div>
                    <span className="text-dark-500">{addLiquidityGasFee}</span>
                  </div>
                  <div className="flex w-full flex-row justify-between">
                    <div className="flex">{t("poolsPage.route")}</div>
                    <div className="flex items-center gap-[3px] rounded-lg bg-gray-500 px-[8px] py-[2px]">
                      <HubIcon /> <span className="text-dark-500">{t("poolsPage.assetHub")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <ReviewTransactionModal
            open={reviewModalOpen}
            title="Review adding liquidity"
            transactionType={TransactionTypes.add}
            swapGasFee={addLiquidityGasFee}
            priceImpact={priceImpact}
            inputValueA={selectedTokenNativeValue ? selectedTokenNativeValue?.tokenValue : ""}
            inputValueB={selectedTokenAssetValue ? selectedTokenAssetValue?.tokenValue : ""}
            spotPriceA={selectedTokenA.tokenId !== "" ? "0" : tokenBalances?.spotPrice}
            spotPriceB={selectedTokenB?.assetTokenId !== "" ? assetTokenBSpotPrice : tokenBalances?.spotPrice}
            tokenDecimalsA={selectedTokenA.nativeTokenDecimals}
            tokenDecimalsB={selectedTokenB.decimals}
            tokenValueA={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenAssetValue?.tokenValue
                : selectedTokenNativeValue?.tokenValue
            }
            tokenValueB={
              inputEdited.inputType === InputEditedType.exactIn
                ? formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals)
                : formatDecimalsFromToken(nativeTokenWithSlippage?.tokenValue, selectedTokenA.nativeTokenDecimals)
            }
            tokenSymbolA={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenA.nativeTokenSymbol
                : selectedTokenB.tokenSymbol
            }
            tokenSymbolB={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenB.tokenSymbol
                : selectedTokenA.nativeTokenSymbol
            }
            onClose={() => {
              setReviewModalOpen(false);
            }}
            inputType={inputEdited.inputType}
            onConfirmTransaction={() => {
              handlePool().then();
            }}
          />
          <PoolSelectTokenModal
            onSelect={setSelectedTokenB}
            onClose={() => setIsModalOpen(false)}
            open={isModalOpen}
            title={t("button.selectToken")}
            selected={selectedTokenB}
          />
        </div>
      )}
      <WarningMessage
        show={tooManyDecimalsError.isError}
        message={t("pageError.tooManyDecimals", {
          token: tooManyDecimalsError.tokenSymbol,
          decimals: tooManyDecimalsError.decimalsAllowed,
        })}
      />
      <WarningMessage show={isTokenCanNotCreateWarningPools} message={t("pageError.tokenCanNotCreateWarning")} />
      <WarningMessage
        show={isTransactionTimeout}
        message={t("pageError.transactionTimeout", { url: `${assethubSubscanUrl}/account/${selectedAccount.address}` })}
      />
    </div>
  );
};

export default AddPoolLiquidity;
