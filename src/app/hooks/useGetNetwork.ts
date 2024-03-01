import { NETWORKS } from "../../networkConfig";
import { NetworkKeys } from "../types/enum";

const useGetNetwork = () => {
  return NETWORKS[NetworkKeys.Kusama];
};

export default useGetNetwork;
