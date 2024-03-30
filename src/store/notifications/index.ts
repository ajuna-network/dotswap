import { ActionType } from "../../app/types/enum";
import { NotificationAction, NotificationState } from "./interface";

export const initialNotificationState: NotificationState = {
  notificationModalOpen: false,
  notificationType: null,
  notificationTitle: null,
  notificationTransactionDetails: null,
  notificationChainDetails: null,
  notificationMessage: null,
  notificationLink: null,
};

export const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case ActionType.SET_NOTIFICATION_MODAL_OPEN:
      return { ...state, notificationModalOpen: action.payload };
    case ActionType.SET_NOTIFICATION_TYPE:
      return { ...state, notificationType: action.payload };
    case ActionType.SET_NOTIFICATION_TITLE:
      return { ...state, notificationTitle: action.payload };
    case ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS:
      return { ...state, notificationTransactionDetails: action.payload };
    case ActionType.SET_NOTIFICATION_TRANSACTION_FROM:
      return {
        ...state,
        notificationTransactionDetails: {
          ...(state.notificationTransactionDetails || {}),
          fromToken: action.payload,
        },
      };
    case ActionType.SET_NOTIFICATION_TRANSACTION_TO:
      return {
        ...state,
        notificationTransactionDetails: {
          ...(state.notificationTransactionDetails || {}),
          toToken: action.payload,
        },
      };
    case ActionType.SET_NOTIFICATION_CHAINS_DETAILS:
      return { ...state, notificationChainDetails: action.payload };
    case ActionType.SET_NOTIFICATION_MESSAGE:
      return { ...state, notificationMessage: action.payload };
    case ActionType.SET_NOTIFICATION_LINK:
      return { ...state, notificationLink: action.payload };
    case ActionType.SET_NOTIFICATION_LINK_TEXT:
      return {
        ...state,
        notificationLink: state.notificationLink
          ? { ...state.notificationLink, text: action.payload }
          : { text: action.payload, href: "" },
      };
    case ActionType.SET_NOTIFICATION_LINK_HREF:
      return {
        ...state,
        notificationLink: state.notificationLink
          ? { ...state.notificationLink, href: action.payload }
          : { text: "View in block explorer", href: action.payload },
      };
    case ActionType.SET_NOTIFICATION_DATA:
      return {
        notificationModalOpen: action.payload.notificationModalOpen || false,
        notificationType: action.payload.notificationType || null,
        notificationTitle: action.payload.notificationTitle || null,
        notificationTransactionDetails: action.payload.notificationTransactionDetails || null,
        notificationChainDetails: action.payload.notificationChainDetails || null,
        notificationMessage: action.payload.notificationMessage || null,
        notificationLink: action.payload.notificationLink || null,
      };
    case ActionType.RESET_NOTIFICATION_STATE:
      return {
        notificationModalOpen: false,
        notificationType: null,
        notificationTitle: null,
        notificationTransactionDetails: null,
        notificationChainDetails: null,
        notificationMessage: null,
        notificationLink: null,
      };
    default:
      return state;
  }
};
