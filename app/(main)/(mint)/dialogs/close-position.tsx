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
import { useForm } from "react-hook-form";

export const ClosePositionDialog = (props: DialogProps) => {
  const form = useForm();

  return (
    <Dialog {...props}>
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
    </Dialog>
  );
};
