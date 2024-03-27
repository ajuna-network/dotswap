import { useEffect, useState, useMemo } from "react";
import Decimal from "decimal.js";
import { ButtonVariants } from "../../../app/types/enum";
import Button from "../../atom/Button";
import CrossChainBtnIcon from "../../../assets/img/cross-chain-button.svg?react";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import DotToken from "../../../assets/img/dot-token.svg?react";
import AssetHub from "../../../assets/img/asset-hub.svg?react";
import { TokenProps, TokenDecimalsErrorProps } from "../../../app/types";
import { t } from "i18next";
import SwapSelectTokenModal from "../SwapSelectTokenModal";
import { ActionType, TokenSelection, CrosschainTransactionTypes } from "../../../app/types/enum";
import { useAppContext } from "../../../state";
import { LottieMedium } from "../../../assets/loader";
import DestinationWalletAddress from "../../molecule/DestinationWalletAddress";
import CrosschainReviewTransactionModal from "../CrosschainReviewTransactionModal";
import {
  formatDecimalsFromToken,
  formatInputTokenValue,
  getCrossInFees,
  getCrossOutFees,
} from "../../../app/util/helper";
import { fetchRelayBalance, fetchAssetHubBalance } from "../../../services/polkadotWalletServices";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import TokenIcon from "../../atom/TokenIcon";
import { executeCrossIn, executeCrossOut } from "../../../services/crosschain";

type CrossChainSwapProps = {
  isPopupEdit?: boolean;
};

type TokenValueProps = {
  tokenValue: string;
};

