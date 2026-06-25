import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(decimal: number): string {
  return decimal.toFixed(2);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function oddsMovementLabel(before: number, after: number): string {
  const diff = after - before;
  if (Math.abs(diff) < 0.01) return "stable";
  return diff > 0 ? "drifting" : "shortening";
}

export function teamFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
