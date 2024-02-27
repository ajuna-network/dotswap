import { FC, useState } from "react";
import SwapTokens from "../../components/organism/SwapTokens";
import { SwapOrPools } from "../../app/types/enum";
import PoolsPage from "../PoolsPage";
import classNames from "classnames";

const SwapPage: FC = () => {
  const [swapOrPools, setSwapOrPools] = useState<SwapOrPools>(SwapOrPools.swap);

  const renderSwapOrPools = () => {
    if (swapOrPools === SwapOrPools.swap) {
      return <SwapTokens />;
    }
    return <PoolsPage />;
  };
  return (
    <div className="relative flex w-full flex-col items-center pb-10 pt-32">
      <div className="absolute left-[30px] top-[75px] flex gap-2 rounded-3xl bg-white p-1">
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
          "max-w-[460px]": swapOrPools === SwapOrPools.swap,
          "flex w-full max-w-[1280px] flex-col items-center justify-center": swapOrPools === SwapOrPools.pools,
        })}
      >
        {renderSwapOrPools()}
      </div>
    </div>
  );
};
export default SwapPage;
