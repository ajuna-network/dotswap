import { FC } from "react";
import InfoIcon from "../../../assets/img/info-icon.svg?react";
import CloseIcon from "../../../assets/img/closeButtonIcon.svg?react";

type InfoMessageProps = {
  title: string;
  message: string;
  handleClose: () => void;
};

const InfoMessage: FC<InfoMessageProps> = ({ title, message, handleClose }) => {
  return (
    <div className="flex max-w-[450px] gap-2 rounded-r-lg border-l-2 border-solid border-purple-300 bg-purple-100 p-4">
      <div className="flex items-start justify-start p-1">
        <InfoIcon />
      </div>
      <div className="flex flex-1 flex-col items-start justify-start gap-1 text-left">
        <div className="font-medium">{title}</div>
        <div className="text-medium text-dark-300">{message}</div>
      </div>
      <button className="flex items-start justify-end" onClick={handleClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default InfoMessage;
