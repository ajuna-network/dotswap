import { useState, useEffect } from "react";
import DotToken from "../../../assets/img/dot-token.svg?react";
import AssetHubToken from "../../../assets/img/asset-hub.svg?react";
import { useAppContext } from "../../../state";
import { t } from "i18next";
import Decimal from "decimal.js";
import Tooltip from "../../atom/Tooltip";
import { formatNumberEnUs } from "../../../app/util/helper";

type AssetItemChildProps = {
  isRelayChain?: boolean;
  tokenSymbol: string;
  tokenSpotPrice: string;
  className?: string;
};

const AssetItemChild = ({
  isRelayChain = false,
  tokenSymbol,
  tokenSpotPrice,
  className = "bg-purple-100 rounded-[10px]",
}: AssetItemChildProps) => {
  const { state } = useAppContext();

  const { selectedAccount, api, tokenBalances, crosschainSelectedChain } = state;

  const [balances, setBalances] = useState({
    freeTokenBalance: 0,
    usdFreeTokenBalance: 0,
    reservedTokenBalance: 0,
    usdReservedTokenBalance: 0,
    lockedTokenBalance: 0,
    usdLockedTokenBalance: 0,
    chainName: "",
  });

  useEffect(() => {
    if (!api || !tokenBalances) return;
    const assetHub =
      crosschainSelectedChain.chainA.chainType === "Asset Hub"
        ? { ...crosschainSelectedChain.chainA }
        : { ...crosschainSelectedChain.chainB };
    const relayChain =
      crosschainSelectedChain.chainA.chainType === "Relay Chain"
        ? { ...crosschainSelectedChain.chainA }
        : { ...crosschainSelectedChain.chainB };

    const balances = !isRelayChain ? tokenBalances.balanceAsset : tokenBalances.balanceRelay;
    const chainName = !isRelayChain ? assetHub.chainName + " " + assetHub.chainType : relayChain.chainName;

    const floatFreeTokenBalance = new Decimal(balances?.free).minus(balances?.frozen).toNumber();
    const floatUsdFreeTokenBalance = new Decimal(balances?.free)
      .minus(balances?.frozen)
      .times(tokenSpotPrice)
      .toNumber();
    const floatReservedTokenBalance = Number(balances?.reserved);
    const floatUsdReservedTokenBalance = new Decimal(balances?.reserved).times(tokenSpotPrice).toNumber();
    const floatLockedTokenBalance = Number(balances?.frozen);
    const floatUsdLockedTokenBalance = new Decimal(balances?.frozen).times(tokenSpotPrice).toNumber();

    setBalances({
      freeTokenBalance: floatFreeTokenBalance,
      usdFreeTokenBalance: floatUsdFreeTokenBalance,
      reservedTokenBalance: floatReservedTokenBalance,
      usdReservedTokenBalance: floatUsdReservedTokenBalance,
      lockedTokenBalance: floatLockedTokenBalance,
      usdLockedTokenBalance: floatUsdLockedTokenBalance,
      chainName: chainName || "",
    });
  }, [selectedAccount, tokenBalances, api]);

  return (
    <div className={`flex w-full flex-col transition-all duration-300 ease-in-out ${className}`}>
      <div className="flex w-full flex-row justify-between px-6 py-5">
        <div className="flex items-start justify-start gap-3 font-normal">
          {!isRelayChain ? <AssetHubToken width={24} height={24} /> : <DotToken width={24} height={24} />}
          <div className="flex flex-col gap-1">
            <div className="text-heading-6 leading-none">{balances.chainName !== "" ? balances.chainName : ""}</div>
            <div className="text-medium leading-none">{isRelayChain === true ? "Relay chain" : "Parachain"}</div>
          </div>
        </div>
        <div className="flex items-start justify-end gap-8">
          {balances && balances.lockedTokenBalance !== 0 ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-titillium-web text-medium font-normal uppercase text-dark-200">
                {t("assetItem.locked")}
                <Tooltip message={t("assetItem.lockedTooltip")} />
              </div>
              <div
                className="text-base font-semibold"
                data-balance={balances && balances.lockedTokenBalance !== 0 ? balances.lockedTokenBalance : 0}
              >
                {balances && balances.lockedTokenBalance !== 0
                  ? formatNumberEnUs(balances.lockedTokenBalance) +
                    " " +
                    tokenSymbol +
                    " ($" +
                    formatNumberEnUs(balances.usdLockedTokenBalance) +
                    ")"
                  : "0"}
              </div>
            </div>
          ) : null}

          {balances && balances.reservedTokenBalance !== 0 ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-titillium-web text-medium font-normal uppercase text-dark-200">
                {t("assetItem.reserved")}
                <Tooltip message={t("assetItem.reservedTooltip")} />
              </div>
              <div
                className="text-base font-semibold"
                data-balance={balances && balances.reservedTokenBalance !== 0 ? balances.reservedTokenBalance : 0}
              >
                {balances && balances.reservedTokenBalance !== 0
                  ? formatNumberEnUs(balances.reservedTokenBalance) +
                    " " +
                    tokenSymbol +
                    " ($" +
                    formatNumberEnUs(balances.usdReservedTokenBalance) +
                    ")"
                  : "0"}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col">
            <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">
              {t("assetItem.available")}
            </div>
            <div
              className="text-base font-semibold"
              data-balance={balances && balances.freeTokenBalance !== 0 ? balances.freeTokenBalance : 0}
            >
              {balances
                ? formatNumberEnUs(balances.freeTokenBalance) +
                  " " +
                  tokenSymbol +
                  " ($" +
                  formatNumberEnUs(balances.usdFreeTokenBalance) +
                  ")"
                : "0"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetItemChild;
