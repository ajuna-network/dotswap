import { FC, useEffect, useState } from "react";
import SwapTokens from "../../components/organism/SwapTokens";
import { ActionType, SwapOrPools } from "../../app/types/enum";
import PoolsPage from "../PoolsPage";
import classNames from "classnames";
import { getAllLiquidityPoolsTokensMetadata, getAllPools } from "../../services/poolServices";
import { useAppContext } from "../../state";

const SwapPage: FC = () => {
  const { state, dispatch } = useAppContext();
  const { api } = state;
  const [swapOrPools, setSwapOrPools] = useState<SwapOrPools>(SwapOrPools.swap);

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

  const renderSwapOrPools = () => {
    if (swapOrPools === SwapOrPools.swap) {
      return <SwapTokens />;
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
          onClick={() => setSwapOrPools(SwapOrPools.swap)}
        >
          Swap
        </button>
        <button
          className={classNames("h-[37px] w-[71px] rounded-3xl", {
            "bg-purple-100": swapOrPools === SwapOrPools.pools,
          })}
          onClick={() => setSwapOrPools(SwapOrPools.pools)}
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
