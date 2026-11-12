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

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function computeStatus(qty: number, threshold: number): string {
  if (qty <= 0) return "Out of Stock";
  if (qty <= threshold) return "Low Stock Alert";
  return "In Stock";
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const allProducts = await dbHelper.products.list().catch(() => []);

    const rows: string[] = [];
    const headers = [
      "SKU",
      "Product Title",
      "Variant / Configuration",
      "Category",
      "Stock Units",
      "Low-Stock Threshold",
      "Inventory Status",
      "Unit Price (INR)",
      "Total Inventory Valuation (INR)",
      "Last Updated",
    ];

    rows.push(headers.map(escapeCsvField).join(","));

    allProducts.forEach((p: any) => {
      const pSku = p.sku || `SKU-${(p.id || "").toString().toUpperCase()}`;
      const pUpdated = p.updated_at || p.created_at || new Date().toISOString();
      const pCategory = (p.category || "hardware").replace(/_/g, " ");

      if (Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v: any, vIdx: number) => {
          const vSku = v.sku || `${pSku}-V${vIdx + 1}`;
          const vStock = Math.max(0, Number(v.stock ?? p.stock ?? 0));
          const vPrice = Math.max(0, Number(v.price ?? p.price ?? 0));
          const vThreshold = Number(v.lowStockThreshold ?? p.lowStockThreshold ?? 5);
          const vStatus = computeStatus(vStock, vThreshold);
          const vValuation = vStock * vPrice;

          rows.push(
            [
              vSku,
              p.title || "Untitled Product",
              v.name || v.label || `Variant ${vIdx + 1}`,
              pCategory,
              vStock,
              vThreshold,
              vStatus,
              vPrice,
              vValuation,
              v.updated_at || pUpdated,
            ]
              .map(escapeCsvField)
              .join(",")
          );
        });
      } else {
        const pStock = Math.max(0, Number(p.stock ?? 0));
        const pPrice = Math.max(0, Number(p.price ?? 0));
        const pThreshold = Number(p.lowStockThreshold ?? 5);
        const pStatus = computeStatus(pStock, pThreshold);
        const pValuation = pStock * pPrice;

        rows.push(
          [
            pSku,
            p.title || "Untitled Product",
            "Base Product",
            pCategory,
            pStock,
            pThreshold,
            pStatus,
            pPrice,
            pValuation,
            pUpdated,
          ]
            .map(escapeCsvField)
            .join(",")
        );
      }
    });

    const csvContent = rows.join("\r\n");
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexbyte-hardware-inventory-${dateStamp}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export inventory CSV." },
      { status: 500 }
    );
  }
}

