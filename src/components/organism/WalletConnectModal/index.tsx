import Button from "../../atom/Button";
import Modal from "../../atom/Modal";
import { WalletConnectSteps } from "../../../app/types/enum";
import { ModalStepProps } from "../../../app/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { ActionType } from "../../../app/types/enum";
import { useAppContext } from "../../../state/index.tsx";
import Identicon from "@polkadot/react-identicon";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface WalletConnectModalProps {
  open: boolean;
  title: string;
  modalStep: ModalStepProps;
  supportedWallets: Wallet[];
  walletAccounts: WalletAccount[];
  setModalStep: (step: ModalStepProps) => void;
  handleConnect: (account: WalletAccount) => void;
  handleWalletInstall: (wallet: Wallet) => void;
  onClose: () => void;
  setWalletConnectOpen: (isOpen: boolean) => void;
  onBack?: () => void | undefined;
}

const WalletConnectModal: FC<WalletConnectModalProps> = ({
  open,
  title,
  modalStep,
  supportedWallets,
  walletAccounts,
  onClose,
  onBack,
  setModalStep,
  handleConnect,
  handleWalletInstall,
}) => {
  const { dispatch } = useAppContext();
  const { t } = useTranslation();

  const handleContinueClick = (accounts: WalletAccount[]) => {
    setModalStep({ step: WalletConnectSteps.stepAddresses });
    dispatch({ type: ActionType.SET_ACCOUNTS, payload: accounts });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title} onBack={onBack}>
      <div className="flex min-w-[450px] flex-col gap-5 p-4">
        {modalStep?.step === WalletConnectSteps.stepExtensions
          ? supportedWallets?.map((wallet: Wallet) => {
              return (
                <div key={wallet?.extensionName} className="flex cursor-pointer items-center gap-5">
                  <div className="flex basis-16">
                    <img src={wallet?.logo?.src} alt={wallet?.logo?.alt} width={36} height={36} />
                  </div>
                  <span className="flex basis-full items-center">{wallet?.title}</span>
                  <div className="flex basis-24 items-center">
                    {wallet?.installed ? (
                      <Button
                        className="btn-secondary-white"
                        onClick={async () => {
                          try {
                            await wallet?.enable("DOT-ACP");
                            await wallet?.getAccounts().then((accounts) => {
                              handleContinueClick(accounts);
                            });
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                      >
                        {t("button.continue")}
                      </Button>
                    ) : (
                      <Button
                        className="btn-secondary-white"
                        onClick={() => {
                          handleWalletInstall(wallet);
                        }}
                      >
                        {t("button.install")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          : null}
        {modalStep.step === WalletConnectSteps.stepAddresses
          ? walletAccounts?.map((account: WalletAccount, index: any) => {
              return (
                <div key={index} className="flex cursor-pointer flex-col rounded-lg bg-purple-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Identicon value={account?.address} size={24} theme="polkadot" className="!cursor-pointer" />
                    <button className="flex flex-col items-start" onClick={() => handleConnect(account)}>
                      <div className="text-base font-medium text-gray-300">{account?.name}</div>
                      <div className="text-xs font-normal text-gray-300">{account?.address}</div>
                    </button>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </Modal>
  );
};

export default WalletConnectModal;
