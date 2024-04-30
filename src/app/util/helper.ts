import type { AnyJson } from "@polkadot/types/types/codec";
import * as Sentry from "@sentry/react";
import { Decimal } from "decimal.js";
import { t } from "i18next";
import { UrlParamType, TokenBalanceData } from "../types";
import { isHex } from "@polkadot/util";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import { getAssetTokenFromNativeToken, getNativeTokenFromAssetToken } from "../../services/tokenServices";
import { ApiPromise } from "@polkadot/api";

export const init = () => {
  // Sentry
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
  });
};

export const reduceAddress = (address: string | undefined, lengthLeft: number, lengthRight: number) => {
  if (address) {
    const addressLeftPart = address.substring(0, lengthLeft);
    const addressRightPart = address.substring(48 - lengthRight, 48);
    return `${addressLeftPart}...${addressRightPart}`;
  }
  return t("wallet.notConnected");
};

export const urlTo = (path: string, params?: UrlParamType) => {
  for (const param in params) {
    path = path?.replace(new RegExp(`:${param}`, "g"), params[param as keyof UrlParamType]);
  }
  return path;
};

export const calculateSlippageReduce = (tokenValue: Decimal.Value, slippageValue: number) => {
  return new Decimal(tokenValue).minus(new Decimal(tokenValue).times(slippageValue).dividedBy(100)).toFixed();
};

export const calculateSlippageAdd = (tokenValue: Decimal.Value, slippageValue: number) => {
  return new Decimal(tokenValue).plus(new Decimal(tokenValue).times(slippageValue).dividedBy(100)).toFixed();
};

export const formatInputTokenValue = (base: Decimal.Value, decimals: string) => {
  return new Decimal(base)
    .times(Math.pow(10, parseFloat(decimals)))
    .floor()
    .toFixed();
};

export const liquidityProviderFee = (base: Decimal.Value, lpFee: string) => {
  return new Decimal(base).times(parseFloat(lpFee)).dividedBy(100).toFixed();
};

export const formatDecimalsFromToken = (base: Decimal.Value, decimals: string) => {
  return new Decimal(base || 0).dividedBy(Math.pow(10, parseFloat(decimals || "0"))).toFixed();
};

export const errorMessageHandler = (errorValue: string) => {
  switch (errorValue) {
    case t("error.pallet.AmountOneLessThanMinimal"):
      return t("error.platform.AmountOneLessThanMinimal");
    case t("error.pallet.AmountOutTooHigh"):
      return t("error.platform.AmountOutTooHigh");
    case t("error.pallet.AmountTwoLessThanMinimal"):
      return t("error.platform.AmountTwoLessThanMinimal");
    case t("error.pallet.ProvidedMinimumNotSufficientForSwap"):
      return t("error.platform.ProvidedMinimumNotSufficientForSwap");
    case t("error.pallet.AssetOneDepositDidNotMeetMinimum"):
      return t("error.platform.AssetOneDepositDidNotMeetMinimum");
    case t("error.pallet.EqualAssets"):
      return t("error.platform.EqualAssets");
    case t("error.pallet.IncorrectPoolAssetId"):
      return t("error.platform.IncorrectPoolAssetId");
    case t("error.pallet.CorrespondenceError"):
      return t("error.platform.CorrespondenceError");
    case t("error.pallet.InsufficientLiquidity"):
      return t("error.platform.InsufficientLiquidity");
    case t("error.pallet.PoolExists"):
      return t("error.platform.PoolExists");
    case t("error.pallet.PoolNotFound"):
      return t("error.platform.PoolNotFound");
    case t("error.pallet.ProvidedMaximumNotSufficientForSwap"):
      return t("error.platform.ProvidedMaximumNotSufficientForSwap");
    case t("error.pallet.WrongDesiredAmount"):
      return t("error.platform.WrongDesiredAmount");
    case t("error.pallet.ZeroAmount"):
      return t("error.platform.ZeroAmount");
    case t("error.pallet.ZeroLiquidity"):
      return t("error.platform.ZeroLiquidity");
    case t("error.pallet.NotExpendable"):
      return t("error.platform.NotExpendable");
    case t("error.pallet.TransactionCanceled"):
      return t("error.platform.TransactionCanceled");
    default:
      return errorValue;
  }
};

