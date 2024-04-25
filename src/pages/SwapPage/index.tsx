import { FC, useEffect, useState } from "react";
import SwapTokens from "../../components/organism/SwapTokens";
import { SwapOrPools } from "../../app/types/enum";
import PoolsPage from "../PoolsPage";
import classNames from "classnames";
import { getAllLiquidityPoolsTokensMetadata } from "../../services/poolServices";
import { useAppContext } from "../../state";
import { useLocation, useNavigate } from "react-router-dom";
import { SWAP_ROUTE } from "../../app/router/routes";
import { urlTo, isApiAvailable } from "../../app/util/helper";
import { createPoolCardsArray } from "../../services/poolServices";

const SwapPage: FC = () => {
  const { state, dispatch } = useAppContext();
  const { api, pools, selectedAccount, tokenBalances } = state;
  const location = useLocation();
  const navigate = useNavigate();

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
    if (!api || !pools) return;
    const updatePoolsCards = async () => {
      const isApiReady = await isApiAvailable(api);
      if (isApiReady && pools.length) await createPoolCardsArray(api, dispatch, pools, selectedAccount);
    };
    updatePoolsCards();
  }, [pools, selectedAccount, tokenBalances]);

  useEffect(() => {
    if (api) {
      const fetchPools = async () => {
        await getAllLiquidityPoolsTokensMetadata(api, dispatch);
      };
      fetchPools();
    }
  }, [api]);

  const renderSwapOrPools = () => {
    if (swapOrPools === SwapOrPools.swap) {
      const from = new URLSearchParams(location.search).get("from") || "";
      const to = new URLSearchParams(location.search).get("to") || "";
      return <SwapTokens from={from} to={to} />;
    }
    return <PoolsPage />;
  };
  return (
    <div className="flex w-full flex-1 flex-col items-start justify-center px-6 py-8">
      <div className="z-10 flex gap-2 rounded-3xl bg-white p-1">
        <button
          className={classNames("h-[37px] w-[71px] rounded-3xl", {
            "bg-purple-100": swapOrPools === SwapOrPools.swap,
          })}
          onClick={() => navigateToSwap()}
        >
          Swap
        </button>
        <button
          className={classNames("h-[37px] w-[71px] rounded-3xl", {
            "bg-purple-100": swapOrPools === SwapOrPools.pools,
          })}
          onClick={() => navigateToPools()}
        >
          Pools
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
