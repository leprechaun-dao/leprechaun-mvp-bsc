import { DecimalInput } from "@/components/DecimalInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PositionDetails, SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { DialogProps } from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { readContract } from "@wagmi/core";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import {wagmiConfig} from "@/app/wagmiConfig"
import { toast } from "sonner";

export interface PositionDialogProps extends DialogProps {
  positionToCheck: PositionDetails | undefined
  collateral: SyntheticAssetInfo | undefined
  allowance: bigint | null
}

export const DepositDialog = ({ ...props }: PositionDialogProps) => {
  const form = useForm();
  const [collateralValue, setCollateralValue] = useState<bigint | null>(null);
  const [synthAmountToBeMinted, setSynthAmountToBeMinted] = useState<bigint | null>(null);

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log(data);
    // DepositCollateral

    toast("Transaction sent.", {
      action: {
        label: "View on Etherscan",
        onClick: () => {
          window.open(`https://etherscan.io/tx/${"0x1234567890"}`, "_blank");
        },
      },
    });
    await new Promise((r) => setTimeout(r, 1000));
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
          window.open(`https://etherscan.io/tx/${"0x1234567890"}`, "_blank");
        },
      },
    });

    // props.onOpenChange?.(false);
    // setCollateralValue(null)
    // setSynthAmountToBeMinted(null)
  });

  useEffect(() => {
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  const handleCollateralAmountChange = useDebouncedCallback(
    async (value: number) => {
      const abi = constants.LeprechaunLensABI;
      const address = constants.LENSAddress;

      const inputAmount = BigInt(
        Math.floor(Number(value) * 10 ** (props.collateral?.decimals as number)),
      );

      const res = await readContract(wagmiConfig, {
        abi,
        address: address,
        functionName: "getMintableAmount",
        args: [props.positionToCheck?.syntheticAsset, props.collateral?.tokenAddress, inputAmount],
      });

      const result = res as bigint[];
      // we assuming the decimals here
      // const newAmount = Number(result[0]) / 10 ** 18;

      setCollateralValue(result[1]);
      setSynthAmountToBeMinted(result[0])
    },
    [],
    800,
  );

  return (
    <Dialog {...props}>
      <DialogContent>
        <Form {...form}>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription>
            Enter the amount of tokens you want to deposit.
          </DialogDescription>
          <div className="text-sm">
            <span className="font-medium">Collateral:</span> {props.positionToCheck?.collateralSymbol}
          </div>
          <FormField
            control={form.control}
            name="amount"
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
                    const collateral = props.collateral;
                    const inputAmount = BigInt(
                      Math.floor(Number(value) * 10 ** (collateral?.decimals as number)),
                    );
                    const assetBalance = collateral?.balance;

                    return (
                      inputAmount <= assetBalance! ||
                      "Amount must be within balance"
                    );
                  },
                },
              }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Amount (${parseBigInt(collateralValue as bigint, 17, 2)})</FormLabel>
                <FormControl>
                  <DecimalInput
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleCollateralAmountChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div className="text-sm">
            <span className="font-medium">New Liquidation Price:</span> $2.00 <br/>
            <span className="font-medium">Synthetics to be minted:</span>{" "}
            {parseBigInt(synthAmountToBeMinted as bigint, 18, 2)}{" "} ${props.positionToCheck?.syntheticSymbol}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 mx-4 animate-spin" />
              ) : (
                "Deposit"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
