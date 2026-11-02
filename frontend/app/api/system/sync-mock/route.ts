import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { invalidateQueryCache } from "@/lib/dbHelper";

function getDiskDbPath(): string {
  const fromRoot = path.join(process.cwd(), "nexbyte", "frontend", "data", "mock_db.json");
  if (fs.existsSync(path.dirname(fromRoot))) return fromRoot;
  return path.join(process.cwd(), "data", "mock_db.json");
}

function loadDiskDb(): Record<string, any> {
  try {
    const filePath = getDiskDbPath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.error("[SYNC-MOCK] Error reading mock_db.json:", err);
  }
  return {};
}

function saveDiskDb(db: Record<string, any>) {
  try {
    const filePath = getDiskDbPath();
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf8");
    // Also sync in-memory global reference
    const globalRef = globalThis as any;
    if (globalRef.__nexbyteMockDb) {
      globalRef.__nexbyteMockDb = { ...globalRef.__nexbyteMockDb, ...db };
    }
  } catch (err) {
    console.error("[SYNC-MOCK] Error writing mock_db.json:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, data } = body;

    if (!key || data === undefined) {
      return NextResponse.json({ error: "Missing key or data" }, { status: 400 });
    }

    const db = loadDiskDb();

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
          // Merge updates, preserving existing fields
          existingProducts[index] = { ...existingProducts[index], ...item };
        } else {
          existingProducts.unshift(item);
        }
      }

      db.products = existingProducts;
      saveDiskDb(db);
      invalidateQueryCache("products");

      return NextResponse.json({
        success: true,
        key: "products",
        count: existingProducts.length,
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

    saveDiskDb(db);
    invalidateQueryCache(key);

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error("[SYNC-MOCK] API Error:", err);
    return NextResponse.json({ error: "Internal Server Error in mock sync" }, { status: 500 });
  }
}