export const checkIfPoolAlreadyExists = (id: string, poolArray: AnyJson[]) => {
  let exists = false;

  if (id && poolArray) {
    exists = !!poolArray?.find((pool: any) => {
      return (
        pool?.[0]?.[1]?.interior?.X2 &&
        pool?.[0]?.[1]?.interior?.X2?.[1]?.GeneralIndex?.replace(/[, ]/g, "").toString() === id
      );
    });
  }

  return exists;
};

export const truncateDecimalNumber = (number: string, size = 2): number => {
  const value = number.split(".");

  if (value?.[1]) {
    return Number(`${value[0]}.${value[1].slice(0, size)}`);
  }

  return Number(value);
};

export const toFixedNumber = (number: number) => {
  let decimalX = new Decimal(number);

  if (decimalX.abs().lessThan(1.0)) {
    const e = decimalX.toString().split("e-")[1];
    if (e) {
      const powerOfTen = new Decimal(10).pow(new Decimal(e).minus(1));
      decimalX = decimalX.times(powerOfTen);
      decimalX = new Decimal("0." + "0".repeat(parseInt(e)) + decimalX.toString().substring(2));
    }
  } else {
    let e = parseInt(decimalX.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      decimalX = decimalX.dividedBy(new Decimal(10).pow(e));
      decimalX = decimalX.plus(new Decimal("0".repeat(e + 1)));
    }
  }

  return decimalX.toNumber();
};

/**
 * Accepts a string input and converts it to the base unit
 * @param input format like "110.4089 µKSM", "1.9200 mWND" or "0.001919 WND"
 * @returns converted value in the base unit (e.g. 0.0000001104089, 0.00192)
 */
export const convertToBaseUnit = (input: string): Decimal => {
  // Regular expression to extract the number, optionally the unit (m or µ), followed by the currency type
  const regex = /(\d+\.?\d*)\s*([mµ])?\w+/;
  const match = input.match(regex);

  if (!match) {
    return new Decimal(0);
  }

  const [, rawValue, unit] = match;
  let value = new Decimal(rawValue);

  // Convert based on the unit
  switch (unit) {
    case "m": // milli, divide by 1,000
      value = value.div(1000);
      break;
    case "µ": // micro, divide by 1,000,000
      value = value.div(1000000);
      break;
    // If no unit is specified, we assume the value is already in the base unit
  }

  return value;
};

// Validate Polkadot address
export const isWalletAddressValid = (address: string) => {
  try {
    const decoded = encodeAddress(isHex(address) ? address : decodeAddress(address));
    if (decoded !== address) {
      throw new Error("Invalid address");
    } else {
      return true;
    }
  } catch (error) {
    return false;
  }
};

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};

const setCookie = (name: string, value: string, minutes: number) => {
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
};

/**
 * Fetches the spot price of a token from Coinstats API
 * @param tokenSymbol pass the token symbol to get the spot price in USD
 * @returns USD value of the token
 */

export const getSpotPrice = async (symbol: string) => {
  const data = getCookie("spotPrice");

  const getNameFromSymbol = (symbol: string) => {
    switch (symbol) {
      case "KSM":
        return "kusama";
      case "DOT":
        return "polkadot";
      case "ROC":
        return "roco-finance";
      case "GUPPY":
        return "guppy-gang";
      case "USDt":
        return "tether";
      case "USDC":
        return "usd-coin";
      default:
        return null;
    }
  };

  const singlePrice = getNameFromSymbol(symbol);

  const names = ["polkadot", "tether", "usd-coin"];

  if (singlePrice && !names.includes(singlePrice)) {
    names.push(singlePrice);
  } else if (data && singlePrice && names.includes(singlePrice)) {
    const jsonData = JSON.parse(data);
    return jsonData[singlePrice] || "0";
  } else if (!singlePrice) {
    return "0";
  }

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-API-KEY": process.env.VITE_COINSTATS_API_KEY,
    },
  };

  try {
    const spotPriceObject = Object.fromEntries(
      await Promise.all(
        names.map(async (name) => {
          const response = await fetch(
            `https://openapiv1.coinstats.app/coins/${name}?currency=USD`,
            options as RequestInit
          );
          const data = await response.json();
          return [name, JSON.stringify(data.price, null, 2)];
        })
      )
    );

    setCookie("spotPrice", JSON.stringify(spotPriceObject), 1);
    return spotPriceObject[singlePrice] || "0";
  } catch (error) {
    console.error("Error fetching spot price", error);
    return "0";
  }
};

