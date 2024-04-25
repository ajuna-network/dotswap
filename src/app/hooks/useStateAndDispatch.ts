import { WalletAction } from "../../store/wallet/interface";
import { PoolAction } from "../../store/pools/interface";
import { useEffect, useReducer } from "react";
import {
  initialPoolsState,
  initialSwapState,
  initialWalletState,
  initialCrosschainState,
  poolsReducer,
  swapReducer,
  walletReducer,
  crosschainReducer,
  initialNotificationState,
} from "../../store";
import { setupPolkadotApi } from "../../services/polkadotWalletServices";
import dotAcpToast from "../util/toast";
import { SwapAction } from "../../store/swap/interface";
import { CrosschainAction } from "../../store/crosschain/interface";
import { notificationReducer } from "../../store";
import { NotificationAction } from "../../store/notifications/interface";
import useGetNetwork from "./useGetNetwork";
import { ActionType } from "../types/enum.ts";

const useStateAndDispatch = () => {
  const [walletState, dispatchWallet] = useReducer(walletReducer, initialWalletState);
  const [poolsState, dispatchPools] = useReducer(poolsReducer, initialPoolsState);
  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);
  const [crosschainState, dispatchCrosschain] = useReducer(crosschainReducer, initialCrosschainState);
  const [notificationState, dispatchNotification] = useReducer(notificationReducer, initialNotificationState);

  const state = { ...walletState, ...poolsState, ...swapState, ...crosschainState, ...notificationState };

  const dispatch = (action: WalletAction | PoolAction | SwapAction | CrosschainAction | NotificationAction) => {
    dispatchWallet(action as WalletAction);
    dispatchPools(action as PoolAction);
    dispatchSwap(action as SwapAction);
    dispatchCrosschain(action as CrosschainAction);
    dispatchNotification(action as NotificationAction);
  };

  useEffect(() => {
    const callApiSetup = async () => {
      const { rpcUrl, rpcUrlRelay } = useGetNetwork();
      try {
        const [asset, relay] = await Promise.all([
          setupPolkadotApi(rpcUrl, state.apiProvider, state.api),
          setupPolkadotApi(rpcUrlRelay, state.relayProvider, state.relayApi),
        ]);
        dispatch({ type: ActionType.SET_API, payload: asset.api });
        dispatch({ type: ActionType.SET_RELAY_API, payload: relay.api });
        dispatch({ type: ActionType.SET_API_PROVIDER, payload: asset.provider });
        dispatch({ type: ActionType.SET_RELAY_PROVIDER, payload: relay.provider });
      } catch (error) {
        dotAcpToast.error(`Error setting up Polkadot API: ${error}`);
      }
    };

    callApiSetup().then();
  }, []);

  return { state, dispatch };
};

export default useStateAndDispatch;
