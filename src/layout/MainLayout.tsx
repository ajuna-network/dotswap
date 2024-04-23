import { Outlet } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Sidebar from "../components/organism/Sidebar";
import ConnectWallet from "../components/organism/ConnectWallet";
import NotificationsModal from "../components/organism/NotificationsModal";

const MainLayout = () => {
  return (
    <>
      <SeoHelmet />
      <div className="flex min-h-screen w-full px-4 py-8">
        <Sidebar />
        <div className="flex w-full flex-col px-4">
          <div className="z-[9999] flex w-full justify-end">
            <ConnectWallet />
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
