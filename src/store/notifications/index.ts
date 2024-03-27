import { ActionType } from "../../app/types/enum";
import { NotificationAction, NotificationState } from "./interface";

export const initialNotificationState: NotificationState = {
  type: null,
  title: null,
  transactionDetails: null,
  chainDetails: null,
  message: null,
  link: null,
};

export const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case ActionType.SET_NOTIFICATION_TYPE:
      return { ...state, type: action.payload };
    case ActionType.SET_NOTIFICATION_TITLE:
      return { ...state, title: action.payload };
    case ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS:
      return { ...state, transactionDetails: action.payload };
    case ActionType.SET_NOTIFICATION_TRANSACTION_FROM:
      return {
        ...state,
        transactionDetails: {
          ...(state.transactionDetails || {}),
          fromToken: action.payload,
        },
      };
    case ActionType.SET_NOTIFICATION_TRANSACTION_TO:
      return {
        ...state,
        transactionDetails: {
          ...(state.transactionDetails || {}),
          toToken: action.payload,
        },
      };
    case ActionType.SET_NOTIFICATION_CHAINS_DETAILS:
      return { ...state, chainDetails: action.payload };
    case ActionType.SET_NOTIFICATION_LINK:
      return { ...state, link: action.payload };
    case ActionType.SET_NOTIFICATION_LINK_TEXT:
      return {
        ...state,
        link: state.link ? { ...state.link, text: action.payload } : { text: action.payload, href: "" },
      };
    case ActionType.SET_NOTIFICATION_LINK_HREF:
      return {
        ...state,
        link: state.link
          ? { ...state.link, href: action.payload }
          : { text: "View in block explorer", href: action.payload },
      };
    default:
      return state;
  }
};
