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
  label: string;
  symbol: ReactNode;
}

// TODO: Delete this when the data fetching is implemented
export const tokensMock: Token[] = [
  {
    id: "1",
    value: "0x1234567890abcdef",
    label: "Token A",
    symbol: <SwissFranc />,
  },
  {
    id: "2",
    value: "0xabcdef1234567890",
    label: "Token B",
    symbol: <SaudiRiyal />,
  },
  {
    id: "3",
    value: "0x7890abcdef123456",
    label: "Token C",
    symbol: <RussianRuble />,
  },
];

export const TokenSelector = ({
  tokens,
  onSelect,
}: {
  tokens: Token[];
  onSelect?: (value: string) => void;
}) => {
  return (
    <Command className="**:data-[slot=command-input-wrapper]:h-15">
      <CommandInput />
      <CommandEmpty>No tokens found.</CommandEmpty>
      <CommandList>
        {tokens.map((token) => (
          <CommandItem
            keywords={[token.value, token.label]}
            className="h-15 rounded-none"
            key={token.value}
            value={token.value}
            onSelect={onSelect}
          >
            <span>{token.symbol}</span>
            <span>{token.label}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
