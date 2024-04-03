import { WalletState, WalletAction } from "./interface";
import { ActionType } from "../../app/types/enum";
import type { WalletAccount } from "@talismn/connect-wallets";

export const initialWalletState: WalletState = {
  api: null,
  relayApi: null,
  accounts: [],
  selectedAccount: {} as WalletAccount,
  tokenBalances: null,
  assetsList: [],
  otherAssets: [],
  walletConnectLoading: false,
  extensions: [],
  assetLoading: true,
  blockHashFinalized: "",
  lpFee: "",
  nativeTokenSpotPrice: "0",
  walletBalanceUSD: 0,
};

export const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case ActionType.SET_API:
      return { ...state, api: action.payload };
    case ActionType.SET_RELAY_API:
      return { ...state, relayApi: action.payload };
    case ActionType.SET_ACCOUNTS:
      return { ...state, accounts: action.payload };
    case ActionType.SET_SELECTED_ACCOUNT:
      return { ...state, selectedAccount: action.payload };
    case ActionType.SET_TOKEN_BALANCES:
      return { ...state, tokenBalances: action.payload };
    case ActionType.SET_ASSETS_LIST:
      return { ...state, assetsList: action.payload };
    case ActionType.SET_WALLET_CONNECT_LOADING:
      return { ...state, walletConnectLoading: action.payload };
    case ActionType.SET_WALLET_EXTENSIONS:
      return { ...state, extensions: action.payload };
    case ActionType.SET_ASSET_LOADING:
      return { ...state, assetLoading: action.payload };
    case ActionType.SET_OTHER_ASSETS:
      return { ...state, otherAssets: action.payload };
    case ActionType.SET_BLOCK_HASH_FINALIZED:
      return { ...state, blockHashFinalized: action.payload };
    case ActionType.SET_LP_FEE:
      return { ...state, lpFee: action.payload };
    case ActionType.SET_NATIVE_TOKEN_SPOT_PRICE:
      return { ...state, nativeTokenSpotPrice: action.payload };
    case ActionType.SET_WALLET_BALANCE_USD:
      return { ...state, walletBalanceUSD: action.payload };

    default:
      return state;
  }
};
