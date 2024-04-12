import { ActionType, ToasterType } from "../../app/types/enum";

export interface NotificationState {
  notificationModalOpen: boolean;
  notificationAction?: string | null;
  notificationType: ToasterType | null;
  notificationTitle?: string | null;
  notificationTransactionDetails?: NotificationTransactionDetails | null;
  notificationChainDetails?: NotificationChainDetails | null;
  notificationMessage?: string | null;
  notificationLink?: NotificationLink | null;
}

interface NotificationTransactionDetails {
  fromToken?: NotificationToken | null;
  toToken?: NotificationToken | null;
}

interface NotificationToken {
  symbol: string;
  amount: number;
}

interface NotificationChainDetails {
  originChain: string;
  destinationChain: string;
}

interface NotificationLink {
  text: string;
  href: string;
}

export type NotificationAction =
  | { type: ActionType.SET_NOTIFICATION_MODAL_OPEN; payload: boolean }
  | { type: ActionType.SET_NOTIFICATION_TYPE; payload: ToasterType }
  | { type: ActionType.SET_NOTIFICATION_TITLE; payload: string | null }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS; payload: NotificationTransactionDetails | null }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM; payload: NotificationToken }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM_AMOUNT; payload: number }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO; payload: NotificationToken | null }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO_AMOUNT; payload: number }
  | { type: ActionType.SET_NOTIFICATION_MESSAGE; payload: string | null }
  | { type: ActionType.SET_NOTIFICATION_CHAINS_DETAILS; payload: NotificationChainDetails | null }
  | { type: ActionType.SET_NOTIFICATION_LINK; payload: NotificationLink | null }
  | { type: ActionType.SET_NOTIFICATION_LINK_TEXT; payload: string }
  | { type: ActionType.SET_NOTIFICATION_LINK_HREF; payload: string }
  | { type: ActionType.SET_NOTIFICATION_DATA; payload: NotificationState }
  | { type: ActionType.SET_NOTIFICATION_ACTION; payload: string | null }
  | { type: ActionType.RESET_NOTIFICATION_STATE };
