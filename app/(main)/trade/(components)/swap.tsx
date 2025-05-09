"use client";
import "@uniswap/widgets/fonts.css";
import dynamic from "next/dynamic";

const SwapWidget = dynamic(
  () => {
    return import("@uniswap/widgets").then((mod) => mod.SwapWidget);
  },
  { ssr: false },
);

export const Swap = () => {
  return (
    <SwapWidget
      theme={{
        fontFamily: "var(--font-inter)",
      }}
    />
  );
};
