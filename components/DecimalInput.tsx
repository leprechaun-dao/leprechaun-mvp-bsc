import { Input } from "@/components/ui/input";

const defaultFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const DecimalInput = ({
  formatter = defaultFormatter,
  placeholder = "0.00",
  onChange,
  ...props
}: {
  formatter?: Intl.NumberFormat;
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
        const digits = e.target.value.replace(/[^0-9]/g, "");
        const number = Number(digits) / 100;
        if (number === 0) {
          e.target.value = "";
          onChange?.(0);
          return;
        }

        const formattedValue = formatter.format(number);
        e.target.value = formattedValue;
        onChange?.(number);
      }}
    />
  );
};
