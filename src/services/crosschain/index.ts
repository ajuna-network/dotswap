import { ApiPromise, WsProvider } from "@polkadot/api";
import { Builder } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { NotificationAction } from "../../store/notifications/interface";
import { CrosschainAction } from "../../store/crosschain/interface";
import { ActionType, ToasterType } from "../../app/types/enum";

async function setupCallAndSign(
  api: ApiPromise,
  walletAccount: WalletAccount,
  amount: string,
  destinationAddress: string,
  method: "to" | "from",
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) {
  const call = await Builder(api)[method]("AssetHubKusama").amount(amount).address(destinationAddress).build();
  const wallet = getWalletBySource(walletAccount.wallet?.extensionName);
  if (!wallet?.signer) throw new Error("Wallet signer is not defined.");
  return await call
    .signAsync(walletAccount.address, { signer: wallet.signer })
    .then((res) => {
      dispatch({ type: ActionType.SET_NOTIFICATION_TYPE, payload: ToasterType.PENDING });
      dispatch({ type: ActionType.SET_NOTIFICATION_TITLE, payload: "Pending" });
      dispatch({
        type: ActionType.SET_NOTIFICATION_MESSAGE,
        payload: "Transaction is processing. You can close this modal anytime.",
      });

      return res;
    })
    .catch((err) => {
      dispatch({
        type: ActionType.SET_NOTIFICATION_DATA,
        payload: {
          notificationModalOpen: true,
          notificationType: ToasterType.ERROR,
          notificationTitle: "Error",
          notificationMessage: err.message || "Error executing crosschain",
          notificationTransactionDetails: null,
          notificationChainDetails: null,
          notificationLink: null,
        },
      });
    });
}

async function sendTransaction(
  call: any,
  api: ApiPromise,
  dispatch: Dispatch<CrosschainAction | NotificationAction>,
  subScanURL: string
) {
  return new Promise((resolve, reject) => {
    call.send(({ status, dispatchError, txHash }: { status: any; dispatchError: any; txHash: any }) => {
      if (status.isFinalized) {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const { docs, name, section } = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${section}.${name}: ${docs.join(" ")}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          dispatch({ type: ActionType.SET_CROSSCHAIN_TRANSFER_FINALIZED, payload: true });
          dispatch({ type: ActionType.SET_NOTIFICATION_TYPE, payload: ToasterType.SUCCESS });
          dispatch({ type: ActionType.SET_NOTIFICATION_TITLE, payload: "Success" });
          dispatch({ type: ActionType.SET_NOTIFICATION_MESSAGE, payload: null });
          dispatch({
            type: ActionType.SET_NOTIFICATION_LINK_HREF,
            payload: `${subScanURL}extrinsic/${txHash.toString()}`,
          });
          resolve(txHash.toString());
        }
      }
    });
  });
}

export const executeCrossOut = async (
  walletAccount: WalletAccount,
  amount: string,
  destinationAddress: string,
  rpcUrl: string,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const wsProvider = new WsProvider(rpcUrl);
  const kusamaApi = await ApiPromise.create({ provider: wsProvider });
  const signer = await setupCallAndSign(kusamaApi, walletAccount, amount, destinationAddress, "to", dispatch);
  const subScanURL = "https://kusama.subscan.io/";
  if (!signer) return;
  return await sendTransaction(signer, kusamaApi, dispatch, subScanURL);
};

export const executeCrossIn = async (
  api: ApiPromise,
  amount: string,
  account: WalletAccount,
  destinationAddress: string,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const signer = await setupCallAndSign(api, account, amount, destinationAddress, "from", dispatch);
  const subScanURL = "https://assethub-kusama.subscan.io/";
  if (!signer) return;
  return await sendTransaction(signer, api, dispatch, subScanURL);
};
