import classNames from "classnames";
import { FC } from "react";
import { TokenProps } from "../../../app/types";
import { formatDecimalsFromToken, formatNumberEnUs } from "../../../app/util/helper";
import TokenIcon from "../../atom/TokenIcon";
import CheckIcon from "../../../assets/img/selected-token-check.svg?react";
import Modal from "../../atom/Modal";
import { useTranslation } from "react-i18next";

interface SelectTokenPayload {
  id: string;
  assetSymbol: string;
  decimals: string;
  assetTokenBalance: string;
}
interface SwapSelectTokenModalProps {
  open: boolean;
  title: string;
  tokensData: TokenProps[];
  selected: TokenProps;
  showBalance?: boolean;
  onClose: () => void;
  onSelect: (tokenData: TokenProps) => void;
}

const SwapSelectTokenModal: FC<SwapSelectTokenModalProps> = ({
  open,
  title,
  tokensData,
  selected,
  showBalance = true,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();

  const handleSelectToken = (payload: SelectTokenPayload) => {
    const assetTokenData: TokenProps = {
      tokenSymbol: payload.assetSymbol,
      tokenId: payload.id,
      decimals: payload.decimals,
      tokenBalance: payload.assetTokenBalance,
    };

    onSelect(assetTokenData);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="max-h-[504px] overflow-y-auto">
        {tokensData.length > 0 ? (
          <>
            {tokensData?.map((item: any, index: number) => (
              <div key={index} className="group flex min-w-[498px] flex-col hover:rounded-md hover:bg-purple-800">
                <button
                  className={classNames("flex items-center gap-3 px-4 py-3", {
                    "rounded-md bg-purple-200 hover:bg-purple-800": item.tokenId === selected.tokenId,
                  })}
                  onClick={() =>
                    handleSelectToken({
                      id: item.tokenId,
                      assetSymbol: item.assetTokenMetadata.symbol,
                      decimals: item.assetTokenMetadata.decimals,
                      assetTokenBalance: item.tokenAsset.balance.replace(/[, ]/g, ""),
                    })
                  }
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex gap-3">
                      <div>
                        <TokenIcon tokenSymbol={item.assetTokenMetadata.symbol} />
                      </div>
                      <div className="flex flex-col items-start">
                        <div
                          className={classNames("text-gray-400 group-hover:text-white", {
                            "text-black": item.tokenId === selected.tokenId,
                          })}
                        >
                          {item.assetTokenMetadata.name}
                        </div>
                        <div
                          className={classNames("text-small text-gray-300 group-hover:text-white", {
                            "text-black": item.tokenId === selected.tokenId,
                          })}
                        >
                          {item.assetTokenMetadata.symbol}
                        </div>
                      </div>
                    </div>
                    {showBalance ? (
                      <div className="flex gap-1">
                        <div className="text-[12px] group-hover:text-white">
                          {item.tokenId && item.tokenAsset.balance !== 0
                            ? formatNumberEnUs(
                                Number(
                                  formatDecimalsFromToken(
                                    Number(item.tokenAsset.balance.replace(/[, ]/g, "")),
                                    item.assetTokenMetadata.decimals
                                  )
                                ),
                                Number(item.assetTokenMetadata.decimals)
                              )
                            : formatNumberEnUs(
                                Number(item.tokenAsset.balance),
                                Number(item.assetTokenMetadata.decimals)
                              )}
                        </div>
                        {item.tokenId === selected.tokenId ? <CheckIcon /> : null}
                      </div>
                    ) : null}
                  </div>
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="min-w-[498px] pr-6">
            <div className="flex items-center justify-center gap-3 px-4 py-3">{t("wallet.noAssetFound")}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SwapSelectTokenModal;
