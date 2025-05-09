import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
