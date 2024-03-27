import AccordionAssetItem from "../../molecule/AccordionAssetItem";
import AccordionList from "../../molecule/AccordionList";
import { useAppContext } from "../../../state";
import { useEffect, useState } from "react";
import { whitelist } from "../../../whitelist";
import { fetchNativeTokenBalances } from "../../../services/polkadotWalletServices";
import AssetItemChild from "../../molecule/AccordionAssetItem/AssetItemChild";
import Modal from "../../atom/Modal";
import SwapTokens from "../SwapTokens";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import { formatDecimalsFromToken, getSpotPrice } from "../../../app/util/helper";
import { AssetListToken } from "../../../app/types";
import { ActionType } from "../../../app/types/enum";
import ConnectWallet from "../ConnectWallet";
import { LottieLarge } from "../../../assets/loader";
import LocalStorage from "../../../app/util/localStorage.ts";

const AssetsTable = () => {
  const { state, dispatch } = useAppContext();

  const { rpcUrlRelay } = useGetNetwork();

  const {
    tokenBalances,
    api,
    selectedAccount,
    assetLoading,
    assetsList,
    otherAssets,
    nativeTokenSpotPrice,
    walletBalanceUSD,
  } = state;

  const walletConnected = LocalStorage.get("wallet-connected");

  const [totalBalance, setTotalBalance] = useState<number>(walletBalanceUSD);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");

  const setTokens = async () => {
    if (tokenBalances && tokenBalances.assets && api) {
      const tokenSpotPrice = (await getSpotPrice(tokenBalances.tokenSymbol)) || "0";
      dispatch({ type: ActionType.SET_NATIVE_TOKEN_SPOT_PRICE, payload: tokenSpotPrice });

      const nativeToken: AssetListToken = {
        tokenId: "",
        assetTokenMetadata: {
          symbol: tokenBalances.tokenSymbol,
          name: tokenBalances.tokenSymbol,
          decimals: tokenBalances.tokenDecimals,
        },
        tokenAsset: {
          balance: tokenBalances.balance.toString(),
          relayBalance: "0",
        },
        spotPrice: tokenSpotPrice || "0",
      };

      const nativeTokenBalance = await fetchNativeTokenBalances(
        selectedAccount.address,
        tokenBalances.tokenDecimals,
        undefined,
        rpcUrlRelay
      ).then((data: any) => {
        return data?.free || "0";
      });

      nativeToken.tokenAsset.relayBalance = nativeTokenBalance;

      const otherTokens = tokenBalances.assets.filter(
        (token: AssetListToken) => token.tokenId !== nativeToken.tokenId && !whitelist.includes(token.tokenId)
      );

      const whitelistedTokens = tokenBalances.assets.filter(
        (token: AssetListToken) => token.tokenId === nativeToken.tokenId || whitelist.includes(token.tokenId)
      );

      whitelistedTokens.map((token: AssetListToken) => {
        getSpotPrice(token.assetTokenMetadata.symbol).then((data: string | void) => {
          if (typeof data === "string") {
            token.spotPrice = data;
          }
        });
        return token;
      });

      const assetTokens = [nativeToken, ...whitelistedTokens];

      let totalUsdBalance = 0;

      assetTokens.map((token: AssetListToken) => {
        if (token.tokenId === "1107") return token;

        const formattedBalance =
          token.tokenId === nativeToken.tokenId
            ? token.tokenAsset.balance
            : formatDecimalsFromToken(
                Number(token.tokenAsset.balance?.replace(/[, ]/g, "")),
                token.assetTokenMetadata.decimals as string
              );

        const totalBalance = parseFloat(formattedBalance || "0") + parseFloat(token.tokenAsset.relayBalance || "0");

        const usdTotalBalance = parseFloat(token.spotPrice || "0") * totalBalance;
        totalUsdBalance += usdTotalBalance;
        return token;
      });

      setTotalBalance(totalUsdBalance);
      dispatch({ type: ActionType.SET_WALLET_BALANCE_USD, payload: totalUsdBalance });
      dispatch({ type: ActionType.SET_ASSETS_LIST, payload: assetTokens });
      dispatch({ type: ActionType.SET_OTHER_ASSETS, payload: otherTokens });
    }
  };

  useEffect(() => {
    if (!tokenBalances) return;
    setTokens();
  }, [tokenBalances]);

  const handleSwapModal = (tokenId: string) => {
    setTokenId(tokenId);
    setSwapModalOpen(!swapModalOpen);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full justify-between px-8 py-4">
        <div className="flex flex-col items-start justify-center">
          <div className="font-titillium-web text-heading-6 font-semibold leading-[24px] text-dark-300">
            My Total Assets
          </div>
          <div className="font-titillium-web text-heading-3 font-semibold leading-[48px]">
            {!walletConnected ? "$0.00" : "$" + totalBalance.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-col items-start justify-center">
          <div className="font-titillium-web text-heading-6 font-semibold leading-[24px] text-dark-300">
            {tokenBalances?.tokenSymbol} Price
          </div>
          <div className="font-titillium-web text-heading-3 font-semibold leading-[48px]">
            {!walletConnected ? "$0.00" : "$" + parseFloat(nativeTokenSpotPrice).toFixed(2)}
          </div>
        </div>
      </div>
      {assetsList.length === 0 ? (
        <div className="flex w-full flex-1 flex-col gap-6">
          <div className="mb-4 flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl bg-white">
            <div className="font-unbounded-variable text-medium font-normal text-dark-300">
              {walletConnected ? "Loading assets..." : "To see your asset list first connect your wallet."}
              {/* TODO: translate */}
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-4">
              {walletConnected ? (
                <LottieLarge />
              ) : (
                <div className="flex">
                  <ConnectWallet />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <AccordionList title="Asset List" nested alwaysOpen className="rounded-t-2xl bg-white">
            {assetsList &&
              assetsList.length > 0 &&
              assetsList.map((token: AssetListToken) => {
                return (
                  <AccordionAssetItem
                    key={token.tokenId}
                    token={token}
                    handleSwapModal={(tokenId) => {
                      handleSwapModal(tokenId);
                    }}
                  >
                    {token.tokenId === "" ? (
                      <div className="flex w-full flex-col gap-2">
                        <AssetItemChild
                          tokenSymbol={token.assetTokenMetadata.symbol}
                          tokenSpotPrice={token.spotPrice}
                          decimals={token.assetTokenMetadata.decimals}
                          isRelayChain
                          rpcUrl={rpcUrlRelay}
                        />
                        <AssetItemChild
                          tokenSymbol={token.assetTokenMetadata.symbol}
                          tokenSpotPrice={token.spotPrice}
                          decimals={token.assetTokenMetadata.decimals}
                        />
                      </div>
                    ) : null}
                  </AccordionAssetItem>
                );
              })}
          </AccordionList>

          <AccordionList nested title="Other Assets" className="rounded-b-2xl bg-white">
            {assetLoading ? (
              <div className="flex flex-col items-center justify-center py-8">Loading...</div>
            ) : otherAssets.length > 0 ? (
              otherAssets.map((token: AssetListToken) => {
                return (
                  <AccordionAssetItem
                    key={token.tokenId}
                    token={token}
                    handleSwapModal={(tokenId) => {
                      handleSwapModal(tokenId);
                    }}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8">No other assets found</div>
            )}
          </AccordionList>
        </div>
      )}

      <Modal
        isOpen={swapModalOpen}
        onClose={() => {
          setSwapModalOpen(!swapModalOpen);
        }}
      >
        <SwapTokens tokenId={tokenId} />
      </Modal>
    </div>
  );
};
export default AssetsTable;
