import { Input } from "@/components/ui/input";

const getFormatter = (digits: number) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const DecimalInput = ({
  placeholder = "0.00",
  digits = 2,
  onChange,
  ...props
}: {
  digits?: number;
  onChange?: (value: number | undefined) => void;
} & React.ComponentProps<"input">) => {
  return (
    <Input
      placeholder={placeholder}
      {...props}
      // We don't want to pass the value prop to the input, because it will cause
      // the input to be controlled and uncontrolled at the same time.
      value={undefined}
      onChange={(e) => {
        const inputValue = e.target.value.replace(/[^0-9]/g, "");
        const number = Number(inputValue) / 10 ** digits;
        if (number === 0) {
          e.target.value = "";
          onChange?.(0);
          return;
        }

        const formattedValue = getFormatter(digits).format(number);
        e.target.value = formattedValue;
        onChange?.(number);
      }}
    />
  );
};
