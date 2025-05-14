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
} from "@/components/ui/form";
import { DialogProps } from "@radix-ui/react-dialog";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const DepositDialog = ({ ...props }: DialogProps) => {
  const form = useForm();

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
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <Dialog {...props}>
          <DialogContent>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <DecimalInput {...field} />
                  </FormControl>
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
              <Button type="submit">Deposit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
};
