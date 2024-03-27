import { ActionType, NotificationTypes } from "../../app/types/enum";

export interface NotificationState {
  type: NotificationTypes | null;
  title?: string | null;
  transactionDetails?: TransactionDetails | null;
  chainDetails?: ChainDetails | null;
  message?: string | null;
  link: NotificationLink | null;
}

interface TransactionDetails {
  fromToken?: NotificationToken | null;
  toToken?: NotificationToken | null;
}

interface NotificationToken {
  symbol: string;
  amount: number;
}

interface ChainDetails {
  originChain: string;
  destinationChain: string;
}

interface NotificationLink {
  text: string;
  href: string;
}

export type NotificationAction =
  | { type: ActionType.SET_NOTIFICATION_TYPE; payload: NotificationTypes }
  | { type: ActionType.SET_NOTIFICATION_TITLE; payload: string }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS; payload: TransactionDetails | null }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM; payload: NotificationToken }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO; payload: NotificationToken | null }
  | { type: ActionType.SET_NOTIFICATION_CHAINS_DETAILS; payload: ChainDetails }
  | { type: ActionType.SET_NOTIFICATION_LINK; payload: NotificationLink }
  | { type: ActionType.SET_NOTIFICATION_LINK_TEXT; payload: string }
  | { type: ActionType.SET_NOTIFICATION_LINK_HREF; payload: string };
