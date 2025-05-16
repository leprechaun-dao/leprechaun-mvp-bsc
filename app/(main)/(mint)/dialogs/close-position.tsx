import { wagmiConfig } from "@/app/wagmiConfig";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import * as constants from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import { PositionDetails, SyntheticAssetInfo } from "@/utils/web3/interfaces";
import { DialogProps } from "@radix-ui/react-dialog";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import { sendTxSentToast, sendTxSuccessToast } from "./toasts";

export interface PositionDialogProps extends DialogProps {
  position: PositionDetails | undefined;
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
    if (props.open && props.position) {
      calculateClosePositionDetails();
    }
  }, [props.open, props.position]);

  const calculateClosePositionDetails = async () => {
    if (!props.position || !props.collateral) {
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
      const fee =
        (props.position.collateralAmount * (protocolFeePercent as bigint)) /
        BigInt(10000);
      setFeeAmount(fee);

      // Calculate net collateral returned to user
      const net = props.position.collateralAmount - fee;
      setNetCollateral(net);
    } catch (error) {
      console.error("Error calculating close position details:", error);
    }
  };

  const handleClosePosition = async () => {
    if (!props.position) {
      return;
    }

    try {
      setIsSubmitting(true);

      // First, check if user has enough synthetic tokens to burn
      const syntheticBalance = await readContract(wagmiConfig, {
        abi: constants.ERC20ABI,
        address: props.position.syntheticAsset,
        functionName: "balanceOf",
        args: [props.position.owner],
      });

      if ((syntheticBalance as bigint) < props.position.mintedAmount) {
        toast.error("Insufficient synthetic tokens", {
          description: `You need ${parseBigInt(props.position.mintedAmount, 18, 6)} ${props.position.syntheticSymbol} to close this position`,
        });
        setIsSubmitting(false);
        return;
      }

      // Close position using wagmi's useWriteContractAsync
      const hash = await writeContractAsync({
        address: constants.PositionManagerAddress as `0x${string}`,
        abi: constants.PositionManagerABI,
        functionName: "closePosition",
        args: [props.position.positionId],
      });

      sendTxSentToast(hash);

      const tx = await waitForTransactionReceipt(wagmiConfig, {
        hash: hash,
        confirmations: 3,
      });

      sendTxSuccessToast(tx.transactionHash);
      setIsSubmitting(false);
      props.onSuccess?.();
      props.onOpenChange?.(false);
    } catch (error) {
      console.error("Close position error:", error);
      toast.error("Transaction failed", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogTitle>Close Position</DialogTitle>
        <DialogDescription>
          Are you sure you want to close your position? This will burn your
          synthetic tokens and return your collateral.
        </DialogDescription>

        <div className="space-y-4 my-2">
          <div className="mb-1">
            <span className="font-medium">Position ID:</span>{" "}
            {props.position?.positionId.toString()}
          </div>

          <div className="text-sm space-y-1">
            <div className="mb-1">
              When you close your position, the following will happen:
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <span>Synthetic Asset</span>
              <span className="text-destructive flex items-center">
                <ArrowDown className="size-3 mr-1" />
                {props.position
                  ? parseBigInt(props.position.mintedAmount, 18, 6)
                  : "0"}{" "}
                {props.position?.syntheticSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <span>Protocol Fee</span>
              <span className="text-muted-foreground">
                {feeAmount
                  ? parseBigInt(feeAmount, props.collateral?.decimals || 0, 4)
                  : "0"}{" "}
                {props.position?.collateralSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center font-medium pt-1">
              <span>Collateral Returned</span>
              <span className="text-green-600 flex items-center">
                <ArrowUp className="size-3 mr-1" />
                {netCollateral
                  ? parseBigInt(
                      netCollateral,
                      props.collateral?.decimals || 0,
                      4,
                    )
                  : "0"}{" "}
                {props.position?.collateralSymbol}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleClosePosition}
            disabled={isSubmitting}
          >
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
