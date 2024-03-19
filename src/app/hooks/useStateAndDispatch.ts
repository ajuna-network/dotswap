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
} from "../../store";
import { setupPolkadotApi } from "../../services/polkadotWalletServices";
import { ActionType } from "../types/enum";
import dotAcpToast from "../util/toast";
import { SwapAction } from "../../store/swap/interface";
import { CrosschainAction } from "../../store/crosschain/interface";

const useStateAndDispatch = () => {
  const [walletState, dispatchWallet] = useReducer(walletReducer, initialWalletState);
  const [poolsState, dispatchPools] = useReducer(poolsReducer, initialPoolsState);
  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);
  const [crosschainState, dispatchCrosschain] = useReducer(crosschainReducer, initialCrosschainState);

  const state = { ...walletState, ...poolsState, ...swapState, ...crosschainState };

  const dispatch = (action: WalletAction | PoolAction | SwapAction | CrosschainAction) => {
    dispatchWallet(action as WalletAction);
    dispatchPools(action as PoolAction);
    dispatchSwap(action as SwapAction);
    dispatchCrosschain(action as CrosschainAction);
  };

  useEffect(() => {
    const callApiSetup = async () => {
      try {
        const polkaApi = await setupPolkadotApi();
        dispatch({ type: ActionType.SET_API, payload: polkaApi });
      } catch (error) {
        dotAcpToast.error(`Error setting up Polkadot API: ${error}`);
      }
    };

    callApiSetup();
  }, []);

  return { state, dispatch };
};

export default useStateAndDispatch;
