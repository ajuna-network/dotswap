import { useLocation } from "react-router-dom";
import { LiquidityPageType } from "../../app/types/enum";
import AddPoolLiquidity from "../../components/organism/AddPoolLiquidity";
import WithdrawPoolLiquidity from "../../components/organism/WithdrawPoolLiquidity";
import CreatePool from "../../components/organism/CreatePool";

const LiquidityPage = () => {
  const location = useLocation();

  const renderPoolComponent = () => {
    if (location.state?.pageType === LiquidityPageType.addLiquidity) {
      return <AddPoolLiquidity />;
    } else if (location.state?.pageType === LiquidityPageType.removeLiquidity) {
      return <WithdrawPoolLiquidity />;
    } else {
      return <CreatePool />;
    }
  };

  return <div className="flex w-full flex-col items-center pb-10 pt-32">{renderPoolComponent()}</div>;
};

export default LiquidityPage;
