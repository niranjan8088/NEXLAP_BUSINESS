import { NextRequest, NextResponse } from "next/server";
import { invalidateQueryCache, dbHelper } from "@/lib/dbHelper";

function loadMemoryDb(): Record<string, any> {
  const globalRef = globalThis as any;
  if (!globalRef.__nexbyteMockDb) {
    globalRef.__nexbyteMockDb = {};
  }
  return globalRef.__nexbyteMockDb;
}

function saveMemoryDb(db: Record<string, any>) {
  const globalRef = globalThis as any;
  if (!globalRef.__nexbyteMockDb) {
    globalRef.__nexbyteMockDb = {};
  }
  globalRef.__nexbyteMockDb = { ...globalRef.__nexbyteMockDb, ...db };
}

function trySaveDiskDb(key: string, data: any) {
  if (typeof process === "undefined" || !process.cwd) return;
  try {
    const fs = eval("require")("fs");
    const path = eval("require")("path");
    const possiblePaths = [
      path.join(process.cwd(), "data", "mock_db.json"),
      path.join(process.cwd(), "frontend", "data", "mock_db.json"),
      path.join(process.cwd(), "nexbyte", "frontend", "data", "mock_db.json"),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const current = JSON.parse(raw);
        current[key] = data;
        fs.writeFileSync(p, JSON.stringify(current, null, 2), "utf8");
        break;
      }
    }
  } catch {
    // Edge/serverless runtime environment without filesystem write access
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, data } = body;

    if (!key || data === undefined) {
      return NextResponse.json({ error: "Missing key or data" }, { status: 400 });
    }

    const db = loadMemoryDb();

    if (key === "products") {
      const existingProducts: any[] = Array.isArray(db.products) ? [...db.products] : [];
      const incomingList: any[] = Array.isArray(data) ? data : [data];

      for (const item of incomingList) {
        if (!item || typeof item !== "object") continue;
        const index = existingProducts.findIndex(
          (p) =>
            (item.id && p.id === item.id) ||
            (item.sku && p.sku && p.sku.toUpperCase() === item.sku.toUpperCase())
        );

        if (index >= 0) {
          existingProducts[index] = { ...existingProducts[index], ...item };
        } else {
          existingProducts.unshift(item);
        }
      }

      db.products = existingProducts;
      saveMemoryDb(db);
      trySaveDiskDb("products", existingProducts);
      invalidateQueryCache("products");

      return NextResponse.json({
        success: true,
        key: "products",
        count: existingProducts.length,
      });
    }

    if (key === "orders") {
      const existingOrders: any[] = Array.isArray(db.orders) ? [...db.orders] : [];
      const incomingList: any[] = Array.isArray(data) ? data : [data];

      for (const item of incomingList) {
        if (!item || typeof item !== "object") continue;
        const orderKey = item.order_id || item.id;
        if (!orderKey) continue;
        const index = existingOrders.findIndex(
          (o) => (o.order_id && o.order_id === orderKey) || (o.id && o.id === orderKey)
        );

        if (index >= 0) {
          existingOrders[index] = { ...existingOrders[index], ...item };
        } else {
          existingOrders.unshift(item);
        }

        // Background persist to server database/backup
        try {
          dbHelper.orders.create(item).catch(() => {});
        } catch {}
      }

      db.orders = existingOrders;
      saveMemoryDb(db);
      trySaveDiskDb("orders", existingOrders);
      invalidateQueryCache("orders");

      return NextResponse.json({
        success: true,
        key: "orders",
        count: existingOrders.length,
      });
    }

    // Generic key handler
    if (Array.isArray(data)) {
      const existing: any[] = Array.isArray(db[key]) ? [...db[key]] : [];
      for (const item of data) {
        if (!item || typeof item !== "object") continue;
        const index = item.id ? existing.findIndex((e) => e.id === item.id) : -1;
        if (index >= 0) {
          existing[index] = { ...existing[index], ...item };
        } else {
          existing.unshift(item);
        }
      }
      db[key] = existing;
    } else if (typeof data === "object" && data !== null) {
      db[key] = { ...(db[key] || {}), ...data };
    } else {
      db[key] = data;
    }

    saveMemoryDb(db);
    trySaveDiskDb(key, db[key]);
    invalidateQueryCache(key);

    return NextResponse.json({
      success: true,
      key,
      count: Array.isArray(db[key]) ? db[key].length : 1,
    });
  } catch (error: any) {
    console.error("[SYNC-MOCK] Error in sync-mock handler:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync mock data." },
      { status: 500 }
    );
  }
}
