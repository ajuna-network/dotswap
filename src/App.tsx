import type { WalletAccount } from "@talismn/connect-wallets";
import { FC, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import useStateAndDispatch from "./app/hooks/useStateAndDispatch";
import router from "./app/router";
import LocalStorage from "./app/util/localStorage";
import { connectWalletAndFetchBalance } from "./services/polkadotWalletServices";
import { AppStateProvider } from "./state";
import UpdateMetadataModal from "./components/organism/UpdateMetadataModal";
import { useOnlineStatus } from "./app/hooks/useOnlineStatus";
import OfflinePage from "./OfflinePage";
import { useIsMobile } from "./app/hooks/useIsMobile";
import MobilePage from "./MobilePage";

const App: FC = () => {
  const { dispatch, state } = useStateAndDispatch();
  const { api, relayApi } = state;

  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();

  const walletConnected: WalletAccount = LocalStorage.get("wallet-connected");

  useEffect(() => {
    if (isMobile) return;
    if (isOnline && walletConnected && api && relayApi) {
      connectWalletAndFetchBalance(dispatch, api, relayApi, walletConnected).then();
    }
  }, [isMobile, api, relayApi]);

  return (
    <AppStateProvider state={state} dispatch={dispatch}>
      {!isMobile ? (
        !isOnline ? (
          <OfflinePage />
        ) : (
          <>
            {walletConnected && <UpdateMetadataModal account={walletConnected} />}
            <RouterProvider router={router} />
          </>
        )
      ) : (
        <MobilePage />
      )}
    </AppStateProvider>
  );
};

export default App;
