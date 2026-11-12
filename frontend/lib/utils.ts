import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getSafeImageSrc(src: any, fallback = "/images/poster-products.webp"): string {
  let url = src;
  if (src && typeof src === "object") {
    url = src.url || src.src || src.storage_path || "";
  }
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "[object Object]") return fallback;

  // Seamlessly deliver WebP versions for public assets
  if (trimmed === "/images/poster-products.webp") return "/images/poster-products.webp";
  if (trimmed === "/images/poster-services.webp") return "/images/poster-services.webp";
  if (trimmed === "/assets/nexlaptech-logo.webp") return "/assets/nexlaptech-logo.webp";
  if (trimmed === "/assets/nexlaptech-horizontal.png") return "/assets/nexlaptech-horizontal.webp";
  if (trimmed.startsWith("/images/product-") && trimmed.endsWith(".png")) {
    return trimmed.replace(/\.png$/, ".webp");
  }

  if (!trimmed.startsWith("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
    return `/${trimmed}`;
  }
  return trimmed;
}

/**
 * Customer Initials Utility
 * Derives dynamic 1-2 letter initials from customer name:
 * - "NIRANJAN" -> "N"
 * - "NIRANJAN M" -> "NM"
 * - "Niranjan M Kumar" -> "NM"
 * - "" / empty -> "" (triggers default user profile icon)
 */
export function getCustomerInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "";
  const cleaned = name.trim();
  if (!cleaned) return "";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  const firstInitial = parts[0][0].toUpperCase();

  // If 2 parts: take first letter of part 1 and part 2 (e.g. "NIRANJAN M" -> "NM", "Ramesh Kumar" -> "RK")
  if (parts.length === 2) {
    return (firstInitial + parts[1][0]).toUpperCase();
  }

  // If 3 or more parts:
  // e.g. "Niranjan M Kumar" -> if the second part is a single letter initial (like 'M' or 'M.'), use that initial -> "NM".
  // Otherwise, use first name and last name initials.
  const secondClean = parts[1].replace(/[^a-zA-Z0-9]/g, "");
  if (secondClean.length === 1) {
    return (firstInitial + secondClean[0]).toUpperCase();
  }

  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return (firstInitial + lastInitial).toUpperCase();
}
