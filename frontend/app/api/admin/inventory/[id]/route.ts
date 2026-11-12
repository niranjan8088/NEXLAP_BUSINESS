import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const allProducts = await dbHelper.products.list();
    const product = allProducts.find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: `Product with ID '${id}' was not found.` }, { status: 404 });
    }

    // Retrieve recent inventory audit transactions on-demand
    const transactions = await dbHelper.inventoryTransactions.listByProduct(id).catch(() => []);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        sku: product.sku || `SKU-${product.id.toUpperCase()}`,
        category: product.category || "hardware",
        stock: product.stock ?? 0,
        price: product.price ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 5,
        variants: product.variants || [],
        image: product.image || (Array.isArray(product.images) && product.images[0]) || "",
        created_at: product.created_at,
        updated_at: product.updated_at,
      },
      transactions: transactions.slice(0, 50),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve product inventory detail." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { sku, lowStockThreshold, variants, stock } = body;

    const allProducts = await dbHelper.products.list();
    const product = allProducts.find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: `Product with ID '${id}' was not found.` }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof sku === "string" && sku.trim()) {
      updatePayload.sku = sku.trim();
    }

    if (typeof lowStockThreshold === "number") {
      updatePayload.lowStockThreshold = Math.max(1, lowStockThreshold);
    }

    if (Array.isArray(variants)) {
      updatePayload.variants = variants;
      updatePayload.stock = variants.reduce((sum: number, v: any) => sum + Math.max(0, Number(v.stock) || 0), 0);
    } else if (typeof stock === "number") {
      updatePayload.stock = Math.max(0, stock);
    }

    const updated = await dbHelper.products.update(id, updatePayload);

    return NextResponse.json({
      success: true,
      message: "Product inventory settings updated successfully.",
      product: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update product inventory settings." },
      { status: 500 }
    );
  }
}

