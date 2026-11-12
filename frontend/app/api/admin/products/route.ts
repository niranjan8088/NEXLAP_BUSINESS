import { NextRequest, NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

class ProductVariantValidationError extends Error {}

/** GET /api/admin/products — Returns product list for admin with search, filter, and pagination */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "reseller"]);
    const allProducts = await dbHelper.products.list();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status") || "all";
    const categoryParam = searchParams.get("category") || "";
    const brandParam = (searchParams.get("brand") || "").trim().toLowerCase();
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 1. Compute summary counts across all items
    const counts = {
      all: allProducts.filter((p: any) => p.status !== "deleted").length,
      active: allProducts.filter((p: any) => (!p.status || p.status === "show") && (p.stock === undefined || p.stock > 0)).length,
      pending_approval: allProducts.filter((p: any) => p.approval_status === "pending" || p.status === "pending").length,
      hidden: allProducts.filter((p: any) => p.status === "hide" && p.approval_status !== "pending").length,
      out_of_stock: allProducts.filter((p: any) => p.stock === 0 && p.status !== "deleted").length,
      trash: allProducts.filter((p: any) => p.status === "deleted").length,
    };

    // 2. Filter products
    let filtered = allProducts.filter((p: any) => {
      // Search query filter
      if (q) {
        const titleMatch = (p.title || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        const brandMatch = (p.brand || "").toLowerCase().includes(q);
        const skuMatch = (p.sku || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch && !brandMatch && !skuMatch) {
          return false;
        }
      }

      // Category filter
      if (categoryParam && categoryParam !== "all" && p.category !== categoryParam) {
        return false;
      }

      // Brand filter
      if (brandParam && (p.brand || "").toLowerCase() !== brandParam) {
        return false;
      }

      // Status filter
      if (statusParam === "active") {
        return (!p.status || p.status === "show") && (p.stock === undefined || p.stock > 0);
      }
      if (statusParam === "hidden") {
        return p.status === "hide" && p.approval_status !== "pending";
      }
      if (statusParam === "out_of_stock") {
        return p.stock === 0 && p.status !== "deleted";
      }
      if (statusParam === "pending_approval") {
        return p.approval_status === "pending" || p.status === "pending";
      }
      if (statusParam === "trash") {
        return p.status === "deleted";
      }
      // "all" excludes soft-deleted trash items
      return p.status !== "deleted";
    });

    // 3. Sort
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === "price") {
        comparison = (Number(a.price) || 0) - (Number(b.price) || 0);
      } else if (sortBy === "stock") {
        comparison = (Number(a.stock) || 0) - (Number(b.stock) || 0);
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else {
        const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
        comparison = timeA - timeB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;

    // 4. Pagination
    let pagedProducts = filtered;
    let page = 1;
    let limit = total;
    let totalPages = 1;

    if (pageParam !== null || limitParam !== null) {
      page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
      const parsedLimit = parseInt(limitParam || "20", 10);
      limit = parsedLimit > 0 ? parsedLimit : 20;
      totalPages = Math.max(1, Math.ceil(total / limit));
      if (page > totalPages && totalPages > 0) page = totalPages;
      const start = (page - 1) * limit;
      pagedProducts = filtered.slice(start, start + limit);
    }

    return NextResponse.json(
      {
        products: pagedProducts,
        total,
        totalPages,
        page,
        limit,
        counts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}


/** POST /api/admin/products — Create a new product with full attributes */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "reseller"]);
    const body = await request.json();

    const {
      sku,
      title,
      description,
      shortDescription,
      category,
      subcategoryId,
      brand,
      price,
      compareAtPrice,
      costPrice,
      stock,
      lowStockThreshold,
      images,
      specs,
      compatibility,
      variants,
      warrantyEnabled,
      warrantyDuration,
      warrantyText,
      returnEnabled,
      returnWindowDays,
      returnPolicyText,
      deliveryEnabled,
      deliveryEstimate,
      deliveryMinDays,
      deliveryMaxDays,
      offersEnabled,
      activeOfferId,
      featured,
      latest,
      condition,
    } = body;

    // Title and Category are strictly required
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Product title is required." }, { status: 400 });
    }
    if (!category || !String(category).trim()) {
      return NextResponse.json({ error: "Product category is required." }, { status: 400 });
    }

    // Server-side validation for price and stock
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
    }

    const parsedStock = stock !== undefined ? Number(stock) : 10;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Stock quantity must be a non-negative number." }, { status: 400 });
    }

    // SKU uniqueness check if provided
    const cleanSku = sku ? String(sku).trim().toUpperCase() : `SKU-${Date.now()}`;
    const allProducts = await dbHelper.products.list();
    const existingSku = allProducts.find((p: any) =>
      p.status !== "deleted" &&
      ((p.sku || "").toUpperCase() === cleanSku ||
        (Array.isArray(p.variants) && p.variants.some((variant: any) => (variant.sku || "").toUpperCase() === cleanSku)))
    );
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${cleanSku}" already exists. SKU must be unique.` }, { status: 400 });
    }

    if (variants !== undefined && !Array.isArray(variants)) {
      return NextResponse.json({ error: "Variants must be an array of variant objects." }, { status: 400 });
    }

    const variantIds = new Set<string>();
    const variantSkus = new Set<string>();
    const normalizedVariants = (variants || []).map((variant: any, index: number) => {
      if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
        throw new ProductVariantValidationError(`Variant ${index + 1} must be an object.`);
      }

      const name = String(variant.name || "").trim();
      const parsedVariantPrice = Number(variant.price);
      if (!name) throw new ProductVariantValidationError(`Variant ${index + 1} needs a name.`);
      if (variant.price === undefined || variant.price === null || variant.price === "" || !Number.isFinite(parsedVariantPrice) || parsedVariantPrice < 0) {
        throw new ProductVariantValidationError(`Variant "${name}" needs a valid non-negative price.`);
      }

      const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "option";
      const id = String(variant.id || `variant-${index + 1}-${idSlug}`).trim();
      if (variantIds.has(id)) throw new ProductVariantValidationError(`Variant ID "${id}" is duplicated.`);
      variantIds.add(id);

      const variantSku = variant.sku ? String(variant.sku).trim().toUpperCase() : undefined;
      if (variantSku) {
        if (variantSkus.has(variantSku)) throw new ProductVariantValidationError(`Variant SKU "${variantSku}" is duplicated.`);
        const conflictingSku = allProducts.some((product: any) =>
          product.status !== "deleted" &&
          ((product.sku || "").toUpperCase() === variantSku ||
            (Array.isArray(product.variants) && product.variants.some((existing: any) => (existing.sku || "").toUpperCase() === variantSku)))
        );
        if (variantSku === cleanSku || conflictingSku) {
          throw new ProductVariantValidationError(`SKU "${variantSku}" already exists. SKUs must be unique.`);
        }
        variantSkus.add(variantSku);
      }

      const parsedStock = variant.stock === undefined || variant.stock === null || variant.stock === ""
        ? undefined
        : Number(variant.stock);
      if (parsedStock !== undefined && (!Number.isInteger(parsedStock) || parsedStock < 0)) {
        throw new ProductVariantValidationError(`Stock for variant "${name}" must be a non-negative whole number.`);
      }

      const parsedCompareAtPrice = variant.compareAtPrice === undefined || variant.compareAtPrice === null || variant.compareAtPrice === ""
        ? undefined
        : Number(variant.compareAtPrice);
      if (parsedCompareAtPrice !== undefined && (!Number.isFinite(parsedCompareAtPrice) || parsedCompareAtPrice < 0)) {
        throw new ProductVariantValidationError(`Compare-at price for variant "${name}" is invalid.`);
      }

      const parsedCostPrice = variant.costPrice === undefined || variant.costPrice === null || variant.costPrice === ""
        ? undefined
        : Number(variant.costPrice);
      if (parsedCostPrice !== undefined && (!Number.isFinite(parsedCostPrice) || parsedCostPrice < 0)) {
        throw new ProductVariantValidationError(`Cost price for variant "${name}" is invalid.`);
      }

      const image = variant.image ? String(variant.image).trim() : undefined;
      if (image && !/^https?:\/\//i.test(image) && !image.startsWith("/")) {
        throw new ProductVariantValidationError(`Image for variant "${name}" must be an http(s) URL or a site-relative path.`);
      }

      let attributes: Record<string, string> | undefined;
      if (variant.attributes !== undefined) {
        if (!variant.attributes || typeof variant.attributes !== "object" || Array.isArray(variant.attributes)) {
          throw new ProductVariantValidationError(`Attributes for variant "${name}" must be an object.`);
        }
        attributes = {};
        for (const [key, value] of Object.entries(variant.attributes)) {
          if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
            throw new ProductVariantValidationError(`Attribute "${key}" for variant "${name}" must be text or a number.`);
          }
          if (String(value).trim()) attributes[key.trim()] = String(value).trim();
        }
      }

      return {
        id,
        sku: variantSku,
        name,
        price: parsedVariantPrice,
        compareAtPrice: parsedCompareAtPrice,
        costPrice: user.role === "admin" && parsedCostPrice !== undefined ? parsedCostPrice : undefined,
        stock: parsedStock,
        image,
        attributes,
        active: variant.active !== false,
      };
    });

    const normalizedVariantNames = new Set<string>();
    for (const variant of normalizedVariants) {
      const key = variant.name.toLowerCase();
      if (normalizedVariantNames.has(key)) {
        return NextResponse.json({ error: `Variant name "${variant.name}" is duplicated.` }, { status: 400 });
      }
      normalizedVariantNames.add(key);
    }

    // Delivery validation min <= max
    if (deliveryMinDays != null && deliveryMaxDays != null) {
      if (Number(deliveryMinDays) > Number(deliveryMaxDays)) {
        return NextResponse.json({ error: "Minimum delivery days cannot exceed maximum delivery days." }, { status: 400 });
      }
    }

    // Normalize images
    const normalizedImages = Array.isArray(images) ? images : [];
    const primaryImage = normalizedImages.find((img: any) => img.is_primary)?.url || normalizedImages[0]?.url || "/images/poster-products.webp";

    const payload = {
      sku: cleanSku,
      slug: cleanSku.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: String(title).trim(),
      description: String(description || "").trim(),
      shortDescription: String(shortDescription || "").trim(),
      category: String(category).trim(),
      subcategoryId: subcategoryId ? String(subcategoryId).trim() : undefined,
      brand: brand ? String(brand).trim() : undefined,

      price: parsedPrice,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPrice: user.role === "admin" && costPrice != null ? Number(costPrice) : undefined,

      stock: parsedStock,
      lowStockThreshold: lowStockThreshold != null ? Number(lowStockThreshold) : 5,

      image: primaryImage,
      images: normalizedImages,

      specs: specs || {},
      compatibility: compatibility || {},
      variants: normalizedVariants,

      warrantyEnabled: warrantyEnabled !== undefined ? Boolean(warrantyEnabled) : true,
      warrantyDuration: warrantyDuration || "1 Year",
      warranty: warrantyText || warrantyDuration || "1 Year Brand Warranty",

      returnEnabled: returnEnabled !== undefined ? Boolean(returnEnabled) : true,
      returnWindowDays: returnWindowDays != null ? Number(returnWindowDays) : 7,
      returnPolicyText: returnPolicyText || "7-Day Replacement Guarantee",

      deliveryEnabled: deliveryEnabled !== undefined ? Boolean(deliveryEnabled) : false,
      deliveryEstimate: deliveryEstimate || "3–5 business days",
      deliveryMinDays: deliveryMinDays != null ? Number(deliveryMinDays) : 3,
      deliveryMaxDays: deliveryMaxDays != null ? Number(deliveryMaxDays) : 5,

      offersEnabled: Boolean(offersEnabled),
      activeOfferId: activeOfferId || undefined,

      featured: Boolean(featured),
      latest: Boolean(latest),
      condition: condition || "new",

      seller_id: user.role === "reseller" ? user.resellerId || user.id : undefined,
      seller_type: user.role === "admin" ? "admin" : "reseller",
      created_by: user.id,
      approval_status: user.role === "admin" ? "approved" : "pending",
      status: user.role === "admin" ? "show" : "pending",
    };

    const newProduct = await dbHelper.products.create(payload);
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (err) {
    if (err instanceof ProductVariantValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}
