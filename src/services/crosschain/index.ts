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
import {
  calculateMaxAmountForCrossIn,
  calculateMaxAmountForCrossOut,
  errorMessageHandler,
  getPlatform,
} from "../../app/util/helper";
import { t } from "i18next";

// Relay chain -> Parachain
export const createCrossOutExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).to("AssetHubPolkadot").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

// Parachain -> relay chain
export const createCrossInExtrinsic = async (api: ApiPromise, amount: string, destinationAddress: string) => {
  const extrinsic = await Builder(api).from("AssetHubPolkadot").amount(amount).address(destinationAddress).build();
  return extrinsic;
};

export const calculateOriginFee = async (api: ApiPromise, account: WalletAccount, extrinsic: CrosschainExtrinsic) => {
  if (extrinsic && api) {
    try {
      const paymentInfo = await extrinsic.paymentInfo(account.address);
      const partialFee = new Decimal(paymentInfo.partialFee.toString()).dividedBy(Math.pow(10, 10)).toFixed();

      const weightFee = await api.call.transactionPaymentCallApi
        .queryCallFeeDetails(extrinsic, extrinsic.toU8a().length)
        .then((res: any) => {
          if (!res) return new Decimal(0);
          const humanRes = res.inclusionFee.toHuman().adjustedWeightFee.split(" ")[0];
          const fee = new Decimal(humanRes).dividedBy(Math.pow(10, 4));
          return fee;
        });
      return new Decimal(partialFee).plus(weightFee).toFixed();
    } catch (error) {
      return "0";
    }
  } else {
    return "0";
  }
};

export const calculateCrosschainMaxAmount = async (
  freeBalance: string,
  decimals: string,
  crosschainTransactionType: CrosschainTransactionTypes,
  destinationAddress: string,
  api: ApiPromise,
  existentialDeposit: string,
  account: WalletAccount
): Promise<string> => {
  const tokenAmountDecimal = new Decimal(freeBalance).times(Math.pow(10, parseInt(decimals))).toFixed();
  let extrinsic, originFeeA, calculatedMaxAmount;
  if (crosschainTransactionType === CrosschainTransactionTypes.crossIn) {
    extrinsic = await createCrossInExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(api, account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossIn(freeBalance, originFeeA, existentialDeposit);
  } else {
    extrinsic = await createCrossOutExtrinsic(api, tokenAmountDecimal, destinationAddress);
    originFeeA = await calculateOriginFee(api, account, extrinsic);
    calculatedMaxAmount = calculateMaxAmountForCrossOut(freeBalance, originFeeA, existentialDeposit);
  }

  // if the calculated max amount is less 0 then return 0
  if (new Decimal(calculatedMaxAmount).lessThanOrEqualTo(0)) {
    return "0";
  }

  return calculatedMaxAmount;
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
            notificationMessage: err.message ? errorMessageHandler(err.message) : "Error executing crosschain",
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
              notificationTitle: t("modal.notifications.transactionInitiatedTitle", {
                platform: getPlatform(),
              }),
              notificationMessage: t("modal.notifications.transactionInitiatedNotification"),
            },
          },
        });
      } else if (status.isBroadcast) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "crosschain",
            props: {
              notificationType: ToasterType.PENDING,
              notificationPercentage: 30,
              notificationTitle: t("modal.notifications.transactionBroadcastedTitle", {
                platform: getPlatform(),
              }),
              notificationMessage: t("modal.notifications.transactionBroadcastedNotification"),
            },
          },
        });
      } else if (status.isInBlock) {
        dispatch({
          type: ActionType.UPDATE_NOTIFICATION,
          payload: {
            id: "crosschain",
            props: {
              notificationType: ToasterType.PENDING,
              notificationPercentage: 45,
              notificationTitle: t("modal.notifications.transactionIncludedInBlockTitle", {
                platform: getPlatform(),
              }),
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
                notificationTitle: t("modal.notifications.transactionIsProcessingTitleBelow70", {
                  platform: getPlatform(),
                }),
                notificationMessage: t("modal.notifications.isProcessingAbove70"),
                notificationLink: {
                  text: t("modal.notifications.viewInBlockExplorer"),
                  href: `${subScanURL}/extrinsic/${txHash.toString()}`,
                },
              },
            },
          });
          percentage += Math.floor(Math.random() * 5) + 1;
          if (percentage >= 92) {
            clearInterval(interval);
          }
        }, 900);
      } else if (status.isFinalized) {
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
