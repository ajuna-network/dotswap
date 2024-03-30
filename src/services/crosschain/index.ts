import { ApiPromise } from "@polkadot/api";
import { Builder, Extrinsic } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { CrosschainAction, CrosschainExtrinsic } from "../../store/crosschain/interface";
import { ActionType } from "../../app/types/enum";
import dotAcpToast from "../../app/util/toast";
import Decimal from "decimal.js";

// Relay chain -> parachain
export const createCrossOutExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).to("AssetHubKusama").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

// Parachain -> relay chain
export const createCrossInExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).from("AssetHubKusama").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

export const calculateOriginFee = async (account: WalletAccount, extrinsic: CrosschainExtrinsic) => {
  if (extrinsic) {
    const wallet = getWalletBySource(account.wallet?.extensionName);
    const paymentInfo = await extrinsic.paymentInfo(account.address, { signer: wallet!.signer });
    return new Decimal(paymentInfo.partialFee.toString()).dividedBy(Math.pow(10, 12)).toFixed();
  } else {
    return "";
  }
};

export const signAndSendTransaction = async (
  api: ApiPromise,
  walletAccount: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction>
) => {
  const wallet = getWalletBySource(walletAccount.wallet?.extensionName);
  await extrinsic.signAsync(walletAccount.address, { signer: wallet!.signer });
  return await new Promise((resolve, reject) => {
    void extrinsic.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        // Check if there are any dispatch errors
        if (dispatchError !== undefined) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            dotAcpToast.error(dispatchError.toString());
            reject(new Error(`${section}.${name}: ${docs.join(" ")}`));
          } else {
            dotAcpToast.error(dispatchError.toString());
            reject(new Error(dispatchError.toString()));
          }
        } else {
          // No dispatch error, transaction should be successful
          dispatch({ type: ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED, payload: true });

          dotAcpToast.success(`Current status: ${status.type}`);
          resolve(txHash.toString());
        }
      }
    });
  });
};
