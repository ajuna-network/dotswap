import type { WalletAccount } from "@talismn/connect-wallets";
import { FC, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import useStateAndDispatch from "./app/hooks/useStateAndDispatch";
import router from "./app/router";
import LocalStorage from "./app/util/localStorage";
import { connectWalletAndFetchBalance } from "./services/polkadotWalletServices";
import { AppStateProvider } from "./state";

const App: FC = () => {
  const { dispatch, state } = useStateAndDispatch();
  const { api } = state;

  const walletConnected: WalletAccount = LocalStorage.get("wallet-connected");

  useEffect(() => {
    if (walletConnected && api) {
      connectWalletAndFetchBalance(dispatch, api, walletConnected).then();
    }
  }, [api]);

  return (
    <AppStateProvider state={state} dispatch={dispatch}>
      <RouterProvider router={router} />
    </AppStateProvider>
  );
};

export default App;
