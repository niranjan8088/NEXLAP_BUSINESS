"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Zap,
  CheckCircle,
  X,
  SlidersHorizontal,
  RotateCcw,
  Upload,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import Image from "next/image";
import { getSafeImageSrc } from "@/lib/utils";
import ProductCatalogImport from "@/components/ProductCatalogImport";

const CATEGORIES = [
  { val: "storage", label: "1. Storage (SSD / HDD / Enclosures)" },
  { val: "ram", label: "2. RAM / Memory (DDR3 / DDR4 / DDR5)" },
  { val: "laptop_components", label: "3. Laptop Components & Parts" },
  { val: "desktop_components", label: "4. Desktop Components & PC Parts" },
  { val: "peripherals", label: "5. Keyboard / Mouse / Peripherals" },
  { val: "usb_typec", label: "6. USB & Type-C Accessories" },
  { val: "display_video", label: "7. Display & Video Adapters/Cables" },
  { val: "networking", label: "8. Networking & WiFi Devices" },
  { val: "repair_tools", label: "9. Laptop / PC Repair Tools" },
  { val: "thermal_cooling", label: "10. Thermal Paste & Cooling Solutions" },
  { val: "laptop_cleaning", label: "11. Laptop Cleaning & Maintenance" },
  { val: "power", label: "12. Power Adapters & SMPS Supplies" },
  { val: "memory_cards", label: "13. Memory Cards & Readers" },
  { val: "audio", label: "14. Audio Accessories & Microphones" },
  { val: "cctv_security", label: "15. CCTV & Security Accessories" },
  { val: "small_components", label: "16. Small Repair Components & ICs" },
  { val: "gaming_pcs", label: "Gaming PCs & Workstations" },
  { val: "business_laptops", label: "Business Laptops" },
  { val: "premium_used_laptops", label: "Premium Used Laptops" },
  { val: "second_hand_laptops", label: "Refurbished Laptops" },
  { val: "servers", label: "Servers" },
  { val: "desktop_systems", label: "Desktop Workstations" },
  { val: "monitors", label: "Monitors" },
  { val: "cctv", label: "Complete CCTV Systems" },
];

export type ProductImageItem = {
  id: string;
  url: string;
  file?: File;
  is_primary: boolean;
  sort_order: number;
  alt_text?: string;
  isUploading?: boolean;
  uploadError?: string;
};

type ProductVariantDraft = {
  id: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  image: string;
  attributesJson: string;
  active: boolean;
};

const MAX_PRODUCT_IMAGE_BYTES = 99_000;

