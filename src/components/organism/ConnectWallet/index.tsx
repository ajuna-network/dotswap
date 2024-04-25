import { ActionType, ButtonVariants, ToasterType, WalletConnectSteps } from "../../../app/types/enum.ts";
import { isApiAvailable, reduceAddress } from "../../../app/util/helper";
import {
  connectWalletAndFetchBalance,
  getSupportedWallets,
  handleDisconnect,
} from "../../../services/polkadotWalletServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button/index.tsx";
import { t } from "i18next";
import { useEffect, useState } from "react";
import WalletConnectModal from "../WalletConnectModal/index.tsx";
import SelectAccountModal from "../SelectAccountModal/index.tsx";
import LocalStorage from "../../../app/util/localStorage.ts";
import { ModalStepProps } from "../../../app/types";
import type { Timeout } from "react-number-format/types/types";
import { type Wallet, type WalletAccount } from "@talismn/connect-wallets";
import dotAcpToast from "../../../app/util/toast.tsx";
import { LottieSmall } from "../../../assets/loader";
import { TokenBalanceData } from "../../../app/types";
import Identicon from "@polkadot/react-identicon";
import CircleLoader from "../../../assets/img/rotating-circle.svg?react";
import NotificationsModal from "../NotificationsModal/index.tsx";

interface WalletAccountCustom {
  address: string;
  source: string;
  name?: string;
  wallet?: Wallet;
  signer?: unknown;
  type?: string;
}

const ConnectWallet = () => {
  const { state, dispatch } = useAppContext();
  const { walletConnectLoading, api, relayApi, accounts, notifications } = state;

  const pendingNotifications = notifications.filter((n) => n.notificationType === ToasterType.PENDING);

  const [walletAccount, setWalletAccount] = useState<WalletAccount>({} as WalletAccount);
  const [modalStep, setModalStep] = useState<ModalStepProps>({ step: WalletConnectSteps.stepExtensions });
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([] as Wallet[]);

  const [selectAccountModalOpen, setSelectAccountModalOpen] = useState(false);

  const walletConnected = LocalStorage.get("wallet-connected");

  const connectWallet = () => {
    setWalletConnectOpen(true);
  };

  const handleConnect = async (account: WalletAccountCustom) => {
    if (selectAccountModalOpen) {
      dispatch({ type: ActionType.SET_ASSETS_LIST, payload: [] });
      dispatch({ type: ActionType.SET_OTHER_ASSETS, payload: [] });
      dispatch({ type: ActionType.SET_WALLET_BALANCE_USD, payload: 0 });
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: {} as TokenBalanceData });
      setSelectAccountModalOpen(false);
    }
    try {
      if (account.type === "ethereum") {
        dotAcpToast.error(t("error.wallet.notSupported"), undefined, null);
        return;
      }
      if (!api || !relayApi) return;
      const isApiReady = await isApiAvailable(api, relayApi);
      if (!isApiReady) {
        dotAcpToast.error(t("error.api.notReady"), undefined, null);
        return;
      }
      setWalletConnectOpen(false);
      await connectWalletAndFetchBalance(dispatch, api, relayApi, account).then(
        () => {
          dotAcpToast.success("Wallet successfully connected!", {
            id: "wallet-connected",
          });
        },
        (error) => {
          dotAcpToast.error(`Error connecting: ${error}`, undefined, null);
        }
      );
    } catch (error) {
      dotAcpToast.error(`${t("toaster.errorConnecting")} ${error}`);
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

  const getWalletsFn = async () => {
    const wallets = getSupportedWallets();
    setSupportedWallets(wallets);
  };

  useEffect(() => {
    getWalletsFn();
  }, []);

  const handleWalletInstall = async (wallet: Wallet) => {
    setWalletConnectOpen(false);

    dispatch({
      type: ActionType.ADD_NOTIFICATION,
      payload: {
        notificationModalOpen: true,
        notificationType: ToasterType.INFO,
        notificationTitle: "Install Wallet",
        notificationMessage: "Once you have installed the wallet, please refresh the page to connect.",
        id: "install-wallet-notification",
        notificationAction: "Install",
        notificationLink: {
          text: "Install Wallet",
          href: wallet?.installUrl,
        },
      },
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-8">
        {pendingNotifications && pendingNotifications.length > 0 && (
          <div className="group relative flex cursor-pointer items-center gap-4 rounded-medium bg-pink px-4 py-2 text-center">
            <span className="font-medium lowercase leading-none text-white">
              {pendingNotifications.length} {t("modal.notifications.pending")}
            </span>
            <CircleLoader className="animate-spin" />
            <div className="invisible absolute right-full top-1/2 z-10 w-max -translate-x-2 -translate-y-1/2 rounded-lg bg-yellow-100 p-2 text-sm opacity-0 drop-shadow-md transition-all duration-300 group-hover:visible group-hover:opacity-100 [&>path]:fill-yellow-100 ">
              <div className="font-inter text-medium font-normal normal-case leading-normal text-dark-300">
                {pendingNotifications.length}{" "}
                {pendingNotifications.length > 1 ? t("wallet.pendingMultiple") : t("wallet.pendingSingle")}{" "}
                {t("wallet.pending")}
              </div>
            </div>
          </div>
        )}
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
        title={t("modal.connectWallet")}
        open={walletConnectOpen}
        onClose={() => setWalletConnectOpen(false)}
        onBack={modalStep.step === WalletConnectSteps.stepAddresses ? onBack : undefined}
        modalStep={modalStep}
        setModalStep={setModalStep}
        setWalletConnectOpen={setWalletConnectOpen}
        walletAccounts={accounts}
        supportedWallets={supportedWallets}
        handleConnect={handleConnect}
        handleWalletInstall={handleWalletInstall}
      />

      <NotificationsModal id="install-wallet-notification" />
    </>
  );
};

export default ConnectWallet;
