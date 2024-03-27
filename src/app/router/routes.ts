import { t } from "i18next";

const HOME_ROUTE = "/";
const POOLS_ROUTE = "pools";
const ADD_LIQUIDITY = "add-liquidity";
const ADD_LIQUIDITY_TO_EXISTING = "add-liquidity/:id";
const REMOVE_LIQUIDITY_FROM_EXISTING = "remove-liquidity/:id";
const SWAP_ROUTE = "swap";
const DASHBOARD_ROUTE = "dashboard";
const CROSS_CHAIN_ROUTE = "cross-chain";
const SUPPORT_ROUTE = "support";
const POOLS_ADD_LIQUIDITY = "/pools/add-liquidity";
const POOLS_PAGE = "/pools";
const TEST_ROUTE = "/test";

const SEO_ROUTES = {
  [POOLS_ROUTE]: {
    title: t("seo.pools.title"),
    description: t("seo.pools.description"),
  },
  [SWAP_ROUTE]: {
    title: t("seo.swap.title"),
    description: t("seo.swap.description"),
  },
};

export {
  HOME_ROUTE,
  POOLS_ROUTE,
  SWAP_ROUTE,
  DASHBOARD_ROUTE,
  CROSS_CHAIN_ROUTE,
  ADD_LIQUIDITY,
  POOLS_ADD_LIQUIDITY,
  POOLS_PAGE,
  SEO_ROUTES,
  ADD_LIQUIDITY_TO_EXISTING,
  REMOVE_LIQUIDITY_FROM_EXISTING,
  SUPPORT_ROUTE,
  TEST_ROUTE,
};
