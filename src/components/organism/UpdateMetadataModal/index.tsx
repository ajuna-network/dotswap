import { ApiPromise } from "@polkadot/api";
import { WalletAccount } from "@talismn/connect-wallets";
import Modal from "../../atom/Modal";
import { ButtonVariants } from "../../../app/types/enum";
import { updateWalletMetadata } from "../../../services/polkadotWalletServices";
import { t } from "i18next";

type UpdateMetadataModalProps = {
  metadataModalOpen: boolean;
  setMetadataModalOpen: (isOpen: boolean) => void;
  api: ApiPromise | null;
  walletConnected: WalletAccount;
};

const UpdateMetadataModal = ({
  metadataModalOpen,
  setMetadataModalOpen,
  api,
  walletConnected,
}: UpdateMetadataModalProps) => {
  const updateMetadata = async () => {
    if (api && walletConnected) {
      await updateWalletMetadata(api, walletConnected);
      setMetadataModalOpen(false);
    }
  };

  return (
    <Modal isOpen={metadataModalOpen} onClose={() => setMetadataModalOpen(false)}>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full border-b border-purple-100 pb-3">
          <p className="max-w-[390px] font-inter text-large font-normal text-black">{t("modal.updateMetadata")}</p>
        </div>
        <div className="flex w-full max-w-[340px] gap-2">
          <button
            className={ButtonVariants.btnSecondaryWhiteNoBorder}
            onClick={() => {
              setMetadataModalOpen(false);
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
