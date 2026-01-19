import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

export function roundDecimals(x: number, decimals: number = 2): number {
  if (Number.isNaN(x)) {
    throw new Error("Es necesario un número para redondear");
  }

  const off = Math.pow(10, decimals);

  return Math.round(x * off) / 100;
}

export const formatPrice = (amount: number | string, decimals?: number) =>
  formatCurrency(amount);

export default function usePrice(amount: number, decimals: number = 2) {
  const value = useMemo(() => {
    if (typeof amount !== "number") {
      return "";
    }

    return formatCurrency(amount);
  }, [amount]);

  return value;
}