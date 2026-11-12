import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getSafeImageSrc(src: any, fallback = "/images/poster-products.webp"): string {
  if (!src || typeof src !== "string") return fallback;
  const trimmed = src.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return fallback;
  if (!trimmed.startsWith("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
    return `/${trimmed}`;
  }
  return trimmed;
}
