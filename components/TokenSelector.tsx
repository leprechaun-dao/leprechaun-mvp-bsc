import { SyntheticAssetInfo } from "@/utils/web3/interfaces";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export const TokenSelector = ({
  tokens,
  onSelect,
}: {
  tokens: SyntheticAssetInfo[];
  onSelect?: (token: SyntheticAssetInfo) => unknown;
}) => {
  return (
    <Command className="**:data-[slot=command-input-wrapper]:h-10">
      <CommandInput />
      <CommandEmpty>No tokens found.</CommandEmpty>
      <CommandList>
        {tokens.map((token) => (
          <CommandItem
            keywords={[token.name, token.tokenAddress]}
            className="h-10 rounded-none"
            key={token.tokenAddress}
            value={token.tokenAddress}
            onSelect={() => {
              onSelect?.(token);
            }}
          >
            <span>{token.icon}</span>
            <span>{token.name}</span>
            {token.balance && <span>{token.balance.toString()}</span>}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
