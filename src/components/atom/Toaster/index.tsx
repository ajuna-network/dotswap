import { FC, ReactElement } from "react";
import { ToasterType } from "../../../app/types/enum";
import classNames from "classnames";
import { LottieSmall } from "../../../assets/loader";
import SuccessIcon from "../../../assets/img/toasterSuccessIcon.svg?react";
import ArrowOpenLink from "../../../assets/img/open-link-arrow.svg?react";
import ErrorIcon from "../../../assets/img/toasterErrorIcon.svg?react";
import CloseButtonIcon from "../../../assets/img/closeButtonIcon.svg?react";

interface ToasterProps {
  description: string;
  type: ToasterType;
  blockExplorerLink?: string;
  close: () => void;
}

const Toaster: FC<ToasterProps> = ({ description, type = ToasterType.SUCCESS, close, blockExplorerLink }) => {
  const handleIcon = (type: ToasterType): ReactElement => {
    if (type === ToasterType.SUCCESS) return <SuccessIcon />;
    if (type === ToasterType.PENDING) return <LottieSmall />;
    if (type === ToasterType.ERROR) return <ErrorIcon />;

    return <SuccessIcon />;
  };
  const handleToasterHeaderText = (type: ToasterType) => {
    if (type === ToasterType.SUCCESS) return "Success";
    if (type === ToasterType.PENDING) return "Pending";
  };

  return (
    <div
      className={classNames(
        "flex w-full max-w-toaster items-center rounded-br-lg rounded-tr-lg border-l-2 p-4 tracking-[0.2px] shadow-toaster-box-shadow",
        {
          "border-success bg-green-100": type === ToasterType.SUCCESS,
          "border-blue-400 bg-blue-200": type === ToasterType.PENDING,
          "border-red-400 bg-red-200": type === ToasterType.ERROR,
        }
      )}
    >
      <div className="flex gap-3">
        {handleIcon(type)}
        <div
          className={classNames("flex flex-col gap-1", {
            "text-green-900": type === ToasterType.SUCCESS,
            "text-blue-900": type === ToasterType.PENDING,
            "text-red-900": type === ToasterType.ERROR,
          })}
        >
          <div className="font-medium">{handleToasterHeaderText(type)}</div>
          <div className="text-medium font-normal">{description}</div>
          {blockExplorerLink && blockExplorerLink !== "" && (
            <div className="flex gap-0.5 pt-1">
              <a
                href={blockExplorerLink}
                target="_blank"
                rel={"noreferrer"}
                className="cursor-pointer border-b border-solid border-black pb-0.5 font-unbounded-variable text-small leading-tight tracking-[0.06em] text-black text-opacity-90"
              >
                View in block explorer
              </a>
              <ArrowOpenLink />
            </div>
          )}
        </div>
        <div>
          <button onClick={close}>
            <CloseButtonIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toaster;
