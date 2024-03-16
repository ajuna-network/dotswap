import { t } from "i18next";
import { useEffect, useState } from "react";
import { PoolCardProps } from "../../app/types";
import TokenIcon from "../../assets/img/token-icon.svg?react";
import { LottieLarge } from "../../assets/loader";
import { useAppContext } from "../../state";
import PoolDataCard from "./PoolDataCard";
import { createPoolCardsArray } from "../../services/poolServices";

const PoolsPage = () => {
  const { state, dispatch } = useAppContext();
  const { selectedAccount, pools, poolsCards, api, tokenBalances } = state;

  const [isPoolsLoading, setPoolsIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const updatePoolsCards = async () => {
      if (api && pools.length) await createPoolCardsArray(api, dispatch, pools, selectedAccount);
    };

    updatePoolsCards().then();
  }, [pools, selectedAccount, tokenBalances]);

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
              <div key={index}>
                <PoolDataCard
                  tokenPair={item.name}
                  nativeTokens={item.totalTokensLocked.nativeToken.formattedValue}
                  assetTokens={item.totalTokensLocked.assetToken.formattedValue}
                  lpTokenAsset={item.lpTokenAsset}
                  assetTokenIcon={item.totalTokensLocked.assetToken.icon}
                  nativeTokenIcon={item.totalTokensLocked.nativeToken.icon}
                  assetTokenId={item.assetTokenId}
                  lpTokenId={item.lpTokenId}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-white p-6">
          <TokenIcon />
          <div className="text-center text-gray-300">
            {selectedAccount ? t("poolsPage.noActiveLiquidityPositions") : t("poolsPage.connectWalletToView")}
          </div>
        </div>
      )}
    </div>
  );
};
export default PoolsPage;
