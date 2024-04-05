import { FC } from "react";
import { t } from "i18next";
import DotSwapLogo from "./assets/img/dot-swap-logo.svg?react";

const MobilePage: FC = () => {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-8 p-4">
      <DotSwapLogo />
      <div className="text-normal w-full text-center">{t("mobilePage.subtitle")}</div>
    </main>
  );
};

export default MobilePage;
