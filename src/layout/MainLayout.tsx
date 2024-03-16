import { Outlet } from "react-router-dom";
import SeoHelmet from "../components/atom/SeoHelmet";
import Sidebar from "../components/organism/Sidebar";
import ConnectWallet from "../components/organism/ConnectWallet";

const MainLayout = () => {
  return (
    <>
      <SeoHelmet />
      <div className="flex min-h-screen w-full px-4 py-8">
        <div className="absolute right-0 top-0 z-[9999] px-4 py-8">
          <ConnectWallet />
        </div>
        <Sidebar />
        <Outlet />
      </div>
    </>
  );
};

export default MainLayout;
