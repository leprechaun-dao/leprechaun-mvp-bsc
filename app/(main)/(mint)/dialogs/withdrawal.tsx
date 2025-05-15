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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { readContract } from "@wagmi/core";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import { wagmiConfig } from "@/app/wagmiConfig";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseUnits } from "viem";

export interface PositionDialogProps extends DialogProps {
  positionToCheck: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  allowance?: bigint | null;
  onSuccess?: () => void;
}

export const WithdrawalDialog = ({ onSuccess, ...props }: PositionDialogProps) => {
  const form = useForm({
    defaultValues: {
      amount: "" as unknown as number
    }
  });
  const [maxWithdrawable, setMaxWithdrawable] = useState<bigint | null>(null);
  const [newRatio, setNewRatio] = useState<number | null>(null);
  const [feeAmount, setFeeAmount] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use wagmi's useWriteContract hook
  const { writeContractAsync } = useWriteContract();

  // Handle transaction receipt
  const { status } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    enabled: !!txHash,
  });

  console.log("WithdrawalDialog props:", props);
  console.log("Position to check:", props.positionToCheck);
  console.log("Collateral:", props.collateral);

  useEffect(() => {
    if (props.open && props.positionToCheck) {
      console.log("Position data:", props.positionToCheck);
      
      // Reset form when dialog opens
      form.reset({
        amount: "" as unknown as number
      });
      
      // Calculate max withdrawable amount
      calculateMaxWithdrawable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.positionToCheck]);

  // Handle transaction status changes
  useEffect(() => {
    if (txHash && status === "pending") {
      toast("Transaction sent.", {
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`${constants.EXPLORER_URL}/tx/${txHash}`, "_blank"),
        },
      });
    }

    if (status === "success") {
      toast.success("Withdrawal successful!", {
        description: `Withdrew collateral from your position`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`${constants.EXPLORER_URL}/tx/${txHash}`, "_blank"),
        },
      });
      
      // Call success callback to refresh data
      if (onSuccess) onSuccess();
      
      // Close dialog
      props.onOpenChange?.(false);
      
      // Reset state
      form.reset();
      setNewRatio(null);
      setFeeAmount(null);
      setTxHash(null);
      setIsSubmitting(false);
    }

    if (status === "error") {
      toast.error("Transaction failed", {
        description: "Error processing transaction"
      });
      setIsSubmitting(false);
      setTxHash(null);
    }
  }, [status, txHash, onSuccess, props, form]);

  const calculateMaxWithdrawable = async () => {
    if (!props.positionToCheck || !props.collateral) return;
    
    try {
      console.log("Calculating max withdrawable...");
      console.log("Position:", props.positionToCheck);
      console.log("Collateral:", props.collateral);
      
      // Get effective collateral ratio (minimum required)
      const effectiveRatio = await readContract(wagmiConfig, {
        abi: constants.LeprechaunFactoryABI,
        address: constants.LeprechaunFactoryAddress,
        functionName: "getEffectiveCollateralRatio",
        args: [
          props.positionToCheck.syntheticAsset,
          props.positionToCheck.collateralAsset
        ],
      });
      
      console.log("Effective ratio:", effectiveRatio);
      
      // Calculate required collateral based on debt
      const requiredCollateral = await readContract(wagmiConfig, {
        abi: constants.PositionManagerABI,
        address: constants.PositionManagerAddress,
        functionName: "getRequiredCollateral",
        args: [
          props.positionToCheck.syntheticAsset,
          props.positionToCheck.collateralAsset,
          props.positionToCheck.mintedAmount
        ],
      });
      
      console.log("Required collateral:", requiredCollateral);
      console.log("Actual collateral:", props.positionToCheck.collateralAmount);
      
      // Calculate max withdrawable (with some buffer)
      if (props.positionToCheck.collateralAmount > (requiredCollateral as bigint)) {
        // Add 1% buffer to be safe
        const safetyBuffer = (requiredCollateral as bigint) * BigInt(100) / BigInt(9900);
        const maxWithdraw = props.positionToCheck.collateralAmount - safetyBuffer;
        setMaxWithdrawable(maxWithdraw > 0 ? maxWithdraw : BigInt(0));
        console.log("Max withdrawable set to:", maxWithdraw);
      } else {
        setMaxWithdrawable(BigInt(0));
        console.log("Max withdrawable set to 0");
      }
    } catch (error) {
      console.error("Error calculating max withdrawable:", error);
      setMaxWithdrawable(BigInt(0));
    }
  };
  
  const handleWithdrawalAmountChange = useDebouncedCallback(
    async (value: string) => {
      if (!props.positionToCheck || !props.collateral || !value || parseFloat(value) <= 0) {
        setNewRatio(null);
        setFeeAmount(null);
        return;
      }
      
      try {
        const decimals = props.collateral.decimals || 0;
        const valueAsNumber = parseFloat(value);
        const withdrawAmount = parseUnits(value, decimals);
        
        // Ensure not trying to withdraw more than available
        if (withdrawAmount > props.positionToCheck.collateralAmount) {
          return;
        }
        
        // Calculate protocol fee
        const protocolFeePercent = await readContract(wagmiConfig, {
          abi: constants.LeprechaunFactoryABI,
          address: constants.LeprechaunFactoryAddress,
          functionName: "protocolFee",
        });
        
        const fee = (withdrawAmount * (protocolFeePercent as bigint)) / BigInt(10000);
        setFeeAmount(fee);
        
        // Calculate new ratio after withdrawal
        const remainingCollateral = props.positionToCheck.collateralAmount - withdrawAmount;
        
        // Get USD values
        const collateralUsdValue = await readContract(wagmiConfig, {
          abi: constants.OracleInterfaceABI,
          address: constants.OracleInterfaceAddress,
          functionName: "getUsdValue",
          args: [
            props.positionToCheck.collateralAsset,
            remainingCollateral,
            props.collateral.decimals
          ],
        });
        
        const debtUsdValue = props.positionToCheck.debtUsdValue;
        
        if (debtUsdValue && debtUsdValue > 0) {
          const newCollateralRatio = Number((collateralUsdValue as bigint) * BigInt(10000) / (debtUsdValue as bigint)) / 100;
          setNewRatio(newCollateralRatio);
          console.log("New ratio calculated:", newCollateralRatio);
        }
      } catch (error) {
        console.error("Error calculating new ratio:", error);
      }
    },
    [props.collateral, props.positionToCheck],
    800,
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!props.positionToCheck || !props.collateral) {
      console.error("Missing position or collateral data");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting withdrawal:", data);
      
      // Convert amount to proper decimals
      const decimals = props.collateral.decimals || 0;
      const amountString = data.amount.toString();
      const amountInWei = parseUnits(amountString, decimals);
      
      console.log("Amount in wei:", amountInWei);
      console.log("Position collateral:", props.positionToCheck.collateralAmount);
      
      // Check if amount is valid
      if (amountInWei > (props.positionToCheck.collateralAmount || BigInt(0))) {
        toast.error("Cannot withdraw more than available collateral");
        setIsSubmitting(false);
        return;
      }
      
      // Check if new ratio would be safe
      if (newRatio !== null) {
        const effectiveRatio = await readContract(wagmiConfig, {
          abi: constants.LeprechaunFactoryABI,
          address: constants.LeprechaunFactoryAddress,
          functionName: "getEffectiveCollateralRatio",
          args: [
            props.positionToCheck.syntheticAsset,
            props.positionToCheck.collateralAsset
          ],
        });
        
        const minRequiredRatio = Number(effectiveRatio as bigint) / 100;
        
        if (newRatio < minRequiredRatio) {
          toast.error(`New ratio (${newRatio.toFixed(2)}%) would be below minimum required ratio (${minRequiredRatio.toFixed(2)}%)`);
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log("Calling withdrawCollateral with:", props.positionToCheck.positionId, amountInWei);
      
      // Withdraw collateral using wagmi's useWriteContractAsync
      const hash = await writeContractAsync({
        address: constants.PositionManagerAddress as `0x${string}`,
        abi: constants.PositionManagerABI,
        functionName: "withdrawCollateral",
        args: [props.positionToCheck.positionId, amountInWei]
      });
      
      console.log("Transaction hash:", hash);
      setTxHash(hash);
      
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <Form {...form}>
          <DialogTitle>Withdraw Collateral</DialogTitle>
          <DialogDescription>
            Withdraw collateral from your position while maintaining a safe ratio.
          </DialogDescription>
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium">Position ID:</span> {props.positionToCheck?.positionId.toString()}
            </div>
            <div>
              <span className="font-medium">Collateral:</span> {props.positionToCheck?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Available:</span> {props.positionToCheck?.collateralAmount ? 
                parseBigInt(props.positionToCheck.collateralAmount, props.collateral?.decimals || 0, 4) : '0'} {props.positionToCheck?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Current Ratio:</span> {props.positionToCheck?.currentRatio ? 
                parseBigInt(props.positionToCheck.currentRatio as bigint, 2, 2) : '0'}%
            </div>
            <div>
              <span className="font-medium">Max Withdrawable:</span> {maxWithdrawable !== null ? 
                parseBigInt(maxWithdrawable, props.collateral?.decimals || 0, 4) : '0'} {props.positionToCheck?.collateralSymbol}
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleWithdrawalAmountChange(e.toString());
                    }}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          {feeAmount !== null && (
            <div className="text-sm mt-1">
              <span className="font-medium">Protocol Fee:</span> {parseBigInt(feeAmount, props.collateral?.decimals || 0, 4)} {props.positionToCheck?.collateralSymbol}
            </div>
          )}
          {newRatio !== null && (
            <div className="text-sm mt-2">
              <span className="font-medium">New Ratio:</span> {newRatio.toFixed(2)}%
              <div className={`text-xs ${newRatio < 150 ? 'text-red-500' : newRatio > 200 ? 'text-green-500' : 'text-yellow-500'}`}>
                {newRatio < 150 ? '⚠️ Danger zone' : 
                 newRatio < 180 ? '⚠️ Close to liquidation threshold' : 
                 newRatio > 250 ? '✅ Very safe position' : 
                 '✅ Safe position'}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 mx-4 animate-spin" />
              ) : (
                "Withdraw"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};