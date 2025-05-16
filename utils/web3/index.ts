export function parseBigInt(
  amount: bigint,
  targetDecimals: number,
  maximumDigits: number,
) {
  return (Number(amount) / 10 ** targetDecimals).toLocaleString(undefined, {
    maximumFractionDigits: maximumDigits,
  });
}
