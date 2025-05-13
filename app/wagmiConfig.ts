import { createConfig, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  // TODO change this to base once the new deployments are up
  chains: [arbitrum],
  connectors: [metaMask()],
  ssr: true,
  transports: {
    [arbitrum.id]: http(),
  },
});
