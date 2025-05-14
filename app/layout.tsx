import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils/css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leprechaun",
  description: "Invest anywhere, anytime, with Leprechaun",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          `${inter.variable} antialiased`,
          // For now this will always dark, for simplicity, we may change this later
          "dark",
        )}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