/**
 * Fetches the spot price of a token from Coingecko API
 * @param symbol pass the token symbol to get the spot price in USD
 * @returns USD value of the token
 */

// export const getSpotPrice = async (symbol: string) => {
//   const data = getCookie("spotPrice");

//   const getNameFromSymbol = (symbol: string) => {
//     switch (symbol) {
//       case "KSM":
//         return "kusama";
//       case "DOT":
//         return "polkadot";
//       case "ROC":
//         return "roco-finance";
//       case "GUPPY":
//         return "guppy-gang";
//       case "USDt":
//         return "tether";
//       case "USDC":
//         return "usd-coin";
//       default:
//         return null;
//     }
//   };

//   const singlePrice = getNameFromSymbol(symbol);

//   const names = ["polkadot", "tether", "usd-coin"];

//   if (singlePrice && !names.includes(singlePrice)) {
//     names.push(singlePrice);
//   } else if (data && singlePrice && names.includes(singlePrice)) {
//     const jsonData = JSON.parse(data);
//     return jsonData[singlePrice].usd || "0";
//   } else if (!singlePrice) {
//     return "0";
//   }

//   const options = {
//     method: "GET",
//     headers: {
//       accept: "application/json",
//     },
//   };
//   try {
//     const res = await fetch(
//       `https://api.coingecko.com/api/v3/simple/price?ids=${names}&vs_currencies=usd&precision=10`,
//       options
//     );
//     if (!res.ok) {
//       console.error("Error fetching spot price", res.status, res.statusText);
//       return "0";
//     }
//     const json = await res.json();
//     setCookie("spotPrice", JSON.stringify(json), 1);
//     const token = (singlePrice && json[singlePrice].usd) || "0";
//     return token;
//   } catch (error) {
//     console.error("Error fetching spot price", error);
//     return "0";
//   }
// };

// destination chain fee for Polkadot Asset Hub -> Polkadot Relay Chain
// destination chain fee: 0.0020830735 DOT
export const getCrossInDestinationFee = () => {
  return "0.0029169265";
};

//
// destination chain fee for Polkadot Relay Chain -> Polkadot Asset Hub
// destination chain fee: 0.0397 DOT
export const getCrossOutDestinationFee = () => {
  return "0.003593";
};

// function for calculating max amount for cross out
// existential deposit for polkadot relay chain is 1.0000000000 DOT
// xcm instructions buffer for cross out is 0.000371525 DOT
// free balance - origin chain fee - destination chain fee - existential deposit
export const calculateMaxAmountForCrossOut = (
  freeBalance: string,
  originChainFee: string,
  chainExistentialDeposit: string
) => {
  //   const xcmInstructionsBuffer = new Decimal("0.01371525");
  //   const xcmInstructionsBuffer = new Decimal("0.03095");
  const existentialDeposit = new Decimal(chainExistentialDeposit);
  const freeBalanceDecimal = new Decimal(freeBalance);
  const originChainFeeDecimal = new Decimal(originChainFee);
  const destinationChainFeeDecimal = new Decimal(getCrossOutDestinationFee());

  return (
    freeBalanceDecimal
      // .minus(xcmInstructionsBuffer)
      .minus(originChainFeeDecimal)
      .minus(existentialDeposit)
      .minus(destinationChainFeeDecimal)
      .toString()
  );
};

// function for calculating max amount for cross in
// existential deposit for polkadot asset hub is 1.0000000000 DOT
// xcm instructions buffer for cross in is 0.0005298333 DOT
// free balance - origin chain fee - destination chain fee - existential deposit
export const calculateMaxAmountForCrossIn = (
  freeBalance: string,
  originChainFee: string,
  chainExistentialDeposit: string
) => {
  //   const xcmInstructionsBuffer = new Decimal("0.015298333");
  //   const xcmInstructionsBuffer = new Decimal("0.0393");
  const existentialDeposit = new Decimal(chainExistentialDeposit);
  const freeBalanceDecimal = new Decimal(freeBalance);
  const originChainFeeDecimal = new Decimal(originChainFee);
  const destinationChainFeeDecimal = new Decimal(getCrossInDestinationFee());
  return (
    freeBalanceDecimal
      // .minus(xcmInstructionsBuffer)
      .minus(originChainFeeDecimal)
      .minus(existentialDeposit)
      .minus(destinationChainFeeDecimal)
      .toString()
  );
};

