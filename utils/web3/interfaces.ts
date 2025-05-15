export interface SyntheticAssetInfo {
  tokenAddress: string;
  name: string;
  symbol?: string;
  minCollateralRatio?: bigint;
  auctionDiscount?: bigint;
  multiplier?: bigint;
  isActive: boolean;

  balance?: bigint;
  decimals?: number;
  value?: bigint;
  assetID?: string;
  label?: string;
}

export interface PositionDetails {
  positionId: bigint;
  owner: string;
  syntheticAsset: string;
  syntheticSymbol: string;
  collateralAsset: string;
  collateralSymbol: string;
  collateralAmount: bigint;
  mintedAmount: bigint;
  lastUpdateTimestamp: bigint;
  isActive: boolean;
  currentRatio: bigint;
  requiredRatio: bigint;
  isUnderCollateralized: boolean;
  collateralUsdValue: bigint;
  debtUsdValue: bigint;

  mintedCurrentUsdValue?: bigint;
  collateralCurrentUsdValue?: bigint;
}
