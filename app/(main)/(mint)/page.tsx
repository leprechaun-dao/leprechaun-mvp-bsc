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
import { readContract } from "@wagmi/core";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteX,
  ChevronDown,
  EllipsisVertical,
  RussianRuble,
  SaudiRiyal,
  SwissFranc,
  VaultIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useAccount,
  useConnect,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ClosePositionDialog } from "./dialogs/close-position";
import { DepositDialog, PositionDialogProps } from "./dialogs/deposit";
import { WithdrawalDialog } from "./dialogs/withdrawal";

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
          <span className="group-hover:hidden group-focus-visible:hidden flex items-center gap-1">
            {selectedSymbol}
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
    icon: <SwissFranc />,
  },
  {
    tokenAddress: constants.mWETHAddress,
    name: "Wrapped Ether",
    symbol: "mWETH",
    decimals: 18,
    isActive: true,
    icon: <SaudiRiyal />,
  },
  {
    tokenAddress: constants.mUSDCAddress,
    name: "USDC",
    symbol: "mUSDC",
    isActive: true,
    decimals: 6,
    icon: <RussianRuble />,
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

export default function Home() {
  const form = useForm();
  const { connect, connectors } = useConnect();
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

  const getAssetIcon = (
    sSymbol: string,
    className: string,
  ): React.ReactNode => {
    switch (sSymbol) {
      case "sOIL":
        return <SwissFranc className={className} />;
      case "sDOW":
        return <RussianRuble className={className} />;
      case "sXAU":
        return <SaudiRiyal className={className} />;
      default:
        return <VaultIcon className={className} />;
    }
  };

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
        icon: getAssetIcon(item.name, "h-6 w-6") || <VaultIcon />,
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
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { writeContract, writeContractAsync } = useWriteContract({
    mutation: {
      onSuccess(data) {
        setTxHash(data);
      },
      onError(error) {
        console.error("❌ Error en la tx:", error);
        toast.error("Transaction failed! Please try again");
      },
    },
  });
  const { data: receipt, status } = useWaitForTransactionReceipt({
    // @ts-expect-error address is alread 0x${string}
    hash: txHash,
    confirmations: 4,
    enabled: !!txHash,
  });

  const [pricedPositions, setPricedPositions] = useState<
    PositionDetails[] | null
  >(null);

  useEffect(() => {
    if (txHash && status === "pending") {
      toast("Transaction sent.", {
        action: {
          label: "View on Basescan",
          onClick: () => {
            window.open(`https://basescan.io/tx/${txHash}`, "_blank");
          },
        },
      });
    }

    if (status === "success") {
      console.log("✅ Tx confirmed:", receipt);
      // TODO handle approve and mint notifications
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
            window.open(`https://basescan.io/tx/${txHash}`, "_blank");
          },
        },
      });

      setTxHash(null);
      // TODO if the tx is an approval tx, make allowance the same value as the collateralAmount
    }

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
  }, [
    status,
    receipt,
    txHash,
    openPositionsContractCall.status,
    openPositionsContractCall.data,
  ]);

  const collateralWatched = form.watch("collateral");
  const collateralAmountWatched = form.watch("collateralAmount");
  const cleanCollateralAmount = useMemo(() => {
    if (
      !collateralWatched ||
      collateralAmountWatched == null ||
      collateralAmountWatched === ""
    )
      return null;

    const decimals = collateralWatched.decimals;
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

    return _allowance!.result as bigint;
  }, [collateralWatched, mUSDCAllowance, mWBTCAllowance, mWETHAllowance]);

  const handleSubmitMint = form.handleSubmit(async (data) => {
    if ((allowance || 0) < cleanCollateralAmount!) {
      const abi = constants.ERC20ABI;
      // approveTokens
      await writeContractAsync({
        abi,
        address: data.collateral.tokenAddress,
        functionName: "approve",
        args: [positionManagerAddress, cleanCollateralAmount],
      });
    } else {
      const abi = constants.PositionManagerABI;

      // createPosition
      await writeContractAsync({
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

  const [collateralValue, setCollateralValue] = useState<bigint | null>(null);
  const [synthAmountToBeMinted, setSynthAmountToBeMinted] = useState<
    bigint | null
  >(null);

  const handleCollateralAmountChange = useDebouncedCallback(
    async (value: number) => {
      const abi = constants.LeprechaunLensABI;
      const address = constants.LENSAddress;

      const mint = form.getValues().mint;
      const collateral = form.getValues().collateral;

      if (!mint || !collateral) return;

      const asset = collateralAssetsWithBalance.find(
        (collateralAsset) => collateralAsset.symbol === collateral?.symbol,
      );
      const inputAmount = BigInt(
        Math.floor(Number(value) * 10 ** (asset?.decimals as number)),
      );

      const res = await readContract(wagmiConfig, {
        abi,
        address: address,
        functionName: "getMintableAmount",
        args: [mint.tokenAddress, collateral.tokenAddress, inputAmount],
      });

      const result = res as bigint[];
      // we assuming the decimals here
      const newAmount = Number(result[0]) / 10 ** 18;

      setCollateralValue(result[1]);
      setSynthAmountToBeMinted(result[0]);
      form.setValue("mintAmount", newAmount, {
        shouldValidate: true,
      });
    },
    [],
    800,
  );

  const calculateLiquidationPrice = (position: PositionDetails): number => {
    const collateralUsd = Number(position.collateralUsdValue) / 1e18;
    const minted = Number(position.mintedAmount) / 1e18;
    const ratio = Number(position.requiredRatio) / 10000;

    return collateralUsd / (minted * ratio);
  };

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

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* @ts-expect-error we dont care about these issues rn */}
      <DepositDialog
        {...selectedPosition}
        open={openDialog === "deposit"}
        onOpenChange={(v) =>
          v ? setOpenDialog("deposit") : setOpenDialog(null)
        }
      />
      <WithdrawalDialog
        open={openDialog === "withdrawal"}
        onOpenChange={(v) =>
          v ? setOpenDialog("withdrawal") : setOpenDialog(null)
        }
      />
      <ClosePositionDialog
        open={openDialog === "close-position"}
        onOpenChange={(v) =>
          v ? setOpenDialog("close-position") : setOpenDialog(null)
        }
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
                      <FormLabel>
                        <span>
                          Collateral{" "}
                          <span
                            className={cn({
                              hidden: !form.watch("collateral"),
                            })}
                          >
                            (${parseBigInt(collateralValue as bigint, 18, 2)})
                          </span>
                        </span>
                      </FormLabel>
                      <div className="flex items-end gap-2">
                        <FormControl>
                          <DecimalInput
                            className="h-14"
                            {...field}
                            disabled={!form.watch("collateral")}
                            onChange={(e) => {
                              field.onChange(e);
                              handleCollateralAmountChange(e);
                            }}
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
                        <span>
                          Minted{" "}
                          <span
                            className={cn({
                              hidden: !form.watch("mint"),
                            })}
                          >
                            (
                            {parseBigInt(
                              synthAmountToBeMinted as bigint,
                              18,
                              2,
                            )}{" "}
                            ${form.getValues().mint?.symbol})
                          </span>
                        </span>
                      </FormLabel>
                      <div className="flex items-end gap-2">
                        <FormControl>
                          <DecimalInput className="h-14" {...field} disabled />
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
                      <FormLabel className="mb-2">Collateral Ratio</FormLabel>
                      <FormControl>
                        <Slider
                          min={150}
                          max={250}
                          step={50}
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
                        <span>150%</span>
                        <span>200%</span>
                        <span>250%</span>
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={account.status !== "connected"}
                  className="mt-5"
                  onClick={handleSubmitMint}
                >
                  {collateralWatched &&
                  allowance &&
                  cleanCollateralAmount &&
                  allowance >= cleanCollateralAmount
                    ? "Mint"
                    : "Approve"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    id="USDC"
                    variant="secondary"
                    disabled={account.status !== "connected"}
                    onClick={mintMockCollateral}
                  >
                    mUSDC
                  </Button>
                  <Button
                    id="wBTC"
                    variant="secondary"
                    disabled={account.status !== "connected"}
                    onClick={mintMockCollateral}
                  >
                    mWBTC
                  </Button>
                  <Button
                    id="wETH"
                    variant="secondary"
                    disabled={account.status !== "connected"}
                    onClick={mintMockCollateral}
                  >
                    mWETH
                  </Button>
                </div>
              </div>
              <CardFooter></CardFooter>
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
                    <TableHead>Current Price</TableHead>
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
                            {getAssetIcon(
                              position.syntheticSymbol,
                              "inline-block size-4",
                            )}
                            {position.syntheticSymbol}
                          </TableCell>
                          <TableCell>
                            {parseBigInt(position.mintedAmount, 18, 5)}
                          </TableCell>
                          <TableCell>
                            {parseBigInt(
                              position.collateralAmount,
                              getDecimalsPerCollateralSymbol(
                                position.collateralSymbol,
                              ),
                              4,
                            )}{" "}
                            {position.collateralSymbol}{" "}
                          </TableCell>
                          <TableCell>
                            $
                            {parseBigInt(
                              position.mintedCurrentUsdValue as bigint,
                              18,
                              2,
                            )}
                          </TableCell>
                          <TableCell>
                            $
                            {calculateLiquidationPrice(position).toLocaleString(
                              undefined,
                              { currency: "USD", maximumFractionDigits: 2 },
                            )}
                          </TableCell>
                          <TableCell>%RATIO</TableCell>
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
                                      collateral:
                                        collateralAssetsWithBalance.find(
                                          (collateralAsset) =>
                                            collateralAsset.symbol ===
                                            position.collateralSymbol,
                                        ),
                                      allowance: allowance,
                                    });
                                    setOpenDialog("deposit");
                                  }}
                                >
                                  <BanknoteArrowUp />
                                  Deposit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setOpenDialog("withdrawal")}
                                >
                                  <BanknoteArrowDown />
                                  Withdrawal
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setOpenDialog("close-position")
                                  }
                                >
                                  <BanknoteX />
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
              <Button
                className="w-full"
                onClick={() => connect({ connector: connectors[0] })}
              >
                Connect
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
