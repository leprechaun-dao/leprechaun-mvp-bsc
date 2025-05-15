export const LeprechaunLensABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_factory",
        type: "address",
        internalType: "address",
      },
      {
        name: "_positionManager",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "calculateAdditionalCollateralForPosition",
    inputs: [
      {
        name: "positionId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "additionalCollateral",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentRatio",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentCollateralUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateCollateralForMintAmount",
    inputs: [
      {
        name: "syntheticAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "mintAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "syntheticUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minRequiredRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateLiquidationReturns",
    inputs: [
      {
        name: "positionId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "syntheticAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralReceived",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "discount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "fee",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateMintAmountForTargetRatio",
    inputs: [
      {
        name: "syntheticAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "mintAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxMintable",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "effectiveRatio",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minRequiredRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "factory",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract LeprechaunFactory",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllSyntheticAssets",
    inputs: [],
    outputs: [
      {
        name: "assets",
        type: "tuple[]",
        internalType: "struct LeprechaunLens.SyntheticAssetInfo[]",
        components: [
          {
            name: "tokenAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "name",
            type: "string",
            internalType: "string",
          },
          {
            name: "symbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "minCollateralRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "auctionDiscount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLiquidatablePositions",
    inputs: [
      {
        name: "skip",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "positions",
        type: "tuple[]",
        internalType: "struct LeprechaunLens.PositionDetails[]",
        components: [
          {
            name: "positionId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "owner",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "collateralSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "mintedAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastUpdateTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "currentRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "requiredRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isUnderCollateralized",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "collateralUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "debtUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "total",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMintableAmount",
    inputs: [
      {
        name: "syntheticAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "mintableAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "usdCollateralValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "effectiveRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPosition",
    inputs: [
      {
        name: "positionId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "details",
        type: "tuple",
        internalType: "struct LeprechaunLens.PositionDetails",
        components: [
          {
            name: "positionId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "owner",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "collateralSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "mintedAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastUpdateTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "currentRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "requiredRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isUnderCollateralized",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "collateralUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "debtUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProtocolInfo",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct LeprechaunLens.ProtocolInfo",
        components: [
          {
            name: "fee",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "collector",
            type: "address",
            internalType: "address",
          },
          {
            name: "oracleAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "owner",
            type: "address",
            internalType: "address",
          },
          {
            name: "assetCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "collateralCount",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSyntheticAssetWithCollateral",
    inputs: [
      {
        name: "syntheticAsset",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "assetInfo",
        type: "tuple",
        internalType: "struct LeprechaunLens.SyntheticAssetInfo",
        components: [
          {
            name: "tokenAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "name",
            type: "string",
            internalType: "string",
          },
          {
            name: "symbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "minCollateralRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "auctionDiscount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
      {
        name: "allowedCollaterals",
        type: "tuple[]",
        internalType: "struct LeprechaunLens.CollateralTypeInfo[]",
        components: [
          {
            name: "tokenAddress",
            type: "address",
            internalType: "address",
          },
          {
            name: "multiplier",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "symbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "name",
            type: "string",
            internalType: "string",
          },
          {
            name: "decimals",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "effectiveRatio",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPositions",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "positions",
        type: "tuple[]",
        internalType: "struct LeprechaunLens.PositionDetails[]",
        components: [
          {
            name: "positionId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "owner",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "syntheticSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAsset",
            type: "address",
            internalType: "address",
          },
          {
            name: "collateralSymbol",
            type: "string",
            internalType: "string",
          },
          {
            name: "collateralAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "mintedAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastUpdateTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "currentRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "requiredRatio",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isUnderCollateralized",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "collateralUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "debtUsdValue",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "positionManager",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract PositionManager",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewPositionWithTargetRatio",
    inputs: [
      {
        name: "syntheticAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAsset",
        type: "address",
        internalType: "address",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "mintAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "syntheticUsdValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "effectiveRatio",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minRequiredRatio",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
];
