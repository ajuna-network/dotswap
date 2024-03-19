import { Outlet } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Sidebar from "../components/organism/Sidebar";
import ConnectWallet from "../components/organism/ConnectWallet";

const MainLayout = () => {
  return (
    <>
      <SeoHelmet />
      <div className="flex min-h-screen w-full px-4 py-8">
        <Sidebar />
        <div className="flex w-full flex-col px-4">
          <div className="z-[9999] flex w-full justify-end">
            <ConnectWallet />
          </div>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default MainLayout;
