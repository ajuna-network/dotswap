import { t } from "i18next";
import Button from "../../atom/Button";
import DotSwapLogo from "../../../assets/img/dot-swap-logo.svg?react";
import AlertIcon from "../../../assets/img/alert-icon.svg?react";

export type FallbackProps = {
  error: Error | undefined;
  resetErrorBoundary: () => void;
};

const PageError = ({ error, resetErrorBoundary }: FallbackProps) => {
  const onReset = () => {
    resetErrorBoundary();
  };
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
        <div className="text-normal w-full text-center">
          {t("pageError.error")} <pre>{error?.message}</pre>
        </div>
        <div>
          <Button onClick={onReset}>{t("pageError.tryAgain")}</Button>
        </div>
      </div>
    </main>
  );
};

export default PageError;
