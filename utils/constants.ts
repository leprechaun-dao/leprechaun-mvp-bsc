// TODO make these wagmi contracts?
import { ERC20ABI } from "@/utils/abis/ERC20";
import { LeprechaunFactoryABI } from "@/utils/abis/LeprechaunFactory";
import { LeprechaunLensABI } from "@/utils/abis/LeprechaunLens";
import { OracleInterfaceABI } from "@/utils/abis/OracleInterface";
import { PositionManagerABI } from "@/utils/abis/PositionManager";
import { SyntheticAssetABI } from "@/utils/abis/SyntheticAsset";

export const rpcUrl =
  "https://base-mainnet.infura.io/v3/" + process.env.NEXT_PUBLIC_INFURA_KEY;

export const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const icoAddress = "0x99ECa4843D85b73b4EEA8e987B63B77763DAadFd";
export const lprAddress = "0x7AD3b12d91e81ebd218f9acF55E2A699d7f68A33";

export const LeprechaunFactoryAddress =
  "0x364A6127A8b425b6857f4962412b0664D257BDD5";
export const PositionManagerAddress =
  "0x401d1cD4D0ff1113458339065Cf9a1f2e8425afb";
export const OracleInterfaceAddress =
  "0xBc2e651eD3566c6dF862815Ed05b99eFb9bC0255";
export const LENSAddress = "0x9757edD261BFAE5e1038Aa9413c289c2318B8c3D";

export const sDOWAddress = "0xD14F0B478F993967240Aa5995eb2b1Ca6810969a";

export const mUSDCAddress = "0x39510c9f9E577c65b9184582745117341e7bdD73";
export const mWETHAddress = "0x95539ce7555F53dACF3a79Ff760C06e5B4e310c3";
export const mWBTCAddress = "0x1DBf5683c73E0D0A0e20AfC76F924e08E95637F7";

export {
  ERC20ABI,
  LeprechaunFactoryABI,
  LeprechaunLensABI,
  OracleInterfaceABI,
  PositionManagerABI,
  SyntheticAssetABI,
};
