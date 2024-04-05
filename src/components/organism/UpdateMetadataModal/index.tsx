import Modal from "../../atom/Modal";
import { ButtonVariants } from "../../../app/types/enum";
import { checkWalletMetadata, updateWalletMetadata } from "../../../services/polkadotWalletServices";
import { t } from "i18next";
import useStateAndDispatch from "../../../app/hooks/useStateAndDispatch";
import { useEffect, useState } from "react";

const UpdateMetadataModal = () => {
  const [metadataModalOpen, setMetadataModalOpen] = useState({
    modalOpen: false,
    assetHubUpdateAvailable: false,
    relayChainUpdateAvailable: false,
  });
  const { state } = useStateAndDispatch();
  const { api, relayApi, selectedAccount } = state;
  const updateMetadata = async () => {
    if (api && relayApi && selectedAccount) {
      if (metadataModalOpen.assetHubUpdateAvailable) await updateWalletMetadata(api, selectedAccount);
      if (metadataModalOpen.relayChainUpdateAvailable) await updateWalletMetadata(relayApi, selectedAccount);
      setMetadataModalOpen({ modalOpen: false, assetHubUpdateAvailable: false, relayChainUpdateAvailable: false });
    }
  };
  useEffect(() => {
    const updatesCheck = async () => {
      const assetHubUpdateAvailable = await checkWalletMetadata(api!, selectedAccount);
      const relayChainUpdateAvailable = await checkWalletMetadata(relayApi!, selectedAccount);
      if (assetHubUpdateAvailable || relayChainUpdateAvailable) {
        setMetadataModalOpen({
          modalOpen: true,
          assetHubUpdateAvailable,
          relayChainUpdateAvailable,
        });
      }
    };

    updatesCheck();
  }, [api, relayApi, selectedAccount]);

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
