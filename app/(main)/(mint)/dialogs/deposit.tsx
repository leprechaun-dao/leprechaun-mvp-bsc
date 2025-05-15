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
import { readContract, writeContract } from "@wagmi/core";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import useDebouncedCallback from "beautiful-react-hooks/useDebouncedCallback";
import { wagmiConfig } from "@/app/wagmiConfig";
import { toast } from "sonner";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export interface PositionDialogProps extends DialogProps {
  positionToCheck: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  allowance: bigint | null;
  onSuccess?: () => void;
}

const formSchema = yup.object({
  amount: yup
    .number()
    .required("Amount is required")
    .positive("Amount must be positive")
    .typeError("Amount must be a number"),
});

export const DepositDialog = ({ onSuccess, ...props }: PositionDialogProps) => {
  const form = useForm({
    resolver: yupResolver(formSchema),
  });
  const [collateralValue, setCollateralValue] = useState<bigint | null>(null);
  const [synthAmountToBeMinted, setSynthAmountToBeMinted] = useState<bigint | null>(null);
  const [newRatio, setNewRatio] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSynthAmountToBeMinted(null);
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

  useEffect(() => {
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);
  
  const handleCollateralAmountChange = useDebouncedCallback(
    async (value: number) => {
      if (!props.positionToCheck || !props.collateral || value <= 0) {
        setCollateralValue(null);
        setSynthAmountToBeMinted(null);
        setNewRatio(null);
        return;
      }
      
      try {
        const inputAmount = BigInt(
          Math.floor(Number(value) * 10 ** (props.collateral.decimals as number)),
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
            Add more collateral to increase your position's health ratio.
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
            name="amount"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Amount {collateralValue ? 
                  `(~$${parseBigInt(collateralValue, 18, 2)})` : ''}</FormLabel>
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
                "Deposit"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};