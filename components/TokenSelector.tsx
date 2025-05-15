import { assetsImages } from "@/utils/constants";
import { parseBigInt } from "@/utils/web3";
import { SyntheticAssetInfo } from "@/utils/web3/interfaces";
import Image from "next/image";
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
            <Image
              src={assetsImages[token.symbol || ""]}
              alt={`${token.symbol} Icon`}
              className="rounded-full"
              width={16}
              height={16}
            />
            <span>{token.symbol} - </span>
            <span>{token.name}</span>
            {token.balance && (
              <span>
                {parseBigInt(token.balance, token.decimals as number, 4)}
              </span>
            )}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
