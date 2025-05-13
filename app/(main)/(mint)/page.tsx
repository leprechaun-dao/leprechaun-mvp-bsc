"use client";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Header } from "@/components/layout/header";
import { TokenSelector, tokensMock } from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RussianRuble } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAccount, useConnect } from "wagmi";
import { metaMask } from "wagmi/connectors";

export default function Home() {
  const form = useForm();
  const { connect } = useConnect();
  const account = useAccount();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header activeRoute="mint" />
      <main className="flex flex-col gap-5 flex-1 items-center justify-center mb-[20vh] px-6">
        <Card className="w-lg">
          <CardHeader>
            <CardTitle>Mint</CardTitle>
            <CardDescription>
              Enter the amount of collateral and minted tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 **:data-[slot=input]:h-14 **:data-[slot=input]:text-right **:data-[slot=input]:text-lg">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="colateral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collateral</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <CurrencyInput {...field} />
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
                          <CurrencyInput {...field} />
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

        <Card className="w-lg">
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
                    <TableHead>Symbol</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="flex gap-1 items-center *:[svg]:size-4">
                      <RussianRuble /> RUB
                    </TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>$11.00 USD</TableCell>
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
                // TODO: Should we add more connectors?
                onClick={() => connect({ connector: metaMask() })}
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
