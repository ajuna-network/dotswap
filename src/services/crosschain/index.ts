import { ApiPromise, WsProvider } from "@polkadot/api";
import { Builder } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { CrosschainAction } from "../../store/crosschain/interface";
import { ActionType } from "../../app/types/enum";
import dotAcpToast from "../../app/util/toast";

// Relay chain -> parachain
export const executeCrossOut = async (
  walletAccount: WalletAccount,
  amount: string,
  destinationAddress: string,
  rpcUrl: string,
  dispatch: Dispatch<CrosschainAction>
) => {
  const wsProvider = new WsProvider(rpcUrl);
  const kusamaApi = await ApiPromise.create({ provider: wsProvider });
  const call = await Builder(kusamaApi).to("AssetHubKusama").amount(amount).address(destinationAddress).build();
  const wallet = getWalletBySource(walletAccount.wallet?.extensionName);
  await call.signAsync(walletAccount.address, { signer: wallet!.signer });
  return await new Promise((resolve, reject) => {
    void call.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        // Check if there are any dispatch errors
        if (dispatchError !== undefined) {
          if (dispatchError.isModule) {
            const decoded = kusamaApi.registry.findMetaError(dispatchError.asModule);
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

// Parachain -> Relay chain
export const executeCrossIn = async (
  api: ApiPromise,
  amount: string,
  account: WalletAccount,
  destinationAddress: string,
  dispatch: Dispatch<CrosschainAction>
) => {
  const call = await Builder(api).from("AssetHubKusama").amount(amount).address(destinationAddress).build();
  const wallet = getWalletBySource(account.wallet?.extensionName);
  await call.signAsync(account.address, { signer: wallet!.signer });
  return await new Promise((resolve, reject) => {
    void call.send(({ status, dispatchError, txHash }) => {
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
