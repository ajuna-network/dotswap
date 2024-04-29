import { FC } from "react";
import { t } from "i18next";
import AlertIcon from "./assets/img/alert-icon.svg?react";
import AppLogo from "./components/atom/AppLogo";

const OfflinePage: FC = () => {
  return (
    <main className="flex h-screen w-full flex-1 flex-col gap-8 p-8">
      <div>
        <AppLogo />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
        <div className="[&>svg]:h-20 [&>svg]:w-20">
          <AlertIcon />
        </div>
        <div className="w-full text-center font-unbounded-variable text-heading-5 font-semibold">
          {t("offlinePage.title")}
        </div>
        <div className="text-normal w-full text-center">{t("offlinePage.subtitle")}</div>
      </div>
    </main>
  );
};

export default OfflinePage;
