export function roundToDecimal(value: number, decimals: number = 1): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export function roundToDecimalString(value: number, decimals: number = 1): string {
  return roundToDecimal(value, decimals).toFixed(decimals);
}
