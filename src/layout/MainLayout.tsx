import { Outlet } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Sidebar from "../components/organism/Sidebar";
import ConnectWallet from "../components/organism/ConnectWallet";
import NotificationsModal from "../components/organism/NotificationsModal";
import PendingNotification from "../components/atom/PendingNotification";
import ConnectedChain from "../components/atom/ConnectedChain";

const MainLayout = () => {
  return (
    <>
      <SeoHelmet />
      <div className="flex min-h-screen w-full px-4 py-8">
        <Sidebar />
        <div className="flex w-full flex-col px-4">
          <div className="z-[9999] flex w-full justify-end gap-16">
            <PendingNotification />
            <div className="flex items-center justify-end gap-2">
              <ConnectedChain />
              <ConnectWallet />
            </div>
            <NotificationsModal id="swap" />
            <NotificationsModal id="crosschain" />
            <NotificationsModal id="liquidity" />
          </div>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default MainLayout;
