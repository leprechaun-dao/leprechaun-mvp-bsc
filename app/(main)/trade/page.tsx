"use client";

import { Header } from "@/components/layout/header";

export default function Trade() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header activeRoute="trade" />
      <main className="flex flex-1 mb-[20vh] px-6">
        <div className="flex w-full items-center justify-center"></div>
      </main>
    </div>
  );
}
