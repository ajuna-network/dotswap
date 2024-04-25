import { FC, ReactElement } from "react";
import { ToasterType } from "../../../app/types/enum";
import classNames from "classnames";
import { LottieSmall } from "../../../assets/loader";
import SuccessIcon from "../../../assets/img/toasterSuccessIcon.svg?react";
import ArrowOpenLink from "../../../assets/img/open-link-arrow.svg?react";
import ErrorIcon from "../../../assets/img/toasterErrorIcon.svg?react";
import InfoIcon from "../../../assets/img/info-icon.svg?react";
import CloseButtonIcon from "../../../assets/img/closeButtonIcon.svg?react";
import toast from "react-hot-toast";

interface ToasterProps {
  description: string;
  type: ToasterType;
  blockExplorerLink?: string | null;
  close: () => void;
}

const Toaster: FC<ToasterProps> = ({
  description,
  type = ToasterType.SUCCESS,
  close = () => toast.dismiss(),
  blockExplorerLink,
}) => {
  const handleIcon = (type: ToasterType): ReactElement => {
    if (type === ToasterType.SUCCESS) return <SuccessIcon />;
    if (type === ToasterType.PENDING) return <LottieSmall />;
    if (type === ToasterType.ERROR) return <ErrorIcon />;
    if (type === ToasterType.INFO) return <InfoIcon className="[&>path]:fill-white" />;

    return <SuccessIcon />;
  };
  const handleToasterHeaderText = (type: ToasterType) => {
    if (type === ToasterType.SUCCESS) return "Success";
    if (type === ToasterType.PENDING) return "Pending";
    if (type === ToasterType.INFO) return "Info";
  };

  return (
    <div
      className={classNames(
        "flex w-full max-w-toaster items-center rounded-br-lg rounded-tr-lg border-l-2 p-4 tracking-[0.2px] shadow-toaster-box-shadow",
        {
          "border-success bg-green-100": type === ToasterType.SUCCESS,
          "border-blue-400 bg-blue-200": type === ToasterType.PENDING,
          "border-red-400 bg-red-200": type === ToasterType.ERROR,
          "border-yellow-300 bg-yellow-200": type === ToasterType.INFO,
        }
      )}
    >
      <div className="flex w-full gap-3">
        {handleIcon(type)}
        <div
          className={classNames("flex flex-1 flex-col gap-1", {
            "text-green-900": type === ToasterType.SUCCESS,
            "text-blue-900": type === ToasterType.PENDING,
            "text-red-900": type === ToasterType.ERROR,
            "text-yellow-700": type === ToasterType.INFO,
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
