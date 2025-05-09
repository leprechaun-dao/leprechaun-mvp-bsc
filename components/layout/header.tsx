import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

export const Header = () => {
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
        <Link href="#">Trade</Link>
        <Link href="#">Mint</Link>
        <Link href="#">Pool</Link>
      </div>

      <Button size="lg" className="ml-auto max-sm:hidden">
        Connect
      </Button>
      <Button size="sm" className="ml-auto sm:hidden">
        Connect
      </Button>
    </header>
  );
};
