import { FC } from "react";
import Modal from "../../atom/Modal";
import Button from "../../atom/Button";
import { ButtonVariants, InputEditedType, TransactionTypes } from "../../../app/types/enum";
import TokenIcon from "../../atom/TokenIcon";
import Decimal from "decimal.js";
import { formatNumberEnUs } from "../../../app/util/helper";
import { useTranslation } from "react-i18next";

interface SwapSelectTokenModalProps {
  open: boolean;
  title: string;
  inputValueA: string;
  inputValueB: string;
  spotPriceA?: string;
  spotPriceB?: string;
  priceImpact?: string;
  swapGasFee?: string;
  tokenValueA?: string;
  tokenDecimalsA?: string;
  tokenValueB?: string;
  tokenDecimalsB?: string;
  tokenValueASecond?: string;
  tokenValueBSecond?: string;
  tokenSymbolA?: string;
  tokenSymbolB?: string;
  inputType?: string;
  showAll?: boolean;
  transactionType: TransactionTypes;
  onClose: () => void;
  onConfirmTransaction: () => void;
}

const ReviewTransactionModal: FC<SwapSelectTokenModalProps> = ({
  open,
  title,
  inputValueA,
  inputValueB,
  spotPriceA,
  spotPriceB,
  // priceImpact,
  swapGasFee,
  tokenValueA,
  tokenDecimalsA = "4",
  tokenValueASecond,
  tokenValueB,
  tokenDecimalsB = "4",
  tokenValueBSecond,
  tokenSymbolA,
  tokenSymbolB,
  inputType,
  showAll,
  transactionType,
  onClose,
  onConfirmTransaction,
}) => {
  const { t } = useTranslation();

  const priceA = new Decimal(Number(spotPriceA) || 0).times(new Decimal(Number(inputValueA) || 0));
  const priceB = new Decimal(Number(spotPriceB) || 0).times(new Decimal(Number(inputValueB) || 0));
  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="flex w-[360px] flex-col gap-5">
        <div className="flex flex-col items-start" data-dec={tokenDecimalsA}>
          <span className="font-inter text-small text-gray-200 dark:font-open-sans dark:font-bold dark:uppercase">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && t("modal.reviewTransaction.youPay")}
            {transactionType === TransactionTypes.withdraw && t("modal.reviewTransaction.withdrawAmount")}
            {transactionType === TransactionTypes.createPool && t("modal.reviewTransaction.youPay")}
          </span>
          <span className="flex w-full items-center justify-between font-unbounded-variable text-heading-5 font-bold text-gray-400 dark:font-omnes-bold dark:text-heading-4">
            <div className="no-scrollbar flex overflow-y-scroll">{inputValueA}</div>
            <TokenIcon tokenSymbol={tokenSymbolA || ""} width="24" height="24" />
          </span>
          {priceA.gt(0) && (
            <span className="font-inter text-small text-gray-200 dark:font-open-sans">
              {formatNumberEnUs(priceA.toNumber(), undefined, true)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start" data-dec={tokenDecimalsB}>
          <span className="font-inter text-small text-gray-200 dark:font-open-sans dark:font-bold dark:uppercase">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && t("modal.reviewTransaction.youReceive")}
            {transactionType === TransactionTypes.withdraw && t("modal.reviewTransaction.withdrawAmount")}
            {transactionType === TransactionTypes.createPool && t("modal.reviewTransaction.youPay")}
          </span>
          <span className="flex w-full items-center justify-between font-unbounded-variable text-heading-5 font-bold text-gray-400 dark:font-omnes-bold dark:text-heading-4">
            <div className="no-scrollbar flex overflow-y-scroll">{inputValueB}</div>
            <TokenIcon tokenSymbol={tokenSymbolB || ""} width="24" height="24" />
          </span>
          {priceB.gt(0) && (
            <span className="font-inter text-small text-gray-200 dark:font-open-sans">
              {formatNumberEnUs(priceB.toNumber(), undefined, true)}
            </span>
          )}
        </div>
        {transactionType !== TransactionTypes.createPool && (
          <>
            <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50" />
            <div className="flex flex-col pb-5 dark:border-b-[0.7px] dark:border-b-gray-50">
              {/* <div className="flex justify-between">
                <span className="font-inter text-medium text-gray-300">Price impact</span>
                <span className="font-inter text-medium text-gray-400">{priceImpact}%</span>
              </div> */}
              {showAll ? (
                <>
                  <div className="flex justify-between font-inter text-medium dark:font-open-sans dark:font-extrabold">
                    <span className="text-gray-300 ">{t("modal.reviewTransaction.expectedOutput")}</span>
                    <span className="text-gray-400">
                      {tokenValueA} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">{t("modal.reviewTransaction.minimumOutput")}</span>
                    <span className="text-gray-400">
                      {tokenValueB} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">{t("modal.reviewTransaction.expectedOutput")}</span>
                    <span className="text-gray-400">
                      {tokenValueASecond} {tokenSymbolB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">{t("modal.reviewTransaction.minimumOutput")}</span>
                    <span className="text-gray-400">
                      {tokenValueBSecond} {tokenSymbolB}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">
                      {inputType == InputEditedType.exactIn ? "Expected output" : "Expected input"}
                    </span>
                    <span className="font-inter text-medium text-gray-400">
                      {tokenValueA} {tokenSymbolA}
                    </span>
                  </div> */}
                  {transactionType !== TransactionTypes.add && transactionType !== TransactionTypes.withdraw && (
                    <div className="flex justify-between font-inter text-medium dark:mb-2 dark:font-open-sans dark:font-extrabold">
                      <span className="text-gray-300">
                        {inputType === InputEditedType.exactIn
                          ? t("modal.reviewTransaction.minimumReceived")
                          : t("modal.reviewTransaction.maximumPaid")}
                      </span>
                      <span className="font-inter text-medium text-gray-400">
                        {tokenValueB} {tokenSymbolB}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-inter text-medium dark:font-open-sans dark:font-extrabold">
                    <div className="flex">{t("modal.reviewTransaction.transactionCost")}</div>
                    <span className="font-inter text-medium text-gray-400">{swapGasFee}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <div className="flex">
          <Button onClick={onClose} variant={ButtonVariants.btnCloseModal}>
            {t("button.close")}
          </Button>
          <Button onClick={onConfirmTransaction} variant={ButtonVariants.btnPrimaryPinkSm}>
            {t("button.confirm")} {transactionType === TransactionTypes.add && t("button.deposit")}
            {transactionType === TransactionTypes.swap && t("button.swap")}
            {transactionType === TransactionTypes.createPool && t("button.deposit")}
            {transactionType === TransactionTypes.withdraw && t("button.withdraw")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewTransactionModal;
