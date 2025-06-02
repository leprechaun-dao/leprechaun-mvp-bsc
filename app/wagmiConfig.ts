import { createConfig, http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

export const wagmiConfig = createConfig(
	getDefaultConfig({
		chains: [bscTestnet],
		appName: "Leprechaun",
		walletConnectProjectId: process.env.CLOUD_REOWN_KEY as string,
		ssr: true,
		transports: {
			[bscTestnet.id]: http(),
		},
	}),
);
