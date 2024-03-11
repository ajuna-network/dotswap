import { useEffect, useState } from "react";
import { ButtonVariants } from "../../../app/types/enum";
import Button from "../../atom/Button";
import CrossChainBtnIcon from "../../../assets/img/cross-chain-button.svg?react";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import DotToken from "../../../assets/img/dot-token.svg?react";
import { TokenProps } from "../../../app/types";
import { t } from "i18next";

type SwapTokenProps = {
  tokenA: TokenProps;
  tokenB: TokenProps;
};

const CrossChainSwap = () => {
  const [buttonDisabled, setButtonDisabled] = useState(true);
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

  const handleTokenValue = (tokenValue: string) => {
    setButtonDisabled(tokenValue === "");
    setSelectedTokens({
      ...selectedTokens,
      tokenA: {
        ...selectedTokens.tokenA,
        tokenSymbol: selectedTokens.tokenA?.tokenSymbol,
        tokenId: selectedTokens.tokenA?.tokenId,
        decimals: selectedTokens.tokenA?.decimals,
        tokenBalance: selectedTokens.tokenA?.tokenBalance,
      },
    });
  };

  useEffect(() => {
    handleTokenValue("");
  }, [selectedTokens]);
  return (
    <div className="flex w-full flex-col items-center justify-center gap-10">
      <div className="relative flex h-[147px] w-[552px] gap-2 rounded-2xl bg-white p-8">
        <div className="h-[83px] w-[230px] rounded-lg bg-purple-100 px-4 py-6"></div>
        <div className="h-[83px] w-[230px] rounded-lg bg-purple-100 px-4 py-6"></div>
        <div className="absolute left-[44.3%] top-[35%] h-[42px] w-[42px]">
          <CrossChainBtnIcon width={42} height={42} />
        </div>
      </div>
      <div className="flex h-[324px] w-[552px] flex-col gap-4 rounded-2xl bg-white p-8">
        <div>
          <TokenAmountInput
            tokenText={selectedTokens.tokenA?.tokenSymbol}
            tokenBalance={selectedTokens.tokenA?.tokenBalance}
            tokenId={selectedTokens.tokenA?.tokenId}
            tokenDecimals={selectedTokens.tokenA?.decimals}
            labelText={t("tokenAmountInput.youPay")}
            tokenIcon={<DotToken />}
            tokenValue={"0"}
            onClick={() => {}}
            onSetTokenValue={() => {}}
            disabled={false}
            assetLoading={false}
            onMaxClick={() => {}}
          />
        </div>
        <div className="h-[83px] w-full rounded-lg bg-purple-100 px-4 py-6"></div>
        <div>
          <Button onClick={() => {}} disabled={buttonDisabled} variant={ButtonVariants.btnInteractivePink}>
            {/* move this text to en and make it dynamic */}
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrossChainSwap;
