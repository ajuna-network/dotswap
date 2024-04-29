import { FC } from "react";
import { t } from "i18next";
import Modal from "../../atom/Modal";
import Button from "../../atom/Button";
import { ButtonVariants, CrosschainTransactionTypes } from "../../../app/types/enum";
import ArrowRightIcon from "../../../assets/img/arrow-right-long.svg?react";
import { useAppContext } from "../../../state";
import Decimal from "decimal.js";
import { formatNumberEnUs } from "../../../app/util/helper";

interface CrosschainReviewTransactionModalProps {
  tokenSymbol: string;
  tokenDecimals: string;
  open: boolean;
  nativeChainName: string;
  destinationChainName: string;
  destinationBalance: string;
  transactionType: CrosschainTransactionTypes;
  onClose: () => void;
  onConfirmTransaction: () => void;
}

const CrosschainReviewTransactionModal: FC<CrosschainReviewTransactionModalProps> = ({
  tokenSymbol,
  tokenDecimals,
  open,
  nativeChainName,
  destinationChainName,
  destinationBalance,
  transactionType,
  onClose,
  onConfirmTransaction,
}) => {
  const { state } = useAppContext();

  const { crosschainExactTokenAmount, crosschainOriginChainFee, crosschainDestinationChainFee } = state;

  const destinationChainFee = new Decimal(Number(crosschainDestinationChainFee)).toString();

  const originChainFee = new Decimal(Number(crosschainOriginChainFee))
    .plus(destinationChainName === "Asset Hub" ? Number("0.03") : Number("0.03"))
    .toString();

  const destinationBalanceAfter = new Decimal(Number(destinationBalance))
    .plus(Number(crosschainExactTokenAmount))
    .toNumber();

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        t(`crosschainReviewTransactionModal.${transactionType}`) +
        " " +
        t("crosschainReviewTransactionModal.confirmation")
      }
    >
      <div className="flex w-[391px] items-center justify-between py-9">
        <div className="flex items-center gap-[2px]">
          <div className="flex items-center gap-[10px] rounded-full bg-gray-5 px-2 py-[2px] text-medium capitalize">
            {nativeChainName}
            <ArrowRightIcon />
          </div>
          <div className="flex items-center gap-[10px] rounded-full bg-black px-2 py-[2px] text-medium capitalize text-white">
            {destinationChainName}
          </div>
        </div>
        <div className="flex flex-col items-end text-medium">
          <div className="font-inter uppercase">{t(`crosschainReviewTransactionModal.transfer`)}</div>
          <span className="font-semibold">
            {formatNumberEnUs(Number(crosschainExactTokenAmount), Number(tokenDecimals))} {tokenSymbol}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col">
        <hr className="mb-3 mt-3 w-full border-[0.7px] border-gray-50" />
        <div className="flex flex-col gap-3">
          {destinationBalance && (
            <div className="flex justify-between">
              <span className="font-inter text-medium capitalize text-gray-300">
                {destinationChainName} {t(`crosschainReviewTransactionModal.currentBalance`)}
              </span>
              <span className="font-inter text-medium text-gray-400">
                {formatNumberEnUs(Number(destinationBalance), Number(tokenDecimals))} {tokenSymbol}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-inter text-medium capitalize text-gray-300">
              {t(`crosschainReviewTransactionModal.transferringAmount`)}
            </span>
            <span className="font-inter text-medium text-gray-400">
              {formatNumberEnUs(Number(crosschainExactTokenAmount), Number(tokenDecimals))} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-inter text-medium capitalize text-gray-300">
              {t(`crosschainReviewTransactionModal.originChainFee`)}
            </span>
            <span className="font-inter text-medium text-gray-400">
              ~ {formatNumberEnUs(Number(originChainFee), Number(tokenDecimals))} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-inter text-medium capitalize text-gray-300">
              {t(`crosschainReviewTransactionModal.destinationChainFee`)}
            </span>
            <span className="font-inter text-medium text-gray-400">
              ~ {formatNumberEnUs(Number(destinationChainFee), Number(tokenDecimals))} {tokenSymbol}
            </span>
          </div>
          {destinationBalance && (
            <>
              <hr className="mb-0 mt-3 w-full border-[0.7px] border-gray-50" />
              <div className="flex justify-between">
                <span className="font-inter text-medium capitalize text-gray-300">
                  {destinationChainName} {t(`crosschainReviewTransactionModal.newBalance`)}
                </span>
                <span className="font-inter text-medium text-gray-400">
                  ~ {formatNumberEnUs(Number(destinationBalanceAfter), Number(tokenDecimals))} {tokenSymbol}
                </span>
              </div>
            </>
          )}
        </div>
        <hr className="mb-3 mt-5 w-full border-[0.7px] border-gray-50" />
        <div className="flex flex-row justify-center gap-[6px]">
          <button
            className="flex w-full max-w-[176px] items-center justify-center px-4 py-3 font-unbounded-variable text-small leading-[13.2px] tracking-[.96px]"
            onClick={onClose}
          >
            {t(`crosschainReviewTransactionModal.close`)}
          </button>
          <Button
            onClick={onConfirmTransaction}
            variant={ButtonVariants.btnInteractivePink}
            className="max-w-[176px] !rounded-full !px-4 !py-3 !font-unbounded-variable text-small capitalize !leading-[13.2px] tracking-[.96px]"
          >
            {t(`crosschainReviewTransactionModal.confirm`)} {t(`crosschainReviewTransactionModal.${transactionType}`)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CrosschainReviewTransactionModal;
