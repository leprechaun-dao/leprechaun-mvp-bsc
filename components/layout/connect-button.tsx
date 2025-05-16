import { ConnectKitButton } from "connectkit";
import { Button, ButtonProps } from "../ui/button";

export const CustomConnectButton = (props: ButtonProps) => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show }) => {
        return (
          <Button {...props} onClick={show}>
            {isConnected ? "Disconnect" : "Connect Wallet"}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
