import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DialogProps } from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const ClosePositionDialog = (props: DialogProps) => {
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
    <Dialog {...props}>
      <form onSubmit={handleSubmit}>
        <Form {...form}>
          <DialogContent>
            <DialogTitle>Close Position</DialogTitle>
            <DialogDescription>
              Are you sure you want to close your position?
            </DialogDescription>

            <div>
              <div className="mb-1">
                When you close your position, the following will happen:
              </div>
              <div className="text-green">
                <span className="font-medium ">Collateral:</span>{" "}
                <ArrowUp className="size-3 inline center" />
                1.45 ETH
              </div>
              <div className="text-red-500">
                <span className="font-medium ">Asset:</span>{" "}
                <ArrowDown className="size-3 inline center" />
                0.205 ETH
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="default">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" type="submit">
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Form>
      </form>
    </Dialog>
  );
};
