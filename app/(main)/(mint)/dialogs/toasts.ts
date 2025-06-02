import { toast } from "sonner";

export function sendTxSentToast(hash: string) {
	toast("Transaction sent.", {
		action: {
			label: "View on Scan",
			onClick: () => {
				window.open(`https://testnet.bscscan.com/tx/${hash}`, "_blank");
			},
		},
	});
}

export function sendTxSuccessToast(hash: string) {
	toast.success("Transaction confirmed.", {
		action: {
			label: "View on Scan",
			onClick: () => {
				window.open(`https://testnet.bscscan.com/tx/${hash}`, "_blank");
			},
		},
	});
}
