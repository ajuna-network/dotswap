import { useState, useRef, useEffect } from "react";
import DownArrow from "../../../assets/img/down-arrow.svg?react";
import Button from "../../atom/Button";
import { ButtonVariants } from "../../../app/types/enum";
import TokenIcon from "../../atom/TokenIcon";
import CrossChainSwap from "../../organism/CrossChainSwap";
import Modal from "../../atom/Modal";
import { formatDecimalsFromToken } from "../../../app/util/helper";
import { AssetListToken } from "../../../app/types";

type AccordionAssetItemProps = {
  token: AssetListToken;
  className?: string;
  children?: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  handleSwapModal: (tokenId: string) => void | undefined;
};

const AccordionAssetItem = ({
  token,
  className = "border-t border-1 border-purple-100",
  children,
  alwaysOpen = false,
  defaultOpen = false,
  handleSwapModal,
}: AccordionAssetItemProps) => {
  const titleElm = useRef<HTMLDivElement>(null);
  const itemsElm = useRef<HTMLDivElement>(null);

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

  const formattedBalance =
    token.tokenId === ""
      ? token.tokenAsset.balance
      : formatDecimalsFromToken(
          Number(token.tokenAsset.balance?.replace(/[, ]/g, "")),
          token.assetTokenMetadata.decimals as string
        ) || "0";

  const totalBalance = parseFloat(formattedBalance) + parseFloat(token.tokenAsset.relayBalance || "0");
  const formattedTotalBalance = token.tokenId !== "" ? totalBalance : totalBalance.toFixed(2);

  const usdTotalBalance = (parseFloat(token.spotPrice) * totalBalance).toFixed(2);

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

  return (
    <div
      className={`acItem flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      data-height={
        isOpen ? accordionHeight.titleElmHeight + accordionHeight.itemsElmHeight : accordionHeight.titleElmHeight
      }
      style={{
        height: isOpen
          ? accordionHeight.itemsElmHeight + accordionHeight.titleElmHeight
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
          <div className="flex w-2/4 items-center justify-start">
            <div className="flex flex-col">
              <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">
                Total Available Balance
              </div>
              <div className="font-titillium-web text-base font-semibold">
                {totalBalance && totalBalance !== 0
                  ? formattedTotalBalance + " " + token.assetTokenMetadata.symbol
                  : "0"}
                {token.spotPrice ? " ($" + usdTotalBalance + ")" : ""}
              </div>
            </div>
          </div>
          <div className="flex w-1/4 flex-row items-center justify-end gap-4 px-6">
            {token.tokenId === "" && (
              <Button
                onClick={() => {
                  handleCrosschainModal();
                }}
                variant={ButtonVariants.btnSecondaryGray}
                className="max-w-max"
              >
                Crosschain
              </Button>
            )}
            <Button
              onClick={() => {
                handleSwapModal(token.tokenId === "" ? "0" : token.tokenId);
              }}
              variant={ButtonVariants.btnSecondaryGray}
              className="max-w-max"
            >
              Swap
            </Button>
          </div>
        </div>
        <div className="flex w-10 flex-row items-center justify-end">
          {!alwaysOpen && children && (
            <button
              className={`flex items-center justify-center transition-all duration-300 ease-in-out ${isOpen ? "rotate-180 transform opacity-100" : "opacity-40"}`}
              onClick={() => {
                toggleAccordionAssetItem();
              }}
            >
              <DownArrow />
            </button>
          )}
        </div>
      </div>
      {children && (
        <div
          ref={itemsElm}
          className={`flex w-full flex-col overflow-hidden px-8 pb-8 transition-all duration-300 ease-in-out`}
          data-height={accordionHeight.itemsElmHeight}
          style={{ height: isOpen ? "100%" : 0 }}
        >
          {children}
        </div>
      )}
      {token.tokenId === "" && (
        <Modal
          isOpen={crossChainModalOpen}
          onClose={() => {
            handleCrosschainModal();
          }}
        >
          <CrossChainSwap isPopupEdit={false} />
        </Modal>
      )}
    </div>
  );
};

export default AccordionAssetItem;
