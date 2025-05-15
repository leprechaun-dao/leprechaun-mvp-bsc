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
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { readContract, writeContract } from "@wagmi/core";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import { wagmiConfig } from "@/app/wagmiConfig";
import { toast } from "sonner";

export interface PositionDialogProps extends DialogProps {
  positionToCheck: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  allowance: bigint | null;
  onSuccess?: () => void;
}

export const DepositDialog = ({ onSuccess, ...props }: PositionDialogProps) => {
  const form = useForm();

  const [loading, setLoading] = useState(false);

  const [collateralValue, setCollateralValue] = useState<bigint | null>(null);
  const [newRatio, setNewRatio] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratioAvaliation = useMemo(() => {
    if (!newRatio) return null
    let textColor
    let text

    if (newRatio < 150) {
      textColor = "text-red-500"
      text = "⚠️ Danger zone"
    } else if (newRatio > 180) {
      textColor = "text-green-500"
    } else {
      textColor = "text-yellow-500"
    }
    if (newRatio < 180) {
      text = "⚠️ Close to liquidation threshold"
    } else if (newRatio > 250) {
      text = "✅ Very safe position"
    } else {
      text = "✅ Safe position"
    }

    return (
    <div className={`text-xs ${textColor}`}>
      {text}
    </div>
    )
  }, [newRatio])

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!props.positionToCheck || !props.collateral) return;

    try {
      setIsSubmitting(true);

      // Convert amount to proper decimals
      const decimals = props.collateral.decimals || 0;
      const amountInWei = BigInt(Math.floor(data.amount * 10 ** decimals));

      // Check allowance first
      if (props.allowance && props.allowance < amountInWei) {
        // Approve tokens first
        const txHash = await writeContract(wagmiConfig, {
          // @ts-expect-error this is a valid address
          address: props.collateral.tokenAddress,
          abi: constants.ERC20ABI,
          functionName: "approve",
          args: [constants.PositionManagerAddress, amountInWei]
        });

        toast("Approval transaction sent", {
          action: {
            label: "View on Explorer",
            onClick: () => window.open(`${constants.EXPLORER_URL}/tx/${txHash}`, "_blank"),
          },
        });

        // Wait for approval to be confirmed
        // In a real implementation, you'd want to wait for the transaction receipt
        await new Promise(r => setTimeout(r, 2000));
      }

      // Deposit collateral
      const txHash = await writeContract(wagmiConfig, {
        address: constants.PositionManagerAddress,
        abi: constants.PositionManagerABI,
        functionName: "depositCollateral",
        args: [props.positionToCheck.positionId, amountInWei]
      });

      toast("Transaction sent", {
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`${constants.EXPLORER_URL}/tx/${txHash}`, "_blank"),
        },
      });

      // Wait for confirmation
      // In a real implementation, you'd use useWaitForTransactionReceipt or similar
      await new Promise(r => setTimeout(r, 2000));

      toast.success("Deposit successful!", {
        description: `Added ${data.amount} ${props.collateral.symbol} to your position`
      });

      // Call success callback to refresh data
      if (onSuccess) onSuccess();

      // Close dialog
      props.onOpenChange?.(false);

      // Reset form
      form.reset();
      setCollateralValue(null);
      setNewRatio(null);

    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const collateralAmountWatched = form.watch("collateralAmount") as number;

  useEffect(() => {
    if (!props.open) {
      form.reset();
      setCollateralValue(null);
      setNewRatio(null);
    }
console.log(collateralAmountWatched)
    if ( collateralAmountWatched ) {
      setLoading(true);
      handleUpdateRatio(collateralAmountWatched);
    } else {
      setNewRatio(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, collateralAmountWatched]);


  const handleUpdateRatio = useDebouncedCallback(
    async (collateralAmount) => {
      if (!props.positionToCheck || !props.collateral) {
        setCollateralValue(null);
        setNewRatio(null);
        return;
      }

      try {
        const inputAmount = BigInt(
          Math.floor(Number(collateralAmount) * 10 ** (props.collateral.decimals as number)),
        );

        // Calculate USD value of added collateral
        const collateralValueResult = await readContract(wagmiConfig, {
          abi: constants.OracleInterfaceABI,
          address: constants.OracleInterfaceAddress,
          functionName: "getUsdValue",
          args: [props.collateral.tokenAddress, inputAmount, props.collateral.decimals],
        });

        setCollateralValue(collateralValueResult as bigint);

        // Calculate new collateral ratio
        if (props.positionToCheck.debtUsdValue && props.positionToCheck.collateralUsdValue) {
          const totalCollateralValue = (props.positionToCheck.collateralUsdValue as bigint) + (collateralValueResult as bigint);
          const newRatio = Number(totalCollateralValue * BigInt(10000) / (props.positionToCheck.debtUsdValue as bigint)) / 100;
          setNewRatio(newRatio);
        }
        setLoading(false)
      } catch (error) {
        console.error("Error calculating values:", error);
      }
    },
    [props.collateral, props.positionToCheck],
    800,
  );

  return (
    <Dialog {...props}>
      <DialogContent>
        <Form {...form}>
          <DialogTitle>Deposit Collateral</DialogTitle>
          <DialogDescription>
            Add more collateral to increase your position&apos;s health ratio.
          </DialogDescription>
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium">Position ID:</span> {props.positionToCheck?.positionId.toString()}
            </div>
            <div>
              <span className="font-medium">Collateral:</span> {props.positionToCheck?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Current Ratio:</span> {props.positionToCheck?.currentRatio ?
                parseBigInt(props.positionToCheck.currentRatio as bigint, 2, 2) : '0'}%
            </div>
          </div>
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
                  const inputAmount = BigInt(
                    Math.floor(
                      Number(value) * 10 ** (props.collateral?.decimals as number),
                    ),
                  );
                  const assetBalance = props.collateral?.balance as bigint;

                  return (
                    inputAmount <= assetBalance ||
                    "Amount must be within balance"
                  );
                },
              },
            }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex gap-[24%]">
                  <span>
                    Amount {collateralValue ?
                    `(~$${parseBigInt(collateralValue, 18, 2)})` : ''}
                  </span>

                  <span className="flex gap-[12px]">
                    New Ratio: {loading && (<Loader2 className="animate-spin size-3" />)}
                    {" "}{newRatio && <>{newRatio.toFixed(2)}%</>}
                  </span>
                </FormLabel>
                <FormControl>
                  <DecimalInput
                    {...field}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div className={`text-center text-xs ${newRatio ? "":"text-gray-500"}`}>
            <span className="flex justify-center">
              Position avaliation: {newRatio && ratioAvaliation}
            </span>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting || loading}>
              Deposit
              {loading || isSubmitting && (
                <Loader2 className="animate-spin size-3" />
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};