"use client"
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { Button } from "@/components/ui/button";

export const ConnectButton = () => {
  const { connect } = useConnect()
  const { disconnect } = useDisconnect();
  const account = useAccount();

  const handleClick = () => {
    if (account.status === "connected") {
      disconnect();
    } else {
      connect({ connector: metaMask() });
    }
  };

  return (
    <>
      {
        [0, 1].map((val) => {
          return (
            <Button size="lg" key={`connect-button-${val}`} className={`${val === 0 ? "ml-auto max-sm:hidden" : "ml-auto sm:hidden"}`} onClick={() => handleClick()}>
              {account.status === "connected" ? "Disconnect" : "Connect"}
            </Button>
          )
        })
      }
    </>
  )
}
