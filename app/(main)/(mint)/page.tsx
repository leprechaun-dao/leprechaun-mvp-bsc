"use client";
import { wagmiConfig } from "@/app/wagmiConfig";
import { DecimalInput } from "@/components/DecimalInput";
import { Header } from "@/components/layout/header";
import { TokenSelector } from "@/components/TokenSelector";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as constants from "@/utils/constants";
import { cn } from "@/utils/css";
import { parseBigInt } from "@/utils/web3";
import { PositionDetails, SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteX,
  ChevronDown,
  EllipsisVertical,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { assetsImages } from "../../../utils/constants";
import { ClosePositionDialog } from "./dialogs/close-position";
import { DepositDialog, PositionDialogProps } from "./dialogs/deposit";
import { WithdrawalDialog } from "./dialogs/withdrawal";
import { sendTxSentToast, sendTxSuccessToast } from "./dialogs/toasts";
import { ConnectKitButton } from "connectkit";

const TokenSelectorButton = ({
  selectedSymbol,
  className,
  ...props
}: {
  selectedSymbol?: string;
} & ButtonProps) => {
  return (
    <Button {...props} className={cn("h-full group w-32 relative", className)}>
      {!!selectedSymbol ? (
        <>
          <span className="group-hover:block group-focus-visible:block hidden">
            Change Token
          </span>
          <span className="group-hover:hidden group-focus-visible:hidden flex items-center gap-2">
            <Image
              src={assetsImages[selectedSymbol]}
              alt={`${selectedSymbol} Icon`}
              className="rounded-full border-2 border-neutral-700"
              width={16}
              height={16}
            />
            <span className="leading-none">{selectedSymbol}</span>
            <ChevronDown className="size-3" />
          </span>
        </>
      ) : (
        <span>Select Token</span>
      )}
    </Button>
  );
};

const collateralAssets: SyntheticAssetInfo[] = [
  {
    tokenAddress: constants.mWBTCAddress,
    name: "Bitcoin",
    symbol: "mWBTC",
    isActive: true,
    decimals: 8,
  },
  {
    tokenAddress: constants.mWETHAddress,
    name: "Wrapped Ether",
    symbol: "mWETH",
    decimals: 18,
    isActive: true,
  },
  {
    tokenAddress: constants.mUSDCAddress,
    name: "USDC",
    symbol: "mUSDC",
    isActive: true,
    decimals: 6,
  },
];

const mUSDCContract = {
  address: constants.mUSDCAddress,
  abi: constants.ERC20ABI,
} as const;
const mWETHContract = {
  address: constants.mWETHAddress,
  abi: constants.ERC20ABI,
} as const;
const mWBTCContract = {
  address: constants.mWBTCAddress,
  abi: constants.ERC20ABI,
} as const;
const lensContract = {
  address: constants.LENSAddress,
  abi: constants.LeprechaunLensABI,
} as const;
const factoryContract = {
  address: constants.LeprechaunFactoryAddress,
  abi: constants.LeprechaunFactoryABI,
} as const;

export default function Home() {
  const form = useForm();
  const account = useAccount();
  const positionManagerAddress = constants.PositionManagerAddress;

  const syntheticAssetsContract = useReadContract({
    ...lensContract,
    functionName: "getAllSyntheticAssets",
  });

  const openPositionsContractCall = useReadContract({
    ...lensContract,
    functionName: "getUserPositions",
    args: [account.address],
    query: {
      enabled: !!account.address,
    },
  });

  const allowanceAndBalanceContract = useReadContracts({
    contracts: [
      {
        ...mUSDCContract,
        functionName: "balanceOf",
        args: [account.address],
      },
      {
        ...mWETHContract,
        functionName: "balanceOf",
        args: [account.address],
      },
      {
        ...mWBTCContract,
        functionName: "balanceOf",
        args: [account.address],
      },
      {
        ...mUSDCContract,
        functionName: "allowance",
        args: [account.address, positionManagerAddress],
      },
      {
        ...mWETHContract,
        functionName: "allowance",
        args: [account.address, positionManagerAddress],
      },
      {
        ...mWBTCContract,
        functionName: "allowance",
        args: [account.address, positionManagerAddress],
      },
    ],
    query: {
      enabled: !!account.address,
    },
  });
  const [
    mUSDCBalance,
    mWETHBalance,
    mWBTCBalance,
    mUSDCAllowance,
    mWETHAllowance,
    mWBTCAllowance,
  ] = allowanceAndBalanceContract.data || [];

  const formattedAssets = useMemo(() => {
    if (
      !syntheticAssetsContract.data ||
      (syntheticAssetsContract.data as SyntheticAssetInfo[]).length === 0
    )
      return [];

    return (syntheticAssetsContract.data as SyntheticAssetInfo[]).map(
      (item: SyntheticAssetInfo) => ({
        tokenAddress: item.tokenAddress,
        name: item.name,
        symbol: item.symbol,
        minCollateralRatio: item.minCollateralRatio,
        auctionDiscount: item.auctionDiscount,
        isActive: item.isActive,
      }),
    );
  }, [syntheticAssetsContract.data]);

  const collateralAssetsWithBalance = useMemo(() => {
    if (
      mUSDCBalance?.status !== "success" ||
      mWBTCBalance?.status !== "success" ||
      mWETHBalance?.status !== "success"
    ) {
      return collateralAssets;
    }

    const tempArray = [mWBTCBalance, mWETHBalance, mUSDCBalance];
    return collateralAssets.map((col, i) => ({
      ...col,
      balance: tempArray[i].result as bigint,
    }));
  }, [mUSDCBalance, mWBTCBalance, mWETHBalance]);

  const [mintTokenSelectorOpen, setMintTokenSelectorOpen] = useState(false);
  const [collateralTokenSelectorOpen, setCollateralTokenSelectorOpen] =
    useState(false);

  const [openDialog, setOpenDialog] = useState<
    "deposit" | "withdrawal" | "close-position" | null
  >(null);

  const [selectedPosition, setSelectedPosition] =
    useState<PositionDialogProps | null>(null);
  const { writeContract, writeContractAsync } = useWriteContract({
    mutation: {
      onError(error) {
        console.error("❌ Error on tx:", error);
        toast.error("Transaction failed! Please try again");
      },
    },
  });

  const [pricedPositions, setPricedPositions] = useState<
    PositionDetails[] | null
  >(null);

  useEffect(() => {
    if (openPositionsContractCall.status === "success") {
      const fetchPrices = async () => {
        const pPositions: PositionDetails[] = [];
        const positions = openPositionsContractCall.data as PositionDetails[];

        const pricePromises = positions.map((position) =>
          readContract(wagmiConfig, {
            abi: constants.OracleInterfaceABI,
            address: constants.OracleInterfaceAddress,
            functionName: "getNormalizedPrice",
            args: [position.syntheticAsset],
          }),
        );

        const prices = await Promise.all(pricePromises);

        for (let i = 0; i < positions.length; i++) {
          pPositions.push({
            ...positions[i],
            mintedCurrentUsdValue: (prices[i] as bigint[])[0],
          });
        }

        setPricedPositions(pPositions);
      };

      fetchPrices();
    }
  }, [openPositionsContractCall.status, openPositionsContractCall.data]);

  const collateralWatched = form.watch("collateral") as SyntheticAssetInfo;
  const collateralAmountWatched = form.watch("collateralAmount") as number;
  const mintWatched = form.watch("mint") as SyntheticAssetInfo;
  const collateralRatioWatched = form.watch("collateralRatio") as number;

  const getMinCollateralRatioContract = useReadContract({
    ...factoryContract,
    functionName: "getEffectiveCollateralRatio",
    args: [mintWatched?.tokenAddress, collateralWatched?.tokenAddress],
    query: {
      enabled:
        !!account.address &&
        !!mintWatched?.tokenAddress &&
        !!collateralWatched?.tokenAddress,
    },
  });

  const minCollateralRatio = useMemo(() => {
    const result = getMinCollateralRatioContract.data as bigint;
    const minCollateralRatio = result ? Number(result) / 100 : 150;

    const currentCollateralRatio = form.getValues().collateralRatio;

    if (currentCollateralRatio < minCollateralRatio) {
      form.setValue("collateralRatio", minCollateralRatio);
    }

    return minCollateralRatio;
  }, [form, getMinCollateralRatioContract.data]);

  const cleanCollateralAmount = useMemo(() => {
    if (!collateralWatched || collateralAmountWatched == null) return null;

    const decimals = collateralWatched.decimals || 0;
    const value = BigInt(
      Math.floor(Number(collateralAmountWatched) * 10 ** decimals),
    );

    return value;
  }, [collateralWatched, collateralAmountWatched]);

  const allowance = useMemo<bigint | null>(() => {
    if (!collateralWatched) return null;

    let _allowance;

    switch (collateralWatched.symbol) {
      case "mUSDC":
        _allowance = mUSDCAllowance;
        break;
      case "mWETH":
        _allowance = mWETHAllowance;
        break;
      case "mWBTC":
        _allowance = mWBTCAllowance;
        break;

      default:
        break;
    }

    const result = _allowance?.result as number | undefined;
    if (!result) return null;

    return BigInt(result);
  }, [collateralWatched, mUSDCAllowance, mWBTCAllowance, mWETHAllowance]);

  const handleSubmitMint = form.handleSubmit(async (data) => {
    if ((allowance || 0) < cleanCollateralAmount!) {
      const abi = constants.ERC20ABI;
      // approveTokens
      const approvalTxHash = await writeContractAsync({
        abi,
        address: data.collateral.tokenAddress,
        functionName: "approve",
        args: [positionManagerAddress, cleanCollateralAmount],
      });

      sendTxSentToast(approvalTxHash)

      const approvalConfirmationTxHash = await waitForTransactionReceipt(
        wagmiConfig,
        {
          hash: approvalTxHash,
          confirmations: 3,
        },
      );

      sendTxSuccessToast(approvalConfirmationTxHash.transactionHash)
    } else {
      const abi = constants.PositionManagerABI;

      const createPositionTxHash = await writeContractAsync({
        abi,
        address: positionManagerAddress,
        functionName: "createPosition",
        args: [
          data.mint.tokenAddress,
          data.collateral.tokenAddress,
          BigInt(
            Math.floor(data.collateralAmount * 10 ** data.collateral.decimals),
          ),
          BigInt(Math.floor(data.mintAmount * 10 ** 18)),
        ],
      });

      sendTxSentToast(createPositionTxHash)

      const confirmationTx = await waitForTransactionReceipt(wagmiConfig, {
        hash: createPositionTxHash,
        confirmations: 3,
      });

      toast.success("Transaction confirmed.", {
        action: {
          label: (
            <div className="flex gap-2 items-center">
              <Image
                src="/uniswap.svg"
                alt="Uniswap Logo"
                width={24}
                height={24}
              />
              Pool on Uniswap
            </div>
          ),
          onClick: () => {
            // TODO: Update this to Pool URL
            window.open(
              `https://basescan.org/tx/${confirmationTx.transactionHash}`,
              "_blank",
            );
          },
        },
      });

      await openPositionsContractCall.refetch();
    }

    await allowanceAndBalanceContract.refetch();
  });

  // @ts-expect-error types dont matter here
  function mintMockCollateral(e) {
    const buttonId = e.target.id;
    const abi = constants.SyntheticAssetABI;

    let contractAddress;
    let amount = BigInt(10_000_000);

    switch (buttonId) {
      case "wBTC":
        contractAddress = constants.mWBTCAddress;
        amount = amount * BigInt(10 * 10 ** 8);
        break;
      case "wETH":
        contractAddress = constants.mWETHAddress;
        amount = amount * BigInt(10 * 10 ** 18);
        break;
      case "USDC":
        contractAddress = constants.mUSDCAddress;
        amount = amount * BigInt(10 * 10 ** 6);
        break;

      default:
        break;
    }

    writeContract({
      abi,
      // @ts-expect-error address is alread 0x${string}
      address: contractAddress!,
      functionName: "mint",
      args: [account.address, amount],
    });
  }

  const handleUpdateMintedAmount = useDebouncedCallback(
    async ({
      collateral,
      collateralAmount,
      mint,
      collateralRatio,
    }: {
      collateral: SyntheticAssetInfo;
      collateralAmount: number;
      mint: SyntheticAssetInfo;
      collateralRatio: number;
    }) => {
      try {
        const abi = constants.LeprechaunLensABI;
        const address = constants.LENSAddress;
        const asset = collateralAssetsWithBalance.find(
          (collateralAsset) => collateralAsset.symbol === collateral?.symbol,
        );

        const inputAmount = BigInt(
          Math.floor(
            Number(collateralAmount) * 10 ** (asset?.decimals as number),
          ),
        );

        const res = await readContract(wagmiConfig, {
          abi,
          address: address,
          functionName: "calculateMintAmountForTargetRatio",
          args: [
            mint.tokenAddress,
            collateral.tokenAddress,
            inputAmount,
            collateralRatio * 100,
          ],
        });

        const [mintAmount] = res as bigint[];

        // we assuming the decimals here
        const newAmount = Number(mintAmount) / 10 ** 18;

        form.setValue("mintAmount", newAmount, {
          shouldValidate: true,
        });
      } finally {
        setLoadingMintedAmount(false);
      }
    },
    [],
    800,
  );

  const [loadingMintedAmount, setLoadingMintedAmount] = useState(false);
  const getAllowanceForSymbol = (symbol: string): bigint | null => {
    switch (symbol) {
      case "mUSDC":
        return mUSDCAllowance?.result as bigint;
      case "mWETH":
        return mWETHAllowance?.result as bigint;
      case "mWBTC":
        return mWBTCAllowance?.result as bigint;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (
      collateralWatched &&
      collateralAmountWatched &&
      mintWatched &&
      collateralRatioWatched
    ) {
      setLoadingMintedAmount(true);
      handleUpdateMintedAmount({
        collateral: collateralWatched,
        collateralAmount: collateralAmountWatched,
        mint: mintWatched,
        collateralRatio: collateralRatioWatched,
      });
    } else {
      form.setValue("mintAmount", undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collateralWatched,
    collateralAmountWatched,
    mintWatched,
    collateralRatioWatched,
    handleUpdateMintedAmount,
  ]);

  function getDecimalsPerCollateralSymbol(symbol: string): number {
    switch (symbol) {
      case "mUSDC":
        return 6;
      case "mWETH":
        return 18;
      case "mWBTC":
        return 8;
      default:
        return 0;
    }
  }

  // @ts-expect-error types dont matter here
  async function addTokenToWallet(e) {
    const buttonId = e.target.id;

    let tokenAddress
    let tokenSymbol
    let decimals

    switch (buttonId) {
      case "mUSDC":
        tokenAddress = "0x39510c9f9E577c65b9184582745117341e7bdD73"
        tokenSymbol = "mUSDC"
        decimals = 6

        break;
      case "mWETH":
        tokenAddress = "0x95539ce7555F53dACF3a79Ff760C06e5B4e310c3"
        tokenSymbol = "mWETH"
        decimals = 18

        break;
      case "mWBTC":
        tokenAddress = "0x1DBf5683c73E0D0A0e20AfC76F924e08E95637F7"
        tokenSymbol = "mWBTC"
        decimals = 8
        break;
      default:
        break;
    }

    try {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const wasAdded = await (window as any).ethereum
        .request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: decimals,
            },
          },
        })

      if (wasAdded) {
        console.log("Thanks for your interest!")
      } else {
        console.log("Your loss!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* @ts-expect-error we dont care about these issues rn */}
      <DepositDialog
        {...selectedPosition}
        open={openDialog === "deposit"}
        onOpenChange={(v) => v ? setOpenDialog("deposit") : setOpenDialog(null)}
      />
      {/* @ts-expect-error we dont care about these issues rn */}
      <WithdrawalDialog
        {...selectedPosition}
        open={openDialog === "withdrawal"}
        onOpenChange={(v) => v ? setOpenDialog("withdrawal") : setOpenDialog(null)}
      />
      {/* @ts-expect-error we dont care about these issues rn */}
      <ClosePositionDialog
        {...selectedPosition}
        open={openDialog === "close-position"}
        onOpenChange={(v) => v ? setOpenDialog("close-position") : setOpenDialog(null)}
      />

      <Header activeRoute="mint" />
      <main className="flex flex-col gap-5 flex-1 items-center justify-center mb-[20vh] px-6">
        <Card className="w-2xl">
          <Form {...form}>
            <CardHeader>
              <CardTitle>Mint</CardTitle>
              <CardDescription>
                Enter the amount of collateral and minted tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 **:data-[slot=input]:text-lg">
                <FormField
                  control={form.control}
                  name="collateralAmount"
                  rules={{
                    required: "Amount is required",
                    validate: {
                      isNumber: (value) => {
                        return (
                          typeof value === "number" || "Amount must be a number"
                        );
                      },
                      isPositive: (value) => {
                        return value > 0 || "Amount must be greater than 0";
                      },
                      withinBalance: (value) => {
                        const collateral = form.getValues().collateral;

                        const asset = collateralAssetsWithBalance.find(
                          (collateralAsset) =>
                            collateralAsset.symbol === collateral?.symbol,
                        );

                        const inputAmount = BigInt(
                          Math.floor(
                            Number(value) * 10 ** (asset?.decimals as number),
                          ),
                        );
                        const assetBalance = asset?.balance as bigint;

                        return (
                          inputAmount <= assetBalance ||
                          "Amount must be within balance"
                        );
                      },
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Collateral</FormLabel>
                      <div className="flex items-end gap-2">
                        <FormControl>
                          <DecimalInput
                            className="h-14"
                            {...field}
                            disabled={!collateralWatched}
                          />
                        </FormControl>

                        <FormField
                          name="collateral"
                          control={form.control}
                          rules={{
                            required: true,
                          }}
                          render={({ field }) => (
                            <Dialog
                              open={collateralTokenSelectorOpen}
                              onOpenChange={setCollateralTokenSelectorOpen}
                            >
                              <DialogTrigger asChild>
                                <TokenSelectorButton
                                  disabled={account.status !== "connected"}
                                  className="h-14"
                                  selectedSymbol={field.value?.symbol}
                                />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogTitle>Token Selector</DialogTitle>
                                <DialogDescription>
                                  Select the token you want to use as
                                  collateral.
                                </DialogDescription>
                                <TokenSelector
                                  tokens={collateralAssetsWithBalance}
                                  onSelect={(token) => {
                                    field.onChange(token);
                                    setCollateralTokenSelectorOpen(false);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mintAmount"
                  rules={{
                    required: "Amount is required",
                    validate: {
                      isNumber: (value) => {
                        return (
                          typeof value === "number" || "Amount must be a number"
                        );
                      },
                      isPositive: (value) => {
                        return value > 0 || "Amount must be greater than 0";
                      },
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>
                        Minted
                        {loadingMintedAmount && (
                          <Loader2 className="animate-spin size-3" />
                        )}
                      </FormLabel>
                      <div className="flex items-end gap-2">
                        <FormControl>
                          <Input
                            className="h-14"
                            {...field}
                            value={(field.value || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                            disabled
                          />
                        </FormControl>
                        <FormField
                          name="mint"
                          control={form.control}
                          rules={{
                            required: true,
                          }}
                          render={({ field }) => (
                            <Dialog
                              open={mintTokenSelectorOpen}
                              onOpenChange={setMintTokenSelectorOpen}
                            >
                              <DialogTrigger asChild>
                                <TokenSelectorButton
                                  disabled={account.status !== "connected"}
                                  className="h-14"
                                  selectedSymbol={field.value?.symbol}
                                />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogTitle>Token Selector</DialogTitle>
                                <DialogDescription>
                                  Select the token you want to mint.
                                </DialogDescription>
                                <TokenSelector
                                  tokens={formattedAssets}
                                  onSelect={(token) => {
                                    field.onChange(token);
                                    setMintTokenSelectorOpen(false);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collateralRatio"
                  defaultValue={150}
                  rules={{
                    required: "Collateral Ratio is required",
                    min: {
                      value: 150,
                      message: "Collateral Ratio must be at least 150%",
                    },
                    max: {
                      value: 250,
                      message: "Collateral Ratio must be at most 250%",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="mb-2">
                        Collateral Ratio ({collateralRatioWatched}%)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={minCollateralRatio}
                          max={250}
                          {...field}
                          value={[field.value]}
                          onValueChange={(value) => {
                            field.onChange(value[0]);
                          }}
                        />
                      </FormControl>
                      <span
                        className={cn(
                          "flex flex-row justify-between text-neutral-400",
                          {
                            "text-destructive": !!fieldState.error,
                          },
                        )}
                      >
                        <span>{minCollateralRatio}%</span>
                        <span>250%</span>
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col w-full mt-2">
                  <Button
                    disabled={
                      account.status !== "connected" ||
                      loadingMintedAmount ||
                      form.formState.isSubmitting
                    }
                    onClick={handleSubmitMint}
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="animate-spin size-3" />
                    )}
                    <span>
                      {collateralWatched &&
                      allowance &&
                      cleanCollateralAmount &&
                      allowance >= cleanCollateralAmount
                        ? "Mint"
                        : "Approve"}
                    </span>
                  </Button>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="flex gap-1">
                      <Button
                        id="USDC"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={mintMockCollateral}
                        className="w-36"
                      >
                        mUSDC
                      </Button>
                      <Button
                        id="mUSDC"
                        className="w-10"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={addTokenToWallet}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        id="wETH"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={mintMockCollateral}
                        className="w-36"
                      >
                        mWETH
                      </Button>
                      <Button
                        id="mWETH"
                        className="w-10"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={addTokenToWallet}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        id="wBTC"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={mintMockCollateral}
                        className="w-36"
                      >
                        mWBTC
                      </Button>
                      <Button
                        id="mWBTC"
                        className="w-10"
                        variant="secondary"
                        disabled={account.status !== "connected"}
                        onClick={addTokenToWallet}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                <CardFooter>
                  <div className="w-full text-center text-xs text-neutral-400">
                    You can only mint during market hours.
                  </div>
                </CardFooter>
              </div>
            </CardContent>
          </Form>
        </Card>

        <Card className="w-2xl">
          <CardHeader>
            <CardTitle>Your Positions</CardTitle>
            <CardDescription>
              These are the positions you currently have for the connected
              wallet.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {account.status === "connected" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Collateral</TableHead>
                    <TableHead>Current Ratio</TableHead>
                    <TableHead>Liq. Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricedPositions ? (
                    pricedPositions
                      .filter((position) => position.isActive)
                      .map((position) => (
                        <TableRow key={position.positionId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Image
                                src={assetsImages[position.syntheticSymbol]}
                                alt={`${position.syntheticSymbol} Icon`}
                                className="rounded-full"
                                width={16}
                                height={16}
                              />
                              <span className="leading-none">
                                {position.syntheticSymbol}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {parseBigInt(position.mintedAmount, 18, 3)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Image
                                src={
                                  assetsImages[position.collateralSymbol || ""]
                                }
                                alt={`${position.collateralSymbol} Icon`}
                                className="rounded-full"
                                width={16}
                                height={16}
                              />
                              {parseBigInt(
                                position.collateralAmount,
                                getDecimalsPerCollateralSymbol(
                                  position.collateralSymbol,
                                ),
                                4,
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {parseBigInt(position.currentRatio as bigint, 2, 2)}
                            %
                          </TableCell>
                          <TableCell>
                            {parseBigInt(
                              position.requiredRatio as bigint,
                              2,
                              2,
                            )}
                            %
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="px-1">
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPosition({
                                      positionToCheck: position,
                                      collateral: collateralAssetsWithBalance.find(
                                        (collateralAsset) =>
                                          collateralAsset.symbol === position.collateralSymbol
                                      ),
                                      allowance: getAllowanceForSymbol(position.collateralSymbol),
                                      onSuccess: () => {
                                        // Refresh user positions
                                        openPositionsContractCall.refetch();
                                        // Refresh allowances and balances
                                        allowanceAndBalanceContract.refetch();
                                      }
                                    });
                                    setOpenDialog("deposit");
                                  }}
                                >
                                  <BanknoteArrowUp className="mr-2 size-4" />
                                  Deposit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Log the position data to confirm it exists
                                    console.log("Position data for withdrawal:", position);

                                    setSelectedPosition({
                                      positionToCheck: position,
                                      collateral: collateralAssetsWithBalance.find(
                                        (collateralAsset) =>
                                          collateralAsset.symbol === position.collateralSymbol
                                      ),
                                      allowance: getAllowanceForSymbol(position.collateralSymbol),
                                      onSuccess: () => {
                                        // Refresh user positions
                                        openPositionsContractCall.refetch();
                                        // Refresh allowances and balances
                                        allowanceAndBalanceContract.refetch();
                                      }
                                    });
                                    setOpenDialog("withdrawal");
                                  }}
                                >
                                  <BanknoteArrowDown className="mr-2 size-4" />
                                  Withdraw
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    console.log("Position data for close:", position);
                                    setSelectedPosition({
                                      positionToCheck: position,
                                      collateral: collateralAssetsWithBalance.find(
                                        (collateralAsset) =>
                                          collateralAsset.symbol === position.collateralSymbol
                                      ),
                                      allowance: getAllowanceForSymbol(position.collateralSymbol),
                                      onSuccess: () => {
                                        // Refresh user positions
                                        openPositionsContractCall.refetch();
                                        // Refresh allowances and balances
                                        allowanceAndBalanceContract.refetch();
                                      }
                                    });
                                    setOpenDialog("close-position");
                                  }}
                                >
                                  <BanknoteX className="mr-2 size-4" />
                                  Close Position
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell>No Positions</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {(account.status === "disconnected" ||
              account.status === "connecting") && (
              <p>
                Connect your wallet to see your positions. If you don&apos;t
                have a wallet, you can create one using MetaMask.
              </p>
            )}
          </CardContent>
          {(account.status === "disconnected" ||
            account.status === "connecting") && (
            <CardFooter>
              <div className="mx-auto">
                <ConnectKitButton />
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