async function compressProductImage(source: File): Promise<File> {
  const bitmap = await createImageBitmap(source);
  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const maxDimension = 1800;
    const initialScale = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    let quality = 0.82;
    const canvas = document.createElement("canvas");

    for (let attempt = 0; attempt < 18; attempt++) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image compression is unavailable in this browser.");
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (!blob || blob.type !== "image/webp") {
        throw new Error("This browser could not convert the image to WebP.");
      }
      if (blob.size <= MAX_PRODUCT_IMAGE_BYTES) {
        const baseName = source.name.replace(/\.[^.]+$/, "") || "product-image";
        return new File([blob], `${baseName}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }

      if (quality > 0.42) {
        quality = Math.max(0.38, quality - 0.11);
      } else if (Math.max(width, height) > 360) {
        width = Math.max(1, Math.round(width * 0.82));
        height = Math.max(1, Math.round(height * 0.82));
        quality = 0.82;
      } else {
        break;
      }
    }

    throw new Error(`Could not compress "${source.name}" below 99 KB. Choose a smaller image.`);
  } finally {
    bitmap.close();
  }
}

export default function AdminProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden" | "out_of_stock" | "pending_approval" | "trash">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [sku, setSku] = useState("");
  const [skuError, setSkuError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("Kingston");
  const [category, setCategory] = useState("storage");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [productVariants, setProductVariants] = useState<ProductVariantDraft[]>([]);

  // Warranty Config
  const [warrantyEnabled, setWarrantyEnabled] = useState(true);
  const [warrantyDuration, setWarrantyDuration] = useState("3 Years");
  const [warrantyText, setWarrantyText] = useState("3 Years Brand Warranty");

  // Return Policy Config
  const [returnEnabled, setReturnEnabled] = useState(true);
  const [returnWindowDays, setReturnWindowDays] = useState("7");
  const [returnPolicyText, setReturnPolicyText] = useState("7-Day Replacement Guarantee");

  // Delivery Estimate Config
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState("3–5 business days");
  const [deliveryMinDays, setDeliveryMinDays] = useState("3");
  const [deliveryMaxDays, setDeliveryMaxDays] = useState("5");

  // Compatibility Config
  const [compBrand, setCompBrand] = useState("");
  const [compSeries, setCompSeries] = useState("");
  const [compModel, setCompModel] = useState("");
  const [compPartNumber, setCompPartNumber] = useState("");

  const [condition, setCondition] = useState("new");
  const [featured, setFeatured] = useState(false);
  const [latest, setLatest] = useState(false);

  // Dynamic Category Specs State
  const [specProcBrand, setSpecProcBrand] = useState("Intel");
  const [specProcessor, setSpecProcessor] = useState("Intel Core i5");
  const [specProcGen, setSpecProcGen] = useState("13th Gen");
  const [specRamCap, setSpecRamCap] = useState("16 GB");
  const [specRamType, setSpecRamType] = useState("DDR5");
  const [specSsdCap, setSpecSsdCap] = useState("512 GB");
  const [specStorageType, setSpecStorageType] = useState("NVMe SSD");
  const [specGraphics, setSpecGraphics] = useState("Intel Iris Xe");
  const [specVram, setSpecVram] = useState("Shared");
  const [specScreenSize, setSpecScreenSize] = useState("14 inch");
  const [specDisplayType, setSpecDisplayType] = useState("FHD IPS");
  const [specOs, setSpecOs] = useState("Windows 11 Pro");
  const [specWeight, setSpecWeight] = useState("1.4 kg");
  const [specTouchScreen, setSpecTouchScreen] = useState(false);
  const [specGstInvoice, setSpecGstInvoice] = useState(true);
  const [specCountry, setSpecCountry] = useState("India");

  const [specSsdInterface, setSpecSsdInterface] = useState("PCIe Gen 4.0 x4");
  const [specSsdFormFactor, setSpecSsdFormFactor] = useState("M.2 2280");
  const [specSsdReadSpeed, setSpecSsdReadSpeed] = useState("7000 MB/s");
  const [specSsdWriteSpeed, setSpecSsdWriteSpeed] = useState("5100 MB/s");

  const [specRamSpeed, setSpecRamSpeed] = useState("3200MHz");
  const [specRamFormFactor, setSpecRamFormFactor] = useState("SO-DIMM");

  const [specCctvCameraType, setSpecCctvCameraType] = useState("Dome");
  const [specCctvResolution, setSpecCctvResolution] = useState("4MP");
  const [specCctvNightVision, setSpecCctvNightVision] = useState("Color Night Vision");
  const [specCctvConnectivity, setSpecCctvConnectivity] = useState("PoE");

  // Multi-Image Upload State
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressingImages, setCompressingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [imageError, setImageError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const loadProducts = async () => {
    const list = await dbHelper.products.list();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener("nexbyte-realtime", loadProducts);
    return () => window.removeEventListener("nexbyte-realtime", loadProducts);
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`NEX-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setSkuError("");
    setTitle("");
    setDescription("");
    setBrand("Kingston");
    setCategory("storage");
    setPrice("5499");
    setCompareAtPrice("6499");
    setCostPrice("4200");
    setDiscount("15");
    setStock("12");
    setLowStockThreshold("5");
    setProductVariants([]);

    setWarrantyEnabled(true);
    setWarrantyDuration("3 Years");
    setWarrantyText("3 Years Brand Warranty");

    setReturnEnabled(true);
    setReturnWindowDays("7");
    setReturnPolicyText("7-Day Replacement Guarantee");

    setDeliveryEnabled(false);
    setDeliveryEstimate("3–5 business days");
    setDeliveryMinDays("3");
    setDeliveryMaxDays("5");

    setCompBrand("");
    setCompSeries("");
    setCompModel("");
    setCompPartNumber("");

    setCondition("new");
    setFeatured(false);
    setLatest(false);
    setProductImages([]);
    setImageError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setSku(p.sku || `NEX-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setSkuError("");
    setTitle(p.title);
    setDescription(p.description || "");
    setBrand(p.brand || "Kingston");
    setCategory(p.category || "storage");
    setPrice(String(p.price ?? ""));
    setCompareAtPrice(p.compareAtPrice != null ? String(p.compareAtPrice) : "");
    setCostPrice(p.costPrice != null ? String(p.costPrice) : "");
    setDiscount(String(p.discount || 0));
    setStock(String(p.stock || 0));
    setLowStockThreshold(String(p.lowStockThreshold || 5));
    setProductVariants(Array.isArray(p.variants) ? p.variants.map((variant: any, index: number) => ({
      id: String(variant.id || `variant-${index + 1}-${Date.now()}`),
      sku: String(variant.sku || ""),
      name: String(variant.name || ""),
      price: variant.price == null ? "" : String(variant.price),
      compareAtPrice: variant.compareAtPrice == null ? "" : String(variant.compareAtPrice),
      costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
      stock: variant.stock == null ? "" : String(variant.stock),
      image: String(variant.image || ""),
      attributesJson: JSON.stringify(variant.attributes || {}),
      active: variant.active !== false,
    })) : []);

    setWarrantyEnabled(p.warrantyEnabled !== undefined ? Boolean(p.warrantyEnabled) : true);
    setWarrantyDuration(p.warrantyDuration || "3 Years");
    setWarrantyText(p.warrantyText || p.warranty || "3 Years Brand Warranty");

    setReturnEnabled(p.returnEnabled !== undefined ? Boolean(p.returnEnabled) : true);
    setReturnWindowDays(String(p.returnWindowDays || 7));
    setReturnPolicyText(p.returnPolicyText || "7-Day Replacement Guarantee");

    setDeliveryEnabled(Boolean(p.deliveryEnabled));
    setDeliveryEstimate(p.deliveryEstimate || "3–5 business days");
    setDeliveryMinDays(String(p.deliveryMinDays || 3));
    setDeliveryMaxDays(String(p.deliveryMaxDays || 5));

    setCompBrand(p.compatibility?.brand || "");
    setCompSeries(p.compatibility?.series || "");
    setCompModel(p.compatibility?.model || "");
    setCompPartNumber(p.compatibility?.partNumber || "");

    setCondition(p.condition || "new");
    setFeatured(p.featured || false);
    setLatest(p.latest || false);
    setImageError("");

    // Populate existing images
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      setProductImages(p.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url || img,
        is_primary: img.is_primary !== undefined ? Boolean(img.is_primary) : (img.url === p.image || idx === 0),
        sort_order: img.sort_order || idx + 1,
        alt_text: img.alt_text || ""
      })));
    } else {
      setProductImages([{
        id: `img-primary-${Date.now()}`,
        url: p.image || "/images/poster-products.png",
        is_primary: true,
        sort_order: 1,
        alt_text: p.title || "Product Image"
      }]);
    }
    setIsModalOpen(true);
  };

  // Image Upload File Handlers
  const handleFileSelect = async (files: File[]) => {
    if (uploading || compressingImages) return;
    setImageError("");
    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validFiles: File[] = [];

    for (const f of files) {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      const isValidExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
      const isValidMime = validMimeTypes.includes(f.type.toLowerCase());

      if (!isValidMime && !isValidExt) {
        setImageError(`File "${f.name}" is unsupported. Please upload JPG, PNG, or WebP.`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        setImageError(`File "${f.name}" exceeds maximum limit of 5 MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    const currentCount = productImages.length;
    if (currentCount + validFiles.length > 10) {
      setImageError("Maximum 10 product images allowed.");
    }

    const allowedFiles = validFiles.slice(0, Math.max(0, 10 - currentCount));
    if (allowedFiles.length === 0) return;

    setCompressingImages(true);
    const newItems: ProductImageItem[] = [];
    const compressionErrors: string[] = [];
    try {
      for (const [idx, source] of allowedFiles.entries()) {
        setUploadProgress(`Compressing image ${idx + 1} of ${allowedFiles.length}...`);
        try {
          const file = await compressProductImage(source);
          newItems.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: URL.createObjectURL(file),
            file,
            is_primary: currentCount === 0 && idx === 0,
            sort_order: currentCount + idx + 1,
            alt_text: "",
          });
        } catch (error: any) {
          compressionErrors.push(error.message || `Failed to compress ${source.name}.`);
        }
      }

      if (newItems.length > 0) {
        setProductImages((prev) => {
          const combined = [...prev, ...newItems];
          if (combined.length > 0 && !combined.some((item) => item.is_primary)) {
            combined[0].is_primary = true;
          }
          return combined;
        });
      }
      if (compressionErrors.length > 0) {
        setImageError(compressionErrors.join(" "));
      }
    } finally {
      setCompressingImages(false);
      setUploadProgress("");
    }
  };

  const handleSetPrimary = (id: string) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    setProductImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.url && target.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {}
      }
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered.map((img, idx) => ({ ...img, sort_order: idx + 1 }));
    });
  };

  const handleCloseModal = () => {
    if (uploading || compressingImages) return;
    productImages.forEach((img) => {
      if (img.url && img.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(img.url);
        } catch {}
      }
    });
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= productImages.length) return;

    setProductImages((prev) => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[targetIndex];
      arr[targetIndex] = temp;
      return arr.map((img, idx) => ({ ...img, sort_order: idx + 1 }));
    });
  };

  const handleAltTextChange = (id: string, alt_text: string) => {
    setProductImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, alt_text } : img))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (compressingImages) {
      setImageError("Wait for image compression to finish before saving.");
      return;
    }
    if (!title || !price || !category) return;

    const cleanSku = sku ? sku.trim().toUpperCase() : `NEX-SKU-${Date.now()}`;
    const duplicateSku = products.find(
      (p) => (p.sku || "").toUpperCase() === cleanSku && p.id !== editingProduct?.id && p.status !== "deleted"
    );
    if (duplicateSku) {
      setSkuError(`SKU "${cleanSku}" is already taken by another product. SKU must be unique.`);
      return;
    }
    const knownSkus = new Set<string>();
    products.filter((product) => product.id !== editingProduct?.id).forEach((product) => {
      if (product.sku) knownSkus.add(String(product.sku).trim().toUpperCase());
      if (Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          if (variant.sku) knownSkus.add(String(variant.sku).trim().toUpperCase());
        });
      }
    });
    if (knownSkus.has(cleanSku)) {
      setSkuError(`SKU "${cleanSku}" is already used by a product variant.`);
      return;
    }
    const variantSkus = new Set<string>();
    const variantConfigurations = new Set<string>();
    const normalizedVariants = [];
    for (const [index, variant] of productVariants.entries()) {
      const variantSku = variant.sku.trim().toUpperCase();
      const variantName = variant.name.trim();
      const variantPrice = Number(variant.price);
      const variantCompareAtPrice = variant.compareAtPrice.trim() ? Number(variant.compareAtPrice) : undefined;
      const variantCostPrice = variant.costPrice.trim() ? Number(variant.costPrice) : undefined;
      const variantStock = Number(variant.stock);
      if (!variantSku || !variantName || !variant.price || !variant.stock) {
        setImageError(`Variant ${index + 1} requires a SKU, option name, price, and stock quantity.`);
        return;
      }
      if (variantSku === cleanSku || variantSkus.has(variantSku) || knownSkus.has(variantSku)) {
        setImageError(`Variant SKU "${variantSku}" is duplicated or already in use.`);
        return;
      }
      if (!Number.isFinite(variantPrice) || variantPrice < 0 ||
        !Number.isInteger(variantStock) || variantStock < 0) {
        setImageError(`Variant ${index + 1} needs a non-negative price and whole-number stock quantity.`);
        return;
      }
      if ((variantCompareAtPrice !== undefined && (!Number.isFinite(variantCompareAtPrice) || variantCompareAtPrice < 0)) ||
        (variantCostPrice !== undefined && (!Number.isFinite(variantCostPrice) || variantCostPrice < 0))) {
        setImageError(`Variant ${index + 1} compare-at/cost prices must be valid non-negative numbers.`);
        return;
      }
      if (variant.image && !/^https?:\/\//i.test(variant.image) && !variant.image.startsWith("/")) {
        setImageError(`Variant ${index + 1} image must be an http(s) URL or a site-relative path.`);
        return;
      }
      let attributes: Record<string, string> = {};
      if (variant.attributesJson.trim()) {
        try {
          const parsed: unknown = JSON.parse(variant.attributesJson);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
            Object.values(parsed).some((value) => value !== null && !["string", "number", "boolean"].includes(typeof value))) {
            throw new Error("invalid");
          }
          attributes = Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => [key.trim(), String(value).trim()])
          );
        } catch {
          setImageError(`Variant ${index + 1} specifications must be a JSON object with text or numeric values.`);
          return;
        }
      }
      const configuration = Object.keys(attributes).length
        ? JSON.stringify(Object.entries(attributes).sort(([left], [right]) => left.localeCompare(right)))
        : variantName.toLowerCase();
      if (variantConfigurations.has(configuration)) {
        setImageError(`Variant ${index + 1} duplicates a configuration already listed for this product.`);
        return;
      }
      variantConfigurations.add(configuration);
      variantSkus.add(variantSku);
      normalizedVariants.push({
        id: variant.id,
        sku: variantSku,
        name: variantName,
        price: variantPrice,
        compareAtPrice: variantCompareAtPrice,
        costPrice: variantCostPrice,
        stock: variantStock,
        image: variant.image.trim() || undefined,
        attributes,
        active: variant.active,
      });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setImageError("Selling Price must be a valid positive number.");
      return;
    }

    const numDiscount = Number(discount || 0);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
      setImageError("Discount percentage must be between 0% and 100%.");
      return;
    }

    const numStock = Number(stock || 0);
    if (isNaN(numStock) || numStock < 0) {
      setImageError("Stock quantity cannot be negative.");
      return;
    }

    if (productImages.length === 0) {
      setImageError("At least 1 product image is required.");
      return;
    }

    setUploading(true);
    setImageError("");
    setSkuError("");
    setUploadProgress("Uploading product images...");

    try {
      const uploadedImages: ProductImageItem[] = [];
      const targetProductId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;

      for (let i = 0; i < productImages.length; i++) {
        const item = productImages[i];
        if (item.file) {
          setUploadProgress(`Uploading image ${i + 1} of ${productImages.length}...`);
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("productId", targetProductId);

          let fileUrl = "";
          try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const text = await res.text();
            let json: any = null;
            try {
              json = JSON.parse(text);
            } catch {}
            if (json && json.success && json.fileUrl) {
              fileUrl = json.fileUrl;
            }
          } catch (uploadErr) {
            console.warn("Server /api/upload failed, falling back to base64:", uploadErr);
          }

          // Robust fallback 1: generate base64 data URL from file directly
          if (!fileUrl && item.file) {
            try {
              fileUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const res = reader.result;
                  if (typeof res === "string" && res.length > 0) resolve(res);
                  else resolve("");
                };
                reader.onerror = () => resolve("");
                reader.readAsDataURL(item.file!);
              });
            } catch {}
          }

          // Robust fallback 2: if blob URL, convert blob to base64
          if (!fileUrl && item.url) {
            if (!item.url.startsWith("blob:")) {
              fileUrl = item.url;
            } else {
              try {
                const blobRes = await fetch(item.url);
                const blob = await blobRes.blob();
                fileUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve((reader.result as string) || "");
                  reader.onerror = () => resolve("");
                  reader.readAsDataURL(blob);
                });
              } catch {}
            }
          }

          if (fileUrl) {
            uploadedImages.push({
              id: item.id,
              url: fileUrl,
              is_primary: item.is_primary,
              sort_order: i + 1,
              alt_text: item.alt_text || ""
            });
          } else if (item.url) {
            uploadedImages.push({
              id: item.id,
              url: item.url,
              is_primary: item.is_primary,
              sort_order: i + 1,
              alt_text: item.alt_text || ""
            });
          }
        } else {
          uploadedImages.push({
            ...item,
            sort_order: i + 1
          });
        }
      }

      if (uploadedImages.length === 0) {
        setImageError("At least 1 product image is required.");
        return;
      }

      // Guarantee at least 1 Primary image
      if (uploadedImages.length > 0 && !uploadedImages.some((img) => img.is_primary)) {
        uploadedImages[0].is_primary = true;
      }

      const primaryImageUrl = uploadedImages.find((img) => img.is_primary)?.url || uploadedImages[0]?.url || "/images/poster-products.png";

      const payload = {
        sku: cleanSku,
        title: title.trim(),
        description: description.trim(),
        brand: brand.trim(),
        category: category.trim(),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        discount: Number(discount) || 0,
        stock: Number(stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,

        warrantyEnabled: Boolean(warrantyEnabled),
        warrantyDuration: warrantyDuration || "3 Years",
        warranty: warrantyText || warrantyDuration || "3 Years Brand Warranty",
        warrantyText: warrantyText || warrantyDuration || "3 Years Brand Warranty",

        returnEnabled: Boolean(returnEnabled),
        returnWindowDays: Number(returnWindowDays) || 7,
        returnPolicyText: returnPolicyText || "7-Day Replacement Guarantee",

        deliveryEnabled: Boolean(deliveryEnabled),
        deliveryEstimate: deliveryEstimate || "3–5 business days",
        deliveryMinDays: Number(deliveryMinDays) || 3,
        deliveryMaxDays: Number(deliveryMaxDays) || 5,

        compatibility: {
          brand: compBrand,
          series: compSeries,
          model: compModel,
          partNumber: compPartNumber
        },

        condition,
        featured,
        latest,
        variants: normalizedVariants,
        image: primaryImageUrl,
        images: uploadedImages.map((img) => ({
          id: img.id,
          url: img.url,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
          alt_text: img.alt_text || ""
        })),
        status: editingProduct ? editingProduct.status : "show",
        specs: {
          "Processor Brand": specProcBrand,
          Processor: specProcessor,
          "Processor Generation": specProcGen,
          "RAM Capacity": specRamCap,
          "RAM Type": specRamType,
          "SSD Capacity": specSsdCap,
          "Storage Type": specStorageType,
          Graphics: specGraphics,
          "Dedicated Graphics Memory": specVram,
          "Screen Size": specScreenSize,
          "Display Type": specDisplayType,
          "Operating System": specOs,
          Weight: specWeight,
          "Touch Screen": specTouchScreen ? "Yes" : "No",
          "GST Invoice Available": specGstInvoice ? "Yes" : "No",
          "Country Of Origin": specCountry,
          Capacity: category === "ram" ? specRamCap : specSsdCap,
          Interface: specSsdInterface,
          FormFactor: category === "ram" ? specRamFormFactor : specSsdFormFactor,
          ReadSpeed: specSsdReadSpeed,
          WriteSpeed: specSsdWriteSpeed,
          Speed: specRamSpeed,
          CameraType: specCctvCameraType,
          Resolution: specCctvResolution,
          NightVision: specCctvNightVision,
          Connectivity: specCctvConnectivity,
          ...(editingProduct?.specs || {})
        }
      };

      if (editingProduct) {
        await dbHelper.products.update(editingProduct.id, payload);
      } else {
        await dbHelper.products.create(payload);
      }

      productImages.forEach((img) => {
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      });
      setIsModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || "Failed to save product images. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Move this product to Trash? It will be removed from customer website.")) {
      await dbHelper.products.delete(id);
      loadProducts();
    }
  };

  const handleApproveProduct = async (p: any) => {
    await dbHelper.products.update(p.id, {
      approval_status: "approved",
      status: "show"
    });
    try {
      await dbHelper.notifications.create({
        title: "Product Approved",
        message: `Product "${p.title}" has been approved by admin and is live on store.`,
        type: "product",
        target_role: "reseller"
      });
    } catch {}
    loadProducts();
  };

  const handleRejectProduct = async (p: any) => {
    await dbHelper.products.update(p.id, {
      approval_status: "rejected",
      status: "hide"
    });
    try {
      await dbHelper.notifications.create({
        title: "Product Rejected",
        message: `Product "${p.title}" has been rejected by admin.`,
        type: "product",
        target_role: "reseller"
      });
    } catch {}
    loadProducts();
  };

  const handleRestore = async (id: string) => {
    await dbHelper.products.restore(id);
    loadProducts();
  };

  const handleToggleStatus = async (p: any) => {
    const nextStatus = p.status === "show" ? "hide" : "show";
    await dbHelper.products.update(p.id, { status: nextStatus });
    loadProducts();
  };

  const handleToggleFeatured = async (p: any) => {
    await dbHelper.products.update(p.id, { featured: !p.featured });
    loadProducts();
  };

  // Bulk Delete Action
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to move ${selectedIds.length} selected products to Trash?`)) {
      for (const id of selectedIds) {
        await dbHelper.products.delete(id);
      }
      setSelectedIds([]);
      loadProducts();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Filter calculations
  const filteredProducts = products.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (statusFilter === "active") return (!p.status || p.status === "show") && (p.stock === undefined || p.stock > 0);
    if (statusFilter === "hidden") return p.status === "hide" && p.approval_status !== "pending";
    if (statusFilter === "out_of_stock") return p.stock === 0;
    if (statusFilter === "pending_approval") return p.approval_status === "pending" || p.status === "pending";
    if (statusFilter === "trash") return p.status === "deleted";
    return p.status !== "deleted"; // "all" excludes soft-deleted trash items
  });

  const pendingCount = products.filter((p) => p.approval_status === "pending" || p.status === "pending").length;
  const compressedUploadBytes = productImages.reduce((total, image) => total + (image.file?.size || 0), 0);

  return (
    <div className="admin-products-light space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Products Catalog</h1>
          <p className="text-xs text-nex-mist mt-0.5">Manage systems supply chains, pricing points, reseller submissions, and galleries.</p>
        </div>
        <div className="flex gap-2">
          <ProductCatalogImport onImported={loadProducts} />
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-secondary !py-2.5 !px-4 text-xs bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              Bulk Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="btn-primary !py-2.5 !px-4 text-xs flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" /> Add Product Item
          </button>
        </div>
      </div>

      {/* Search & Status Filter Strip */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-nex-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nex-mist" />
          <input
            type="text"
            placeholder="Search systems title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-nex-black border border-white/[0.08] pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-nex-black p-1 rounded-xl border border-white/10 text-xs">
          {[
            { id: "all", label: "All Items" },
            { id: "active", label: "Active" },
            { id: "pending_approval", label: `Pending (${pendingCount})` },
            { id: "hidden", label: "Hidden" },
            { id: "out_of_stock", label: "Out of Stock" },
            { id: "trash", label: "Trash" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-nex-blue text-white shadow-glow-blue font-bold"
                  : pill.id === "pending_approval" && pendingCount > 0
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : "text-nex-mist hover:text-white hover:bg-white/5"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <ShoppingBag className="h-10 w-10 text-nex-mist mx-auto mb-3" />
          <p className="text-xs text-white">No products found matching criteria.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 bg-nex-ink overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.01] text-nex-mist font-semibold">
                  <th className="py-3 px-5 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded bg-nex-black border-white/20 text-nex-blue"
                    />
                  </th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pricing &amp; Stock</th>
                  <th className="py-3 px-4">Badges</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const imageCount = p.images?.length || (p.image ? 1 : 0);
                  return (
                    <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                      
                      {/* Checkbox */}
                      <td className="py-4 px-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded bg-nex-black border-white/20 text-nex-blue"
                        />
                      </td>

                      {/* Image & Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 p-1 flex items-center justify-center">
                            <Image src={getSafeImageSrc(p.image)} alt={p.title || "Product"} width={36} height={36} className="object-contain" />
                            {imageCount > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                                {imageCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white truncate max-w-[180px]">{p.title}</div>
                            <div className="text-[10px] text-nex-mist mt-0.5 capitalize">{p.condition?.replace("_", " ")}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 font-semibold text-white/80">
                        {CATEGORIES.find((c) => c.val === p.category)?.label || p.category}
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">Rs. {(p.price ?? 0).toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-nex-mist mt-0.5">Stock: <span className="text-white font-bold">{p.stock}</span></div>
                      </td>

                      {/* Flags & Status Badges */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex flex-wrap gap-1.5">
                          {(p.approval_status === "pending" || p.status === "pending") && (
                            <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[8px] text-amber-300 font-extrabold uppercase animate-pulse">
                              Pending Approval
                            </span>
                          )}
                          {p.approval_status === "approved" && (
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] text-emerald-400 font-bold uppercase">
                              Approved
                            </span>
                          )}
                          {p.approval_status === "rejected" && (
                            <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[8px] text-red-400 font-bold uppercase">
                              Rejected
                            </span>
                          )}
                          {p.seller_id && (
                            <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[8px] text-purple-300 font-bold uppercase">
                              Reseller
                            </span>
                          )}
                          {p.featured && (
                            <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[8px] text-amber-400 font-bold uppercase flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-amber-400" /> Featured
                            </span>
                          )}
                          {p.latest && (
                            <span className="rounded bg-nex-blue/20 border border-nex-blue/30 px-2 py-0.5 text-[8px] text-nex-blueLight font-bold uppercase flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5" /> Latest
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5">
                        {p.status === "deleted" ? (
                          <button
                            onClick={() => handleRestore(p.id)}
                            className="h-8 px-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-xs font-semibold inline-flex items-center gap-1"
                            title="Restore Product to Catalog"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                        ) : (p.approval_status === "pending" || p.status === "pending") ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveProduct(p)}
                              className="h-7 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1"
                              title="Approve Reseller Product"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectProduct(p)}
                              className="h-7 px-2.5 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 text-[11px] font-bold inline-flex items-center gap-1"
                              title="Reject Reseller Product"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleFeatured(p)}
                              className={`h-8 w-8 rounded-full border border-transparent flex items-center justify-center inline-flex ${
                                p.featured
                                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                  : "bg-white/5 text-white/40 hover:bg-white/10"
                              }`}
                              title={p.featured ? "Remove from Featured" : "Mark as Featured"}
                            >
                              <Star className={`h-3.5 w-3.5 ${p.featured ? "fill-amber-400" : ""}`} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`h-8 w-8 rounded-full border border-transparent flex items-center justify-center inline-flex ${
                                p.status === "show"
                                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                  : "bg-white/5 text-white/40 hover:bg-white/10"
                              }`}
                              title={p.status === "show" ? "Hide from website" : "Show on website"}
                            >
                              {p.status === "show" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="h-8 w-8 rounded-full bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 flex items-center justify-center inline-flex text-white"
                              title="Edit Details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="h-8 w-8 rounded-full bg-red-500/10 border border-transparent hover:border-red-500/20 hover:bg-red-500/20 flex items-center justify-center inline-flex text-red-400"
                              title="Move to Trash"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => !uploading && setIsModalOpen(false)} />
          
          <div className="glass-panel relative w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue sm:p-8">
            <button
              onClick={() => !uploading && setIsModalOpen(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display text-base font-bold text-white mb-6">
              {editingProduct ? "Modify Product Specifications" : "Register New Product Item"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* SKU */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs text-white/80 font-semibold">SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      setSkuError("");
                    }}
                    placeholder="NEX-SSD-1001"
                    className={`w-full rounded-xl bg-white/[0.03] border px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                      skuError ? "border-red-500 font-bold" : "border-white/10"
                    }`}
                  />
                  {skuError && <p className="text-[10px] text-red-400 font-semibold">{skuError}</p>}
                </div>

                {/* Product Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-white/80 font-semibold">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. EVM 512GB NVMe M.2 SSD"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs text-white/80 font-semibold">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.val} value={c.val}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs text-white/80 font-semibold">Brand *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. EVM, Kingston, Lenovo, Corsair"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Condition */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs text-white/80 font-semibold">Product Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="new">Brand New</option>
                    <option value="premium_used">Premium Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Item Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize processor, memory, speeds, read/write rate..."
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* PRICING & INVENTORY BREAKDOWN */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h4 className="text-xs text-nex-blueLight font-bold uppercase tracking-wider">Pricing &amp; Inventory</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Selling Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/80 font-semibold">Selling Price (Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="45000"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Compare-at Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/80 font-semibold">Compare Price (MRP)</label>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="55000"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Cost Price (Admin confidential) */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-amber-300 font-semibold">Cost Price (Admin Only)</label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="38000"
                      className="w-full rounded-xl bg-white/[0.03] border border-amber-500/30 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Discount */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/80 font-semibold">Discount (%)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                  {/* Stock Quantity */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/80 font-semibold">Stock Quantity *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="12"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Low Stock Threshold */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/80 font-semibold">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* POLICIES & DELIVERY TOGGLES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Warranty Config */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white font-bold">Warranty Policy</span>
                    <input
                      type="checkbox"
                      checked={warrantyEnabled}
                      onChange={(e) => setWarrantyEnabled(e.target.checked)}
                      className="rounded bg-nex-black border-white/20 text-nex-blue"
                    />
                  </label>
                  {warrantyEnabled && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        value={warrantyDuration}
                        onChange={(e) => setWarrantyDuration(e.target.value)}
                        placeholder="Duration (e.g. 3 Years)"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                      />
                      <input
                        type="text"
                        value={warrantyText}
                        onChange={(e) => setWarrantyText(e.target.value)}
                        placeholder="Text (e.g. 3 Years Brand Warranty)"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Return Policy Config */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white font-bold">Return Guarantee</span>
                    <input
                      type="checkbox"
                      checked={returnEnabled}
                      onChange={(e) => setReturnEnabled(e.target.checked)}
                      className="rounded bg-nex-black border-white/20 text-nex-blue"
                    />
                  </label>
                  {returnEnabled && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="number"
                        value={returnWindowDays}
                        onChange={(e) => setReturnWindowDays(e.target.value)}
                        placeholder="Days (e.g. 7)"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                      />
                      <input
                        type="text"
                        value={returnPolicyText}
                        onChange={(e) => setReturnPolicyText(e.target.value)}
                        placeholder="Text (e.g. 7-Day Replacement)"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Delivery Estimate Config */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white font-bold">Delivery Estimate</span>
                    <input
                      type="checkbox"
                      checked={deliveryEnabled}
                      onChange={(e) => setDeliveryEnabled(e.target.checked)}
                      className="rounded bg-nex-black border-white/20 text-nex-blue"
                    />
                  </label>
                  {deliveryEnabled ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="number"
                          value={deliveryMinDays}
                          onChange={(e) => setDeliveryMinDays(e.target.value)}
                          placeholder="Min Days"
                          className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-[11px] text-white"
                        />
                        <input
                          type="number"
                          value={deliveryMaxDays}
                          onChange={(e) => setDeliveryMaxDays(e.target.value)}
                          placeholder="Max Days"
                          className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-[11px] text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={deliveryEstimate}
                        onChange={(e) => setDeliveryEstimate(e.target.value)}
                        placeholder="Estimate text (3-5 days)"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-nex-mist italic pt-1">Disabled: Hidden on customer shop</p>
                  )}
                </div>
              </div>

              <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-nex-blueLight">Product variants</h4>
                    <p className="mt-1 text-[10px] leading-4 text-white/60">Each sellable option needs its own SKU, price, and stock. Inactive variants remain saved but cannot be purchased.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductVariants((current) => [...current, {
                      id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      sku: "",
                      name: "",
                      price: "",
                      compareAtPrice: "",
                      costPrice: "",
                      stock: "",
                      image: "",
                      attributesJson: "{}",
                      active: true,
                    }])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-200 hover:bg-blue-500/20"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add variant
                  </button>
                </div>
                {productVariants.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] text-white/50">No variants are configured for this product.</p>
                ) : (
                  <div className="space-y-3">
                    {productVariants.map((variant, index) => (
                      <div key={variant.id} className="rounded-lg border border-white/10 bg-black/10 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Variant {index + 1}</p>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70">
                              <input
                                type="checkbox"
                                checked={variant.active}
                                onChange={(event) => setProductVariants((current) => current.map((item) =>
                                  item.id === variant.id ? { ...item, active: event.target.checked } : item
                                ))}
                                className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-blue-500"
                              />
                              Active
                            </label>
                            <button
                              type="button"
                              aria-label={`Remove variant ${index + 1}`}
                              onClick={() => setProductVariants((current) => current.filter((item) => item.id !== variant.id))}
                              className="rounded p-1 text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {([
                            ["SKU", "sku", "text"],
                            ["Option name", "name", "text"],
                            ["Price", "price", "number"],
                            ["Compare-at price", "compareAtPrice", "number"],
                            ["Cost price (admin)", "costPrice", "number"],
                            ["Stock", "stock", "number"],
                            ["Image URL", "image", "url"],
                          ] as const).map(([label, field, type]) => (
                            <label key={field} className="space-y-1">
                              <span className="text-[10px] font-semibold text-white/70">{label}{["sku", "name", "price", "stock"].includes(field) ? " *" : ""}</span>
                              <input
                                type={type}
                                min={type === "number" ? "0" : undefined}
                                step={type === "number" && field === "stock" ? "1" : type === "number" ? "0.01" : undefined}
                                value={variant[field]}
                                onChange={(event) => setProductVariants((current) => current.map((item) =>
                                  item.id === variant.id ? { ...item, [field]: event.target.value } : item
                                ))}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </label>
                          ))}
                          <label className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <span className="text-[10px] font-semibold text-white/70">Variant specifications / attributes (JSON)</span>
                            <input
                              type="text"
                              value={variant.attributesJson}
                              onChange={(event) => setProductVariants((current) => current.map((item) =>
                                item.id === variant.id ? { ...item, attributesJson: event.target.value } : item
                              ))}
                              placeholder='{"capacity":"512GB","interface":"NVMe"}'
                              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* COMPATIBILITY METADATA */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <h4 className="text-xs text-nex-blueLight font-bold uppercase tracking-wider">Hardware Compatibility Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    value={compBrand}
                    onChange={(e) => setCompBrand(e.target.value)}
                    placeholder="Compatible Brand (e.g. Dell)"
                    className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                  />
                  <input
                    type="text"
                    value={compSeries}
                    onChange={(e) => setCompSeries(e.target.value)}
                    placeholder="Series (e.g. ThinkPad / Latitude)"
                    className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                  />
                  <input
                    type="text"
                    value={compModel}
                    onChange={(e) => setCompModel(e.target.value)}
                    placeholder="Model (e.g. T480 / XPS 13)"
                    className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                  />
                  <input
                    type="text"
                    value={compPartNumber}
                    onChange={(e) => setCompPartNumber(e.target.value)}
                    placeholder="Part Number"
                    className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[11px] text-white"
                  />
                </div>
              </div>

              {/* CATEGORY-AWARE SPECIFICATIONS SECTION */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-nex-blueLight font-bold uppercase tracking-wider">
                    Category Specifications ({category.replace("_", " ")})
                  </h4>
                  <span className="text-[10px] text-nex-mist">Powers Customer Catalog Filters</span>
                </div>

                {["business_laptops", "premium_used_laptops", "second_hand_laptops"].includes(category) ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Processor Brand</label>
                        <select value={specProcBrand} onChange={(e) => setSpecProcBrand(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="Intel">Intel</option>
                          <option value="AMD">AMD</option>
                          <option value="Apple">Apple</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Processor Family</label>
                        <input type="text" value={specProcessor} onChange={(e) => setSpecProcessor(e.target.value)} placeholder="Intel Core i5" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Processor Gen</label>
                        <select value={specProcGen} onChange={(e) => setSpecProcGen(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="11th Gen">11th Gen</option>
                          <option value="12th Gen">12th Gen</option>
                          <option value="13th Gen">13th Gen</option>
                          <option value="14th Gen">14th Gen</option>
                          <option value="Apple Silicon">Apple Silicon</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">RAM Capacity</label>
                        <select value={specRamCap} onChange={(e) => setSpecRamCap(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="4 GB">4 GB</option>
                          <option value="8 GB">8 GB</option>
                          <option value="16 GB">16 GB</option>
                          <option value="32 GB">32 GB</option>
                          <option value="64 GB">64 GB</option>
                          <option value="128 GB">128 GB</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">RAM Type</label>
                        <select value={specRamType} onChange={(e) => setSpecRamType(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="DDR4">DDR4</option>
                          <option value="DDR5">DDR5</option>
                          <option value="LPDDR5">LPDDR5</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">SSD Capacity</label>
                        <select value={specSsdCap} onChange={(e) => setSpecSsdCap(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="128 GB">128 GB</option>
                          <option value="256 GB">256 GB</option>
                          <option value="512 GB">512 GB</option>
                          <option value="1 TB">1 TB</option>
                          <option value="2 TB">2 TB</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Storage Type</label>
                        <select value={specStorageType} onChange={(e) => setSpecStorageType(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="NVMe SSD">NVMe SSD</option>
                          <option value="SATA SSD">SATA SSD</option>
                          <option value="HDD">HDD</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Screen Size</label>
                        <select value={specScreenSize} onChange={(e) => setSpecScreenSize(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                          <option value="13.3 inch">13.3 inch</option>
                          <option value="14 inch">14 inch</option>
                          <option value="15.6 inch">15.6 inch</option>
                          <option value="16 inch">16 inch</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Graphics GPU</label>
                        <input type="text" value={specGraphics} onChange={(e) => setSpecGraphics(e.target.value)} placeholder="Intel Iris Xe / RTX 4070" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Operating System</label>
                        <input type="text" value={specOs} onChange={(e) => setSpecOs(e.target.value)} placeholder="Windows 11 Pro" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 block mb-0.5">Weight</label>
                        <input type="text" value={specWeight} onChange={(e) => setSpecWeight(e.target.value)} placeholder="1.4 kg" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                      </div>
                      <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                          <input type="checkbox" checked={specTouchScreen} onChange={(e) => setSpecTouchScreen(e.target.checked)} className="rounded text-nex-blue" />
                          <span>Touchscreen</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : category === "storage" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Capacity</label>
                      <select value={specSsdCap} onChange={(e) => setSpecSsdCap(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                        <option value="128 GB">128 GB</option>
                        <option value="256 GB">256 GB</option>
                        <option value="512 GB">512 GB</option>
                        <option value="1 TB">1 TB</option>
                        <option value="2 TB">2 TB</option>
                        <option value="4 TB">4 TB</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Interface</label>
                      <input type="text" value={specSsdInterface} onChange={(e) => setSpecSsdInterface(e.target.value)} placeholder="PCIe Gen 4.0 x4" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Form Factor</label>
                      <input type="text" value={specSsdFormFactor} onChange={(e) => setSpecSsdFormFactor(e.target.value)} placeholder="M.2 2280" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Read Speed</label>
                      <input type="text" value={specSsdReadSpeed} onChange={(e) => setSpecSsdReadSpeed(e.target.value)} placeholder="7000 MB/s" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                  </div>
                ) : category === "ram" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Capacity</label>
                      <select value={specRamCap} onChange={(e) => setSpecRamCap(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                        <option value="4 GB">4 GB</option>
                        <option value="8 GB">8 GB</option>
                        <option value="16 GB">16 GB</option>
                        <option value="32 GB">32 GB</option>
                        <option value="64 GB">64 GB</option>
                        <option value="128 GB">128 GB</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">DDR Generation</label>
                      <select value={specRamType} onChange={(e) => setSpecRamType(e.target.value)} className="w-full rounded-lg bg-nex-ink border border-white/10 px-2 py-1 text-white text-[11px]">
                        <option value="DDR4">DDR4</option>
                        <option value="DDR5">DDR5</option>
                        <option value="LPDDR5">LPDDR5</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Speed</label>
                      <input type="text" value={specRamSpeed} onChange={(e) => setSpecRamSpeed(e.target.value)} placeholder="3200MHz" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Form Factor</label>
                      <input type="text" value={specRamFormFactor} onChange={(e) => setSpecRamFormFactor(e.target.value)} placeholder="SO-DIMM" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                  </div>
                ) : (category === "cctv" || category === "cctv_security") ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Camera Type</label>
                      <input type="text" value={specCctvCameraType} onChange={(e) => setSpecCctvCameraType(e.target.value)} placeholder="Dome / Bullet" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Resolution</label>
                      <input type="text" value={specCctvResolution} onChange={(e) => setSpecCctvResolution(e.target.value)} placeholder="4MP" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Night Vision</label>
                      <input type="text" value={specCctvNightVision} onChange={(e) => setSpecCctvNightVision(e.target.value)} placeholder="Color Night Vision" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/70 block mb-0.5">Connectivity</label>
                      <input type="text" value={specCctvConnectivity} onChange={(e) => setSpecCctvConnectivity(e.target.value)} placeholder="PoE / BNC" className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-white text-[11px]" />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-nex-mist italic">
                    General product item — Basic specs will be automatically derived from description and brand.
                  </div>
                )}
              </div>

              {/* PRODUCT IMAGES MULTI-UPLOADER SECTION */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/90 font-bold uppercase tracking-wider">
                    Product Images *
                  </label>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-[11px] font-bold ${productImages.length >= 10 ? "text-amber-400" : "text-nex-mist"}`}>
                      {productImages.length} / 10 images
                    </span>
                    {compressedUploadBytes > 0 && (
                      <span className="text-[10px] text-nex-mist">
                        Compressed total: {(compressedUploadBytes / 1024).toFixed(0)} / 967 KB
                      </span>
                    )}
                  </div>
                </div>

                {imageError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 font-semibold flex items-center justify-between">
                    <span>{imageError}</span>
                    <button type="button" onClick={() => setImageError("")} className="text-red-400 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Drag & Drop Upload Zone */}
                {productImages.length < 10 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.length) {
                        handleFileSelect(Array.from(e.dataTransfer.files));
                      }
                    }}
                    className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                      isDragging
                        ? "border-nex-blue bg-nex-blue/10 scale-[1.01]"
                        : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleFileSelect(Array.from(e.target.files));
                        }
                        e.target.value = "";
                      }}
                      className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                      disabled={uploading || compressingImages}
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-nex-blue/10 border border-nex-blue/20 text-nex-blueLight flex items-center justify-center">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Drag &amp; Drop Product Images Here</p>
                        <p className="text-[11px] text-nex-mist mt-0.5">JPG, PNG or WebP • Each compressed below 100 KB • Under 1 MB total</p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary !py-1.5 !px-3.5 text-xs mt-1 pointer-events-auto"
                      >
                        + Browse Images
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {(uploading || compressingImages) && (
                  <div className="rounded-xl bg-nex-blue/10 border border-nex-blue/20 p-3 text-xs text-nex-blueLight flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0 text-nex-blueLight" />
                    <span>{uploadProgress || "Uploading product images..."}</span>
                  </div>
                )}

                {/* Image Preview Grid */}
                {productImages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {productImages.map((img, index) => (
                        <div
                          key={img.id}
                          className={`relative rounded-xl overflow-hidden border bg-nex-black/60 p-2 flex flex-col justify-between transition-all ${
                            img.is_primary
                              ? "border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/50"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {/* Primary Badge */}
                          {img.is_primary && (
                            <div className="absolute top-2 left-2 z-10 rounded bg-amber-500 text-black px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow">
                              PRIMARY
                            </div>
                          )}

                          {/* Thumbnail */}
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white/5 border border-white/5 mb-2 flex items-center justify-center p-1">
                            <img
                              src={img.url}
                              alt={img.alt_text || `Product image ${index + 1}`}
                              className="h-full w-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = "/images/poster-products.png"; }}
                            />
                            {img.file && (
                              <span className="absolute bottom-1 right-1 bg-nex-blue/90 text-white text-[8px] font-bold px-1 rounded">
                                New · {Math.max(1, Math.round(img.file.size / 1024))} KB
                              </span>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-nex-mist">
                              <span>Img #{index + 1}</span>
                              {!img.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(img.id)}
                                  className="text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-0.5"
                                >
                                  <Star className="h-3 w-3" /> Set Primary
                                </button>
                              )}
                            </div>

                            {/* Alt Text Input */}
                            <input
                              type="text"
                              value={img.alt_text || ""}
                              onChange={(e) => handleAltTextChange(img.id, e.target.value)}
                              placeholder="Alt text (e.g. Front view)"
                              className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-[10px] text-white focus:outline-none placeholder-white/20"
                            />

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveImage(index, "left")}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
                                  title="Move Left"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === productImages.length - 1}
                                  onClick={() => handleMoveImage(index, "right")}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
                                  title="Move Right"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveImage(img.id)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px]"
                                title="Remove image"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-nex-mist italic">
                      💡 Use arrows to reorder images. The PRIMARY image will be displayed on customer product cards.
                    </p>
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="pt-2 flex items-center gap-6 text-xs text-white/95">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded bg-nex-black border-white/20 text-nex-blue focus:ring-0"
                  />
                  <span>Mark as Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={latest}
                    onChange={(e) => setLatest(e.target.checked)}
                    className="rounded bg-nex-black border-white/20 text-nex-blue focus:ring-0"
                  />
                  <span>Mark as Latest Arrival</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => !uploading && setIsModalOpen(false)}
                  className="btn-secondary !py-2 !px-4"
                  disabled={uploading || compressingImages}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary !py-2 !px-5 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Save Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function getStatusConfig(val: string) {
  return { value: val };
}
