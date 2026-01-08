import { useMemo } from "react";

export function roundDecimals(x: number, decimals: number = 2): number {
  if (Number.isNaN(x)) {
    throw new Error("Es necesario un número para redondear");
  }

  const off = Math.pow(10, decimals);

  return Math.round(x * off) / 100;
}

export function formatPrice(amount: number, decimals: number = 0) {
  const strAmount = String(amount.toFixed(decimals)).replace(
    /(\d)(?=(\d{3})+(?!\d))/g,
    "$1,"
  );

  return `$${strAmount}`;
}

export default function usePrice(amount: number, decimals: number = 0) {
  const value = useMemo(() => {
    if (typeof amount !== "number") {
      return "";
    }

    return formatPrice(amount, decimals);
  }, [amount, decimals]);

  return value;
}
