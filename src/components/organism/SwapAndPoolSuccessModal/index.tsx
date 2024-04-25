import { FC, ReactNode } from "react";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import ArrowLeft from "../../../assets/img/arrow-left.svg?react";
import ArrowRight from "../../../assets/img/arrow-right.svg?react";
import OpenLinkArrow from "../../../assets/img/open-link-arrow.svg?react";
import { useAppContext } from "../../../state";
import Modal from "../../atom/Modal";
import { useTranslation } from "react-i18next";

interface SwapAndPoolSuccessModalProps {
  open: boolean;
  contentTitle: string;
  tokenA: {
    value?: string | null;
    symbol: string;
    icon: ReactNode;
  };
  tokenB: {
    value?: string | null;
    symbol: string;
    icon: ReactNode;
  };
  actionLabel: string;
  onClose: () => void;
}

const SwapAndPoolSuccessModal: FC<SwapAndPoolSuccessModalProps> = ({
  open,
  contentTitle,
  actionLabel,
  tokenA,
  tokenB,
  onClose,
}) => {
  const { assethubSubscanUrl, nativeTokenSymbol } = useGetNetwork();
  const { state } = useAppContext();
  const { blockHashFinalized } = state;
  const { t } = useTranslation();

  return (
    <div>
      <Modal isOpen={open} onClose={onClose}>
        <div className="flex min-w-[427px] flex-col">
          <div className="font-unbounded-variable text-heading-6">{contentTitle}</div>
          <div className="my-8 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-2 font-unbounded-variable">
              {tokenA.icon} {tokenA.symbol}
              <ArrowLeft />
              <ArrowRight />
              {tokenB.symbol} {tokenB.icon}
            </div>
            <div className="flex w-full justify-center text-gray-200">
              <div>{actionLabel}</div>
            </div>
            <div className="flex items-center justify-center gap-2 font-unbounded-variable text-medium">
              {tokenA.icon} {tokenA.value} {tokenA.symbol} <ArrowRight /> {tokenB.icon} {tokenB.value} {tokenB.symbol}
            </div>
          </div>
          <div className="flex flex-row items-center justify-center gap-1 font-unbounded-variable text-medium underline">
            <a
              href={`${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${blockHashFinalized}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("toast.viewInBlockExplorer")}
            </a>
            <OpenLinkArrow />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SwapAndPoolSuccessModal;
