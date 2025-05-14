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
import { yupResolver } from "@hookform/resolvers/yup";
import { DialogProps } from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";

const formSchema = yup.object({
  amount: yup
    .number()
    .required("Amount is required")
    .typeError("Amount must be a number"),
});

export const DepositDialog = ({ ...props }: DialogProps) => {
  const form = useForm({
    resolver: yupResolver(formSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    console.log(data);

    // Handle deposit logic here

    toast("Transaction sent.", {
      action: {
        label: "View on Etherscan",
        onClick: () => {
          window.open(`https://etherscan.io/tx/${"0x1234567890"}`, "_blank");
        },
      },
    });
    await new Promise((r) => setTimeout(r, 1000));
    toast("Transaction confirmed.", {
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

    props.onOpenChange?.(false);
  });

  useEffect(() => {
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  return (
    <Dialog {...props}>
      <DialogContent>
        <Form {...form}>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription>
            Enter the amount of tokens you want to deposit.
          </DialogDescription>
          <div className="text-sm">
            <span className="font-medium">Collateral:</span> ETH
          </div>
          <FormField
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Amount ($0.00)</FormLabel>
                <FormControl>
                  <DecimalInput {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div className="text-sm">
            <span className="font-medium">New Liquidation Price:</span> $2.00
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
