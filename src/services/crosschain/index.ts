import { ApiPromise } from "@polkadot/api";
import { Builder, Extrinsic } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { CrosschainAction, CrosschainExtrinsic } from "../../store/crosschain/interface";
import Decimal from "decimal.js";
import { NotificationAction } from "../../store/notifications/interface";
import { ActionType, ToasterType } from "../../app/types/enum";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import useGetNetwork from "../../app/hooks/useGetNetwork";

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
    if (!wallet?.signer) throw new Error("Wallet signer is not defined.");
    const paymentInfo = await extrinsic.paymentInfo(account.address, { signer: wallet.signer });
    return new Decimal(paymentInfo.partialFee.toString()).dividedBy(Math.pow(10, 12)).toFixed();
  } else {
    return "";
  }
};

async function setupCallAndSign(
  walletAccount: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) {
  const wallet = getWalletBySource(walletAccount.wallet?.extensionName);
  if (!wallet?.signer) throw new Error("Wallet signer is not defined.");
  return await extrinsic
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
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
  api: ApiPromise,
  dispatch: Dispatch<CrosschainAction | NotificationAction>,
  subScanURL: string
) {
  return new Promise((resolve, reject) => {
    extrinsic.send(({ status, dispatchError, txHash }) => {
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
            payload: `${subScanURL}/extrinsic/${txHash.toString()}`,
          });
          resolve(txHash.toString());
        }
      }
    });
  });
}

export const executeCrossOut = async (
  api: ApiPromise,
  walletAccount: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const signer = await setupCallAndSign(walletAccount, extrinsic, dispatch);
  const { relaySubscanUrl } = useGetNetwork();
  if (!signer || !relaySubscanUrl) return;
  return await sendTransaction(signer, api, dispatch, relaySubscanUrl);
};

export const executeCrossIn = async (
  api: ApiPromise,
  account: WalletAccount,
  extrinsic: Extrinsic,
  dispatch: Dispatch<CrosschainAction | NotificationAction>
) => {
  const signer = await setupCallAndSign(account, extrinsic, dispatch);
  const { assethubSubscanUrl } = useGetNetwork();
  if (!signer || !assethubSubscanUrl) return;
  return await sendTransaction(signer, api, dispatch, assethubSubscanUrl);
};
