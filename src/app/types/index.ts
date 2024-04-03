import type { AnyJson } from "@polkadot/types/types/codec";
import { InputEditedType, WalletConnectSteps } from "./enum";

export type LpTokenAsset = {
  balance: string;
  extra: string | null;
  reason: string;
  status: string;
};

export type PoolCardProps = {
  name: string;
  lpTokenAsset: LpTokenAsset | null;
  lpTokenId: string | null;
  assetTokenId: string;
  totalTokensLocked: {
    nativeToken: Token;
    assetToken: Token;
  };
};

export type InputEditedProps = {
  inputType: InputEditedType;
};

export type TokenProps = {
  tokenSymbol: string;
  tokenId: string;
  decimals: string;
  tokenBalance: string;
};

export type TokenBalanceData = {
  balanceAsset: {
    free: string;
    reserved: string;
    frozen: string;
  };
  balanceRelay: {
    free: string;
    reserved: string;
    frozen: string;
  };
  spotPrice: string;
  ss58Format: AnyJson;
  existentialDeposit: string;
  tokenDecimals: string;
  tokenSymbol: string;
  assets: any;
};

export type AssetListToken = {
  tokenId: string;
  assetTokenMetadata: {
    symbol: string;
    name: string;
    decimals: string;
  };
  tokenAsset: {
    balance: string;
    relayBalance: string;
  };
  spotPrice: string;
};

export type UrlParamType = {
  id: string;
};

export type PoolsTokenMetadata = {
  tokenId: string;
  assetTokenMetadata: any;
  tokenAsset: {
    balance: number | undefined;
  };
};

export type ModalStepProps = {
  step: WalletConnectSteps;
};

export type TokenDecimalsErrorProps = {
  tokenSymbol: string;
  decimalsAllowed: number;
  isError: boolean;
};

export type Token = {
  id?: string;
  icon: string;
  value: string;
  decimals: string;
  formattedValue: string;
};

export type SelectedChain = {
  chainA: {
    chainName: string;
    chainType: string;
    balances: {
      free: string;
      reserved: string;
      frozen: string;
    };
  };
  chainB: {
    chainName: string;
    chainType: string;
    balances: {
      free: string;
      reserved: string;
      frozen: string;
    };
  };
};
