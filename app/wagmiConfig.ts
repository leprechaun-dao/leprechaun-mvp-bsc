import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [base],
    appName: "Leprechaun",
    walletConnectProjectId: process.env.CLOUD_REOWN_KEY as string,
    ssr: true,
    transports: {
      [base.id]: http(),
    },
  })
);
