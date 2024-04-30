import { FC } from "react";
import DotSwapLogo from "../../../assets/img/dot-swap-logo-alpha.svg?react";
import DedSwapLogo from "../../../assets/img/ded-bird-logo.png";

interface AppLogoProps {
  classNames?: string;
}

const AppLogo: FC = ({ classNames = "mb-12 pl-4 dedswap:p-0 dedswap:w-full dedswap:mb-0" }: AppLogoProps) => {
  return (
    <div className={classNames}>
      <DotSwapLogo className="dedswap:hidden" />
      <div className="hidden w-full justify-center dedswap:flex">
        <img src={DedSwapLogo} alt="Dedswap Logo" className="w-24" />
      </div>
    </div>
  );
};

export default AppLogo;
