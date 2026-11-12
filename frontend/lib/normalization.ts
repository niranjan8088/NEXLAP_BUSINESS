/**
 * NEXLAPTECH — FILTER DATA NORMALIZATION UTILITIES
 * Normalizes varied specification strings (e.g., "8GB", "8 GB", "8 gb") into clean,
 * consistent values for dynamic filter option extraction and matching without
 * altering original display labels.
 */

import { ProductStructuredSpecs } from "./types/ecommerce";

/** Normalizes RAM capacity strings e.g. "32GB", "32 gb", "32 GB RAM", "Capacity: 32 GB" -> "32 GB" */
export function normalizeRamCapacity(val?: string | number | null): string {
  if (val === undefined || val === null || val === "") return "";
  const s = String(val).toUpperCase().trim();
  
  if (s.includes("128")) return "128 GB";
  if (s.includes("64")) return "64 GB";
  if (s.includes("32")) return "32 GB";
  if (s.includes("16")) return "16 GB";
  if (s.includes("8")) return "8 GB";
  if (s.includes("4")) return "4 GB";
  if (s.includes("2")) return "2 GB";
  
  return String(val).trim();
}

/** Normalizes Storage capacity strings e.g. "512GB", "512 gb", "1TB", "1 TB NVMe" -> "512 GB" or "1 TB" */
export function normalizeStorageCapacity(val?: string | number | null): string {
  if (val === undefined || val === null || val === "") return "";
  const s = String(val).toUpperCase().trim();
  
  if (s.includes("4TB") || s.includes("4 TB") || s.includes("4000GB")) return "4 TB";
  if (s.includes("2TB") || s.includes("2 TB") || s.includes("2000GB")) return "2 TB";
  if (s.includes("1TB") || s.includes("1 TB") || s.includes("1000GB")) return "1 TB";
  if (s.includes("512GB") || s.includes("512 GB") || s.includes("500GB") || s.includes("500 GB")) return "512 GB";
  if (s.includes("256GB") || s.includes("256 GB")) return "256 GB";
  if (s.includes("128GB") || s.includes("128 GB")) return "128 GB";
  
  return String(val).trim();
}

/** Normalizes RAM Type e.g. "DDR4", "DDR5", "LPDDR5", "32 GB DDR4 3200 MHz" -> "DDR4" */
export function normalizeRamType(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toUpperCase();
  if (s.includes("LPDDR5")) return "LPDDR5";
  if (s.includes("DDR5")) return "DDR5";
  if (s.includes("DDR4")) return "DDR4";
  if (s.includes("DDR3")) return "DDR3";
  return val.trim();
}

/** Normalizes RAM Speed e.g. "3200", "3200MHz", "3200 MHz" -> "3200 MHz" */
export function normalizeRamSpeed(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toUpperCase();
  if (s.includes("6000")) return "6000 MHz";
  if (s.includes("5600")) return "5600 MHz";
  if (s.includes("4800")) return "4800 MHz";
  if (s.includes("3200")) return "3200 MHz";
  if (s.includes("2666")) return "2666 MHz";
  if (s.includes("2400")) return "2400 MHz";
  return val.trim();
}

/** Normalizes Processor Brand e.g. "Intel Core i7-14700K" -> "Intel" */
export function normalizeProcessorBrand(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toLowerCase();
  
  if (s.includes("intel")) return "Intel";
  if (s.includes("amd") || s.includes("ryzen")) return "AMD";
  if (s.includes("apple") || s.includes("m1") || s.includes("m2") || s.includes("m3")) return "Apple";
  
  return val.trim();
}

/** Normalizes Processor Family e.g. "Intel Core™ i5-1335U" -> "Intel Core i5" */
export function normalizeProcessorFamily(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toLowerCase();
  
  if (s.includes("i9")) return "Intel Core i9";
  if (s.includes("i7")) return "Intel Core i7";
  if (s.includes("i5")) return "Intel Core i5";
  if (s.includes("i3")) return "Intel Core i3";
  if (s.includes("ryzen 9")) return "AMD Ryzen 9";
  if (s.includes("ryzen 7")) return "AMD Ryzen 7";
  if (s.includes("ryzen 5")) return "AMD Ryzen 5";
  if (s.includes("ryzen 3")) return "AMD Ryzen 3";
  if (s.includes("m3 pro") || s.includes("m3 max")) return "Apple M3";
  if (s.includes("m2 pro") || s.includes("m2 max") || s.includes("m2")) return "Apple M2";
  if (s.includes("m1 pro") || s.includes("m1 max") || s.includes("m1")) return "Apple M1";
  
  return val.trim();
}

