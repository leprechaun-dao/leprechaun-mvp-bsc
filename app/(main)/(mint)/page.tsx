"use client";
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

  // TODO: We need to get the token object in here
  const [mint, setMintToken] = useState<{ symbol: string }>();
  const [collateral, setCollateral] = useState<{ symbol: string }>();

  const [mintTokenSelectorOpen, setMintTokenSelectorOpen] = useState(false);
  const [collateralTokenSelectorOpen, setCollateralTokenSelectorOpen] =
    useState(false);

  const [openDialog, setOpenDialog] = useState<
    "deposit" | "withdrawal" | "close-position" | null
  >(null);

  const handleSubmitMint = form.handleSubmit(async (data) => {
    console.log(data);

    // createPosition

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
            <form onSubmit={handleSubmitMint}>
              <CardHeader>
                <CardTitle>Mint</CardTitle>
                <CardDescription>
                  Enter the amount of collateral and minted tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 **:data-[slot=input]:h-14 **:data-[slot=input]:text-right **:data-[slot=input]:text-lg">
                  <FormField
                    control={form.control}
                    name="collateral-amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collateral ($0.00)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <DecimalInput {...field} />
                            <Dialog
                              open={collateralTokenSelectorOpen}
                              onOpenChange={setCollateralTokenSelectorOpen}
                            >
                              <DialogTrigger asChild>
                                <TokenSelectorButton
                                  selectedSymbol={collateral?.symbol}
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
                                    setCollateral({ symbol: token.symbol! });
                                    setCollateralTokenSelectorOpen(false);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mint-amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minted ($0.00)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <DecimalInput {...field} />
                            <Dialog
                              open={mintTokenSelectorOpen}
                              onOpenChange={setMintTokenSelectorOpen}
                            >
                              <DialogTrigger asChild>
                                <TokenSelectorButton
                                  selectedSymbol={mint?.symbol}
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
                                    setMintToken({ symbol: token.symbol! });
                                    setMintTokenSelectorOpen(false);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collateral-ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collateral Ratio</FormLabel>
                        <FormControl>
                          <Slider
                            className="mt-2"
                            min={150}
                            max={250}
                            step={50}
                            {...field}
                          />

                          {/* 150, 200, 250 */}
                        </FormControl>
                        <span className="flex flex-row justify-between text-neutral-400">
                          <span>150%</span>
                          <span>200%</span>
                          <span>250%</span>
                        </span>
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={account.status !== "connected"}
                    className="mt-5"
                    type="submit"
                  >
                    Mint
                  </Button>
                </div>
                <CardFooter></CardFooter>
              </CardContent>
            </form>
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
                        <DropdownMenuTrigger>
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
