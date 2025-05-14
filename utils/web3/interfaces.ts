import { ReactNode } from "react";

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
  icon?: ReactNode;
}