/** Normalizes Processor Generation e.g. "13th Gen", "13th Generation", "i5-1335U" -> "13th Gen" */
export function normalizeProcessorGeneration(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toLowerCase();
  
  if (s.includes("14th") || s.includes("-14")) return "14th Gen";
  if (s.includes("13th") || s.includes("-13")) return "13th Gen";
  if (s.includes("12th") || s.includes("-12")) return "12th Gen";
  if (s.includes("11th") || s.includes("-11")) return "11th Gen";
  if (s.includes("10th") || s.includes("-10")) return "10th Gen";
  if (s.includes("8th") || s.includes("-8")) return "8th Gen";
  
  if (s.includes("m1") || s.includes("m2") || s.includes("m3")) return "Apple Silicon";
  
  return val.trim();
}

/** Normalizes Screen Size e.g. "14.0-inch", "14\"", "14.0 inch" -> "14 inch" */
export function normalizeScreenSize(val?: string | null): string {
  if (!val) return "";
  const s = String(val).toLowerCase().replace(/["\s]/g, "");
  
  if (s.includes("13.3") || s.includes("13.3inch")) return "13.3 inch";
  if (s.includes("14") || s.includes("14inch") || s.includes("14.0")) return "14 inch";
  if (s.includes("15.6") || s.includes("15.6inch") || s.includes("15.6-inch")) return "15.6 inch";
  if (s.includes("16") || s.includes("16inch") || s.includes("16.2")) return "16 inch";
  if (s.includes("17.3") || s.includes("17inch")) return "17.3 inch";

  return val.trim();
}

/** Normalizes Boolean Flags (e.g. Touchscreen, GST Invoice, New Arrival) */
export function normalizeBoolean(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "yes" || s === "1" || s === "available" || s === "enabled";
}

/**
 * Extracts and normalizes structured specifications from a raw product instance.
 * Category-aware extraction ensures strict separation between RAM Capacity and Storage Capacity.
 */
export function extractStructuredSpecs(product: any): ProductStructuredSpecs {
  if (!product) return {};

  const rawSpecs: Record<string, any> = product.specs || {};

  // Extract raw values from product specs dictionary with fallback case-insensitive matching
  const getSpecVal = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      if (rawSpecs[k] !== undefined && rawSpecs[k] !== null && rawSpecs[k] !== "") {
        return String(rawSpecs[k]);
      }
      // Case-insensitive lookup
      const foundKey = Object.keys(rawSpecs).find((rk) => rk.toLowerCase() === k.toLowerCase());
      if (foundKey && rawSpecs[foundKey] !== undefined && rawSpecs[foundKey] !== null && rawSpecs[foundKey] !== "") {
        return String(rawSpecs[foundKey]);
      }
    }
    return undefined;
  };

  const category = (product.category || "").toLowerCase();
  const isRamCategory = category === "ram";
  const isStorageCategory = category === "storage";
  const isLaptopCategory = ["business_laptops", "premium_used_laptops", "second_hand_laptops"].includes(category);

  const rawProcessor = getSpecVal("Processor", "processor", "cpu", "CPU");
  
  let rawRam: string | undefined;
  let rawStorage: string | undefined;

  if (isRamCategory) {
    // RAM product: Capacity refers strictly to RAM capacity
    rawRam = getSpecVal("Capacity", "RAM Capacity", "ramCapacity", "RAM", "ram", "Memory", "memory", "Capacity - RAM");
    rawStorage = undefined; // Strictly prevent RAM capacity from polluting storage capacity!
  } else if (isStorageCategory) {
    // Storage product: Capacity refers strictly to Storage capacity
    rawStorage = getSpecVal("Capacity", "SSD Capacity", "ssdCapacity", "storageCapacity", "Storage Capacity", "Storage", "storage", "SSD", "ssd");
    rawRam = undefined; // Strictly prevent SSD capacity from polluting RAM capacity!
  } else if (isLaptopCategory) {
    // Laptop product: RAM and Storage capacity are distinct
    rawRam = getSpecVal("RAM Capacity", "ramCapacity", "RAM", "ram", "Memory", "memory");
    rawStorage = getSpecVal("SSD Capacity", "ssdCapacity", "storageCapacity", "Storage Capacity", "Storage", "storage", "SSD", "ssd", "HDD Capacity");
  } else {
    rawRam = getSpecVal("RAM Capacity", "ramCapacity", "RAM", "ram", "Memory");
    rawStorage = getSpecVal("SSD Capacity", "ssdCapacity", "storageCapacity", "Storage Capacity", "Storage", "storage");
  }

  const rawScreen = getSpecVal("Display", "display", "Screen Size", "screenSize", "Screen");
  const rawGpu = getSpecVal("GPU", "gpu", "Graphics", "graphics");
  const rawOs = getSpecVal("OS", "os", "Operating System", "operatingSystem");

  const processorBrand = normalizeProcessorBrand(product.processorBrand || getSpecVal("Processor Brand") || rawProcessor);
  const processorFamily = normalizeProcessorFamily(product.processor || getSpecVal("Processor") || rawProcessor);
  const processorGen = normalizeProcessorGeneration(product.processorGen || getSpecVal("Processor Generation") || rawProcessor);

  const ramCapacity = normalizeRamCapacity(product.ramCapacity || getSpecVal("RAM Capacity") || rawRam);
  const rawRamTypeCandidate = product.ramType || getSpecVal("RAM Type", "RamType", "DDR Generation") || rawRam;
  const ramType = normalizeRamType(rawRamTypeCandidate);
  const speed = normalizeRamSpeed(product.speed || getSpecVal("Speed", "RAM Speed") || rawRam);

  const ssdCapacity = normalizeStorageCapacity(product.ssdCapacity || getSpecVal("SSD Capacity", "SSD") || rawStorage);
  const storageType = product.storageType || getSpecVal("Storage Type") || (rawStorage?.includes("NVMe") ? "NVMe SSD" : rawStorage?.includes("SATA") ? "SATA SSD" : "SSD");

  const screenSize = normalizeScreenSize(product.screenSize || getSpecVal("Screen Size") || rawScreen);
  const graphics = product.graphics || getSpecVal("Graphics") || rawGpu;
  const dedicatedGraphicsMemory = product.dedicatedGraphicsMemory || getSpecVal("Dedicated Graphics Memory", "VRAM");
  const operatingSystem = product.operatingSystem || getSpecVal("Operating System", "OS") || rawOs;

  const touchScreen = normalizeBoolean(product.touchScreen || getSpecVal("Touch Screen", "Touchscreen"));
  const gstInvoiceAvailable = normalizeBoolean(product.gstInvoiceAvailable || product.gst_invoice || getSpecVal("GST Invoice Available", "GST"));

  return {
    processor: processorFamily,
    processorBrand,
    processorGen,
    ramCapacity,
    ramType,
    speed,
    ssdCapacity,
    storageType,
    graphics,
    dedicatedGraphicsMemory,
    screenSize,
    operatingSystem,
    touchScreen,
    gstInvoiceAvailable,
    countryOfOrigin: product.countryOfOrigin || getSpecVal("Country Of Origin") || "India",
    warranty: product.warrantyText || product.warrantyDuration || product.warranty || getSpecVal("Warranty"),
    newArrival: normalizeBoolean(product.latest || product.newArrival),
    featured: normalizeBoolean(product.featured),
    rating: Number(product.rating || 4.5),
    reviewsCount: Number(product.reviewCount || product.reviewsCount || 12),
    ...rawSpecs,
  };
}

