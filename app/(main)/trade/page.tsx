"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Trade() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header activeRoute="trade" />
      <main className="flex flex-1 mb-[20vh] px-6">
        <div className="flex w-full items-center justify-center">
          <Card className="w-2xl">
            <CardHeader>
              <CardTitle>Pools</CardTitle>
              <CardDescription>
                Provide liquidity, buy, or sell.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white hover:from-yellow-600 hover:to-yellow-800"
                >
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://app.uniswap.org/explore/pools/base/0x4a880171e7bfbee7a8f390ac3fe36245baecc1b7064e399ad042c5e85a010651"
                  >
                    sXAU Pool
                  </a>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800"
                >
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://app.uniswap.org/explore/pools/base/0x35fe68d317f15c3db528192cf0e71eff2265babaaaee23d7192b98703729bd89"
                  >
                    sDOW Pool
                  </a>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800"
                >
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://app.uniswap.org/explore/pools/base/0xfb6d04fbc133f88ee966239857c3b9f1c005a5aba87497dad853d175bc819451"
                  >
                    sOIL Pool
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
