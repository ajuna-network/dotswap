import { ActionType } from "../../app/types/enum";

export interface CrosschainState {
  crosschainFinalized: boolean;
  crosschainOriginChainFee: string;
  crosschainDestinationChainFee: string;
  crosschainLoading: boolean;
  crosschainExactTokenAmount: string;
  crosschainDestinationWalletAddress: string;
}

export type CrosschainAction =
  | { type: ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED; payload: boolean }
  | { type: ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN__FEE; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_LOADING; payload: boolean }
  | { type: ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS; payload: string };
