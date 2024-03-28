import { useState, useEffect } from "react";
import DotToken from "../../../assets/img/dot-token.svg?react";
import AssetHubToken from "../../../assets/img/asset-hub.svg?react";
import { fetchNativeTokenBalances } from "../../../services/polkadotWalletServices";
import { useAppContext } from "../../../state";

type AssetItemChildProps = {
  isRelayChain?: boolean;
  decimals: string;
  tokenSymbol: string;
  tokenSpotPrice: string;
  rpcUrl?: string;
  className?: string;
};

const AssetItemChild = ({
  isRelayChain = false,
  decimals,
  tokenSymbol,
  tokenSpotPrice,
  rpcUrl,
  className = "bg-purple-100 rounded-[10px]",
}: AssetItemChildProps) => {
  const { state } = useAppContext();

  const { selectedAccount, api } = state;

  const [balances, setBalances] = useState({
    freeTokenBalance: 0,
    usdFreeTokenBalance: 0,
    lockedTokenBalance: 0,
    usdLockedTokenBalance: 0,
    chainName: "",
  });

  useEffect(() => {
    if (!api) return;
    fetchNativeTokenBalances(selectedAccount.address, decimals, !rpcUrl ? api : undefined, !rpcUrl ? "" : rpcUrl).then(
      (data: any) => {
        const floatFreeTokenBalance = parseFloat(data?.free);
        const floatUsdFreeTokenBalance = parseFloat(data?.free) * parseFloat(tokenSpotPrice);
        const floatLockedTokenBalance = parseFloat(data?.reserved);
        const floatUsdLockedTokenBalance = parseFloat(data?.reserved) * parseFloat(tokenSpotPrice);
        const chainName = data?.chainName;

        console.log(data, `${tokenSymbol}: ${rpcUrl ? "relay chain" : "asset hub"}`); // TODO: remove after testing locked balance

        setBalances({
          freeTokenBalance: floatFreeTokenBalance,
          usdFreeTokenBalance: floatUsdFreeTokenBalance,
          lockedTokenBalance: floatLockedTokenBalance,
          usdLockedTokenBalance: floatUsdLockedTokenBalance,
          chainName: chainName,
        });
      }
    );
  }, [selectedAccount]);

  return (
    <div className={`flex w-full flex-col transition-all duration-300 ease-in-out ${className}`}>
      <div className="flex w-full flex-row justify-between px-6 py-5">
        <div className="flex items-start justify-start gap-3 font-normal">
          {!isRelayChain ? <AssetHubToken width={24} height={24} /> : <DotToken width={24} height={24} />}
          <div className="flex flex-col gap-1">
            <div className="text-heading-6 leading-none">
              {balances.chainName !== "" ? balances.chainName : "Not connected to a chain"}
            </div>
            <div className="text-medium leading-none">{isRelayChain === true ? "Relay" : "Parachain"}</div>
          </div>
        </div>
        <div className="flex items-start justify-end gap-8">
          {balances && balances.lockedTokenBalance !== 0 ? (
            <div className="flex flex-col">
              <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">Locked</div>
              <div className="text-base font-semibold">
                {balances && balances.lockedTokenBalance !== 0
                  ? balances.lockedTokenBalance.toFixed(2) +
                    " " +
                    tokenSymbol +
                    " ($" +
                    balances.usdLockedTokenBalance.toFixed(2) +
                    ")"
                  : "0"}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col">
            <div className="font-titillium-web text-medium font-normal uppercase text-dark-200">Available balance</div>
            <div className="text-base font-semibold">
              {balances
                ? balances.freeTokenBalance.toFixed(2) +
                  " " +
                  tokenSymbol +
                  " ($" +
                  balances.usdFreeTokenBalance.toFixed(2) +
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
