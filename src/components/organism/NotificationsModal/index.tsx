import { FC, useEffect } from "react";
import Modal from "../../atom/Modal";
import { LottieMedium } from "../../../assets/loader";
import ArrowRight from "../../../assets/img/arrow-right.svg?react";
import ArrowOpenLink from "../../../assets/img/open-link-arrow.svg?react";
import ArrowRightLong from "../../../assets/img/arrow-right-long.svg?react";
import AlertIcon from "../../../assets/img/alert-icon-white.svg?react";
import SuccessIcon from "../../../assets/img/success-icon.svg?react";
import InfoIcon from "../../../assets/img/info-icon.svg?react";
import TokenIcon from "../../atom/TokenIcon";
import { useAppContext } from "../../../state";
import { ToasterType } from "../../../app/types/enum";
import dotAcpToast from "../../../app/util/toast";
import { ActionType } from "../../../app/types/enum";
import { formatNumberEnUs } from "../../../app/util/helper";

interface Props {
  id: string;
}

const NotificationsModal: FC<Props> = ({ id }) => {
  const { state, dispatch } = useAppContext();

  const setViewed = (value: boolean) => {
    dispatch({
      type: ActionType.SET_NOTIFICATION_VIEWED,
      payload: { id: id, notificationViewed: value },
    });
  };

  const onModalClose = () => {
    dispatch({
      type: ActionType.SET_NOTIFICATION_MODAL_OPEN,
      payload: { id: id, notificationModalOpen: false },
    });

    if (currentNotification?.notificationType === ToasterType.INFO) {
      dispatch({
        type: ActionType.REMOVE_NOTIFICATION,
        payload: id,
      });
    }
  };

  const { notifications } = state;

  const currentNotification = notifications.find((notification) => notification.id === id);

  const fromTokenSymbol = currentNotification?.notificationTransactionDetails?.fromToken?.symbol ?? "";
  const toTokenSymbol = currentNotification?.notificationTransactionDetails?.toToken?.symbol ?? "";
  const fromTokenAmount = formatNumberEnUs(
    currentNotification?.notificationTransactionDetails?.fromToken?.amount ?? 0,
    12
  );
  const toTokenAmount = formatNumberEnUs(currentNotification?.notificationTransactionDetails?.toToken?.amount ?? 0, 12);

  const buildToasterMessage = () => {
    return (
      `${currentNotification?.notificationAction ? currentNotification?.notificationAction + " " : ""}${fromTokenAmount} ${fromTokenSymbol}` +
      `${currentNotification?.notificationTransactionDetails?.toToken ? " -> " + toTokenAmount + " " + toTokenSymbol : ""}`
    );
  };

  useEffect(() => {
    if (!currentNotification?.notificationModalOpen) {
      if (!currentNotification?.notificationViewed) {
        const toasterMessage = buildToasterMessage();
        setViewed(true);

        switch (currentNotification?.notificationType) {
          case ToasterType.SUCCESS:
            dotAcpToast.success(toasterMessage ?? "", undefined, currentNotification?.notificationLink?.href);
            break;
          case ToasterType.PENDING:
            dotAcpToast.pending(toasterMessage ?? "", undefined, currentNotification?.notificationLink?.href);
            setViewed(false);
            break;
          case ToasterType.ERROR:
            dotAcpToast.error(
              currentNotification?.notificationMessage ?? "",
              undefined,
              currentNotification?.notificationLink?.href
            );
            break;
          default:
            break;
        }
      } else {
        setViewed(false);
      }
    } else {
      if (!currentNotification?.notificationViewed) {
        if (currentNotification?.notificationType !== ToasterType.PENDING) {
          setViewed(true);
        }
      } else {
        setViewed(false);
      }
    }
  }, [
    currentNotification?.notificationModalOpen,
    currentNotification?.notificationType,
    currentNotification?.notificationMessage,
  ]);

  const renderNotificationIcon = () => {
    switch (currentNotification?.notificationType) {
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
      case ToasterType.INFO:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-300">
            <InfoIcon className="[&>path]:fill-white" />
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
    if (!currentNotification?.notificationTitle) return null;

    return (
      <div className="text-center font-unbounded-variable text-heading-6 font-bold leading-tight tracking-[0.002em]">
        {currentNotification?.notificationTitle}
      </div>
    );
  };

  const renderTransactionDetails = () => {
    if (!currentNotification?.notificationTransactionDetails) return null;

    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center gap-1">
          <TokenIcon tokenSymbol={fromTokenSymbol} width="16" height="16" />
          <p>{fromTokenAmount ?? ""}</p>
          <p className="uppercase">{fromTokenSymbol}</p>
        </div>
        {currentNotification?.notificationTransactionDetails.toToken && (
          <>
            <ArrowRight />
            <div className="flex items-center gap-1">
              <TokenIcon tokenSymbol={toTokenSymbol} width="16" height="16" />
              <p>{toTokenAmount}</p>
              <p className="uppercase">{toTokenSymbol}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderChainDetails = () => {
    if (!currentNotification?.notificationChainDetails) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        <div className="flex items-center gap-2 rounded-medium bg-gray-500 px-2 py-0.5">
          <span className="font-fira-sans text-sm leading-relaxed">
            {currentNotification?.notificationChainDetails.originChain}
          </span>
          <ArrowRightLong />
        </div>
        <div className="flex items-center justify-center rounded-medium bg-black px-2 py-0.5">
          <span className="font-fira-sans text-sm leading-relaxed text-white">
            {currentNotification?.notificationChainDetails.destinationChain}
          </span>
        </div>
      </div>
    );
  };

  const renderNotificationMessage = () => {
    if (!currentNotification?.notificationMessage) return null;

    return (
      <div className="flex max-w-notification">
        <p className="text-center font-inter text-medium leading-tight tracking-[0.0125em] text-black text-opacity-70">
          {currentNotification?.notificationMessage}
        </p>
      </div>
    );
  };

  const renderNotificationLink = () => {
    if (!currentNotification?.notificationLink) return null;

    return (
      <div className="flex w-max gap-1 border-b border-solid border-black">
        <a
          href={currentNotification?.notificationLink.href}
          target="_blank"
          rel="noreferrer"
          className="text-center font-unbounded-variable text-small leading-tight tracking-[0.06em] text-black text-opacity-90"
        >
          <span>{currentNotification?.notificationLink.text}</span>
        </a>
        <ArrowOpenLink />
      </div>
    );
  };

  return (
    <Modal isOpen={currentNotification?.notificationModalOpen ?? false} onClose={onModalClose}>
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
