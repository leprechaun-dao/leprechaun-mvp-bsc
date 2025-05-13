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
import { useForm } from "react-hook-form";

export const WithdrawalDialog = (props: DialogProps) => {
  const form = useForm();

  return (
    <Form {...form}>
      <Dialog {...props}>
        <DialogContent>
          <DialogTitle>Withdrawal</DialogTitle>
          <DialogDescription>
            Enter the amount of minted tokens that you want to withdrawal.
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
            <Button type="submit">Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};
