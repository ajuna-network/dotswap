import { createBrowserRouter, Navigate } from "react-router-dom";
import SwapPage from "../../pages/SwapPage";
import LiquidityPage from "../../pages/LiquidityPage/index.tsx";
import {
  HOME_ROUTE,
  SWAP_ROUTE,
  ADD_LIQUIDITY,
  ADD_LIQUIDITY_TO_EXISTING,
  REMOVE_LIQUIDITY_FROM_EXISTING,
  DASHBOARD_ROUTE,
  CROSS_CHAIN_ROUTE,
  SUPPORT_ROUTE,
  TEST_ROUTE,
} from "./routes";
import MainLayout from "../../layout/MainLayout.tsx";
import NotFoundPage from "../../pages/NotFoundPage";
import DashboardPage from "../../pages/DashboardPage/index.tsx";
import CrossChainPage from "../../pages/CrossChainPage/index.tsx";
import SupportPage from "../../pages/SupportPage/index.tsx";
import TestPage from "../../pages/TestPage/index.tsx";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: HOME_ROUTE,
        element: <Navigate to={SWAP_ROUTE} />,
      },

      {
        path: SWAP_ROUTE,

        children: [
          {
            element: <SwapPage />,
            index: true,
          },
          {
            path: ADD_LIQUIDITY,
            element: <LiquidityPage />,
            index: true,
          },
          {
            path: ADD_LIQUIDITY_TO_EXISTING,
            element: <LiquidityPage />,
            index: true,
          },
          {
            path: REMOVE_LIQUIDITY_FROM_EXISTING,
            element: <LiquidityPage />,
            index: true,
          },
        ],
      },

      {
        path: DASHBOARD_ROUTE,
        element: <DashboardPage />,
      },
      {
        path: CROSS_CHAIN_ROUTE,
        element: <CrossChainPage />,
      },
      {
        path: SUPPORT_ROUTE,
        element: <SupportPage />,
      },
      {
        path: TEST_ROUTE,
        element: <TestPage />,
      },
    ],
  },
]);

export default router;
