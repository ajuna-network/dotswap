import { ActionType } from "../../app/types/enum";
import { CrosschainAction, CrosschainState } from "./interface";

export const initialCrosschainState: CrosschainState = {
  crosschainFinalized: false,
  crosschainOriginChainFee: "",
  crosschainDestinationChainFee: "",
  crosschainLoading: false,
  crosschainExactTokenAmount: "",
  crosschainSelectedChain: {
    chainA: {
      chainName: "Kusama",
      chainType: "Relay Chain",
      balances: {
        free: "0",
        reserved: "0",
        frozen: "0",
      },
    },
    chainB: {
      chainName: "Kusama",
      chainType: "Asset Hub",
      balances: {
        free: "0",
        reserved: "0",
        frozen: "0",
      },
    },
  },
  crosschainDestinationWalletAddress: "",
  crosschainExtrinsic: null,
};

export const crosschainReducer = (state: CrosschainState, action: CrosschainAction): CrosschainState => {
  switch (action.type) {
    case ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED:
      return { ...state, crosschainFinalized: action.payload };
    case ActionType.SET_CROSSCHAIN_ORIGIN_CHAIN_FEE:
      return { ...state, crosschainOriginChainFee: action.payload };
    case ActionType.SET_CROSSCHAIN_DESTINATION_CHAIN_FEE:
      return { ...state, crosschainDestinationChainFee: action.payload };
    case ActionType.SET_CROSSCHAIN_LOADING:
      return { ...state, crosschainLoading: action.payload };
    case ActionType.SET_CROSSCHAIN_EXACT_TOKEN_AMOUNT:
      return { ...state, crosschainExactTokenAmount: action.payload };
    case ActionType.SET_CROSSCHAIN_SELECTED_CHAIN:
      return { ...state, crosschainSelectedChain: action.payload };
    case ActionType.SET_CROSSCHAIN_DESTINATION_WALLET_ADDRESS:
      return { ...state, crosschainDestinationWalletAddress: action.payload };
    case ActionType.SET_CROSSCHAIN_EXTRINSIC:
      return { ...state, crosschainExtrinsic: action.payload };
    default:
      return state;
  }
};
