import { ActionType } from "../../app/types/enum";
import { NotificationAction, NotificationState } from "./interface";

export const initialNotificationState: NotificationState = {
  notifications: [],
};

export const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case ActionType.ADD_NOTIFICATION:
      return { ...state, notifications: [...state.notifications, action.payload] };

    case ActionType.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload.props } : n
        ),
      };

    case ActionType.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case ActionType.SET_NOTIFICATION_MODAL_OPEN:
    case ActionType.SET_NOTIFICATION_VIEWED:
    case ActionType.SET_NOTIFICATION_TYPE:
    case ActionType.SET_NOTIFICATION_ACTION:
    case ActionType.SET_NOTIFICATION_TITLE:
    case ActionType.SET_NOTIFICATION_TRANSACTION_DETAILS:
    case ActionType.SET_NOTIFICATION_TRANSACTION_FROM:
    case ActionType.SET_NOTIFICATION_TRANSACTION_FROM_AMOUNT:
    case ActionType.SET_NOTIFICATION_TRANSACTION_TO:
    case ActionType.SET_NOTIFICATION_TRANSACTION_TO_AMOUNT:
    case ActionType.SET_NOTIFICATION_CHAINS_DETAILS:
    case ActionType.SET_NOTIFICATION_MESSAGE:
    case ActionType.SET_NOTIFICATION_LINK:
    case ActionType.SET_NOTIFICATION_LINK_TEXT:
    case ActionType.SET_NOTIFICATION_LINK_HREF:
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.payload.id ? { ...n, ...action.payload } : n)),
      };

    case ActionType.SET_NOTIFICATION_DATA:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload.notificationData } : n
        ),
      };

    case ActionType.RESET_NOTIFICATION_STATE:
      return initialNotificationState;

    default:
      return state;
  }
};
