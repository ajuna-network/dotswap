import { FC } from "react";
import TooltipIcon from "../../../assets/img/tooltip-icon.svg?react";
import TooltipBottom from "../../../assets/img/tooltip-bottom.svg?react";

interface TooltipProps {
  message: string;
}

const Tooltip: FC<TooltipProps> = ({ message }) => {
  return (
    <div className="group relative flex items-center justify-center">
      <div className="flex items-center justify-center">
        <TooltipIcon />
      </div>
      <div className="invisible absolute -right-[17.5px] -top-[10px] z-10 w-80 -translate-y-full rounded-lg bg-yellow-100 p-2 text-sm opacity-0 drop-shadow-md transition-all duration-300 group-hover:visible group-hover:opacity-100 [&>path]:fill-yellow-100 ">
        <div className="font-inter text-medium font-normal normal-case leading-normal text-dark-300">{message}</div>
        <div className="absolute bottom-0 right-0 -translate-x-1/2 translate-y-full ">
          <TooltipBottom className="[&>path]:fill-yellow-100" />
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
