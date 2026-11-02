import { NextRequest, NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allProducts = await dbHelper.products.list();
    
    let prod = allProducts.find(
      (p: any) =>
        (p.id === id || p.slug === id || p.sku === id) &&
        p.status !== "deleted" &&
        p.status !== "hide" &&
        p.approval_status !== "pending" &&
        p.approval_status !== "rejected"
    );

    // Fallback: case-insensitive ID/SKU or variant match
    if (!prod) {
      prod = allProducts.find((p: any) =>
        p.status !== "deleted" &&
        p.status !== "hide" &&
        ((p.id && p.id.toLowerCase() === id.toLowerCase()) ||
         (p.slug && p.slug.toLowerCase() === id.toLowerCase()) ||
         (p.sku && p.sku.toLowerCase() === id.toLowerCase()) ||
         (Array.isArray(p.variants) && p.variants.some((v: any) => v.id === id || (v.sku && v.sku.toLowerCase() === id.toLowerCase()))))
      );
    }

    if (!prod) {
      return NextResponse.json({ error: "Product not found or unavailable." }, { status: 404 });
    }

    // Security sanitization: strip costPrice & supplier details
    const { costPrice, supplierPrice, internalNotes, supplier_id, ...customerSafeProduct } = prod;

    const stockQty = Number(customerSafeProduct.stock ?? 10);
    const lowThreshold = Number(customerSafeProduct.lowStockThreshold ?? 5);
    const customerSafeVariants = Array.isArray(customerSafeProduct.variants)
      ? customerSafeProduct.variants.map((variant: any) => {
          const { costPrice: _variantCostPrice, ...safeVariant } = variant;
          return safeVariant;
        })
      : customerSafeProduct.variants;
    let stockStatus = "In Stock";
    if (stockQty <= 0) {
      stockStatus = "Out of Stock";
    } else if (stockQty <= lowThreshold) {
      stockStatus = `Only ${stockQty} left`;
    }

    return NextResponse.json({
      success: true,
      product: {
        ...customerSafeProduct,
        variants: customerSafeVariants,
        stockStatus,
        inStock: stockQty > 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load product details." }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Forbidden: Customer role cannot modify product." }, { status: 403 });
}

export async function PUT() {
  return NextResponse.json({ error: "Forbidden: Customer role cannot modify product." }, { status: 403 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Forbidden: Customer role cannot modify product." }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Forbidden: Customer role cannot modify product." }, { status: 403 });
}
