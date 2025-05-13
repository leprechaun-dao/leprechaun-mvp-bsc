import { ReactNode } from "react";

export interface SyntheticAssetInfo {
  address: string;
  name: string;
  symbol: string;
  minCollateralRatio: bigint;
  auctionDiscount: bigint;
  isActive: boolean;
  value?: bigint;
  label?: string;
  icon?: ReactNode;
}
