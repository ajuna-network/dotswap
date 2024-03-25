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
import { getSpotPrice } from "../../../app/util/helper";
import { AssetListToken } from "../../../app/types";
import { ActionType } from "../../../app/types/enum";

const AssetsTable = () => {
  const { state, dispatch } = useAppContext();

  const { rpcUrlRelay } = useGetNetwork();

  const { tokenBalances, api, selectedAccount, assetLoading, assetsList } = state;

  const assetTokens = assetsList || [];
  const [otherTokens, setOtherTokens] = useState<AssetListToken[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [nativeTokenState, setNativeTokenState] = useState<AssetListToken>({
    tokenId: "",
    assetTokenMetadata: {
      symbol: "",
      name: "",
      decimals: "",
    },
    tokenAsset: {
      balance: "",
      relayBalance: "",
    },
    spotPrice: "0",
  });

  const setTokens = async () => {
    if (tokenBalances && tokenBalances.assets && api) {
      const nativeTokenSpotPrice = await getSpotPrice(tokenBalances.tokenSymbol);

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
        spotPrice: nativeTokenSpotPrice || "0",
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

      setNativeTokenState(nativeToken);

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
        const totalBalance =
          parseFloat(token.tokenAsset.balance || "0") + parseFloat(token.tokenAsset.relayBalance || "0");

        const usdTotalBalance = parseFloat(token.spotPrice || "0") * totalBalance;
        totalUsdBalance += usdTotalBalance;
        return token;
      });

      setTotalBalance(totalUsdBalance);

      dispatch({ type: ActionType.SET_ASSETS_LIST, payload: assetTokens });

      setOtherTokens(otherTokens);
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
            ${totalBalance.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-col items-start justify-center">
          <div className="font-titillium-web text-heading-6 font-semibold leading-[24px] text-dark-300">
            {nativeTokenState.assetTokenMetadata.symbol} Price
          </div>
          <div className="font-titillium-web text-heading-3 font-semibold leading-[48px]">
            {parseFloat(nativeTokenState.spotPrice).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <AccordionList title="Asset List" nested alwaysOpen className="rounded-t-2xl bg-white">
          {assetTokens &&
            assetTokens.length > 0 &&
            assetTokens.map((token: AssetListToken) => {
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
          ) : otherTokens.length > 0 ? (
            otherTokens.map((token: AssetListToken) => {
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
