import React, { FC } from "react";
import TooltipIcon from "../../../assets/img/tooltip-icon.svg?react";
import TooltipBottom from "../../../assets/img/tooltip-bottom.svg?react";

interface TooltipProps {
  message: string;
  children?: React.ReactNode;
  className?: string;
}

const Tooltip: FC<TooltipProps> = ({ message, children, className = "right-1/2" }) => {
  return (
    <div className="group relative z-50 flex items-center justify-center">
      <div
        className={`invisible absolute -top-[10px] z-10 w-80 max-w-max -translate-y-full translate-x-[24px] rounded-lg bg-yellow-100 p-2 text-sm opacity-0 drop-shadow-md transition-all duration-300 group-hover:visible group-hover:opacity-100 dark:bg-primary-500 [&>path]:fill-yellow-100 ${className}`}
      >
        <div className="font-inter text-medium font-normal normal-case leading-normal text-dark-300 dark:font-open-sans dark:text-white">
          {message}
        </div>
        <div className="absolute bottom-0 right-0 -translate-x-1/2 translate-y-full ">
          <TooltipBottom className="[&>path]:fill-yellow-100 dark:[&>path]:fill-primary-500" />
        </div>
      </div>
      <div className="flex items-center justify-center">{children ? children : <TooltipIcon />}</div>
    </div>
  );
};

export default Tooltip;
