import { ActionType, ToasterType } from "../../app/types/enum";

export interface NotificationState {
  notifications: SingleNotification[];
}

export interface SingleNotification {
  id: string;
  notificationModalOpen: boolean;
  notificationViewed?: boolean | null;
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
  | { type: ActionType.ADD_NOTIFICATION; payload: SingleNotification }
  | { type: ActionType.UPDATE_NOTIFICATION; payload: { id: string; props: Partial<SingleNotification> } }
  | { type: ActionType.REMOVE_NOTIFICATION; payload: string }
  | { type: ActionType.SET_NOTIFICATION_VIEWED; payload: { id: string; notificationViewed: boolean } }
  | { type: ActionType.SET_NOTIFICATION_MODAL_OPEN; payload: { id: string; notificationModalOpen: boolean } }
  | { type: ActionType.SET_NOTIFICATION_TYPE; payload: { id: string; toasterType: ToasterType } }
  | { type: ActionType.SET_NOTIFICATION_TITLE; payload: { id: string; title: string | null } }
  | {
      type: ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS;
      payload: { id: string; details: NotificationTransactionDetails | null };
    }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM; payload: { id: string; fromToken: NotificationToken } }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_FROM_AMOUNT; payload: { id: string; amount: number } }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO; payload: { id: string; toToken: NotificationToken | null } }
  | { type: ActionType.SET_NOTIFICATION_TRANSACTION_TO_AMOUNT; payload: { id: string; amount: number } }
  | { type: ActionType.SET_NOTIFICATION_MESSAGE; payload: { id: string; message: string | null } }
  | {
      type: ActionType.SET_NOTIFICATION_CHAINS_DETAILS;
      payload: { id: string; chainDetails: NotificationChainDetails | null };
    }
  | { type: ActionType.SET_NOTIFICATION_LINK; payload: { id: string; link: NotificationLink | null } }
  | { type: ActionType.SET_NOTIFICATION_LINK_TEXT; payload: { id: string; text: string } }
  | { type: ActionType.SET_NOTIFICATION_LINK_HREF; payload: { id: string; href: string } }
  | { type: ActionType.SET_NOTIFICATION_ACTION; payload: { id: string; action: string | null } }
  | { type: ActionType.SET_NOTIFICATION_DATA; payload: { id: string; notificationData: Partial<SingleNotification> } }
  | { type: ActionType.RESET_NOTIFICATION_STATE };
