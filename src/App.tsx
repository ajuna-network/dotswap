import type { WalletAccount } from "@talismn/connect-wallets";
import { FC, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import useStateAndDispatch from "./app/hooks/useStateAndDispatch";
import router from "./app/router";
import LocalStorage from "./app/util/localStorage";
import { connectWalletAndFetchBalance } from "./services/polkadotWalletServices";
import { AppStateProvider } from "./state";
import UpdateMetadataModal from "./components/organism/UpdateMetadataModal";

const App: FC = () => {
  const { dispatch, state } = useStateAndDispatch();
  const { api, relayApi } = state;

  const walletConnected: WalletAccount = LocalStorage.get("wallet-connected");

  useEffect(() => {
    if (walletConnected && api && relayApi) {
      connectWalletAndFetchBalance(dispatch, api, relayApi, walletConnected).then();
    }
  }, [api, relayApi]);

  return (
    <>
      <UpdateMetadataModal />
      <AppStateProvider state={state} dispatch={dispatch}>
        <RouterProvider router={router} />
      </AppStateProvider>
    </>
  );
};

export default App;
