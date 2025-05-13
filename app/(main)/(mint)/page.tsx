"use client";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Header } from "@/components/layout/header";
import { Token, TokenSelector, tokensMock } from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useReadContract, useAccount, useReadContracts } from "wagmi";
import * as constants from "@/utils/constants";
import { useMemo } from "react";

const sDOWContract = {
  address: constants.sDOWAddress,
  abi: constants.SyntheticAssetABI,
} as const
const positionManagerContract = {
  address: constants.PositionManagerAddress,
  abi: constants.PositionManagerABI,
} as const
const leprechaunFactoryContract = {
  address: constants.LeprechaunFactoryAddress,
  abi: constants.LeprechaunFactoryABI,
} as const

export default function Home() {
  const form = useForm();

  const { data: assetCount } = useReadContract({
    ...leprechaunFactoryContract,
    functionName: 'getSyntheticAssetCount',
  })

  const calls = useMemo(() => {
    const _count = Number(assetCount)
    if (!_count) return []

    return Array.from({ length: _count }, (_, i) => ({
      ...leprechaunFactoryContract,
      functionName: 'allSyntheticAssets',
      args: [i],
    }))
  }, [assetCount])

  const { data: assetAddressList } = useReadContracts({
    // @ts-ignore
    contracts: calls,
    query: {
      enabled: calls.length > 0,
    },
  })

  const addressesCalls = useMemo(() => {
    if (!assetAddressList) return [];

    return assetAddressList.map((res) => {
      return {
        ...leprechaunFactoryContract,
        functionName: 'syntheticAssets',
        args: [res.result]
      };
    });
  }, [assetAddressList]);

  // @ts-ignore
  const { data: assetDataList } = useReadContracts({
    // @ts-ignore
    contracts: addressesCalls,
    query: {
      enabled: addressesCalls.length > 0,
    },
  })  as unknown as { result: Token }[];

  // TODO add icons and reactivity to the TokenSelector
  console.log(assetDataList)

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header activeRoute="mint" />
      <main className="flex flex-1 items-center justify-center mb-[20vh] px-6">
        <Card className="w-lg">
          <CardHeader>
            <CardTitle>Mint</CardTitle>
            <CardDescription>
              Enter the amount of collateral and minted tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 [&_.input]:h-14 [&_.input]:text-right [&_.input]:text-lg">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="colateral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collateral</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <CurrencyInput className="input" {...field} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="h-full">Select Token</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>Token Selector</DialogTitle>
                              <DialogDescription>
                                Select the token you want to use as collateral.
                              </DialogDescription>
                              <TokenSelector tokens={tokensMock} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minted</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <CurrencyInput className="input" {...field} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="h-full">Select Token</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>Token Selector</DialogTitle>
                              <DialogDescription>
                                Select the token you want to mint.
                              </DialogDescription>
                              <TokenSelector tokens={tokensMock} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
