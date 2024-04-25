import { FC } from "react";
import { t } from "i18next";
import DotSwapLogo from "./assets/img/dot-swap-logo.svg?react";

type MobilePageProps = {
  isMobile: boolean;
};
const MobilePage: FC<MobilePageProps> = ({ isMobile = false }: { isMobile: boolean }) => {
  const title = isMobile ? t("mobilePage.title") : t("mobilePage.responsiveTitle");
  const subtitle = isMobile ? t("mobilePage.subtitle") : t("mobilePage.responsiveSubtitle");
  return (
    <main className="flex h-screen w-full flex-1 flex-col gap-8 p-8">
      <div>
        <DotSwapLogo />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
        <div className="w-full text-center font-unbounded-variable text-heading-5 font-semibold">{title}</div>
        <div className="text-normal w-full text-center">{subtitle}</div>
      </div>
    </main>
  );
};

export default MobilePage;
