import { ApiPromise } from "@polkadot/api";
import { InjectedExtension } from "@polkadot/extension-inject/types";
import { ActionType } from "../../app/types/enum";
import { TokenBalanceData, AssetListToken } from "../../app/types";
import type { WalletAccount } from "@talismn/connect-wallets";

export interface WalletState {
  api: ApiPromise | null;
  relayApi: ApiPromise | null;
  accounts: WalletAccount[];
  extensions: InjectedExtension[];
  selectedAccount: WalletAccount;
  tokenBalances: TokenBalanceData | null;
  assetsList: AssetListToken[];
  otherAssets: AssetListToken[];
  walletConnectLoading: boolean;
  assetLoading: boolean;
  blockHashFinalized: string;
  lpFee: string;
  nativeTokenSpotPrice: string;
  walletBalanceUSD: number;
}

export type WalletAction =
  | { type: ActionType.SET_API; payload: ApiPromise }
  | { type: ActionType.SET_RELAY_API; payload: ApiPromise }
  | { type: ActionType.SET_ACCOUNTS; payload: WalletAccount[] }
  | { type: ActionType.SET_SELECTED_ACCOUNT; payload: WalletAccount }
  | { type: ActionType.SET_TOKEN_BALANCES; payload: TokenBalanceData }
  | { type: ActionType.SET_ASSETS_LIST; payload: AssetListToken[] }
  | { type: ActionType.SET_OTHER_ASSETS; payload: AssetListToken[] }
  | { type: ActionType.SET_WALLET_CONNECT_LOADING; payload: boolean }
  | { type: ActionType.SET_WALLET_EXTENSIONS; payload: InjectedExtension[] }
  | { type: ActionType.SET_ASSET_LOADING; payload: boolean }
  | { type: ActionType.SET_BLOCK_HASH_FINALIZED; payload: string }
  | { type: ActionType.SET_LP_FEE; payload: string }
  | { type: ActionType.SET_NATIVE_TOKEN_SPOT_PRICE; payload: string }
  | { type: ActionType.SET_WALLET_BALANCE_USD; payload: number };
