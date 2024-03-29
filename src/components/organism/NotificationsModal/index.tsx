import { FC, useEffect, useState } from "react";
import Modal from "../../atom/Modal";
import { LottieMedium } from "../../../assets/loader";
import ArrowRight from "../../../assets/img/arrow-right.svg?react";
import ArrowOpenLink from "../../../assets/img/open-link-arrow.svg?react";
import ArrowRightLong from "../../../assets/img/arrow-right-long.svg?react";
import AlertIcon from "../../../assets/img/alert-icon-white.svg?react";
import SuccessIcon from "../../../assets/img/success-icon.svg?react";
import TokenIcon from "../../atom/TokenIcon";
import { useAppContext } from "../../../state";
import { ToasterType } from "../../../app/types/enum";
import dotAcpToast from "../../../app/util/toast";

const NotificationsModal: FC = () => {
  const { state } = useAppContext();
  const [modalOpen, setModalOpen] = useState(true);

  const onModalClose = () => {
    setModalOpen(false);
  };

  const {
    notificationType,
    notificationTitle,
    notificationLink,
    notificationChainDetails,
    notificationMessage,
    notificationTransactionDetails,
  } = state;

  useEffect(() => {
    if (!modalOpen) {
      switch (notificationType) {
        case ToasterType.SUCCESS:
          dotAcpToast.success(notificationMessage ?? "", undefined, notificationLink?.href);
          break;
        case ToasterType.PENDING:
          dotAcpToast.pending(notificationMessage ?? "");
          break;
        case ToasterType.ERROR:
          dotAcpToast.error(notificationMessage ?? "");
          break;
        default:
          break;
      }
    }
  }, [modalOpen, notificationType]);

  const renderNotificationIcon = () => {
    switch (notificationType) {
      case ToasterType.SUCCESS:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success">
            <SuccessIcon />
          </div>
        );
      case ToasterType.PENDING:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400">
            <LottieMedium />
          </div>
        );
      case ToasterType.ERROR:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alert">
            <AlertIcon />
          </div>
        );
      default:
        return null;
    }
  };

  const renderNotificationTitle = () => {
    if (!notificationTitle) return null;

    return (
      <div className="text-center font-unbounded-variable text-heading-6 font-bold leading-tight tracking-[0.002em]">
        {notificationTitle}
      </div>
    );
  };

  const renderTransactionDetails = () => {
    if (!notificationTransactionDetails) return null;

    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center gap-1">
          <TokenIcon tokenSymbol={notificationTransactionDetails.fromToken?.symbol ?? "DOT"} width="16" height="16" />
          <p>{notificationTransactionDetails.fromToken?.amount ?? ""}</p>
          <p className="uppercase">{notificationTransactionDetails.fromToken?.symbol ?? ""}</p>
        </div>
        {notificationTransactionDetails.toToken && (
          <>
            <ArrowRight />
            <div className="flex items-center gap-1">
              <TokenIcon tokenSymbol={notificationTransactionDetails.toToken.symbol} width="16" height="16" />
              <p>{notificationTransactionDetails.toToken.amount}</p>
              <p className="uppercase">{notificationTransactionDetails.toToken.symbol}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderChainDetails = () => {
    if (!notificationChainDetails) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        <div className="flex items-center gap-2 rounded-medium bg-gray-500 px-2 py-0.5">
          <span className="font-fira-sans text-sm leading-relaxed">{notificationChainDetails.originChain}</span>
          <ArrowRightLong />
        </div>
        <div className="flex items-center justify-center rounded-medium bg-black px-2 py-0.5">
          <span className="font-fira-sans text-sm leading-relaxed text-white">
            {notificationChainDetails.destinationChain}
          </span>
        </div>
      </div>
    );
  };

  const renderNotificationMessage = () => {
    if (!notificationMessage) return null;

    return (
      <div className="flex max-w-notification">
        <p className="text-center font-inter text-medium leading-tight tracking-[0.0125em] text-black text-opacity-70">
          {notificationMessage}
        </p>
      </div>
    );
  };

  const renderNotificationLink = () => {
    if (!notificationLink) return null;

    return (
      <div className="flex w-max gap-1 border-b border-solid border-black">
        <a
          href={notificationLink.href}
          target="_blank"
          rel="noreferrer"
          className="text-center font-unbounded-variable text-small leading-tight tracking-[0.06em] text-black text-opacity-90"
        >
          <span>{notificationLink.text}</span>
        </a>
        <ArrowOpenLink />
      </div>
    );
  };

  return (
    <Modal isOpen={modalOpen} onClose={onModalClose}>
      <div className="min-w-modal max-w-full">
        <div className="flex flex-col items-center gap-3 py-10">
          {renderNotificationIcon()}
          {renderNotificationTitle()}
          {renderTransactionDetails()}
          {renderChainDetails()}
          {renderNotificationMessage()}
          {renderNotificationLink()}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationsModal;
