import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { PositionDetails, SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { DialogProps } from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import { wagmiConfig } from "@/app/wagmiConfig";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import { sendTxSentToast, sendTxSuccessToast } from "./toasts";

export interface PositionDialogProps extends DialogProps {
  positionToCheck: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  onSuccess?: () => void;
}

export const ClosePositionDialog = ({ ...props }: PositionDialogProps) => {
  const [feeAmount, setFeeAmount] = useState<bigint | null>(null);
  const [netCollateral, setNetCollateral] = useState<bigint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use wagmi's useWriteContract hook
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (props.open && props.positionToCheck) {
      calculateClosePositionDetails();
    }
  }, [props.open, props.positionToCheck]);


  const calculateClosePositionDetails = async () => {
    if (!props.positionToCheck || !props.collateral) {
      return;
    }

    try {
      // Get protocol fee
      const protocolFeePercent = await readContract(wagmiConfig, {
        abi: constants.LeprechaunFactoryABI,
        address: constants.LeprechaunFactoryAddress,
        functionName: "protocolFee",
      });

      // Calculate fee on collateral
      const fee = (props.positionToCheck.collateralAmount * (protocolFeePercent as bigint)) / BigInt(10000);
      setFeeAmount(fee);

      // Calculate net collateral returned to user
      const net = props.positionToCheck.collateralAmount - fee;
      setNetCollateral(net);
    } catch (error) {
      console.error("Error calculating close position details:", error);
    }
  };

  const handleClosePosition = async () => {
    if (!props.positionToCheck) {
      return;
    }

    try {
      setIsSubmitting(true);

      // First, check if user has enough synthetic tokens to burn
      const syntheticBalance = await readContract(wagmiConfig, {
        abi: constants.ERC20ABI,
        // @ts-expect-error this is a valid address
        address: props.positionToCheck.syntheticAsset,
        functionName: "balanceOf",
        args: [props.positionToCheck.owner],
      });

      if ((syntheticBalance as bigint) < props.positionToCheck.mintedAmount) {
        toast.error("Insufficient synthetic tokens", {
          description: `You need ${parseBigInt(props.positionToCheck.mintedAmount, 18, 6)} ${props.positionToCheck.syntheticSymbol} to close this position`
        });
        setIsSubmitting(false);
        return;
      }

      // Close position using wagmi's useWriteContractAsync
      const hash = await writeContractAsync({
        address: constants.PositionManagerAddress as `0x${string}`,
        abi: constants.PositionManagerABI,
        functionName: "closePosition",
        args: [props.positionToCheck.positionId]
      });

      sendTxSentToast(hash)

      const tx = await waitForTransactionReceipt(
        wagmiConfig,
        {
          hash: hash,
          confirmations: 3,
        },
      );

      sendTxSuccessToast(tx.transactionHash)
      setIsSubmitting(false);
      props.onSuccess?.()
      props.onOpenChange?.(false);
    } catch (error) {
      console.error("Close position error:", error);
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogTitle>Close Position</DialogTitle>
        <DialogDescription>
          Are you sure you want to close your position? This will burn your synthetic tokens and return your collateral.
        </DialogDescription>

        <div className="space-y-4 my-2">
          <div className="mb-1">
            <span className="font-medium">Position ID:</span> {props.positionToCheck?.positionId.toString()}
          </div>

          <div className="text-sm space-y-1">
            <div className="mb-1">When you close your position, the following will happen:</div>

            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <span>Synthetic Asset</span>
              <span className="text-destructive flex items-center">
                <ArrowDown className="size-3 mr-1" />
                {props.positionToCheck ? parseBigInt(props.positionToCheck.mintedAmount, 18, 6) : '0'} {props.positionToCheck?.syntheticSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <span>Protocol Fee</span>
              <span className="text-muted-foreground">
                {feeAmount ? parseBigInt(feeAmount, props.collateral?.decimals || 0, 4) : '0'} {props.positionToCheck?.collateralSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center font-medium pt-1">
              <span>Collateral Returned</span>
              <span className="text-green-600 flex items-center">
                <ArrowUp className="size-3 mr-1" />
                {netCollateral ? parseBigInt(netCollateral, props.collateral?.decimals || 0, 4) : '0'} {props.positionToCheck?.collateralSymbol}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleClosePosition} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 mx-4 animate-spin" />
            ) : (
              "Close Position"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};