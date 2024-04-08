import { FC } from "react";
import { t } from "i18next";
import DotSwapLogo from "./assets/img/dot-swap-logo.svg?react";
import AlertIcon from "./assets/img/alert-icon.svg?react";

const OfflinePage: FC = () => {
  return (
    <main className="flex h-screen w-full flex-1 flex-col gap-8 p-8">
      <div>
        <DotSwapLogo />
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
