import type { WalletAccount } from "@talismn/connect-wallets";
import { FC, useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import useStateAndDispatch from "./app/hooks/useStateAndDispatch";
import router from "./app/router";
import LocalStorage from "./app/util/localStorage";
import { checkWalletMetadata, connectWalletAndFetchBalance } from "./services/polkadotWalletServices";
import { AppStateProvider } from "./state";
import UpdateMetadataModal from "./components/organism/UpdateMetadataModal";

const App: FC = () => {
  const { dispatch, state } = useStateAndDispatch();
  const { api } = state;

  const [metadataModalOpen, setMetadataModalOpen] = useState(false);

  const walletConnected: WalletAccount = LocalStorage.get("wallet-connected");

  useEffect(() => {
    if (walletConnected && api) {
      const walletConnectAndCheckMetadata = async () => {
        await connectWalletAndFetchBalance(dispatch, api, walletConnected);
        const updateAvailable = await checkWalletMetadata(api, walletConnected);
        if (updateAvailable) {
          setMetadataModalOpen(true);
        }
      };
      walletConnectAndCheckMetadata();
    }
  }, [api]);

  return (
    <>
      <UpdateMetadataModal
        metadataModalOpen={metadataModalOpen}
        setMetadataModalOpen={setMetadataModalOpen}
        api={api}
        walletConnected={walletConnected}
      />
      <AppStateProvider state={state} dispatch={dispatch}>
        <RouterProvider router={router} />
      </AppStateProvider>
    </>
  );
};

export default App;
