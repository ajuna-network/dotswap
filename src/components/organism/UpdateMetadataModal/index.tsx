import Modal from "../../atom/Modal";
import { ButtonVariants } from "../../../app/types/enum";
import { checkWalletMetadata, updateWalletMetadata } from "../../../services/polkadotWalletServices";
import { t } from "i18next";
import useStateAndDispatch from "../../../app/hooks/useStateAndDispatch";
import { useEffect, useState } from "react";
import { WalletAccount } from "@talismn/connect-wallets";

const UpdateMetadataModal = ({ account }: { account: WalletAccount | undefined }) => {
  const [metadataModalOpen, setMetadataModalOpen] = useState({
    modalOpen: false,
    assetHubUpdateAvailable: false,
    relayChainUpdateAvailable: false,
  });
  const { state } = useStateAndDispatch();
  const { api, relayApi } = state;
  const updateMetadata = async () => {
    if (api && relayApi && account) {
      if (metadataModalOpen.assetHubUpdateAvailable) await updateWalletMetadata(api, account);
      if (metadataModalOpen.relayChainUpdateAvailable) await updateWalletMetadata(relayApi, account);
      setMetadataModalOpen({ modalOpen: false, assetHubUpdateAvailable: false, relayChainUpdateAvailable: false });
    }
  };
  useEffect(() => {
    if (!api || !relayApi || !account) return;
    const updatesCheck = async () => {
      const assetHubUpdateAvailable = await checkWalletMetadata(api!, account);
      const relayChainUpdateAvailable = await checkWalletMetadata(relayApi!, account);
      if (assetHubUpdateAvailable || relayChainUpdateAvailable) {
        setMetadataModalOpen({
          modalOpen: true,
          assetHubUpdateAvailable,
          relayChainUpdateAvailable,
        });
      }
    };
    updatesCheck();
  }, [api, relayApi, account]);

  return (
    <Modal
      isOpen={metadataModalOpen.modalOpen}
      onClose={() =>
        setMetadataModalOpen({ modalOpen: false, assetHubUpdateAvailable: false, relayChainUpdateAvailable: false })
      }
    >
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full border-b border-purple-100 pb-3">
          <p className="max-w-[390px] font-inter text-large font-normal text-black">{t("modal.updateMetadata")}</p>
        </div>
        <div className="flex w-full max-w-[340px] gap-2">
          <button
            className={ButtonVariants.btnSecondaryWhiteNoBorder}
            onClick={() => {
              setMetadataModalOpen({
                modalOpen: false,
                assetHubUpdateAvailable: false,
                relayChainUpdateAvailable: false,
              });
            }}
          >
            Cancel
          </button>
          <button
            className={ButtonVariants.btnPrimaryPinkSm}
            onClick={() => {
              updateMetadata();
            }}
          >
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};
export default UpdateMetadataModal;
