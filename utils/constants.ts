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
	"0x43b5445b03E95B334a64AEA8AB5370Fa335D4A6d";
export const PositionManagerAddress =
	"0x9dc67a500D51d36ACD3b89a2f6c7A91ceaaa33b8";
export const OracleInterfaceAddress =
	"0x87C67a8Fa7E054E374BD584cDcC27610361906b1";
export const LENSAddress = "0xB66709165d053DdF7d5FD1f6F2D4Ab471b690847";

export const sDOWAddress = "0xd4Dbb4f8626d1C259524a47A88Ec7908D5e8e17B";

export const mUSDCAddress = "0xE0EEF4F1DDfe50c5fc7ABD543eaD7cBd571C4022";
export const mWETHAddress = "0x6B74f8ca9D712DAfbFf638148215F1128dd77242";
export const mWBTCAddress = "0x9FcE2DaedFDa70a7adA0b14B0471032BC1088c11";

export const assetsImages: Record<string, string> = {
	sDOW: "/assets/us.svg",
	sXAU: "/assets/gold.svg",
	sOIL: "/assets/oil.svg",
	mWBTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
	mWETH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
	mUSDC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
};

export {
	ERC20ABI,
	LeprechaunFactoryABI,
	LeprechaunLensABI,
	OracleInterfaceABI,
	PositionManagerABI,
	SyntheticAssetABI,
};

export function getUniswapPoolHash(
	sAssetSymbol: string,
	collateral: string,
): string {
	if (collateral === mUSDCAddress) {
		switch (sAssetSymbol) {
			case "sDOW":
				return "0x35fe68d317f15c3db528192cf0e71eff2265babaaaee23d7192b98703729bd89";

			case "sXAU":
				return "0x4a880171e7bfbee7a8f390ac3fe36245baecc1b7064e399ad042c5e85a010651";

			case "sOIL":
				return "0xfb6d04fbc133f88ee966239857c3b9f1c005a5aba87497dad853d175bc819451";

			default:
				return "";
		}
	}

	if (collateral === mWETHAddress) {
		switch (sAssetSymbol) {
			case "sDOW":
				return "";

			case "sXAU":
				return "";

			case "sOIL":
				return "";

			default:
				return "";
		}
	}

	if (collateral === mWBTCAddress) {
		switch (sAssetSymbol) {
			case "sDOW":
				return "";

			case "sXAU":
				return "";

			case "sOIL":
				return "";

			default:
				return "";
		}
	}

	return "";
}

export const EXPLORER_URL = "https://basescan.org/";
