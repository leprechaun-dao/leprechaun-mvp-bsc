"use client";
import tokenList from "@/utils/web3/tokenList.json";
import { Web3Provider } from "@ethersproject/providers";
import { darkTheme } from "@uniswap/widgets";
import "@uniswap/widgets/fonts.css";
import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { useWalletClient } from "wagmi";

const SwapWidget = dynamic(
  async () => {
    return import("@uniswap/widgets").then((mod) => mod.SwapWidget);
  },
  { ssr: false },
);

export const Swap = () => {
  const { data: walletClient } = useWalletClient();

  const provider = useMemo(() => {
    if (!walletClient) return;
    return new Web3Provider(walletClient.transport, walletClient.chain.id);
  }, [walletClient]);

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
        hideConnectionUI={true}
        provider={provider}
        className="Uniswap"
        tokenList={tokenList.tokens}
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
