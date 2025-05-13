import { RussianRuble, SaudiRiyal, SwissFranc } from "lucide-react";
import { ReactNode } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export interface Token {
  address: string;
  name: string;
  symbol: string;
  minCollateralRatio: bigint;
  auctionDiscount: bigint;
  isActive: boolean;
  value?: bigint;
  label?: string;
  icon?: ReactNode;
}

// TODO: Delete this when the data fetching is implemented
export const tokensMock: Token[] = [
  {
    address: "0x1234567890abcdef",
    name: "Token A",
    symbol: "Symbol A",
    minCollateralRatio: BigInt(15000),
    auctionDiscount: BigInt(1000),
    isActive: true,
    icon: <SwissFranc />,
  },
  {
    address: "0xabcdef1234567890",
    name: "Token B",
    symbol: "Symbol B",
    minCollateralRatio: BigInt(15000),
    auctionDiscount: BigInt(1000),
    isActive: true,
    icon: <SaudiRiyal />,
  },
  {
    address: "0x7890abcdef123456",
    name: "Token C",
    symbol: "Symbol C",
    minCollateralRatio: BigInt(15000),
    auctionDiscount: BigInt(1000),
    isActive: true,
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
            keywords={[token.name, token.address]}
            className="h-15 rounded-none"
            key={token.address}
            value={token.address}
            onSelect={() => {
              onSelect?.(token);
            }}
          >
            <span>{token.icon}</span>
            <span>{token.name}</span>

          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
