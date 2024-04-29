import { t } from "i18next";
import DotSwapLogo from "../../assets/img/dot-swap-logo.svg?react";
import AlertIcon from "../../assets/img/alert-icon.svg?react";
import DedSwapLogo from "../../assets/img/ded-bird-logo.png";

const NotFoundPage = () => {
  return (
    <main className="flex h-screen w-full flex-1 flex-col gap-8 p-8">
      <div className="dark:hidden">
        <DotSwapLogo />
      </div>
      <div className="hidden dark:flex">
        <img src={DedSwapLogo} alt="Dedswap Logo" className="w-20" />
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
        <div className="dark:rounded-sm dark:border-8 dark:border-black dark:bg-white dark:px-8 dark:py-6">
          <div className="[&>svg]:h-20 [&>svg]:w-20">
            <AlertIcon />
          </div>
          <div className="w-full text-center font-unbounded-variable text-heading-5 font-semibold dark:font-omnes-bold">
            {t("pageNotFound")}
          </div>
        </div>
      </div>
    </main>
  );
};
export default NotFoundPage;
