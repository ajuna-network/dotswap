import TooltipIcon from "../../../assets/img/tooltip-icon.svg?react";

const Tooltip = ({ message }: { message: string }) => {
  return (
    <div className="group relative flex items-center justify-center">
      <div className="flex items-center justify-center">
        <TooltipIcon />
      </div>
      <div className="invisible absolute -right-[17.5px] -top-[10px] z-10 w-80 -translate-y-full rounded-lg bg-yellow-100 p-2 text-sm opacity-0 drop-shadow-md transition-all duration-300 group-hover:visible group-hover:opacity-100 [&>path]:fill-yellow-100 ">
        <div className="font-inter text-medium font-normal normal-case leading-normal text-dark-300">{message}</div>
        <div className="absolute bottom-0 right-0 -translate-x-1/2 translate-y-full ">
          <svg width="24" height="8" viewBox="0 0 24 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className="fill-yellow-100"
              d="M0.832284 0H23.379C19.1366 0 14.8943 4.53165 13.055 6.77361C12.5938 7.33581 11.6697 7.30068 11.2421 6.71249C9.59782 4.45039 5.73929 0 0.832284 0Z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
