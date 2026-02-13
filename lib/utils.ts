import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return "0.00";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export function formatDate(date: string | Date | null | undefined, locale = "fr-CA"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
