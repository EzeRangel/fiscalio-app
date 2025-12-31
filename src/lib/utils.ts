import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CFDI_TYPE, TAX_NAMES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCFDIType(code: keyof typeof CFDI_TYPE) {
  return CFDI_TYPE[code];
}

export function getTaxName(code: keyof typeof TAX_NAMES): string {
  return TAX_NAMES[code];
}

export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    const ms = seconds * 1000;

    setTimeout(() => {
      resolve();
    }, ms);
  });
}
