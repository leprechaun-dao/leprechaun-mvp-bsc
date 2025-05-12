"use client";
import { darkTheme } from "@uniswap/widgets";
import "@uniswap/widgets/fonts.css";
import dynamic from "next/dynamic";
import { useRef } from "react";

const SwapWidget = dynamic(
  async () => {
    return import("@uniswap/widgets").then((mod) => mod.SwapWidget);
  },
  { ssr: false },
);

export const Swap = () => {
  const dialogRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        className="absolute inset-0 m-10 pointer-events-none [&>*]:pointer-events-auto"
        ref={dialogRef}
      ></div>
      <style>
        {`
          // This is hack to fix a weird issue with the Uniswap widget
          .TokenOptions__OnHover-sc-xx1k3q-2 {
            display: none;
          }
        `}
      </style>
      <SwapWidget
        className="Uniswap"
        // TODO: Replace with our token list
        tokenList={"https://ipfs.io/ipns/tokens.uniswap.org"}
        brandedFooter={false}
        dialog={dialogRef.current}
        theme={{
          ...darkTheme,
          container: "#0E0E12",
          module: "#18181B",
          outline: "#27272A",
          networkDefaultShadow: "#B4871233",

          onAccent: "#27272A",
          accent: "#FFFFB7",
          interactive: "#136b3b",
          onInteractive: "white",
          accentSoft: "#136b3b",

          secondary: "#989898",
          primary: "#EEEEEE",
          fontFamily: "var(--font-inter)",
        }}
      />
    </>
  );
};
