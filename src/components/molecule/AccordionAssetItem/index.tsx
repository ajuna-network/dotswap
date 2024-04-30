import { useState, useRef, useEffect, FC } from "react";
import DownArrow from "../../../assets/img/down-arrow.svg?react";
import Button from "../../atom/Button";
import { ButtonVariants, ToasterType } from "../../../app/types/enum";
import TokenIcon from "../../atom/TokenIcon";
import CrossChainSwap from "../../organism/CrossChainSwap";
import Modal from "../../atom/Modal";
import { formatDecimalsFromToken } from "../../../app/util/helper";
import { AssetListToken } from "../../../app/types";
import { t } from "i18next";
import { formatNumberEnUs } from "../../../app/util/helper";
import Decimal from "decimal.js";
import { useAppContext } from "../../../state";
import Tooltip from "../../atom/Tooltip";

type AccordionAssetItemProps = {
  token: AssetListToken;
  className?: string;
  children?: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  handleSwapModal?: (tokenId: string) => void | undefined;
};

const AccordionAssetItem: FC<AccordionAssetItemProps> = ({
  token,
  className = "border-t border-1 border-purple-100",
  children,
  alwaysOpen = false,
  defaultOpen = false,
  handleSwapModal,
}) => {
  const titleElm = useRef<HTMLDivElement>(null);
  const itemsElm = useRef<HTMLDivElement>(null);

  const { state } = useAppContext();

  const { notifications } = state;

  const [isOpen, setIsOpen] = useState(defaultOpen || alwaysOpen);
  const [accordionHeight, setAccordionHeight] = useState({ titleElmHeight: 0, itemsElmHeight: 0 });
  const [crossChainModalOpen, setCrossChainModalOpen] = useState(false);

  const toggleAccordionAssetItem = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setAccordionHeight({
      titleElmHeight: titleElm.current?.scrollHeight || 0,
      itemsElmHeight: itemsElm.current?.scrollHeight || 0,
    });
  }, [isOpen, titleElm, itemsElm]);

  const handleCrosschainModal = () => {
    setCrossChainModalOpen(!crossChainModalOpen);
  };

  const totalBalance =
    token.tokenId === ""
      ? token.tokenAsset.totalBalance
      : formatDecimalsFromToken(
          Number(token.tokenAsset.balance?.replace(/[, ]/g, "")),
          token.assetTokenMetadata.decimals as string
        ) || "0";

  const usdTotalBalance = formatNumberEnUs(
    new Decimal(Number(token.spotPrice || 0)).times(Number(totalBalance)).toNumber(),
    undefined,
    true
  );

  const formattedTotalBalance =
    token.tokenId !== ""
      ? formatNumberEnUs(Number(totalBalance), Number(token.assetTokenMetadata.decimals))
      : formatNumberEnUs(Number(totalBalance));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isEnterKey = e.key === "Enter";
    const isArrowKey = e.key === "ArrowDown" || e.key === "ArrowUp";

    if ((isEnterKey || isArrowKey) && children && !alwaysOpen && !(e.target instanceof HTMLButtonElement)) {
      toggleAccordionAssetItem();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.target instanceof HTMLButtonElement) return;
    if (children && !alwaysOpen) {
      toggleAccordionAssetItem();
    }
  };

  const crosschainNotificationPending = notifications.some(
    (notification) => notification.id === "crosschain" && notification.notificationType === ToasterType.PENDING
  );

  const swapNotificationPending = notifications.some(
    (notification) => notification.id === "swap" && notification.notificationType === ToasterType.PENDING
  );

  return (
    <div
      className={`acItem flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      data-height={
        isOpen ? accordionHeight.titleElmHeight + accordionHeight.itemsElmHeight : accordionHeight.titleElmHeight
      }
      style={{
        height: isOpen
          ? accordionHeight.itemsElmHeight + accordionHeight.titleElmHeight + 32
          : accordionHeight.titleElmHeight,
      }}
    >
      <div
        ref={titleElm}
        className={`flex w-full flex-row justify-between p-8 ${children ? "cursor-pointer" : "cursor-default"}`}
        data-height={accordionHeight.titleElmHeight}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
      >
        <div
          className={`flex w-full flex-1 justify-between ${children ? "border-r border-solid border-black border-opacity-10" : ""}`}
        >
          <div className="flex w-1/4 items-center justify-start gap-3 font-unbounded-variable text-heading-6 font-normal">
            <TokenIcon tokenSymbol={token.assetTokenMetadata.symbol} />
            <span>{token.assetTokenMetadata.symbol}</span>
          </div>
          <div className="flex w-1/2 items-center justify-start gap-4">
            <div className="flex w-1/2 flex-col">
              <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">
                {t("assetItem.total")}
              </div>
              <div
                className="font-titillium-web text-base font-semibold"
                data-balance={totalBalance && totalBalance !== "0" ? totalBalance : 0}
              >
                {totalBalance && totalBalance !== "0"
                  ? formattedTotalBalance + " " + token.assetTokenMetadata.symbol
                  : "0 " + token.assetTokenMetadata.symbol}
                {token.spotPrice ? " (" + usdTotalBalance + ")" : ""}
              </div>
            </div>
            {token.spotPrice && token.spotPrice !== "0" && (
              <div className="flex w-1/2 flex-col">
                <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">Token Price</div>
                <div className="font-titillium-web text-base font-semibold" data-spotprice={token.spotPrice || 0}>
                  {formatNumberEnUs(Number(token.spotPrice || 0), Number(token.assetTokenMetadata.decimals), true)}
                </div>
              </div>
            )}
          </div>
          <div className="flex w-1/4 flex-row items-center justify-end gap-4 px-6">
            {token.tokenId === "" && (
              <Button
                onClick={handleCrosschainModal}
                variant={ButtonVariants.btnSecondaryGray}
                className="max-w-max cursor-pointer gap-2 disabled:opacity-50"
                disabled={crosschainNotificationPending}
              >
                {t("button.crossChain")}
                {crosschainNotificationPending && <Tooltip message={t("tooltip.crosschainPending")} />}
              </Button>
            )}
            {handleSwapModal && (
              <Button
                onClick={() => {
                  handleSwapModal(token.tokenId === "" ? "0" : token.tokenId);
                }}
                variant={ButtonVariants.btnSecondaryGray}
                className="max-w-max cursor-pointer gap-2 disabled:opacity-50"
                disabled={swapNotificationPending}
              >
                {t("button.swap")}
                {swapNotificationPending && <Tooltip message={t("tooltip.swapPending")} />}
              </Button>
            )}
          </div>
        </div>
        <div className="flex w-10 flex-row items-center justify-end">
          {!alwaysOpen && children && (
            <button
              className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isOpen ? "rotate-180 transform opacity-100" : "opacity-40"}`}
              onClick={toggleAccordionAssetItem}
            >
              <DownArrow />
            </button>
          )}
        </div>
      </div>
      {children && (
        <div
          ref={itemsElm}
          className={`flex w-full flex-col px-8 pb-8 transition-all duration-300 ease-in-out`}
          data-height={accordionHeight.itemsElmHeight}
          style={{ height: isOpen ? "100%" : 0 }}
        >
          {children}
        </div>
      )}
      {token.tokenId === "" && (
        <Modal isOpen={crossChainModalOpen} onClose={handleCrosschainModal} disableOverlayClick={true}>
          <CrossChainSwap isPopupEdit={false} />
        </Modal>
      )}
    </div>
  );
};

export default AccordionAssetItem;
