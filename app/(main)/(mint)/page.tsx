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
import { SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { readContract } from "@wagmi/core";
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
import { ReactNode, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useAccount,
  useConnect,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { ClosePositionDialog } from "./dialogs/close-position";
import { DepositDialog } from "./dialogs/deposit";
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
    symbol: "cbBTC",
    isActive: true,
    decimals: 8,
    icon: <SwissFranc />,
  },
  {
    tokenAddress: constants.mWETHAddress,
    name: "Wrapped Ether",
    symbol: "wETH",
    decimals: 18,
    isActive: true,
    icon: <SaudiRiyal />,
  },
  {
    tokenAddress: constants.mUSDCAddress,
    name: "USDC",
    symbol: "USDC",
    isActive: true,
    decimals: 6,
    icon: <RussianRuble />,
  },
];

// const sDOWContract = {
//   address: constants.sDOWAddress,
//   abi: constants.SyntheticAssetABI,
// } as const
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

  const { data: syntheticAssets } = useReadContract({
    ...lensContract,
    functionName: "getAllSyntheticAssets",
  });

  const { data } = useReadContracts({
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
    ],
    query: {
      enabled: !!account.address,
    },
  });
  const [mUSDCBalance, mWETHBalance, mWBTCBalance] = data || [];

  const formattedAssets = useMemo(() => {
    if (
      !syntheticAssets ||
      (syntheticAssets as SyntheticAssetInfo[]).length === 0
    )
      return [];

    const iconMap: Record<string, ReactNode> = {
      CHF: <SwissFranc />,
      sDOW: <RussianRuble />,
      SRL: <SaudiRiyal />,
    };

    return (syntheticAssets as SyntheticAssetInfo[]).map(
      (item: SyntheticAssetInfo) => ({
        tokenAddress: item.tokenAddress,
        name: item.name,
        symbol: item.symbol,
        minCollateralRatio: item.minCollateralRatio,
        auctionDiscount: item.auctionDiscount,
        isActive: item.isActive,
        icon: iconMap[item.name] || <VaultIcon />,
      }),
    );
  }, [syntheticAssets]);

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
  const { writeContract } = useWriteContract();

  const handleSubmitMint = form.handleSubmit(async (data) => {
    const abi = constants.PositionManagerABI;
    const address = constants.PositionManagerAddress;

    // createPosition
    writeContract({
      abi,
      address: address,
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
    toast("Transaction sent.", {
      action: {
        label: "View on Etherscan",
        onClick: () => {
          window.open(`https://etherscan.io/tx/${"0x1234567890"}`, "_blank");
        },
      },
    });
    await new Promise((r) => setTimeout(r, 1000));
    toast("Transaction confirmed.", {
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
          window.open(`https://etherscan.io/tx/${"0x1234567890"}`, "_blank");
        },
      },
    });
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      <DepositDialog
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

                        const index = collateralAssetsWithBalance.findIndex(
                          (collateralAsset) =>
                            collateralAsset.symbol === collateral?.symbol,
                        );
                        const asset = collateralAssetsWithBalance[index];

                        const inputAmount = BigInt(
                          Math.floor(Number(value) * 10 ** asset.decimals!),
                        );
                        const assetBalance = asset.balance!;

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
                            ($0.00)
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
                              // const newValue = e;
                              const mint = form.getValues().mint;
                              const collateral = form.getValues().collateral;
                              const abi = constants.LeprechaunLensABI;
                              const address = constants.LENSAddress;

                              const index =
                                collateralAssetsWithBalance.findIndex(
                                  (collateralAsset) =>
                                    collateralAsset.symbol ===
                                    collateral?.symbol,
                                );
                              const asset = collateralAssetsWithBalance[index];
                              const inputAmount = BigInt(
                                Math.floor(Number(e) * 10 ** asset.decimals!),
                              );

                              if (!mint || !collateral) return;

                              readContract(wagmiConfig, {
                                abi,
                                address: address,
                                functionName: "getMintableAmount",
                                args: [
                                  mint.tokenAddress,
                                  collateral.tokenAddress,
                                  inputAmount,
                                ],
                              }).then((res) => {
                                const result = res as bigint[];
                                // we assuming the decimals here
                                const newAmount = Number(result[0]) / 10 ** 18;
                                form.setValue("mintAmount", newAmount, {
                                  shouldValidate: true,
                                });
                                // console.log(result[0], newAmount)

                                form.setValue("mintAmount", Number(newAmount), {
                                  shouldValidate: true,
                                });
                              });
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
                            ($0.00)
                          </span>
                        </span>
                      </FormLabel>
                      <div className="flex items-end gap-2">
                        <FormControl>
                          <DecimalInput
                            // TODO this is not changing
                            className="h-14"
                            {...field}
                            disabled={!form.watch("mint")}
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
                  Mint
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    disabled={account.status !== "connected"}
                  >
                    A
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={account.status !== "connected"}
                  >
                    B
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={account.status !== "connected"}
                  >
                    C
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
                    <TableHead>Liq. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <RussianRuble className="inline-block size-4" /> RUB
                    </TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>1.04 BTC</TableCell>
                    <TableCell>$5.00</TableCell>
                    <TableCell>$11.00</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="px-1">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => setOpenDialog("deposit")}
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
                            onClick={() => setOpenDialog("close-position")}
                          >
                            <BanknoteX />
                            Close Position
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
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
