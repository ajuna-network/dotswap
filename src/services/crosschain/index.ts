import { ApiPromise } from "@polkadot/api";
import { Builder, Extrinsic } from "@paraspell/sdk";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { CrosschainAction, CrosschainExtrinsic } from "../../store/crosschain/interface";
import Decimal from "decimal.js";
import { NotificationAction } from "../../store/notifications/interface";
import { ActionType, CrosschainTransactionTypes, ToasterType } from "../../app/types/enum";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { calculateMaxAmountForCrossIn, calculateMaxAmountForCrossOut } from "../../app/util/helper";
import { t } from "i18next";

// Relay chain -> Parachain
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

export const calculateCrosschainMaxAmount = async (
  freeBalance: string,
  decimals: string,
  crosschainTransactionType: CrosschainTransactionTypes,
  destinationAddress: string,
  api: ApiPromise | null,
  account: WalletAccount
): Promise<string> => {
  let maxAmount = "";
  if (api) {
    let sameFee = false;
    while (!sameFee) {
      const { originFeeA, originFeeB, calculatedMaxAmount } = await recurseMaxAmount(
        freeBalance,
        decimals,
        crosschainTransactionType,
        destinationAddress,
        api,
        account
      );
      if (originFeeA === originFeeB) {
        maxAmount = calculatedMaxAmount;
        sameFee = true;
      }
    }
  }
  return maxAmount;
};

const recurseMaxAmount = async (
  tokenAmount: string,
  decimals: string,
  crosschainTransactionType: CrosschainTransactionTypes,
  destinationAddress: string,
  api: ApiPromise,
  account: WalletAccount
): Promise<{ originFeeA: string; originFeeB: string; calculatedMaxAmount: string }> => {
  const tokenAmountDecimal = new Decimal(tokenAmount).times(Math.pow(10, parseInt(decimals))).toFixed();
  let extrinsic, originFeeA, calculatedMaxAmount;
  if (crosschainTransactionType === CrosschainTransactionTypes.crossIn) {
    extrinsic = await createCrossInExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossIn(tokenAmount, originFeeA);
  } else {
    extrinsic = await createCrossOutExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossOut(tokenAmount, originFeeA);
  }
  const calculatedMaxAmountDecimal = new Decimal(calculatedMaxAmount).times(Math.pow(10, parseInt(decimals))).toFixed();
  // if the calculated max amount is less 0 then return 0
  if (new Decimal(calculatedMaxAmount).lessThanOrEqualTo(0)) {
    return { originFeeA, originFeeB: originFeeA, calculatedMaxAmount: "0" };
  }
  const verifyingExtrinsic =
    crosschainTransactionType === CrosschainTransactionTypes.crossIn
      ? await createCrossInExtrinsic(api, calculatedMaxAmountDecimal, destinationAddress)
      : await createCrossOutExtrinsic(api, calculatedMaxAmountDecimal, destinationAddress);
  const originFeeB = await calculateOriginFee(account, verifyingExtrinsic);
  return { originFeeA, originFeeB, calculatedMaxAmount };
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
      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "crosschain",
          props: {
            notificationType: ToasterType.PENDING,
            notificationPercentage: 10,
            notificationTitle: "Pending",
            notificationMessage: "Transaction is processing. You can close this modal anytime.",
          },
        },
      });

      return res;
    })
    .catch((err) => {
      dispatch({
        type: ActionType.UPDATE_NOTIFICATION,
        payload: {
          id: "crosschain",
          props: {
            notificationType: ToasterType.ERROR,
            notificationPercentage: null,
            notificationTitle: "Error",
            notificationMessage: err.message || "Error executing crosschain",
          },
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
    let percentage = 60;
    let interval: NodeJS.Timeout;
    extrinsic.send(({ status, dispatchError, txHash }) => {
      if (status.isReady) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "crosschain",
            props: {
              notificationType: ToasterType.PENDING,
              notificationPercentage: 15,
              notificationTitle: t("modal.notifications.transactionInitiatedTitle"),
              notificationMessage: t("modal.notifications.transactionInitiatedNotification"),
            },
          },
        });
      }

      if (status.isBroadcast) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "crosschain",
            props: {
              notificationType: ToasterType.PENDING,
              notificationPercentage: 30,
              notificationTitle: t("modal.notifications.transactionBroadcastedTitle"),
              notificationMessage: t("modal.notifications.transactionBroadcastedNotification"),
            },
          },
        });
      }
      if (status.isInBlock) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "crosschain",
            props: {
              notificationType: ToasterType.PENDING,
              notificationPercentage: 45,
              notificationTitle: t("modal.notifications.transactionIncludedInBlockTitle"),
              notificationMessage: t("modal.notifications.transactionIncludedInBlockNotification"),
              notificationLink: {
                text: t("modal.notifications.viewInBlockExplorer"),
                href: `${subScanURL}/extrinsic/${txHash.toString()}`,
              },
            },
          },
        });

        interval = setInterval(() => {
          dispatch({
            type: ActionType.UPDATE_NOTIFICATION,
            payload: {
              id: "crosschain",
              props: {
                notificationType: ToasterType.PENDING,
                notificationPercentage: percentage,
                notificationTitle: t("modal.notifications.transactionIsProcessingTitleBelow70"),
                notificationMessage: t("modal.notifications.isProcessingAbove70"),
                notificationLink: {
                  text: t("modal.notifications.viewInBlockExplorer"),
                  href: `${subScanURL}/extrinsic/${txHash.toString()}`,
                },
              },
            },
          });
          percentage += Math.floor(Math.random() * 5) + 5;
          if (percentage >= 85) {
            clearInterval(interval);
          }
        }, 4000);
      }

      if (status.isFinalized) {
        clearInterval(interval);
        if (dispatchError) {
          if (dispatchError.isModule) {
            const { docs, name, section } = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${section}.${name}: ${docs.join(" ")}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          dispatch({
            type: ActionType.UPDATE_NOTIFICATION,
            payload: {
              id: "crosschain",
              props: {
                notificationType: ToasterType.SUCCESS,
                notificationPercentage: 100,
                notificationTitle: t("modal.notifications.crosschainSuccess"),
                notificationMessage: null,
                notificationLink: {
                  text: t("modal.notifications.viewInBlockExplorer"),
                  href: `${subScanURL}/extrinsic/${txHash.toString()}`,
                },
              },
            },
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
