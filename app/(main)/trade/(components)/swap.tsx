"use client";
import "@uniswap/widgets/fonts.css";
import dynamic from "next/dynamic";

const SwapWidget = dynamic(
  async () => {
    return import("@uniswap/widgets").then((mod) => mod.SwapWidget);
  },
  { ssr: false },
);

export const Swap = () => {
  return (
    <SwapWidget
      // TODO: Replace with our token list
      tokenList={"https://ipfs.io/ipns/tokens.uniswap.org"}
      theme={{
        fontFamily: "var(--font-inter)",
      }}
    />
  );
};
