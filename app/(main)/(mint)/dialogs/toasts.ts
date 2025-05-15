import { toast } from "sonner";

export function sendTxSentToast(hash: string) {
  toast("Transaction sent.", {
    action: {
      label: "View on Basescan",
      onClick: () => {
        window.open(`https://basescan.org/tx/${hash}`, "_blank");
      },
    },
  });
}

export function sendTxSuccessToast(hash: string) {
  toast.success("Transaction confirmed.", {
    action: {
      label: "View on Basescan",
      onClick: () => {
        window.open(
          `https://basescan.org/tx/${hash}`,
          "_blank",
        );
      },
    },
  });
}