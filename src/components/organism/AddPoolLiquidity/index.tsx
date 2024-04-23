import Decimal from "decimal.js";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
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
import { formatNumberEnUs } from "../../../app/util/helper";

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

const AddPoolLiquidity = ({ tokenBId }: AddPoolLiquidityProps) => {
  const { state, dispatch } = useAppContext();
  const { assethubSubscanUrl } = useGetNetwork();

  const navigate = useNavigate();
  const params = tokenBId ? tokenBId : useParams();

  const {
    tokenBalances,
    api,
    selectedAccount,
    pools,
    transferGasFeesMessage,
    poolGasFee,
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
  const [slippageValue, setSlippageValue] = useState<number>(15);
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
        type: ActionType.SET_NOTIFICATION_DATA,
        payload: {
          notificationModalOpen: true,
          notificationAction: t("modal.notifications.addLiquidity"),
          notificationType: ToasterType.PENDING,
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
        dispatch({ type: ActionType.SET_NOTIFICATION_TYPE, payload: ToasterType.ERROR });
        dispatch({ type: ActionType.SET_NOTIFICATION_TITLE, payload: t("modal.notifications.error") });
        dispatch({ type: ActionType.SET_NOTIFICATION_MESSAGE, payload: `Error: ${error}` });
        dispatch({ type: ActionType.SET_NOTIFICATION_LINK, payload: null });
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
      const assetTokenBalnceFormatted = formatDecimalsFromToken(assetTokenBalance, selectedTokenB.decimals);
      if (selectedAssetTokenNumber.gt(assetTokenBalnceFormatted)) {
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
    calculatePriceImpact();
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
      handleAddPoolLiquidityGasFee();
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
        <div className="relative flex w-full flex-col items-center gap-1.5 rounded-2xl bg-white p-5">
          <button className="absolute left-[18px] top-[18px]" onClick={navigateToPools}>
            <BackArrow width={24} height={24} />
          </button>
          <h3 className="heading-6 font-unbounded-variable font-normal">{t("poolsPage.addLiquidity")}</h3>
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
          <div className="mt-1 text-small">{transferGasFeesMessage}</div>
          <SlippageControl
            slippageValue={slippageValue}
            setSlippageValue={setSlippageValue}
            slippageAuto={slippageAuto}
            setSlippageAuto={setSlippageAuto}
            loadingState={assetLoading}
            poolExists={poolExists}
          />

          {selectedTokenNativeValue?.tokenValue && selectedTokenAssetValue?.tokenValue && (
            <>
              {" "}
              <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-2 py-4">
                <div className="flex w-full flex-row text-medium font-normal text-gray-200">
                  <span>
                    1 {selectedTokenA.nativeTokenSymbol} ={" "}
                    {formatNumberEnUs(Number(assetBPriceOfOneAssetA), Number(selectedTokenB.decimals))}{" "}
                    {selectedTokenB.tokenSymbol}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-4 py-6">
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200">
                  <div className="flex">Price impact</div>
                  <span>~ {priceImpact}%</span>
                </div>
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200">
                  <div className="flex">
                    {inputEdited.inputType === InputEditedType.exactIn ? "Expected output" : "Expected input"}
                  </div>
                  <span>
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? formatNumberEnUs(Number(selectedTokenAssetValue.tokenValue), Number(selectedTokenB.decimals)) +
                        " " +
                        selectedTokenB.tokenSymbol
                      : formatNumberEnUs(
                          Number(selectedTokenNativeValue.tokenValue),
                          Number(selectedTokenA.nativeTokenDecimals)
                        ) +
                        " " +
                        selectedTokenA.nativeTokenSymbol}
                  </span>
                </div>
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200">
                  <div className="flex">
                    {inputEdited.inputType === InputEditedType.exactIn ? "Minimum output" : "Maximum input"}
                  </div>
                  <span>
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? formatNumberEnUs(
                          Number(formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals)),
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
              </div>
            </>
          )}
          <Button
            onClick={() => (getButtonProperties.disabled ? null : setReviewModalOpen(true))}
            variant={ButtonVariants.btnInteractivePink}
            disabled={getButtonProperties.disabled || addLiquidityLoading}
          >
            {addLiquidityLoading ? <LottieMedium /> : getButtonProperties.label}
          </Button>
          <ReviewTransactionModal
            open={reviewModalOpen}
            title="Review adding liquidity"
            transactionType={TransactionTypes.add}
            priceImpact={priceImpact}
            inputValueA={selectedTokenNativeValue ? selectedTokenNativeValue?.tokenValue : ""}
            inputValueB={selectedTokenAssetValue ? selectedTokenAssetValue?.tokenValue : ""}
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
              handlePool();
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
