import { RussianRuble, SaudiRiyal, SwissFranc } from "lucide-react";
import { ReactNode } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

interface Token {
  id: string;
  value: string;
  symbol: string;
  icon: ReactNode;
}

// TODO: Delete this when the data fetching is implemented
export const tokensMock: Token[] = [
  {
    id: "1",
    value: "0x1234567890abcdef",
    symbol: "ETH",
    icon: <SwissFranc />,
  },
  {
    id: "2",
    value: "0xabcdef1234567890",
    symbol: "DOGE",
    icon: <SaudiRiyal />,
  },
  {
    id: "3",
    value: "0x7890abcdef123456",
    symbol: "BTC",
    icon: <RussianRuble />,
  },
];

export const TokenSelector = ({
  tokens,
  onSelect,
}: {
  tokens: Token[];
  onSelect?: (token: Token) => unknown;
}) => {
  return (
    <Command className="**:data-[slot=command-input-wrapper]:h-15">
      <CommandInput />
      <CommandEmpty>No tokens found.</CommandEmpty>
      <CommandList>
        {tokens.map((token) => (
          <CommandItem
            keywords={[token.value, token.symbol]}
            className="h-15 rounded-none"
            key={token.value}
            value={token.value}
            onSelect={() => {
              onSelect?.(token);
            }}
          >
            <span>{token.icon}</span>
            <span>{token.symbol}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