export const generateRandomString = (length: number) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// get asset token price from native token
export const getAssetTokenSpotPrice = async (
  api: any,
  tokenId: string,
  tokenDecimals: string,
  tokenBalances: TokenBalanceData
) => {
  if (!api || !Object.keys(api).length || !tokenBalances || !Object.keys(tokenBalances).length) return "0";
  if (tokenId === "") return tokenBalances.spotPrice;
  const nativeTokenValue = formatInputTokenValue(
    tokenBalances.balanceAsset.free && tokenBalances.balanceAsset.free !== "0" ? tokenBalances.balanceAsset.free : "1",
    tokenBalances.tokenDecimals
  );
  const assetToken = await getAssetTokenFromNativeToken(api, tokenId, nativeTokenValue);

  if (!assetToken) return "0";

  const formattedToken =
    Number(formatDecimalsFromToken(assetToken.toString().replace(/[, ]/g, ""), tokenDecimals)) || 0;

  if (formattedToken === 0) return "0";

  const spotPrice = new Decimal(Number(tokenBalances.spotPrice) || 0).times(
    new Decimal(Number(tokenBalances?.balanceAsset?.free) || 1).div(formattedToken)
  );

  return spotPrice.toString();
};

// get native token value from asset token
export const getNativeTokenSpotPrice = async (api: any, tokenId: string, tokenDecimals: string) => {
  if (!api || !Object.keys(api).length) return "0";
  const value = await getNativeTokenFromAssetToken(api, tokenId, "1000000").then((res) => {
    if (res) {
      return formatDecimalsFromToken(res.toString().replace(/[, ]/g, ""), tokenDecimals);
    }
    return "0";
  });

  const spotPrice = new Decimal(1).dividedBy(new Decimal(value)).toFixed();
  return spotPrice;
};

// function for formatting numbers
export const formatNumberEnUs = (value: number, fixed?: number, showDollarSign = false) => {
  let decimals = fixed || 2;
  if (value > 1 && fixed) {
    decimals = 4;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let formattedValue = formatter.format(value);

  if (fixed) {
    if (value < 1 && formattedValue.includes(".")) {
      const [integerPart, decimalPart] = formattedValue.split(".");
      if (decimalPart && integerPart === "0") {
        if (decimalPart[0] !== "0") {
          formattedValue = integerPart + "." + decimalPart.slice(0, 4);
        } else {
          const firstNonZeroIndex = decimalPart.split("").findIndex((char) => char !== "0");
          formattedValue = integerPart + "." + decimalPart.slice(0, firstNonZeroIndex + 4);
        }
      }
    }

    formattedValue = formattedValue.replace(/\.?0+$/, "");

    if (formattedValue.endsWith(".")) {
      formattedValue = formattedValue.slice(0, -1);
    }
  }
  const approx = "~ ";
  const dollarSign = "$";

  let showApprox = false;

  if (value > 0 && formattedValue === "0.00") {
    showApprox = true;
  } else if (value > 0 && formattedValue === "0") {
    showApprox = true;
  }

  formattedValue = `${showApprox ? approx : ""}${showDollarSign ? dollarSign : ""}${formattedValue}`;

  return formattedValue;
};

/*
 * Function to check if api and/or relayApi are available
 * @param api
 * @param relayApi
 * @returns boolean
 */
export const isApiAvailable = async (api?: ApiPromise, relayApi?: ApiPromise): Promise<boolean> => {
  if (api && relayApi) {
    const isReady = (await api.isReadyOrError) && (await relayApi.isReadyOrError);
    return !!isReady;
  }
  if (api && api.isConnected) {
    const isReady = await api.isReadyOrError;
    return !!isReady;
  }
  if (relayApi && relayApi.isConnected) {
    const isReady = await relayApi.isReadyOrError;
    return !!isReady;
  }
  return false;
};

export const getPlatform = () => {
  if (process.env.VITE_VERSION === "dotswap") {
    return "DOTswap";
  }
  return "DEDswap";
};
