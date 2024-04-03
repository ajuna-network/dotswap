import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import MobilePage from "./MobilePage.tsx";
import { ErrorBoundary } from "react-error-boundary";
import PageError from "./components/organism/PageError";
import { Toaster } from "react-hot-toast";
import { I18nextProvider } from "react-i18next";
import { HelmetProvider } from "react-helmet-async";
import i18n from "./app/config/i18n";
import "./assets/scss/app.scss";
import { init } from "./app/util/helper.ts";

init();

// check if request is from mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary FallbackComponent={PageError}>
        <HelmetProvider>{isMobile ? <MobilePage /> : <App />}</HelmetProvider>
        <Toaster position="top-right" containerClassName="translate-y-toasters" />
      </ErrorBoundary>
    </I18nextProvider>
  </React.StrictMode>
);
