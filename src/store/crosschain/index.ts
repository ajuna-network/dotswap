import { ActionType } from "../../app/types/enum";
import { CrosschainAction, CrosschainState } from "./interface";

export const initialCrosschainState: CrosschainState = {
  crosschainFinalized: false,
  crosschainOriginChainFee: "0.549345346",
  crosschainDestinationChainFee: "0.00483634",
  crosschainLoading: false,
  crosschainExactTokenAmount: "",
  crosschainDestinationWalletAddress: "",
};

export const crosschainReducer = (state: CrosschainState, action: CrosschainAction): CrosschainState => {
  switch (action.type) {
    case ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED:
      return { ...state, crosschainFinalized: action.payload };
    case ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE:
      return { ...state, crosschainOriginChainFee: action.payload };
    case ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN__FEE:
      return { ...state, crosschainDestinationChainFee: action.payload };
    case ActionType.SET_CROSSCHAIN_LOADING:
      return { ...state, crosschainLoading: action.payload };
    case ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT:
      return { ...state, crosschainExactTokenAmount: action.payload };
    case ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS:
      return { ...state, crosschainDestinationWalletAddress: action.payload };
    default:
      return state;
  }
};
