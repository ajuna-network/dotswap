import { t } from "i18next";
import { useEffect, useState } from "react";
import { PoolCardProps } from "../../app/types";
import { ReactComponent as TokenIcon } from "../../assets/img/token-icon.svg";
import { LottieLarge } from "../../assets/loader";
import { useAppContext } from "../../state";
import PoolDataCard from "./PoolDataCard";
import { createPoolCardsArray, getAllLiquidityPoolsTokensMetadata, getAllPools } from "../../services/poolServices";
import { ActionType } from "../../app/types/enum";

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
    if (api) {
      const fetchPools = async () => {
        const pools = await getAllPools(api);
        const poolsTokenMetadata = await getAllLiquidityPoolsTokensMetadata(api);

        if (pools) {
          dispatch({ type: ActionType.SET_POOLS, payload: pools });
          dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: poolsTokenMetadata });
        }
      };
      fetchPools();
    }
  }, [api]);

  useEffect(() => {
    if (poolsCards.length > 0) {
      setPoolsIsLoading(false);
    }
  }, [poolsCards]);

  return (
    // <div className="flex w-full items-center justify-center px-20 pb-16 pt-16">
    <div className="flex w-full max-w-[1280px] flex-col">
      {isPoolsLoading ? (
        <div className="flex items-center justify-center">
          <LottieLarge />
        </div>
      ) : pools.length > 0 && poolsCards.length > 0 ? (
        <div className="mt-14 grid grid-cols-3 gap-4">
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
        <div className="flex h-[664px] flex-col items-center justify-center gap-4 rounded-2xl bg-white p-6">
          <TokenIcon />
          <div className="text-center text-gray-300">
            {selectedAccount ? t("poolsPage.noActiveLiquidityPositions") : t("poolsPage.connectWalletToView")}
          </div>
        </div>
      )}
    </div>
    // </div>
  );
};
export default PoolsPage;
