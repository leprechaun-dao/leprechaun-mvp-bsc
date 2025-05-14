import { cn } from "@/utils/css";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "../web3/connect-button";

const routes = {
  mint: {
    href: "/",
    label: "Mint",
  },
  trade: {
    href: "/trade",
    label: "Trade",
  },
};

export const Header = ({
  activeRoute,
}: {
  activeRoute?: keyof typeof routes;
}) => {
  return (
    <header className="p-8 flex items-center">
      <Link href="/" className="flex gap-2">
        <Image
          src="/logo-coin.svg"
          width={24}
          height={24}
          alt="Leprechaun Logo"
        />
        <span className="leading-none uppercase font-black text-transparent trailing-[-5%] bg-clip-text gold-gradient text-2xl max-sm:hidden">
          Leprechaun
        </span>
      </Link>
      <div className="ml-12 max-sm:ml-4 font-semibold flex gap-6 max-sm:gap-3 max-sm:text-sm">
        {Object.entries(routes).map(([key, route]) => (
          <Link
            key={key}
            href={route.href}
            className={cn("link", {
              "text-green": activeRoute === key,
            })}
          >
            {route.label}
          </Link>
        ))}
      </div>

      <ConnectButton />
    </header>
  );
};
