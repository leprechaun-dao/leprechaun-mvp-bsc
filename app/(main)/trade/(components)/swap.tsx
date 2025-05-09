"use client";
import { darkTheme } from "@uniswap/widgets";
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
      className="Uniswap"
      // TODO: Replace with our token list
      tokenList={"https://ipfs.io/ipns/tokens.uniswap.org"}
      theme={{
        ...darkTheme,
        container: "#0E0E12",
        module: "#18181B",
        outline: "#27272A",
        networkDefaultShadow: "#B4871233",

        accent: "#27272A",
        interactive: "#27272A",

        secondary: "#989898",
        primary: "#EEEEEE",
        fontFamily: "var(--font-inter)",
      }}
    />
  );
};
