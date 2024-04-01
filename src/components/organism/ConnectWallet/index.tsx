import AccountImage from "../../../assets/img/account-image-icon.svg?react";
import { ActionType, ButtonVariants, WalletConnectSteps } from "../../../app/types/enum.ts";
import { reduceAddress } from "../../../app/util/helper";
import {
  connectWalletAndFetchBalance,
  getSupportedWallets,
  handleDisconnect,
} from "../../../services/polkadotWalletServices";
import { useAppContext } from "../../../state/index.tsx";
import Button from "../../atom/Button/index.tsx";
import { t } from "i18next";
import { useEffect, useState } from "react";
import WalletConnectModal from "../WalletConnectModal/index.tsx";
import LocalStorage from "../../../app/util/localStorage.ts";
import { ModalStepProps } from "../../../app/types/index.ts";
import type { Timeout } from "react-number-format/types/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import dotAcpToast from "../../../app/util/toast.tsx";
import { LottieSmall } from "../../../assets/loader/index.tsx";

const ConnectWallet = () => {
  const { state, dispatch } = useAppContext();
  const { walletConnectLoading, api } = state;

  const [walletAccount, setWalletAccount] = useState<WalletAccount>({} as WalletAccount);
  const [modalStep, setModalStep] = useState<ModalStepProps>({ step: WalletConnectSteps.stepExtensions });
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([] as Wallet[]);

  const walletConnected = LocalStorage.get("wallet-connected");

  const connectWallet = () => {
    setWalletConnectOpen(true);
  };

  const handleConnect = async (account: WalletAccount) => {
    try {
      setWalletConnectOpen(false);
      await connectWalletAndFetchBalance(dispatch, api, account);
    } catch (error) {
      dotAcpToast.error(`Error connecting: ${error}`);
    }
  };

  const onBack = () => {
    setModalStep({ step: WalletConnectSteps.stepExtensions });
  };

  const disconnectWallet = () => {
    handleDisconnect(dispatch);
    setWalletAccount({} as WalletAccount);
    setModalStep({ step: WalletConnectSteps.stepExtensions });
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
      payload: "",
    });
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEE,
      payload: "",
    });
  };

  useEffect(() => {
    if (walletConnected) {
      setWalletAccount(walletConnected);
    }
  }, [walletConnected?.address]);

  useEffect(() => {
    let timeout: Timeout;
    if (!walletConnectOpen) {
      timeout = setTimeout(() => setModalStep({ step: WalletConnectSteps.stepExtensions }), 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [walletConnectOpen]);

  useEffect(() => {
    const wallets = getSupportedWallets();
    setSupportedWallets(wallets);
  }, []);

  return (
    <>
      <div className="flex items-center justify-end gap-8">
        {walletConnected ? (
          <>
            {walletConnectLoading ? (
              <Button
                className="max-w-[171px]"
                onClick={connectWallet}
                variant={ButtonVariants.btnPrimaryGhostLg}
                disabled={walletConnectLoading}
              >
                <LottieSmall />
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-[26px]">
                <div className="flex flex-col text-gray-300">
                  <div className="font-[500]">{walletAccount?.name || "Account"}</div>
                  <div className="text-small">{reduceAddress(walletAccount?.address, 6, 6)}</div>
                </div>
                <div>
                  <button onClick={() => disconnectWallet()}>
                    <AccountImage />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Button
            className="max-w-[171px]"
            onClick={connectWallet}
            variant={ButtonVariants.btnPrimaryGhostLg}
            disabled={walletConnectLoading}
          >
            {walletConnectLoading ? <LottieSmall /> : t("button.connectWallet")}
          </Button>
        )}
      </div>

      <WalletConnectModal
        title="Connect a Wallet"
        open={walletConnectOpen}
        onClose={() => setWalletConnectOpen(false)}
        onBack={modalStep.step === WalletConnectSteps.stepAddresses ? onBack : undefined}
        modalStep={modalStep}
        setModalStep={setModalStep}
        setWalletConnectOpen={setWalletConnectOpen}
        supportedWallets={supportedWallets}
        handleConnect={handleConnect}
      />
    </>
  );
};

export default ConnectWallet;
