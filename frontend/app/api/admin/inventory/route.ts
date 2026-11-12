import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItemDTO {
  itemKey: string;
  productId: string;
  variantId?: string;
  sku: string;
  productTitle: string;
  variantName?: string;
  category: string;
  stock: number;
  price: number;
  threshold: number;
  status: StockStatus;
  valuation: number;
  image?: string;
  lastUpdated: string;
}

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

function computeStatus(qty: number, threshold: number): StockStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const statusFilter = searchParams.get("status") || "all";
    const categoryFilter = searchParams.get("category") || "all";
    const globalThreshold = Math.max(1, parseInt(searchParams.get("threshold") || "5", 10));
    const sortBy = searchParams.get("sortBy") || "status";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const allProducts = await dbHelper.products.list().catch(() => []);

    const allItems: InventoryItemDTO[] = [];
    const categorySet = new Set<string>();

    allProducts.forEach((p: any) => {
      const pSku = p.sku || `SKU-${(p.id || "").toString().toUpperCase()}`;
      const pUpdated = p.updated_at || p.created_at || new Date().toISOString();
      const pCategory = p.category || "hardware";
      categorySet.add(pCategory);
      const pImage = p.image || (Array.isArray(p.images) && p.images[0]) || "";

      if (Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v: any, vIdx: number) => {
          const vSku = v.sku || `${pSku}-V${vIdx + 1}`;
          const vStock = Math.max(0, Number(v.stock ?? p.stock ?? 0));
          const vPrice = Math.max(0, Number(v.price ?? p.price ?? 0));
          const vThreshold = Number(v.lowStockThreshold ?? p.lowStockThreshold ?? globalThreshold);
          const vKey = `${p.id}:${v.id || vIdx}`;

          allItems.push({
            itemKey: vKey,
            productId: p.id,
            variantId: v.id ? String(v.id) : String(vIdx),
            sku: vSku,
            productTitle: p.title || "Untitled Product",
            variantName: v.name || v.label,
            category: pCategory,
            stock: vStock,
            price: vPrice,
            threshold: vThreshold,
            status: computeStatus(vStock, vThreshold),
            valuation: vStock * vPrice,
            image: v.image || pImage,
            lastUpdated: v.updated_at || pUpdated,
          });
        });
      } else {
        const pStock = Math.max(0, Number(p.stock ?? 0));
        const pPrice = Math.max(0, Number(p.price ?? 0));
        const pKey = `${p.id}:base`;
        const pThreshold = Number(p.lowStockThreshold ?? globalThreshold);

        allItems.push({
          itemKey: pKey,
          productId: p.id,
          sku: pSku,
          productTitle: p.title || "Untitled Product",
          category: pCategory,
          stock: pStock,
          price: pPrice,
          threshold: pThreshold,
          status: computeStatus(pStock, pThreshold),
          valuation: pStock * pPrice,
          image: pImage,
          lastUpdated: pUpdated,
        });
      }
    });

    // Compute genuine global metrics
    const totalSkus = allItems.length;
    let totalStockUnits = 0;
    let totalInventoryValuation = 0;
    let healthyStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allItems.forEach((i) => {
      totalStockUnits += i.stock;
      totalInventoryValuation += i.valuation;
      if (i.status === "in_stock") healthyStockCount++;
      else if (i.status === "low_stock") lowStockCount++;
      else if (i.status === "out_of_stock") outOfStockCount++;
    });

    const activeAlertsCount = lowStockCount + outOfStockCount;

    // Apply filtering
    let filtered = allItems.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (query) {
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchTitle = item.productTitle.toLowerCase().includes(query);
        const matchVariant = (item.variantName || "").toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        if (!matchSku && !matchTitle && !matchVariant && !matchCategory) {
          return false;
        }
      }
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "stock") {
        comparison = a.stock - b.stock;
      } else if (sortBy === "status") {
        // Priority order: out_of_stock (0), low_stock (1), in_stock (2)
        const orderMap: Record<StockStatus, number> = { out_of_stock: 0, low_stock: 1, in_stock: 2 };
        comparison = orderMap[a.status] - orderMap[b.status];
        if (comparison === 0) comparison = a.stock - b.stock;
      } else if (sortBy === "title") {
        comparison = a.productTitle.localeCompare(b.productTitle);
      } else if (sortBy === "sku") {
        comparison = a.sku.localeCompare(b.sku);
      } else if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "valuation") {
        comparison = a.valuation - b.valuation;
      } else if (sortBy === "updated_at") {
        comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        totalSkus,
        totalStockUnits,
        healthyStockCount,
        lowStockCount,
        outOfStockCount,
        activeAlertsCount,
        totalInventoryValuation,
        categories: Array.from(categorySet).sort(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve inventory items." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variantId, type = "adjustment", quantity = 0, reason, threshold, adminName } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const qtyNumber = Number(quantity);
    if (isNaN(qtyNumber)) {
      return NextResponse.json({ error: "Quantity must be a valid number." }, { status: 400 });
    }

    const allProducts = await dbHelper.products.list();
    const product = allProducts.find((p: any) => p.id === productId);

    if (!product) {
      return NextResponse.json({ error: `Product with ID '${productId}' was not found.` }, { status: 404 });
    }

    let currentStock = 0;
    let targetSku = product.sku || `SKU-${product.id.toUpperCase()}`;
    let newStock = 0;
    let delta = 0;

    if (variantId && Array.isArray(product.variants) && product.variants.length > 0) {
      const vIndex = product.variants.findIndex(
        (v: any, idx: number) => (v.id && String(v.id) === String(variantId)) || String(idx) === String(variantId)
      );

      if (vIndex === -1) {
        return NextResponse.json({ error: `Variant '${variantId}' not found on product '${productId}'.` }, { status: 404 });
      }

      const variant = product.variants[vIndex];
      currentStock = Math.max(0, Number(variant.stock ?? 0));
      targetSku = variant.sku || `${targetSku}-V${vIndex + 1}`;

      if (type === "stock_in") {
        const addAmount = Math.max(0, qtyNumber);
        newStock = currentStock + addAmount;
        delta = addAmount;
      } else if (type === "stock_out") {
        const deductAmount = Math.max(0, qtyNumber);
        if (currentStock < deductAmount) {
          return NextResponse.json(
            { error: `Cannot deduct ${deductAmount} units. Current stock is ${currentStock}. Negative stock is prohibited.` },
            { status: 400 }
          );
        }
        newStock = currentStock - deductAmount;
        delta = -deductAmount;
      } else {
        // Direct absolute adjustment
        newStock = Math.max(0, qtyNumber);
        delta = newStock - currentStock;
      }

      const updatedVariants = [...product.variants];
      updatedVariants[vIndex] = {
        ...variant,
        stock: newStock,
        ...(typeof threshold === "number" ? { lowStockThreshold: Math.max(1, threshold) } : {}),
        updated_at: new Date().toISOString(),
      };

      const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);

      await dbHelper.products.update(product.id, {
        variants: updatedVariants,
        stock: totalStock,
        updated_at: new Date().toISOString(),
      });
    } else {
      currentStock = Math.max(0, Number(product.stock ?? 0));

      if (type === "stock_in") {
        const addAmount = Math.max(0, qtyNumber);
        newStock = currentStock + addAmount;
        delta = addAmount;
      } else if (type === "stock_out") {
        const deductAmount = Math.max(0, qtyNumber);
        if (currentStock < deductAmount) {
          return NextResponse.json(
            { error: `Cannot deduct ${deductAmount} units. Current stock is ${currentStock}. Negative stock is prohibited.` },
            { status: 400 }
          );
        }
        newStock = currentStock - deductAmount;
        delta = -deductAmount;
      } else {
        newStock = Math.max(0, qtyNumber);
        delta = newStock - currentStock;
      }

      await dbHelper.products.update(product.id, {
        stock: newStock,
        ...(typeof threshold === "number" ? { lowStockThreshold: Math.max(1, threshold) } : {}),
        updated_at: new Date().toISOString(),
      });
    }

    // Record immutable audit transaction
    const transaction = await dbHelper.inventoryTransactions.record({
      product_id: product.id,
      variant_id: variantId || null,
      sku: targetSku,
      product_title: product.title,
      type: type === "stock_in" ? "stock_in" : type === "stock_out" ? "stock_out" : "adjustment",
      quantity: Math.abs(delta),
      previous_stock: currentStock,
      new_stock: newStock,
      reason: reason || (type === "stock_in" ? "Stock replenishment" : type === "stock_out" ? "Stock deduction" : "Inventory count adjustment"),
      admin_name: adminName || "Inventory Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Stock updated successfully from ${currentStock} to ${newStock} units.`,
      previousStock: currentStock,
      newStock,
      delta,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update inventory stock." },
      { status: 500 }
    );
  }
}

