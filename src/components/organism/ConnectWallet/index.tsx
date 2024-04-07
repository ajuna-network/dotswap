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
import SelectAccountModal from "../SelectAccountModal/index.tsx";
import LocalStorage from "../../../app/util/localStorage.ts";
import { ModalStepProps } from "../../../app/types/index.ts";
import type { Timeout } from "react-number-format/types/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import dotAcpToast from "../../../app/util/toast.tsx";
import { LottieSmall } from "../../../assets/loader/index.tsx";
import { TokenBalanceData } from "../../../app/types/index.ts";
import Identicon from "@polkadot/react-identicon";

const ConnectWallet = () => {
  const { state, dispatch } = useAppContext();
  const { walletConnectLoading, api, relayApi, accounts } = state;

  const [walletAccount, setWalletAccount] = useState<WalletAccount>({} as WalletAccount);
  const [modalStep, setModalStep] = useState<ModalStepProps>({ step: WalletConnectSteps.stepExtensions });
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([] as Wallet[]);

  const [selectAccountModalOpen, setSelectAccountModalOpen] = useState(false);

  const walletConnected = LocalStorage.get("wallet-connected");

  const connectWallet = () => {
    setWalletConnectOpen(true);
  };

  const handleConnect = async (account: WalletAccount) => {
    if (selectAccountModalOpen) {
      dispatch({ type: ActionType.SET_ASSETS_LIST, payload: [] });
      dispatch({ type: ActionType.SET_OTHER_ASSETS, payload: [] });
      dispatch({ type: ActionType.SET_WALLET_BALANCE_USD, payload: 0 });
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: {} as TokenBalanceData });
      setSelectAccountModalOpen(false);
    }
    try {
      setWalletConnectOpen(false);
      if (!api || !relayApi) return;
      await connectWalletAndFetchBalance(dispatch, api, relayApi, account);
    } catch (error) {
      dotAcpToast.error(`Error connecting: ${error}`);
    }
  };

  const onBack = () => {
    setModalStep({ step: WalletConnectSteps.stepExtensions });
  };

  const disconnectWallet = () => {
    setSelectAccountModalOpen(false);
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
              <button
                className="flex items-center justify-center gap-[26px]"
                onClick={() => {
                  setSelectAccountModalOpen(true);
                }}
              >
                <div className="flex flex-col items-start justify-start text-gray-300">
                  <div className="font-[500]">{walletAccount?.name || "Account"}</div>
                  <div className="text-small">{reduceAddress(walletAccount?.address, 6, 6)}</div>
                </div>
                <div className="flex items-center justify-center">
                  <Identicon value={walletAccount?.address} size={32} theme="polkadot" className="!cursor-pointer" />
                </div>
              </button>
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

      <SelectAccountModal
        open={selectAccountModalOpen}
        title={t("wallet.account")}
        onClose={() => setSelectAccountModalOpen(false)}
        walletAccounts={accounts}
        handleConnect={handleConnect}
        handleDisconnect={disconnectWallet}
      />

      <WalletConnectModal
        title="Connect a Wallet"
        open={walletConnectOpen}
        onClose={() => setWalletConnectOpen(false)}
        onBack={modalStep.step === WalletConnectSteps.stepAddresses ? onBack : undefined}
        modalStep={modalStep}
        setModalStep={setModalStep}
        setWalletConnectOpen={setWalletConnectOpen}
        walletAccounts={accounts}
        supportedWallets={supportedWallets}
        handleConnect={handleConnect}
      />
    </>
  );
};

export default ConnectWallet;
