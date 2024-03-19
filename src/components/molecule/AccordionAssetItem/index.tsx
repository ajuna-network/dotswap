import { useState, useRef, useEffect } from "react";
import DownArrow from "../../../assets/img/down-arrow.svg?react";
import Button from "../../atom/Button";
import { ButtonVariants } from "../../../app/types/enum";
import DotToken from "../../../assets/img/dot-token.svg?react";
import CrossChainSwap from "../../organism/CrossChainSwap";
import Modal from "../../atom/Modal";
import { fetchTokenUsdPrice } from "../../../app/util/helper";

type Token = {
  tokenId: string;
  assetTokenMetadata: {
    symbol: string;
    name: string;
    decimals: string;
  };
  tokenAsset: {
    balance: string | undefined;
  };
};

type AccordionAssetItemProps = {
  token: Token;
  totalBalance: number | undefined;
  className?: string;
  children?: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  handleSwapModal: (tokenId: string) => void | undefined;
};

const AccordionAssetItem = ({
  token,
  totalBalance,
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

  const [usdTokenBalance, setUsdTokenBalance] = useState<string>("");

  const toggleAccordionAssetItem = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setAccordionHeight({
      titleElmHeight: titleElm.current?.scrollHeight || 0,
      itemsElmHeight: itemsElm.current?.scrollHeight || 0,
    });
  }, [isOpen, titleElm, itemsElm]);

  useEffect(() => {
    if (!totalBalance) return;
    fetchTokenUsdPrice("polkadot").then((data: string | void) => {
      if (typeof data === "string") {
        setUsdTokenBalance((parseFloat(data) * totalBalance).toFixed(2));
      }
    });
  }, [totalBalance]);

  const handleCrosschainModal = () => {
    setCrossChainModalOpen(!crossChainModalOpen);
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
        className="flex w-full flex-row justify-between p-8"
        data-height={accordionHeight.titleElmHeight}
      >
        <div
          className={`flex w-full flex-1 justify-between ${children ? "border-r border-solid border-black border-opacity-10" : ""}`}
        >
          <div className="flex w-1/4 items-center justify-start gap-3 font-unbounded-variable text-heading-6 font-normal">
            <DotToken width={36} height={36} />
            <span>{token.assetTokenMetadata.symbol}</span>
          </div>
          <div className="flex w-2/4 items-center justify-start">
            <div className="flex flex-col">
              <div className="text-small font-normal uppercase text-dark-300">Total Available Balance</div>
              <div className="text-small font-semibold">
                {totalBalance && usdTokenBalance !== ""
                  ? totalBalance + " " + token.assetTokenMetadata.symbol + " ($" + usdTokenBalance + ")"
                  : "0"}
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
                handleSwapModal(token.tokenId);
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
          <CrossChainSwap isPopupEdit />
        </Modal>
      )}
    </div>
  );
};

export default AccordionAssetItem;