const CrossChainSwap = ({ isPopupEdit = true }: CrossChainSwapProps) => {
  const { rpcUrlRelay } = useGetNetwork();

  const { state, dispatch } = useAppContext();

  const {
    tokenBalances,
    api,
    selectedAccount,
    // crosschainFinalized,
    crosschainExactTokenAmount,
    crosschainOriginChainFee,
    crosschainDestinationChainFee,
    crosschainDestinationWalletAddress,
    crosschainLoading,
    crosschainSelectedChain,
    assetLoading,
  } = state;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenProps>({
    tokenSymbol: "",
    tokenId: "0",
    decimals: "",
    tokenBalance: "",
  });

  const selectedChain = crosschainSelectedChain;

  useEffect(() => {
    setSelectedToken({
      tokenSymbol: "",
      tokenId: "0",
      decimals: "",
      tokenBalance: "",
    });

    handleTokenValueChange("");
  }, [api]);

  useEffect(() => {
    if (!crosschainDestinationWalletAddress || !tokenBalances || !tokenBalances.tokenDecimals || !api) return;
    if (selectedChain.chainA.chainName !== "" && selectedChain.chainB.chainName !== "") return;

    const fetchData = async () => {
      try {
        const [chainA, chainB] = await Promise.all([
          fetchAssetHubBalance(api),
          fetchRelayBalance(crosschainDestinationWalletAddress, tokenBalances.tokenDecimals.toString(), rpcUrlRelay),
        ]);

        if (!chainA || !chainB) return;

        dispatch({
          type: ActionType.SET_CROSSCHAIN_SELECTED_CHAIN,
          payload: {
            chainA: chainA,
            chainB: chainB.chainB,
            balance: chainB.balance,
          },
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [crosschainDestinationWalletAddress, tokenBalances, api]);

  const handleChainSwitch = () => {
    handleTokenValueChange("");
    dispatch({
      type: ActionType.SET_CROSSCHAIN_SELECTED_CHAIN,
      payload: {
        chainA: selectedChain.chainB,
        chainB: selectedChain.chainA,
        balance: selectedChain.balance,
      },
    });
  };

  const nativeToken = {
    tokenId: "",
    assetTokenMetadata: {
      symbol: tokenBalances?.tokenSymbol,
      name: tokenBalances?.tokenSymbol,
      decimals: tokenBalances?.tokenDecimals,
    },
    tokenAsset: {
      balance: tokenBalances?.balance,
    },
  };

  const [tokenSelectionModal, setTokenSelectionModal] = useState<TokenSelection>(TokenSelection.None);
  const [availablePoolToken, setAvailablePoolToken] = useState<TokenProps[]>([]);

  const getTokenA = async () => {
    if (api) {
      const assetTokens = [nativeToken];
      setAvailablePoolToken(assetTokens as any);
    }
  };

  const tokenValue = async (value?: string) => {
    if (value) {
      value = new Decimal(value).toFixed();

      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedToken.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedToken.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedToken.decimals),
          });
          return value;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      setSelectedTokenValue({ tokenValue: value });
      return value;
    } else {
      setSelectedTokenValue({ tokenValue: "" });
      return "";
    }
  };

  const fillTokenPairsAndOpenModal = (tokenInputSelected: TokenSelection) => {
    if (tokenInputSelected === "tokenA") getTokenA();
    setTokenSelectionModal(tokenInputSelected);
  };

  const tokenSelectModal = (tokenData: any) => {
    setSelectedToken((prev) => {
      return {
        ...prev,
        [tokenSelectionModal]: tokenData,
      };
    });
  };

  const [tooManyDecimalsError, setTooManyDecimalsError] = useState<TokenDecimalsErrorProps>({
    tokenSymbol: "",
    isError: false,
    decimalsAllowed: 0,
  });

  const [selectedTokenValue, setSelectedTokenValue] = useState<TokenValueProps>({ tokenValue: "" });

  const getCrosschainButtonProperties = useMemo(() => {
    const tokenBalanceDecimal = new Decimal(
      selectedChain.chainA.chainType !== "Asset Hub" ? selectedChain.balance : tokenBalances?.balance || 0
    );
    const tokenDecimals = new Decimal(selectedTokenValue.tokenValue || 0);
    if (tokenBalances?.assets) {
      if (selectedToken.tokenSymbol === "") {
        return { label: t("button.selectToken"), disabled: true };
      }
      if (tokenDecimals.lte(0) || crosschainExactTokenAmount === "") {
        return { label: t("button.enterAmount"), disabled: true };
      }
      if (
        selectedToken.tokenSymbol === nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.gt(tokenBalanceDecimal)
      ) {
        return {
          label: t("button.insufficientTokenAmount", { token: nativeToken.assetTokenMetadata.symbol }),
          disabled: true,
        };
      }
      if (
        selectedToken.tokenSymbol !== nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.gt(
          formatDecimalsFromToken(selectedToken.tokenBalance.replace(/[, ]/g, ""), selectedToken.decimals)
        )
      ) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedToken.tokenSymbol }),
          disabled: true,
        };
      }
      if (
        selectedToken.tokenSymbol === nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.lt(tokenBalanceDecimal) &&
        !tooManyDecimalsError.isError
      ) {
        return {
          label: t(`button.${selectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
      if (
        selectedToken.tokenSymbol !== nativeToken.assetTokenMetadata.symbol &&
        tokenDecimals.gt(0) &&
        !tooManyDecimalsError.isError
      ) {
        return {
          label: t(`button.${selectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
      if (tokenDecimals.gt(0) && !tooManyDecimalsError.isError) {
        return {
          label: t(`button.${selectedChain.chainA.chainType !== "Relay Chain" ? "crossIn" : "crossOut"}`),
          disabled: false,
        };
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: t("button.selectToken"), disabled: true };
  }, [
    selectedAccount?.address,
    tooManyDecimalsError.isError,
    tokenBalances?.balance,
    selectedToken.decimals,
    selectedToken.tokenBalance,
    selectedToken.tokenSymbol,
    crosschainExactTokenAmount,
  ]);

  useEffect(() => {
    if (Object.keys(selectedAccount).length === 0) {
      setSelectedTokenValue({ tokenValue: "" });
      setSelectedToken({
        tokenSymbol: "",
        tokenId: "0",
        decimals: "",
        tokenBalance: "",
      });
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (!isPopupEdit && !selectedToken.tokenSymbol && !assetLoading) {
      setSelectedToken({
        tokenSymbol: nativeToken.assetTokenMetadata.symbol || "",
        tokenId: "",
        decimals: nativeToken.assetTokenMetadata.decimals || "",
        tokenBalance: nativeToken.tokenAsset.balance?.toString() || "",
      });
      tokenSelectModal(nativeToken);
    }
  }, [!isPopupEdit, assetLoading, api]);

  const handleTokenValueChange = async (value: string) => {
    const payloadTokenValue = await tokenValue(value);
    dispatch({ type: ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT, payload: payloadTokenValue });
    if (value !== "" && value !== "0") {
      const { originChainFee, destinationChainFee } =
        selectedChain.chainA.chainType === "Asset Hub" ? getCrossInFees() : getCrossOutFees();
      dispatch({
        type: ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE,
        payload: originChainFee,
      });
      dispatch({
        type: ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN_FEE,
        payload: destinationChainFee,
      });
    }
  };

  const handleCrosschain = () => {
    dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: true });
    setReviewModalOpen(true);
  };

  const handleCrosschainExec = async () => {
    dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
    setReviewModalOpen(false);
    if (api) {
      if (selectedChain.chainA.chainType === "Relay Chain") {
        await executeCrossOut(
          selectedAccount,
          formatInputTokenValue(crosschainExactTokenAmount, selectedToken.decimals),
          crosschainDestinationWalletAddress,
          rpcUrlRelay,
          dispatch
        );
      } else if (selectedChain.chainB.chainType === "Relay Chain") {
        await executeCrossIn(
          api,
          formatInputTokenValue(crosschainExactTokenAmount, selectedToken.decimals),
          selectedAccount,
          crosschainDestinationWalletAddress,
          dispatch
        );
      } else {
        // TODO: implement teleportation across parachains
      }
    }
  };

  return (
    <div className="flex w-full max-w-[552px] flex-col items-center justify-center gap-5">
      <div className="relative flex w-full gap-7 rounded-2xl bg-white p-8">
        <div className="flex basis-1/2 items-center gap-1 rounded-lg bg-purple-100 px-4 py-6">
          <div className="flex items-center justify-center">
            {selectedChain.chainA.chainType === "Asset Hub" ? (
              <AssetHub width={37} height={35} />
            ) : (
              <DotToken width={37} height={35} />
            )}
          </div>
          <div className="flex flex-1 flex-col items-start justify-center">
            <div className="text-small font-normal leading-[13.2px] tracking-[.3px] text-gray-100">
              {t("crosschainPage.from")}
            </div>
            <div className="text-base font-normal leading-[19.2px] tracking-[.2px]">
              {selectedChain.chainA.chainName + " " + selectedChain.chainA.chainType}
            </div>
          </div>
        </div>
        <div className="flex basis-1/2 items-center gap-1 rounded-lg bg-purple-100 px-4 py-6">
          <div className="flex flex-1 flex-col items-end justify-center">
            <div className="text-small font-normal leading-[13.2px] tracking-[.3px] text-gray-100">
              {t("crosschainPage.to")}
            </div>
            <div className="text-base font-normal leading-[19.2px] tracking-[.2px]">
              {selectedChain.chainB.chainName + " " + selectedChain.chainB.chainType}
            </div>
          </div>
          <div className="flex items-center justify-center">
            {selectedChain.chainB.chainType === "Relay Chain" ? (
              <DotToken width={37} height={35} />
            ) : (
              <AssetHub width={37} height={35} />
            )}
          </div>
        </div>
        <button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          onClick={() => {
            handleChainSwitch();
          }}
        >
          <CrossChainBtnIcon width={42} height={42} />
        </button>
      </div>
      <div className="flex  w-full flex-col gap-[14px] rounded-2xl bg-white p-8">
        <div className="flex  w-full flex-col gap-[6px]">
          <div>
            <TokenAmountInput
              tokenText={selectedToken?.tokenSymbol}
              tokenBalance={
                selectedChain.chainA.chainType !== "Asset Hub"
                  ? !selectedToken.tokenBalance
                    ? "0"
                    : selectedChain.balance
                  : selectedToken?.tokenBalance
              }
              showUSDValue
              tokenId={selectedToken?.tokenId}
              tokenDecimals={selectedToken?.decimals}
              labelText={t("crosschainPage.transfer")}
              tokenIcon={<TokenIcon tokenSymbol={selectedToken.tokenSymbol} width={"24px"} height={"24px"} />}
              tokenValue={selectedTokenValue.tokenValue || "0"}
              onClick={() => fillTokenPairsAndOpenModal(TokenSelection.TokenA)}
              onSetTokenValue={(value) => {
                handleTokenValueChange(value);
              }}
              disabled={!selectedAccount || crosschainLoading || !tokenBalances?.assets}
              assetLoading={assetLoading}
              onMaxClick={() => {}}
            />
          </div>
          <DestinationWalletAddress
            chainName={selectedChain.chainB.chainName + " " + selectedChain.chainB.chainType}
            isPopupEdit={isPopupEdit}
          />

          <div>
            <Button
              onClick={() => {
                handleCrosschain();
              }}
              disabled={getCrosschainButtonProperties.disabled || crosschainLoading}
              variant={ButtonVariants.btnInteractivePink}
            >
              {!selectedAccount && assetLoading ? <LottieMedium /> : getCrosschainButtonProperties.label}
            </Button>
          </div>
        </div>
        {selectedTokenValue.tokenValue !== "" && !tooManyDecimalsError.isError ? (
          <div className="flex w-full flex-col gap-3 rounded-2xl bg-purple-50 px-4 py-3">
            <div className="flex w-full items-center justify-between text-medium">
              <div className="capitalize text-gray-300">{t("crosschainPage.originChainFee")}</div>
              <span className="text-gray-400">
                {crosschainOriginChainFee} {selectedToken.tokenSymbol}
              </span>
            </div>
            <div className="flex w-full items-center justify-between text-medium">
              <div className="capitalize text-gray-300">{t("crosschainPage.destinationChainFee")}</div>
              <span className="text-gray-400">
                {crosschainDestinationChainFee} {selectedToken.tokenSymbol}
              </span>
            </div>
            <div className="flex w-full items-center justify-between text-medium tracking-[.2px]">
              <div className="text-gray-300">{t("crosschainPage.route")}</div>
              <div className="flex items-center justify-center gap-[2px] rounded-full bg-pink px-1 py-[2px]">
                <DotToken width={16} height={16} />
                <span className="text-white">XCM</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <SwapSelectTokenModal
        open={tokenSelectionModal === TokenSelection.TokenA}
        title={t("modal.selectToken")}
        tokensData={availablePoolToken}
        onClose={() => setTokenSelectionModal(TokenSelection.None)}
        onSelect={(tokenData) => {
          setSelectedToken(tokenData);
          tokenSelectModal(tokenData);
        }}
        selected={selectedToken}
        showBalance={false}
      />
      <CrosschainReviewTransactionModal
        open={reviewModalOpen}
        tokenSymbol={selectedToken.tokenSymbol}
        nativeChainName={selectedChain.chainA.chainName + " " + selectedChain.chainA.chainType}
        destinationChainName={selectedChain.chainB.chainType}
        destinationBalance={
          selectedChain.chainA.chainType === "Asset Hub"
            ? !selectedToken.tokenBalance
              ? "0"
              : selectedChain.balance
            : selectedToken?.tokenBalance
        }
        transactionType={
          selectedChain.chainA.chainType === "Asset Hub"
            ? CrosschainTransactionTypes.crossIn
            : CrosschainTransactionTypes.crossOut
        }
        onClose={() => {
          dispatch({ type: ActionType.SET_CROSSCHAIN_LOADING, payload: false });
          setReviewModalOpen(false);
        }}
        onConfirmTransaction={() => {
          handleCrosschainExec();
        }}
      />
    </div>
  );
};

export default CrossChainSwap;
