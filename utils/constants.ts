// TODO make these wagmi contracts?
import {ERC20ABI} from "@/utils/abis/ERC20";
import {LeprechaunFactoryABI} from "@/utils/abis/LeprechaunFactory.js";
import {OracleInterfaceABI} from "@/utils/abis/OracleInterface";
import {PositionManagerABI} from "@/utils/abis/PositionManager";
import {SyntheticAssetABI} from "@/utils/abis/SyntheticAsset";

export const rpcUrl =
  "https://base-mainnet.infura.io/v3/" + process.env.NEXT_PUBLIC_INFURA_KEY;

export const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const icoAddress = "0x99ECa4843D85b73b4EEA8e987B63B77763DAadFd";
export const lprAddress = "0x7AD3b12d91e81ebd218f9acF55E2A699d7f68A33";

// TODO change/take out these to base once the new deployments are up
export const LeprechaunFactoryAddress = "0x5c7FF36e0BB492c81d85e501C8ce9a418618A4eD"
export const PositionManagerAddress = "0xA202BBa404427dEa715D0ca424FB7dA337fF3a46"
export const OracleInterfaceAddress = "0x3979eeBA732A0d8B422557f489E381e6ee2DD1F8"

export const sDOWAddress = "0x9E623E30bddA40464945cf14777CA990BE2Ba984"

export const mUSDCAddress = "0x26bb5E0E1b93440720cebFCdD94CaA7B515af1cf"
export const mWETHAddress = "0x9FB8bc690C3Dcf32464062f27658A42C87F25C26"
export const mWBTCAddress = "0xE157a88bDaFf6487408131b8369CaaE56691E562"

export { ERC20ABI, PositionManagerABI, OracleInterfaceABI, SyntheticAssetABI, LeprechaunFactoryABI }