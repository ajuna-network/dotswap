import { t } from "i18next";
import { useEffect, useState } from "react";
import { PoolCardProps } from "../../app/types";
import PlaceholderIcon from "../../assets/img/token-icon.svg?react";
import TokenIcon from "../../components/atom/TokenIcon";
import { LottieLarge } from "../../assets/loader";
import { useAppContext } from "../../state";
import PoolDataCard from "../../components/molecule/PoolDataCard/PoolDataCard";

const PoolsPage = () => {
  const { state } = useAppContext();
  const { selectedAccount, pools, poolsCards } = state;

  const [isPoolsLoading, setPoolsIsLoading] = useState<boolean>(selectedAccount ? true : false);

  useEffect(() => {
    if (poolsCards.length > 0) {
      setPoolsIsLoading(false);
    }
  }, [poolsCards]);

  return (
    <div className="relative flex h-full w-full flex-1 flex-col items-center">
      {isPoolsLoading ? (
        <div className="flex items-center justify-center">
          <LottieLarge />
        </div>
      ) : pools.length > 0 && poolsCards.length > 0 ? (
        <div className="grid w-full grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {poolsCards.map((item: PoolCardProps, index: number) => {
            return (
              <PoolDataCard
                key={index}
                tokenPair={item.name}
                nativeTokens={item.totalTokensLocked.nativeToken.formattedValue}
                assetTokens={item.totalTokensLocked.assetToken.formattedValue}
                lpTokenAsset={item.lpTokenAsset}
                assetTokenIcon={<TokenIcon tokenSymbol={item.name.split("–")[1]} width="32" height="32" />}
                nativeTokenIcon={<TokenIcon tokenSymbol={item.name.split("–")[0]} width="32" height="32" />}
                assetTokenId={item.assetTokenId}
                lpTokenId={item.lpTokenId}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-white p-6">
          <PlaceholderIcon />
          <div className="text-center text-gray-300">
            {selectedAccount ? t("poolsPage.noActiveLiquidityPositions") : t("poolsPage.connectWalletToView")}
          </div>
        </div>
      )}
    </div>
  );
};
export default PoolsPage;
