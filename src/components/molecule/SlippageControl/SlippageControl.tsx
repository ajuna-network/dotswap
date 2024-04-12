import { t } from "i18next";
import classNames from "classnames";
import { NumericFormat } from "react-number-format";
import { useAppContext } from "../../../state";
import { useRef } from "react";

interface Props {
  slippageValue: number;
  setSlippageValue: (value: number) => void;
  slippageAuto: boolean;
  setSlippageAuto: (auto: boolean) => void;
  loadingState: boolean;
  poolExists?: boolean;
}

const SlippageControl = ({
  slippageValue,
  setSlippageValue,
  slippageAuto,
  setSlippageAuto,
  loadingState,
  poolExists = false,
}: Props) => {
  const { state } = useAppContext();
  const { selectedAccount } = state;
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-4 py-6">
      <div className="flex w-full justify-between text-medium font-normal text-gray-200">
        <div className="flex">{t("tokenAmountInput.slippageTolerance")}</div>
        <span>{slippageValue}%</span>
      </div>
      <div className="flex w-full gap-2">
        <div className="flex w-full basis-8/12 rounded-xl bg-white p-1 text-large font-normal text-gray-400">
          <button
            className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
              "bg-white": !slippageAuto,
              "bg-purple-100": slippageAuto,
            })}
            onClick={() => {
              setSlippageAuto(true);
              setSlippageValue(15);
            }}
            disabled={loadingState || !selectedAccount.address}
          >
            {t("tokenAmountInput.auto")}
          </button>
          <button
            className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
              "bg-white": slippageAuto,
              "bg-purple-100": !slippageAuto,
            })}
            onClick={() => {
              setSlippageAuto(false);
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus();
                  inputRef.current.select();
                }
              }, 0);
            }}
            disabled={loadingState || !selectedAccount.address}
          >
            {t("tokenAmountInput.custom")}
          </button>
        </div>
        <div className="flex basis-1/3">
          <div className="relative flex">
            <NumericFormat
              id="slippage"
              getInputRef={(el: HTMLInputElement | null) => (inputRef.current = el)}
              value={slippageValue}
              isAllowed={(values) => {
                const { formattedValue, floatValue } = values;
                return formattedValue === "" || (floatValue !== undefined && floatValue <= 99);
              }}
              onValueChange={({ value }) => {
                setSlippageValue(parseInt(value) >= 0 ? parseInt(value) : 0);
              }}
              fixedDecimalScale={true}
              thousandSeparator={false}
              allowNegative={false}
              className="w-full rounded-lg bg-purple-100 p-2 text-large text-gray-200 outline-none"
              disabled={slippageAuto || loadingState || !selectedAccount.address}
            />
            <span className="absolute bottom-1/3 right-2 text-medium text-gray-100">%</span>
          </div>
        </div>
      </div>
      {poolExists && (
        <div className="flex rounded-lg bg-lime-500 px-4 py-2 text-medium font-normal text-cyan-700">
          {t("poolsPage.poolExists")}
        </div>
      )}
    </div>
  );
};

export default SlippageControl;
