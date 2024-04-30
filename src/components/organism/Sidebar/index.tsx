import classNames from "classnames";
import { NavLink, useLocation } from "react-router-dom";
import { CROSS_CHAIN_ROUTE, DASHBOARD_ROUTE, SUPPORT_ROUTE, SWAP_ROUTE } from "../../../app/router/routes.ts";
import CrossChainIcon from "../../../assets/img/cross-chain-icon.svg?react";
import DashboardIcon from "../../../assets/img/dashboard-icon.svg?react";
import SwapIcon from "../../../assets/img/swap-icon.svg?react";
import GitIcon from "../../../assets/img/git-icon.svg?react";
import XIcon from "../../../assets/img/x-icon.svg?react";
import TelegramIcon from "../../../assets/img/telegram-icon.svg?react";
import { t } from "i18next";
import AppLogo from "../../atom/AppLogo/index.tsx";

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="shrink-1 sticky top-8 flex max-h-[calc(100vh-64px)] w-full max-w-[194px] flex-col gap-6">
      <div className="flex h-full w-full flex-col items-start gap-7 rounded-2xl bg-white py-8 ">
        <div className="mb-12 pl-4">
          <AppLogo />
        </div>
        <div className="flex h-full w-full flex-col justify-between text-dark-300">
          <div>
            <NavLink
              to={DASHBOARD_ROUTE}
              className={classNames(
                "flex h-[55px] cursor-pointer items-center justify-start gap-3 pl-6 font-inter tracking-[.96px] hover:bg-dark-100",
                {
                  "border-l-2 border-primary-500 bg-dark-100 text-dark-400":
                    location.pathname.includes(DASHBOARD_ROUTE),
                }
              )}
            >
              <DashboardIcon />
              {t("button.dashboard")}
            </NavLink>
            <NavLink
              to={SWAP_ROUTE}
              className={classNames(
                "flex h-[55px] cursor-pointer items-center justify-start gap-3 pl-6 font-inter tracking-[.96px] hover:bg-dark-100",
                {
                  "border-l-2 border-primary-500 bg-dark-100 text-dark-400": location.pathname.includes(SWAP_ROUTE),
                }
              )}
            >
              <SwapIcon />
              {t("button.swap")}
            </NavLink>
            <NavLink
              to={CROSS_CHAIN_ROUTE}
              className={classNames(
                "flex h-[55px] cursor-pointer items-center justify-start gap-3 pl-6 font-inter tracking-[.96px] hover:bg-dark-100",
                {
                  "border-l-2 border-primary-500 bg-dark-100 text-dark-400":
                    location.pathname.includes(CROSS_CHAIN_ROUTE),
                }
              )}
            >
              <CrossChainIcon />
              {t("button.crossChain")}
            </NavLink>
          </div>
          <NavLink
            to={import.meta.env.VITE_ANALYTICS_URL}
            className={classNames(
              "flex h-[55px] cursor-pointer items-center justify-start gap-3 pl-6 font-inter tracking-[.96px] hover:bg-dark-100",
              {
                "border-l-2 border-primary-500 bg-dark-100 text-dark-400": location.pathname.includes(SUPPORT_ROUTE),
              }
            )}
          >
            <DashboardIcon />
            {t("button.analytics")}
          </NavLink>
        </div>
      </div>
      <div className="flex w-full justify-between px-8">
        <a href={import.meta.env.VITE_GIT_URL} target="_blank" rel="noreferrer">
          <GitIcon />
        </a>
        <a href={import.meta.env.VITE_TWITTER_URL} target="_blank" rel="noreferrer">
          <XIcon />
        </a>
        <a href={import.meta.env.VITE_TELEGRAM_URL} target="_blank" rel="noreferrer">
          <TelegramIcon />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
