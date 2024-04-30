import { FC } from "react";
import { t } from "i18next";
import AppLogo from "./components/atom/AppLogo";

type MobilePageProps = {
  isMobile: boolean;
};
const MobilePage: FC<MobilePageProps> = ({ isMobile = false }: { isMobile: boolean }) => {
  const title = isMobile ? t("mobilePage.title") : t("mobilePage.responsiveTitle");
  const subtitle = isMobile ? t("mobilePage.subtitle") : t("mobilePage.responsiveSubtitle");
  return (
    <main className="flex h-screen w-full flex-1 flex-col gap-8 p-8">
      <div>
        <AppLogo />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5  dark:bg-white dark:px-4 dark:py-8 dark:outline dark:outline-8 dark:outline-black">
        <div className="w-full text-center font-unbounded-variable text-heading-5 font-semibold dark:font-omnes-bold">
          {title}
        </div>
        <div className="text-normal w-full text-center dark:font-open-sans dark:font-extrabold">{subtitle}</div>
      </div>
    </main>
  );
};

export default MobilePage;
