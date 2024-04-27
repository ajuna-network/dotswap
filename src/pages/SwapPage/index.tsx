import { FC, useEffect, useState } from "react";
import SwapTokens from "../../components/organism/SwapTokens";
import { ActionType, SwapOrPools } from "../../app/types/enum";
import PoolsPage from "../PoolsPage";
import classNames from "classnames";
import { getAllLiquidityPoolsTokensMetadata, getAllPools } from "../../services/poolServices";
import { useAppContext } from "../../state";
import { useLocation, useNavigate } from "react-router-dom";
import { SWAP_ROUTE } from "../../app/router/routes";
import { urlTo } from "../../app/util/helper";
import { createPoolCardsArray } from "../../services/poolServices";
import { useTranslation } from "react-i18next";

const SwapPage: FC = () => {
  const { state, dispatch } = useAppContext();
  const { api, pools, selectedAccount, tokenBalances } = state;
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [swapOrPools, setSwapOrPools] = useState<SwapOrPools>(
    location.state?.pageType === SwapOrPools.pools ? SwapOrPools.pools : SwapOrPools.swap
  );

  const navigateToSwap = () => {
    navigate(urlTo("/" + SWAP_ROUTE), {
      state: { pageType: SwapOrPools.swap },
    });
    setSwapOrPools(SwapOrPools.swap);
  };

  const navigateToPools = () => {
    navigate(urlTo("/" + SWAP_ROUTE), {
      state: { pageType: SwapOrPools.pools },
    });
    setSwapOrPools(SwapOrPools.pools);
  };

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
      fetchPools().then();
    }
  }, [api]);

  const renderSwapOrPools = () => {
    if (swapOrPools === SwapOrPools.swap) {
      return <SwapTokens />;
    }
    return <PoolsPage />;
  };
  return (
    <div className="flex w-full flex-1 flex-col items-start justify-center px-6 py-8">
      <div
        className="z-10 flex gap-2 rounded-3xl bg-white p-1 
      dark:rounded-sm dark:bg-[#FFFFFFCC] dark:outline dark:outline-[6px] dark:outline-black
      "
      >
        <button
          className={classNames(
            "h-[37px] w-[71px] rounded-3xl  dark:rounded-sm dark:px-4 dark:py-3 dark:font-open-sans dark:text-small dark:font-extrabold dark:uppercase",
            {
              "bg-purple-100": swapOrPools === SwapOrPools.swap,
            }
          )}
          onClick={() => navigateToSwap()}
        >
          {t("button.swap")}
        </button>
        <button
          className={classNames(
            "h-[37px] w-[71px] rounded-3xl  dark:rounded-sm dark:px-4 dark:py-3 dark:font-open-sans dark:text-small dark:font-extrabold dark:uppercase",
            {
              "bg-purple-100": swapOrPools === SwapOrPools.pools,
            }
          )}
          onClick={() => navigateToPools()}
        >
          {t("button.pools")}
        </button>
      </div>
      <div
        className={classNames({
          "flex w-full flex-1 items-start justify-center py-8": swapOrPools === SwapOrPools.swap,
          "flex w-full flex-1 flex-col py-8": swapOrPools === SwapOrPools.pools,
        })}
      >
        {renderSwapOrPools()}
      </div>
    </div>
  );
};
export default SwapPage;
