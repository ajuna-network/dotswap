import AccordionAssetItem from "../../molecule/AccordionAssetItem";
import AccordionList from "../../molecule/AccordionList";
import { useAppContext } from "../../../state";
import { useEffect, useState } from "react";
import { whitelist } from "../../../whitelist";
import { fetchNativeTokenBalances } from "../../../services/polkadotWalletServices";
import AssetItemChild from "../../molecule/AccordionAssetItem/AssetItemChild";
import Modal from "../../atom/Modal";
import SwapTokens from "../SwapTokens";

type Token = {
  tokenId: string;
  assetTokenMetadata: {
    symbol: string;
    name: string;
    decimals: string;
  };
  tokenAsset: {
    balance: string | undefined;
  };
};

const AssetsTable = () => {
  const { state } = useAppContext();

  const { tokenBalances, api, selectedAccount, assetLoading } = state;

  const [assetTokens, setAssetTokens] = useState<Token[]>([]);
  const [otherTokens, setOtherTokens] = useState<Token[]>([]);
  //TODO: calculate all assets price in USD
  const [relayBalance, setRelayBalance] = useState<number>(0);
  console.log(relayBalance); //TODO: remove
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");

  const setTokens = async () => {
    if (tokenBalances && tokenBalances.assets && api) {
      const nativeToken: Token = {
        tokenId: "",
        assetTokenMetadata: {
          symbol: tokenBalances?.tokenSymbol,
          name: tokenBalances?.tokenSymbol,
          decimals: tokenBalances?.tokenDecimals,
        },
        tokenAsset: {
          balance: tokenBalances?.balance.toString(),
        },
      };

      await fetchNativeTokenBalances(
        selectedAccount.address,
        tokenBalances?.tokenDecimals,
        undefined,
        "wss://rococo-rpc.polkadot.io"
      ).then((data: any) => {
        const floatRelayBalance = parseFloat(data?.free);
        const floatTokenBalance = nativeToken.tokenAsset.balance ? parseFloat(nativeToken.tokenAsset.balance) : 0;
        setRelayBalance(floatRelayBalance);
        setTotalBalance(floatRelayBalance + floatTokenBalance);
      });

      const otherTokens = tokenBalances?.assets?.filter((item: Token) => whitelist.includes(item.tokenId)) || [];

      setOtherTokens(otherTokens);
      setAssetTokens([nativeToken]);
    }
  };

  useEffect(() => {
    setTokens();
  }, [tokenBalances]);

  const handleSwapModal = (tokenId: string) => {
    setTokenId(tokenId);
    setSwapModalOpen(!swapModalOpen);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-6">
        <AccordionList title="Asset List" nested alwaysOpen className="rounded-t-2xl bg-white">
          {assetTokens.map((token: Token) => {
            return (
              <AccordionAssetItem
                key={token.tokenId}
                token={token}
                totalBalance={
                  token.tokenId === ""
                    ? totalBalance
                    : token.tokenAsset.balance
                      ? parseFloat(token.tokenAsset.balance)
                      : 0
                }
                handleSwapModal={(tokenId) => {
                  handleSwapModal(tokenId);
                }}
              >
                <div className="flex w-full flex-col gap-2">
                  <AssetItemChild
                    tokenSymbol={token.assetTokenMetadata.symbol}
                    decimals={token.assetTokenMetadata.decimals}
                    isRelayChain
                    rpcUrl="wss://rococo-rpc.polkadot.io/"
                  />
                  <AssetItemChild
                    tokenSymbol={token.assetTokenMetadata.symbol}
                    decimals={token.assetTokenMetadata.decimals}
                  />
                </div>
              </AccordionAssetItem>
            );
          })}
        </AccordionList>

        <AccordionList nested title="Other Assets" className="rounded-b-2xl bg-white">
          {assetLoading ? (
            <div className="flex flex-col items-center justify-center py-8">Loading...</div>
          ) : otherTokens.length > 0 ? (
            otherTokens.map((token: Token) => {
              return (
                <AccordionAssetItem
                  key={token.tokenId}
                  token={token}
                  totalBalance={token.tokenAsset.balance ? parseFloat(token.tokenAsset.balance) : 0}
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
