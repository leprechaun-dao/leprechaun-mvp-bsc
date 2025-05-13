import { http, createConfig } from 'wagmi'
import { arbitrum } from 'wagmi/chains'

export const config = createConfig({
  // TODO change this to base once the new deployments are up
  chains: [arbitrum],
  ssr: true,
  transports: {
    [arbitrum.id]: http(),
  },
})
