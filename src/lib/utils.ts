import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CFDI_TYPE } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCFDIType(code: string) {
  return CFDI_TYPE[code];
}
