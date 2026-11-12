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

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const [orders, bookings, customers, products] = await Promise.all([
      dbHelper.orders.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.customers.list().catch(() => []),
      dbHelper.products.list().catch(() => []),
    ]);

    const validOrders = (orders || []).filter(
      (o: any) => o.status !== "cancelled" && o.status !== "failed"
    );

    let grossRevenue = 0;
    validOrders.forEach((o: any) => {
      grossRevenue += Number(o.total_amount || o.total || o.amount || 0);
    });

    let inventoryValuation = 0;
    (products || []).forEach((p: any) => {
      inventoryValuation += Math.max(0, Number(p.stock ?? 0)) * Math.max(0, Number(p.price ?? 0));
    });

    const rows: string[] = [];

    // Header 1: Executive Financial Overview
    rows.push(escapeCsvField("=== NEXLAPTECH EXECUTIVE ANALYTICS SUMMARY ==="));
    rows.push(["Metric", "Value", "Notes"].map(escapeCsvField).join(","));
    rows.push(["Gross Hardware Revenue", `INR ${grossRevenue.toLocaleString("en-IN")}`, "Authoritative confirmed orders"].map(escapeCsvField).join(","));
    rows.push(["Total Orders", validOrders.length, "Excludes cancelled/failed"].map(escapeCsvField).join(","));
    rows.push(["Total Service Bookings", (bookings || []).length, "Diagnostics & Doorstep Repairs"].map(escapeCsvField).join(","));
    rows.push(["Registered Clients", (customers || []).length, "Active customer database"].map(escapeCsvField).join(","));
    rows.push(["Total Inventory Valuation", `INR ${inventoryValuation.toLocaleString("en-IN")}`, "Hardware on-hand valuation"].map(escapeCsvField).join(","));
    rows.push("");

    // Header 2: Order Details
    rows.push(escapeCsvField("=== RECENT VALID ORDERS ==="));
    const orderHeaders = ["Order ID", "Date", "Customer Name", "Status", "Amount (INR)", "Items Count"];
    rows.push(orderHeaders.map(escapeCsvField).join(","));

    validOrders.slice(0, 100).forEach((o: any) => {
      rows.push(
        [
          o.order_id || o.id,
          o.created_at || "",
          o.customer?.name || o.customerName || "Customer",
          o.status || "confirmed",
          Number(o.total_amount || o.total || 0),
          Array.isArray(o.items) ? o.items.length : 1,
        ]
          .map(escapeCsvField)
          .join(",")
      );
    });

    const csvContent = rows.join("\r\n");
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexbyte-executive-analytics-${dateStamp}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export analytics CSV." },
      { status: 500 }
    );
  }
}