/**
 * Strict category-aware specification sanitizer.
 * Removes duplicate, irrelevant, or fabricated template specifications (e.g., laptop CPU/RAM/Display or CCTV PoE on peripherals/storage).
 */
export function sanitizeProductSpecs(specs: Record<string, any> | undefined | null, category: string = ""): Record<string, any> {
  if (!specs || typeof specs !== "object") return {};
  
  const cleanCategory = String(category || "").toLowerCase().trim();
  const isLaptop = ["business_laptops", "premium_used_laptops", "second_hand_laptops"].includes(cleanCategory) || cleanCategory === "laptop";
  const isDesktopOrPC = ["gaming_pcs", "desktop_systems", "servers"].includes(cleanCategory);
  const isStorage = ["storage", "ssd"].includes(cleanCategory);
  const isRam = cleanCategory === "ram";
  const isCctv = ["cctv", "cctv_security"].includes(cleanCategory);
  const isMonitor = cleanCategory === "monitors";

  // Template keys commonly injected across products indiscriminately
  const templateKeys = new Set([
    "processor brand", "processor", "processor generation",
    "ram capacity", "ram type",
    "ssd capacity", "storage type",
    "graphics", "dedicated graphics memory",
    "screen size", "display type",
    "operating system", "weight", "touch screen",
    "capacity", "interface", "form factor", "read speed", "write speed", "speed",
    "camera type", "resolution", "night vision", "connectivity",
    "gst invoice available", "country of origin"
  ]);

  const clean: Record<string, any> = {};

  for (const [rawKey, rawVal] of Object.entries(specs)) {
    if (rawVal === undefined || rawVal === null || rawVal === "" || String(rawVal).trim() === "") continue;

    const lowerKey = rawKey.toLowerCase().replace(/[\s_\-]/g, "");
    const lowerKeySpaced = rawKey.toLowerCase().trim();

    // Reject non-technical store administrative defaults that pollute technical spec tables
    if (lowerKey === "gstinvoiceavailable" || lowerKey === "countryoforigin") continue;

    // 1. CCTV specs (CameraType, Resolution, NightVision, Connectivity PoE)
    const isCctvSpec = ["cameratype", "nightvision", "connectivity", "cameras", "nvr"].includes(lowerKey);
    if (isCctvSpec && !isCctv) continue;

    // 2. Storage read/write/interface specs
    const isStorageSpec = ["readspeed", "writespeed", "interface", "formfactor", "controller"].includes(lowerKey);
    if (isStorageSpec && !isStorage) continue;

    // 3. RAM speeds & DDR generation
    const isRamSpec = ["ddrgeneration", "ramtype", "ramspeed", "speed", "memoryspeed"].includes(lowerKey);
    if (isRamSpec && !isRam && !isLaptop && !isDesktopOrPC) continue;

    // 4. Screen & Display specs (14 inch, FHD IPS, Touchscreen)
    const isDisplaySpec = ["screensize", "displaytype", "touchscreen"].includes(lowerKey);
    if (isDisplaySpec && !isLaptop && !isMonitor) continue;

    // 5. Processor, CPU, GPU, OS specs
    const isComputeSpec = ["processor", "processorbrand", "processorgeneration", "graphics", "dedicatedgraphicsmemory", "operatingsystem"].includes(lowerKey);
    if (isComputeSpec && !isLaptop && !isDesktopOrPC) continue;

    // 6. Generic "Capacity" on peripherals or general accessories
    if (lowerKey === "capacity" && !isStorage && !isRam) continue;

    // 7. RAM Capacity & SSD Capacity on peripherals, accessories, CCTV
    if ((lowerKey === "ramcapacity" || lowerKey === "ssdcapacity" || lowerKey === "storagetype") && !isLaptop && !isDesktopOrPC && !isStorage && !isRam) {
      continue;
    }

    // 8. Default 1.4 kg weight template
    if (lowerKey === "weight" && (!isLaptop || String(rawVal).trim() === "1.4 kg")) continue;

    // 9. For peripherals, accessories, components, reject all remaining template keys
    const isPeripheralOrGeneral = ["peripherals", "accessories", "laptop_components", "desktop_components", "networking"].includes(cleanCategory) || (!isLaptop && !isDesktopOrPC && !isStorage && !isRam && !isCctv && !isMonitor);
    if (isPeripheralOrGeneral && (templateKeys.has(lowerKeySpaced) || templateKeys.has(lowerKey))) {
      continue;
    }

    clean[rawKey] = rawVal;
  }

  return clean;
}

