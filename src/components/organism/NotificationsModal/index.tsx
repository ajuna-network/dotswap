import { FC } from "react";
import Modal from "../../atom/Modal";
import { LottieMedium } from "../../../assets/loader";
import ArrowRight from "../../../assets/img/arrow-right.svg?react";
import ArrowOpenLink from "../../../assets/img/open-link-arrow.svg?react";
import ArrowRightLong from "../../../assets/img/arrow-right-long.svg?react";
import TokenIcon from "../../atom/TokenIcon";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsModal: FC<NotificationsModalProps> = ({ open, onClose }) => {
  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="min-w-[450px]">
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400">
            <LottieMedium />
          </div>
          <div className="text-center font-unbounded-variable text-heading-6 font-bold leading-[1.2] tracking-[0.002em]">
            Submitting Transaction
          </div>
          <div className="flex items-center gap-2 py-2">
            <div className="flex items-center gap-1">
              <TokenIcon tokenSymbol="DOT" width="16" height="16" />
              <p>1056.106</p>
              <p>DOT</p>
            </div>
            <ArrowRight />
            <div className="flex items-center gap-1">
              <TokenIcon tokenSymbol="DOT" width="16" height="16" />
              <p>1056.106</p>
              <p>DOT</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1">
            <div className="flex items-center gap-2 rounded-[100px] bg-gray-500 px-2 py-0.5">
              <span className="font-fira-sans text-sm leading-[1.7]">Polkadot relay chain</span>
              <ArrowRightLong />
            </div>
            <div className="flex items-center justify-center rounded-[100px] bg-black px-2 py-0.5">
              <span className="font-fira-sans text-sm leading-[1.7] text-white">Asset Hub</span>
            </div>
          </div>
          <div className="flex max-w-[280px]">
            <p className="text-center font-inter text-medium leading-[1.2] tracking-[0.0125em] text-black text-opacity-70">
              Transaction is processing. You can close this window anytime.
            </p>
          </div>
          <div className="flex w-max gap-1 border-b border-solid border-black">
            <a
              href="https://google.com"
              target="_blank"
              rel="noreferrer"
              className="text-center font-unbounded-variable text-small leading-[1.2] tracking-[0.06em] text-black text-opacity-90"
            >
              <span>View in block explorer</span>
            </a>
            <ArrowOpenLink />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationsModal;
