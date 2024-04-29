import { FC } from "react";
import CircleLoader from "../../../assets/img/rotating-circle.svg?react";
import { useAppContext } from "../../../state";
import { ToasterType } from "../../../app/types/enum.ts";
import { t } from "i18next";

const PendingNotification: FC = () => {
  const { state } = useAppContext();
  const { notifications } = state;
  const pendingNotifications = notifications.filter((n) => n.notificationType === ToasterType.PENDING);

  return pendingNotifications && pendingNotifications.length > 0 ? (
    <div className="group relative flex cursor-pointer items-center gap-4 rounded-medium bg-pink px-4 py-2 text-center">
      <span className="font-medium lowercase leading-none text-white">
        {pendingNotifications.length} {t("modal.notifications.pending")}
      </span>
      <CircleLoader className="animate-spin" />
      <div className="invisible absolute right-full top-1/2 z-10 w-max -translate-x-2 -translate-y-1/2 rounded-lg bg-yellow-100 p-2 text-sm opacity-0 drop-shadow-md transition-all duration-300 group-hover:visible group-hover:opacity-100 [&>path]:fill-yellow-100 ">
        <div className="font-inter text-medium font-normal normal-case leading-normal text-dark-300">
          {pendingNotifications.length}{" "}
          {pendingNotifications.length > 1 ? t("wallet.pendingMultiple") : t("wallet.pendingSingle")}{" "}
          {t("wallet.pending")}
        </div>
      </div>
    </div>
  ) : null;
};

export default PendingNotification;
