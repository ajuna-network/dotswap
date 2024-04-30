import { FC } from "react";
import DotSwapLogo from "../../../assets/img/dot-swap-logo-alpha.svg?react";
import DedSwapLogo from "../../../assets/img/ded-bird-logo.png";

const AppLogo: FC = () => {
  return (
    <>
      <DotSwapLogo className="dark:hidden" />
      <img src={DedSwapLogo} alt="Dedswap Logo" className="hidden w-24 justify-center dark:flex" />
    </>
  );
};

export default AppLogo;
