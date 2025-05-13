import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'

export const config = createConfig({
  chains: [base],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})
