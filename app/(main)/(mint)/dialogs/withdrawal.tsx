import { wagmiConfig } from "@/app/wagmiConfig";
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
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import { PositionDetails, SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { DialogProps } from "@radix-ui/react-dialog";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { useWriteContract } from "wagmi";
import { sendTxSentToast, sendTxSuccessToast } from "./toasts";

export interface PositionDialogProps extends DialogProps {
  position: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  allowance: bigint | null;
  onSuccess?: () => void;
}

export const WithdrawalDialog = ({
  ...props
}: PositionDialogProps) => {
  const form = useForm();
  const [maxWithdrawable, setMaxWithdrawable] = useState<bigint | null>(null);
  const [newRatio, setNewRatio] = useState<number | null>(null);
  const [feeAmount, setFeeAmount] = useState<bigint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Use wagmi's useWriteContract hook
  const { writeContractAsync } = useWriteContract();

  const amountWatched = form.watch("amount") as number;

  useEffect(() => {
    if (props.open && props.position) {
      // Calculate max withdrawable amount
      calculateMaxWithdrawable();

      if (amountWatched && props.collateral) {
        handleWithdrawalAmountChange(amountWatched, props.position, props.collateral)
      }
    } else {
      form.reset()
      setMaxWithdrawable(null)
      setNewRatio(null);
      setFeeAmount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.position, props.collateral, amountWatched]);

  const calculateMaxWithdrawable = async () => {
    if (!props.position || !props.collateral || maxWithdrawable) return;
    try {
      // Get effective collateral ratio (minimum required)
      // const effectiveRatio = await readContract(wagmiConfig, {
      //   abi: constants.LeprechaunFactoryABI,
      //   address: constants.LeprechaunFactoryAddress,
      //   functionName: "getEffectiveCollateralRatio",
      //   args: [props.position.syntheticAsset, props.position.collateralAsset],
      // });
      setLoading(true)

      // Calculate required collateral based on debt
      const requiredCollateral = await readContract(wagmiConfig, {
        abi: constants.PositionManagerABI,
        address: constants.PositionManagerAddress,
        functionName: "getRequiredCollateral",
        args: [
          props.position.syntheticAsset,
          props.position.collateralAsset,
          props.position.mintedAmount,
        ],
      });

      // Calculate max withdrawable (with some buffer)
      if (props.position.collateralAmount > (requiredCollateral as bigint)) {
        // Add 1% buffer to be safe
        const safetyBuffer =
          ((requiredCollateral as bigint) * BigInt(100)) / BigInt(9900);
        const maxWithdraw = props.position.collateralAmount - safetyBuffer;
        setMaxWithdrawable(maxWithdraw > 0 ? maxWithdraw : BigInt(0));
      } else {
        setMaxWithdrawable(BigInt(0));
      }
      setLoading(false)
    } catch (error) {
      console.error("Error calculating max withdrawable:", error);
      setMaxWithdrawable(BigInt(0));
      setLoading(false)
    }
  };

  const handleWithdrawalAmountChange = useDebouncedCallback(
    async (amount, position, collateral) => {

      try {
        setLoading(true)
        const withdrawAmount = BigInt(
          Math.floor(
            Number(amount) * 10 ** (collateral.decimals as number),
          ),
        );

        // Ensure not trying to withdraw more than available
        if (withdrawAmount > position.collateralAmount) {
          setLoading(false)
          setInvalid(true)
          toast.error("Cannot withdraw more than available collateral");
          return;
        }

        // Calculate protocol fee
        const protocolFeePercent = await readContract(wagmiConfig, {
          abi: constants.LeprechaunFactoryABI,
          address: constants.LeprechaunFactoryAddress,
          functionName: "protocolFee",
        });

        const fee =
          (withdrawAmount * (protocolFeePercent as bigint)) / BigInt(10000);
        setFeeAmount(fee);

        // Calculate new ratio after withdrawal
        const remainingCollateral =
          position.collateralAmount - withdrawAmount;

        // Get USD values
        const collateralUsdValue = await readContract(wagmiConfig, {
          abi: constants.OracleInterfaceABI,
          address: constants.OracleInterfaceAddress,
          functionName: "getUsdValue",
          args: [
            position.collateralAsset,
            remainingCollateral,
            collateral.decimals,
          ],
        });

        const debtUsdValue = position.debtUsdValue;

        if (debtUsdValue && debtUsdValue > 0) {
          const newCollateralRatio =
            Number(
              ((collateralUsdValue as bigint) * BigInt(10000)) /
                (debtUsdValue as bigint),
            ) / 100;
          setNewRatio(newCollateralRatio);
        }
        setLoading(false)
        setInvalid(false)
      } catch (error) {
        console.error("Error calculating new ratio:", error);
        setLoading(false)
      }
    },
    [props.collateral, props.position],
    800,
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!props.position || !props.collateral) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert amount to proper decimals
      const decimals = props.collateral.decimals || 0;
      const amountString = data.amount.toString();
      const amountInWei = parseUnits(amountString, decimals);


      // Check if new ratio would be safe
      if (newRatio !== null) {
        const effectiveRatio = await readContract(wagmiConfig, {
          abi: constants.LeprechaunFactoryABI,
          address: constants.LeprechaunFactoryAddress,
          functionName: "getEffectiveCollateralRatio",
          args: [props.position.syntheticAsset, props.position.collateralAsset],
        });

        const minRequiredRatio = Number(effectiveRatio as bigint) / 100;

        if (newRatio < minRequiredRatio) {
          toast.error(
            `New ratio (${newRatio.toFixed(2)}%) would be below minimum required ratio (${minRequiredRatio.toFixed(2)}%)`,
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Withdraw collateral using wagmi's useWriteContractAsync
      const hash = await writeContractAsync({
        address: constants.PositionManagerAddress as `0x${string}`,
        abi: constants.PositionManagerABI,
        functionName: "withdrawCollateral",
        args: [props.position.positionId, amountInWei],
      });

      sendTxSentToast(hash);

      const txHash = await waitForTransactionReceipt(
        wagmiConfig,
        {
          hash: hash,
          confirmations: 3,
        },
      );
      sendTxSuccessToast(txHash.transactionHash);
      setIsSubmitting(false);
      props.onSuccess?.()
      props.onOpenChange?.(false);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Transaction failed");
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <Form {...form}>
          <DialogTitle>Withdraw Collateral</DialogTitle>
          <DialogDescription>
            Withdraw collateral from your position while maintaining a safe
            ratio.
          </DialogDescription>
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium">Position ID:</span>{" "}
              {props.position?.positionId.toString()}
            </div>
            <div>
              <span className="font-medium">Collateral:</span>{" "}
              {props.position?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Available:</span>{" "}
              {props.position?.collateralAmount
                ? parseBigInt(
                    props.position.collateralAmount,
                    props.collateral?.decimals || 0,
                    4,
                  )
                : "0"}{" "}
              {props.position?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Current Ratio:</span>{" "}
              {props.position?.currentRatio
                ? parseBigInt(props.position.currentRatio as bigint, 2, 2)
                : "0"}
              %
            </div>
            <div>
              <span className="font-medium">Max Withdrawable:</span>{" "}
              {maxWithdrawable !== null
                ? parseBigInt(
                    maxWithdrawable,
                    props.collateral?.decimals || 0,
                    4,
                  )
                : "0"}{" "}
              {props.position?.collateralSymbol}
            </div>
          </div>
          <FormField
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Amount to Withdraw</FormLabel>
                <FormControl>
                  <DecimalInput
                    {...field}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          {feeAmount !== null && (
            <div className="text-sm mt-1">
              <span className="font-medium">Protocol Fee:</span>{" "}
              {parseBigInt(feeAmount, props.collateral?.decimals || 0, 4)}{" "}
              {props.position?.collateralSymbol}
            </div>
          )}
          {newRatio !== null && (
            <div className="text-sm mt-2">
              <span className="font-medium">New Ratio:</span>{" "}
              {newRatio.toFixed(2)}%
              <div
                className={`text-xs ${newRatio < 150 ? "text-red-500" : newRatio > 200 ? "text-green-500" : "text-yellow-500"}`}
              >
                {newRatio < 150
                  ? "⚠️ Danger zone"
                  : newRatio < 180
                    ? "⚠️ Close to liquidation threshold"
                    : newRatio > 250
                      ? "✅ Very safe position"
                      : "✅ Safe position"}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting || !amountWatched || loading|| invalid}>
              {invalid? "Invalid": "Withdraw"}
              {(loading || isSubmitting) && <Loader2 className="animate-spin size-3" />}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
