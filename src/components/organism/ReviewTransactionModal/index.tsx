import { FC } from "react";
import Modal from "../../atom/Modal";
import Button from "../../atom/Button";
import { ButtonVariants, InputEditedType, TransactionTypes } from "../../../app/types/enum";
import TokenIcon from "../../atom/TokenIcon";
import { formatNumberEnUs } from "../../../app/util/helper";

interface SwapSelectTokenModalProps {
  open: boolean;
  title: string;
  inputValueA: string;
  inputValueB: string;
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
  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="flex w-[360px] flex-col gap-5">
        <div className="flex flex-col items-start">
          <span className="font-inter text-small text-gray-200">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && "You pay"}
            {transactionType === TransactionTypes.withdraw && "Withdrawal amount"}
            {transactionType === TransactionTypes.createPool && "You pay"}
          </span>
          <span className="flex w-full items-center justify-between font-unbounded-variable text-heading-4 font-bold text-gray-400">
            <div className="flex overflow-y-scroll">
              {formatNumberEnUs(Number(inputValueA), Number(tokenDecimalsA))}
            </div>
            <TokenIcon tokenSymbol={tokenSymbolA || ""} width="24" height="24" />
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-inter text-small text-gray-200">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && "You receive"}
            {transactionType === TransactionTypes.withdraw && "Withdrawal amount"}
            {transactionType === TransactionTypes.createPool && "You pay"}
          </span>
          <span className="flex w-full items-center justify-between gap-6 font-unbounded-variable text-heading-4 font-bold text-gray-400">
            <div className="flex overflow-y-scroll">
              {formatNumberEnUs(Number(inputValueB), Number(tokenDecimalsB))}
            </div>
            <TokenIcon tokenSymbol={tokenSymbolB || ""} width="24" height="24" />
          </span>
        </div>
        {transactionType !== TransactionTypes.createPool && (
          <>
            <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50" />
            <div className="flex flex-col">
              {/* <div className="flex justify-between">
                <span className="font-inter text-medium text-gray-300">Price impact</span>
                <span className="font-inter text-medium text-gray-400">{priceImpact}%</span>
              </div> */}
              {showAll ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">Expected output</span>
                    <span className="font-inter text-medium text-gray-400">
                      {formatNumberEnUs(Number(tokenValueA), Number(tokenDecimalsA))} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">Minimum output</span>
                    <span className="font-inter text-medium text-gray-400">
                      {formatNumberEnUs(Number(tokenValueB), Number(tokenDecimalsB))} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">Expected output</span>
                    <span className="font-inter text-medium text-gray-400">
                      {formatNumberEnUs(Number(tokenValueASecond), Number(tokenDecimalsA))} {tokenSymbolB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">Minimum output</span>
                    <span className="font-inter text-medium text-gray-400">
                      {formatNumberEnUs(Number(tokenValueBSecond), Number(tokenDecimalsB))} {tokenSymbolB}
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
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300">
                      {inputType === InputEditedType.exactIn ? "Minimum Received" : "Maximum Paid"}
                    </span>
                    <span className="font-inter text-medium text-gray-400">
                      {formatNumberEnUs(Number(tokenValueB), Number(tokenDecimalsB))} {tokenSymbolB}
                    </span>
                  </div>
                  <div className="flex justify-between text-medium font-normal text-gray-300">
                    <div className="flex">Transaction Cost</div>
                    <span className="font-inter text-medium text-gray-400">{swapGasFee}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <div className="flex">
          <Button onClick={onClose} variant={ButtonVariants.btnCloseModal}>
            Close
          </Button>
          <Button onClick={onConfirmTransaction} variant={ButtonVariants.btnPrimaryPinkSm}>
            Confirm {transactionType === TransactionTypes.add && "Deposit"}
            {transactionType === TransactionTypes.swap && "Swap"}
            {transactionType === TransactionTypes.createPool && "Deposit"}
            {transactionType === TransactionTypes.withdraw && "Withdraw"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewTransactionModal;
