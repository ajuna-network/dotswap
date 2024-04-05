import classNames from "classnames";
import { t } from "i18next";
import { ReactNode, useRef, useState, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import useClickOutside from "../../../app/hooks/useClickOutside";
import { ButtonVariants } from "../../../app/types/enum";
import { LottieSmall } from "../../../assets/loader";
import Button from "../../atom/Button";
import { generateRandomString, getSpotPrice } from "../../../app/util/helper";
import { formatDecimalsFromToken } from "../../../app/util/helper";

type TokenAmountInputProps = {
  tokenText: string;
  tokenBalance?: string;
  tokenId?: string;
  tokenDecimals?: string | undefined;
  disabled?: boolean;
  className?: string;
  tokenIcon?: ReactNode;
  tokenValue?: string;
  labelText?: string;
  selectDisabled?: boolean;
  assetLoading?: boolean;
  withdrawAmountPercentage?: number;
  showUSDValue?: boolean;
  spotPrice?: string;
  onClick: () => void;
  onSetTokenValue: (value: string) => void;
  onMaxClick?: () => void;
  maxVisible?: boolean;
};

const TokenAmountInput = ({
  tokenIcon,
  tokenText,
  tokenBalance,
  tokenId,
  tokenDecimals,
  disabled,
  tokenValue,
  labelText,
  selectDisabled,
  assetLoading,
  withdrawAmountPercentage,
  showUSDValue,
  spotPrice,
  onSetTokenValue,
  onClick,
  onMaxClick,
  maxVisible,
}: TokenAmountInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useClickOutside(wrapperRef, () => {
    setIsFocused(false);
  });

  const [tokenPriceUSD, setTokenPriceUSD] = useState<string>("");
  const [spotPriceLoaded, setSpotPriceLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!showUSDValue) return;
    setSpotPriceLoaded(false);
    if (spotPrice !== "") {
      setTokenPriceUSD((parseFloat(spotPrice || "") * parseFloat(tokenBalance || "0")).toFixed(2));
      setSpotPriceLoaded(true);
      return;
    }
    getSpotPrice(tokenText).then((data: string | void) => {
      if (typeof data === "string") {
        setTokenPriceUSD((parseFloat(data) * parseFloat(tokenBalance || "0")).toFixed(2));
        setSpotPriceLoaded(true);
      }
    });
  }, [tokenText, tokenBalance]);

  const formId = `token-amount-${generateRandomString(4)}`;

  return (
    <div
      ref={wrapperRef}
      className={classNames(
        "relative flex flex-col items-center justify-start gap-2 rounded-lg border bg-purple-100 px-4 py-6",
        {
          "border-pink": isFocused,
          "border-transparent": !isFocused,
        }
      )}
    >
      <div className="flex">
        <label htmlFor={formId} className="absolute top-4 text-small font-normal text-gray-200">
          {labelText}
        </label>
        <NumericFormat
          id={formId}
          getInputRef={inputRef}
          allowNegative={false}
          fixedDecimalScale
          displayType={"input"}
          disabled={disabled || !tokenText}
          placeholder={"0"}
          className="w-full basis-auto bg-transparent font-unbounded-variable text-heading-4 font-bold text-gray-300 outline-none placeholder:text-gray-200"
          onFocus={() => setIsFocused(true)}
          value={tokenValue}
          isAllowed={({ floatValue }) => {
            if (floatValue) {
              return floatValue?.toString()?.length <= 15;
            } else {
              return true;
            }
          }}
          onValueChange={({ floatValue }) => {
            if (!floatValue) return;
            onSetTokenValue(floatValue?.toString() || "");
          }}
        />

        {tokenText ? (
          <Button
            icon={tokenIcon}
            type="button"
            onClick={() => onClick()}
            variant={ButtonVariants.btnSelectGray}
            disabled={disabled || selectDisabled}
            className="basis-2/5 disabled:basis-[23%]"
          >
            {tokenText}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => onClick()}
            variant={ButtonVariants.btnSelectPink}
            className="basis-[57%]"
            disabled={disabled}
          >
            {!disabled ? assetLoading ? <LottieSmall /> : t("button.selectToken") : t("button.selectToken")}
          </Button>
        )}
      </div>
      <div className="flex w-full justify-between">
        {withdrawAmountPercentage ? (
          <span className="text-[13px] tracking-[0.2px] text-black text-opacity-50">({withdrawAmountPercentage}%)</span>
        ) : null}
        <div className="flex w-full justify-end pr-1 text-medium text-gray-200">
          Balance:{" "}
          {tokenId && tokenText && Number(tokenBalance) !== 0
            ? formatDecimalsFromToken(Number(tokenBalance?.replace(/[, ]/g, "")), tokenDecimals as string)
            : tokenBalance || 0}
          {showUSDValue ? (
            tokenPriceUSD && spotPriceLoaded ? (
              <span>&nbsp;(${tokenPriceUSD})</span>
            ) : (
              <>
                &nbsp;
                <LottieSmall />
              </>
            )
          ) : null}
          {tokenText &&
            onMaxClick &&
            maxVisible &&
            import.meta.env.VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP &&
            import.meta.env.VITE_ENABLE_EXPERIMENTAL_MAX_TOKENS_SWAP == "true" && (
              <button
                className="inline-flex h-5 w-11 flex-col items-start justify-start gap-2 px-1.5 text-pink"
                onClick={onMaxClick}
              >
                MAX
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TokenAmountInput;
