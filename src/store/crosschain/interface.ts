import { ActionType } from "../../app/types/enum";
import { SelectedChain } from "../../app/types";
import { Extrinsic } from "@paraspell/sdk";

export type CrosschainExtrinsic = Extrinsic | null;

export interface CrosschainState {
  crosschainFinalized: boolean;
  crosschainOriginChainFee: string;
  crosschainDestinationChainFee: string;
  crosschainLoading: boolean;
  crosschainSelectedChain: SelectedChain;
  crosschainExactTokenAmount: string;
  crosschainExactMaxTokenAmount: string;
  crosschainDestinationWalletAddress: string;
  crosschainExtrinsic: CrosschainExtrinsic;
}

export type CrosschainAction =
  | { type: ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED; payload: boolean }
  | { type: ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN_FEE; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_LOADING; payload: boolean }
  | { type: ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_EXACT_MAX_TOKEN_AMOUNT; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_SELECTED_CHAIN; payload: SelectedChain }
  | { type: ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS; payload: string }
  | { type: ActionType.SET_CROSSCHAIN_EXTRINSIC; payload: CrosschainExtrinsic };
