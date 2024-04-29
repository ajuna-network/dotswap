import { FC } from "react";
import hubImage from "../../../assets/img/asset-hub-logo.png";
import { useAppContext } from "../../../state";
import { isApiAvailable } from "../../../app/util/helper";

const ConnectedChain: FC = () => {
  const { state } = useAppContext();
  const { api } = state;

  const link = import.meta.env.VITE_ASSETHUB_LINK;

  const handleChainChange = () => {
    if (link && link !== "") {
      window.open(link, "_blank");
    } else {
      console.error("Asset Hub link not found");
    }
  };
  const apiIsReady = api && isApiAvailable(api);

  return apiIsReady ? (
    <button
      className="flex min-w-max items-center justify-center rounded-full bg-white px-2 py-[6px] shadow-modal-box-shadow"
      onClick={() => {
        handleChainChange();
      }}
    >
      <img src={hubImage} alt={api.runtimeChain.toString().split(" ").slice(-2).join(" ")} width="32" height="32" />
      <span className="px-4 text-medium tracking-[0.2px] text-gray-300">
        {api.runtimeChain.toString().split(" ").slice(-2).join(" ")}
      </span>
    </button>
  ) : null;
};

export default ConnectedChain;
