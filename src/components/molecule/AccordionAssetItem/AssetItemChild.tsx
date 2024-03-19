import { useState, useEffect } from "react";
import DotToken from "../../../assets/img/dot-token.svg?react";
import AssetHubToken from "../../../assets/img/asset-hub.svg?react";
import { fetchNativeTokenBalances } from "../../../services/polkadotWalletServices";
import { useAppContext } from "../../../state";
import { fetchTokenUsdPrice } from "../../../app/util/helper";

type AssetItemChildProps = {
  isRelayChain?: boolean;
  decimals: string;
  tokenSymbol: string;
  rpcUrl?: string;
  className?: string;
};

const AssetItemChild = ({
  isRelayChain = false,
  decimals,
  tokenSymbol,
  rpcUrl,
  className = "bg-purple-100 rounded-[10px]",
}: AssetItemChildProps) => {
  const { state } = useAppContext();

  const { selectedAccount, api } = state;

  const [balances, setBalances] = useState({
    floatFreeTokenBalance: 0,
    floatLockedTokenBalance: 0,
    chainName: "",
  });

  const [usdLockedTokenBalance, setUsdLockedTokenBalance] = useState<string>("");
  const [usdFreeTokenBalance, setUsdFreeTokenBalance] = useState<string>("");

  useEffect(() => {
    if (!api) return;
    fetchNativeTokenBalances(selectedAccount.address, decimals, !rpcUrl ? api : undefined, !rpcUrl ? "" : rpcUrl).then(
      (data: any) => {
        const floatFreeTokenBalance = parseFloat(data?.free);
        const floatLockedTokenBalance = parseFloat(data?.reserved);
        const chainName = data?.chainName;
        setBalances({
          floatFreeTokenBalance,
          floatLockedTokenBalance,
          chainName,
        });
      }
    );
  }, [selectedAccount]);

  useEffect(() => {
    if (!balances) return;
    fetchTokenUsdPrice("polkadot").then((data: string | void) => {
      if (typeof data === "string") {
        setUsdLockedTokenBalance((parseFloat(data) * balances.floatLockedTokenBalance).toFixed(2));
        setUsdFreeTokenBalance((parseFloat(data) * balances.floatFreeTokenBalance).toFixed(2));
      }
    });
  }, [balances]);

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
        <div className="flex items-start justify-start gap-8">
          {balances && balances.floatLockedTokenBalance !== 0 ? (
            <div className="flex flex-col">
              <div className="text-small font-normal uppercase text-dark-300">Locked</div>
              <div className="text-small font-semibold">
                {balances && usdLockedTokenBalance !== "" && balances.floatLockedTokenBalance !== 0
                  ? balances.floatLockedTokenBalance + " " + tokenSymbol + " ($" + usdLockedTokenBalance + ")"
                  : "0"}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col">
            <div className="text-small font-normal uppercase text-dark-300">Available balance</div>
            <div className="text-small font-semibold">
              {balances && usdFreeTokenBalance !== ""
                ? balances.floatFreeTokenBalance + " " + tokenSymbol + " ($" + usdFreeTokenBalance + ")"
                : "0"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetItemChild;
