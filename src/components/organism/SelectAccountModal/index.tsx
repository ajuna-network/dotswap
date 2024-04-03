import Modal from "../../atom/Modal";
import RandomTokenIcon from "../../../assets/img/random-token-icon.svg?react";
import LogoutIcon from "../../../assets/img/logout-icon.svg?react";
import ArrowDownIcon from "../../../assets/img/arrow-left.svg?react";
import type { WalletAccount } from "@talismn/connect-wallets";
import { useAppContext } from "../../../state/index.tsx";
import { useEffect, useState } from "react";
import { getWalletBySource } from "@talismn/connect-wallets";
import { ActionType } from "../../../app/types/enum";
import { reduceAddress } from "../../../app/util/helper";
import InfoMessage from "../../atom/InfoMessage/index.tsx";

interface SelectAccountModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  walletAccounts: WalletAccount[];
  handleConnect: (account: WalletAccount) => void;
  handleDisconnect: () => void;
}

const SelectAccountModal = ({ open, title, onClose, handleConnect, handleDisconnect }: SelectAccountModalProps) => {
  const { state, dispatch } = useAppContext();
  const { selectedAccount, accounts } = state;

  useEffect(() => {
    if (accounts.length === 0 && selectedAccount?.wallet) {
      const fetchAccounts = async () => {
        const wallet = await getWalletBySource(selectedAccount?.wallet?.extensionName);
        await wallet?.enable("DOT-ACP");
        const accounts = await wallet?.getAccounts();
        dispatch({
          type: ActionType.SET_ACCOUNTS,
          payload: accounts || [],
        });
      };
      fetchAccounts();
    }
  }, [accounts, selectedAccount]);

  const [infoModal, setInfoModal] = useState(true);

  const handleClose = () => {
    setInfoModal(false);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="flex min-w-[450px] flex-col gap-1 py-7">
        <div className="flex w-full items-start justify-start text-medium">Select Account</div>
        {accounts?.map((account: WalletAccount, index: any) => {
          return (
            <div key={index} className="flex flex-col rounded-lg bg-purple-50 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex flex-1 items-center gap-2">
                  <RandomTokenIcon />
                  <div className="flex w-full flex-col items-start">
                    <div className="text-base font-medium text-gray-300">{account?.name}</div>
                    <div className="text-xs font-normal text-gray-300">{reduceAddress(account?.address, 6, 6)}</div>
                  </div>
                  {selectedAccount?.address === account?.address && (
                    <button
                      className="flex -rotate-90 justify-end text-xs font-normal text-gray-300"
                      onClick={handleDisconnect}
                    >
                      <ArrowDownIcon />
                    </button>
                  )}
                </div>
                {selectedAccount?.address !== account?.address && (
                  <button
                    className="flex justify-end text-xs font-normal text-gray-300"
                    onClick={() => handleConnect(account)}
                  >
                    <LogoutIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {infoModal && (
        <InfoMessage
          title={"Need to see all your accounts?"}
          message="Head over to your wallet and customize which accounts can access DEDSwap."
          handleClose={handleClose}
        />
      )}
    </Modal>
  );
};

export default SelectAccountModal;
