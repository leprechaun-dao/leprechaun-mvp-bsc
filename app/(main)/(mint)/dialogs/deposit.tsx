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
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWriteContract } from "wagmi";
import { sendTxSentToast, sendTxSuccessToast } from "./toasts";

export interface PositionDialogProps extends DialogProps {
  position: PositionDetails | undefined;
  collateral: SyntheticAssetInfo | undefined;
  allowance: bigint | null;
  onSuccess?: () => void;
}

export const DepositDialog = ({ ...props }: PositionDialogProps) => {
  const form = useForm();
  const { writeContractAsync } = useWriteContract({
    mutation: {
      onError(error) {
        console.error("❌ Error on tx:", error);
        toast.error("Transaction failed! Please try again");
        setIsSubmitting(false);
      },
    },
  });

  const [loading, setLoading] = useState(false);

  const [collateralValue, setCollateralValue] = useState<bigint | null>(null);
  const [newRatio, setNewRatio] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratioAvaliation = useMemo(() => {
    if (!newRatio) return null;
    let textColor;
    let text;

    if (newRatio < 150) {
      textColor = "text-red-500";
      text = "⚠️ Danger zone";
    } else if (newRatio > 180) {
      textColor = "text-green-500";
    } else {
      textColor = "text-yellow-500";
    }
    if (newRatio < 180) {
      text = "⚠️ Close to liquidation threshold";
    } else if (newRatio > 250) {
      text = "✅ Very safe position";
    } else {
      text = "✅ Safe position";
    }

    return <div className={`text-xs ${textColor}`}>{text}</div>;
  }, [newRatio]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!props.position || !props.collateral) return;

    setIsSubmitting(true);
    if ((props.allowance || 0) < cleanCollateralAmount!) {
      const abi = constants.ERC20ABI;
      // approveTokens
      const approvalTxHash = await writeContractAsync({
        abi,
        address: props.collateral.tokenAddress,
        functionName: "approve",
        args: [constants.PositionManagerAddress, cleanCollateralAmount],
      });

      sendTxSentToast(approvalTxHash);

      const approvalConfirmationTxHash = await waitForTransactionReceipt(
        wagmiConfig,
        {
          hash: approvalTxHash,
          confirmations: 3,
        },
      );

      sendTxSuccessToast(approvalConfirmationTxHash.transactionHash);
    } else {
      const abi = constants.PositionManagerABI;

      const amountInWei = BigInt(
        Math.floor(
          data.collateralAmount * 10 ** (props.collateral?.decimals as number),
        ),
      );

      const createPositionTxHash = await writeContractAsync({
        abi,
        address: constants.PositionManagerAddress,
        functionName: "depositCollateral",
        args: [props.position.positionId, amountInWei],
      });

      sendTxSentToast(createPositionTxHash);

      const confirmationTx = await waitForTransactionReceipt(wagmiConfig, {
        hash: createPositionTxHash,
        confirmations: 3,
      });

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
            window.open(
              `https://basescan.org/tx/${confirmationTx.transactionHash}`,
              "_blank",
            );
          },
        },
      });

      props.onOpenChange?.(false);
    }

    props?.onSuccess?.();
    setIsSubmitting(false);
  });

  const collateralAmountWatched = form.watch("collateralAmount") as number;
  const cleanCollateralAmount = useMemo(() => {
    if (collateralAmountWatched == null) return null;

    const decimals = props.collateral?.decimals || 0;
    const value = BigInt(
      Math.floor(Number(collateralAmountWatched) * 10 ** decimals),
    );

    return value;
  }, [collateralAmountWatched]);

  const handleUpdateRatio = useDebouncedCallback(
    async (collateralAmount, position, collateral) => {
      try {
        const inputAmount = BigInt(
          Math.floor(
            Number(collateralAmount) * 10 ** (collateral.decimals as number),
          ),
        );

        // Calculate USD value of added collateral
        const collateralValueResult = await readContract(wagmiConfig, {
          abi: constants.OracleInterfaceABI,
          address: constants.OracleInterfaceAddress,
          functionName: "getUsdValue",
          args: [collateral.tokenAddress, inputAmount, collateral.decimals],
        });

        setCollateralValue(collateralValueResult as bigint);

        // Calculate new collateral ratio
        if (position.debtUsdValue && position.collateralUsdValue) {
          const totalCollateralValue =
            (position.collateralUsdValue as bigint) +
            (collateralValueResult as bigint);
          const newRatio =
            Number(
              (totalCollateralValue * BigInt(10000)) /
                (position.debtUsdValue as bigint),
            ) / 100;
          setNewRatio(newRatio);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error calculating values:", error);
      }
    },
    [],
    800,
  );

  useEffect(() => {
    if (!props.open) {
      form.reset();
      setCollateralValue(null);
      setNewRatio(null);
    }

    if (props.position && props.collateral && collateralAmountWatched) {
      setLoading(true);
      handleUpdateRatio(
        collateralAmountWatched,
        props.position,
        props.collateral,
      );
    } else {
      setNewRatio(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, collateralAmountWatched, handleUpdateRatio]);

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
              <span className="font-medium">Position ID:</span>{" "}
              {props.position?.positionId.toString()}
            </div>
            <div>
              <span className="font-medium">Collateral:</span>{" "}
              {props.position?.collateralSymbol}
            </div>
            <div>
              <span className="font-medium">Current Ratio:</span>{" "}
              {props.position?.currentRatio
                ? parseBigInt(props.position.currentRatio as bigint, 2, 2)
                : "0"}
              %
            </div>
          </div>
          <FormField
            control={form.control}
            name="collateralAmount"
            rules={{
              required: "Amount is required",
              validate: {
                isNumber: (value) => {
                  return typeof value === "number" || "Amount must be a number";
                },
                isPositive: (value) => {
                  return value > 0 || "Amount must be greater than 0";
                },
                withinBalance: (value) => {
                  const inputAmount = BigInt(
                    Math.floor(
                      Number(value) *
                        10 ** (props.collateral?.decimals as number),
                    ),
                  );
                  console.log(
                    props.collateral,
                    props.collateral?.balance,
                    inputAmount,
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
                    Amount{" "}
                    {collateralValue
                      ? `(~$${parseBigInt(collateralValue, 18, 2)})`
                      : ""}
                  </span>

                  <span className="flex gap-[12px]">
                    New Ratio:{" "}
                    {loading && <Loader2 className="animate-spin size-3" />}{" "}
                    {newRatio && <>{newRatio.toFixed(2)}%</>}
                  </span>
                </FormLabel>
                <FormControl>
                  <DecimalInput {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div
            className={`text-center text-xs ${newRatio ? "" : "text-gray-500"}`}
          >
            <span className="flex justify-center">
              Position avaliation: {newRatio && ratioAvaliation}
            </span>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loading || !collateralAmountWatched}
            >
              {(props?.allowance as bigint) >= (cleanCollateralAmount as bigint)
                ? "Deposit"
                : "Approve"}
              {loading ||
                (isSubmitting && <Loader2 className="animate-spin size-3" />)}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
