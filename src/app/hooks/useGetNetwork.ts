import { NETWORKS } from "../../networkConfig";
import { NetworkKeys } from "../types/enum";

const useGetNetwork = () => {
  // change network in networkConfig for testing purposes
  return NETWORKS[NetworkKeys.Polkadot];
};

export default useGetNetwork;
