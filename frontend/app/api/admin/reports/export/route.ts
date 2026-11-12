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

function parsePeriodCutoff(period: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = customEnd ? new Date(customEnd) : now;

  if (customStart) {
    return { start: new Date(customStart), end };
  }

  let start = new Date(0);
  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "7d") {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), qMonth, 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end };
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "sales";
    const period = searchParams.get("period") || "30d";
    const statusFilter = searchParams.get("status") || "all";

    const { start: periodStart, end: periodEnd } = parsePeriodCutoff(period);

    const [orders, bookings, products, enquiries, customers, invoices] = await Promise.all([
      dbHelper.orders.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.products.list().catch(() => []),
      dbHelper.laptopEnquiries.list().catch(() => []),
      dbHelper.customers.list().catch(() => []),
      dbHelper.invoices.list().catch(() => []),
    ]);

    const rows: string[] = [];
    let headers: string[] = [];

    if (category === "sales") {
      headers = ["Order Reference", "Date", "Customer Name", "Customer Phone", "Items Count", "Payment Method", "Status", "Total Amount (INR)"];
      rows.push(headers.map(escapeCsvField).join(","));

      const validOrders = (orders || []).filter((o: any) => o.status !== "cancelled" && o.status !== "failed");
      validOrders.forEach((o: any) => {
        const d = new Date(o.created_at || "");
        if (period !== "all" && !isNaN(d.getTime())) {
          if (d < periodStart || d > periodEnd) return;
        }
        if (statusFilter !== "all" && o.status !== statusFilter) return;

        rows.push([
          o.order_id || o.id,
          o.created_at || "",
          o.customer?.name || o.customerName || "Customer",
          o.customer?.phone || o.phone || "",
          Array.isArray(o.items) ? o.items.length : 1,
          o.payment_method || o.paymentMethod || "UPI",
          o.status || "confirmed",
          Number(o.total_amount || o.total || 0),
        ].map(escapeCsvField).join(","));
      });
    } else if (category === "services") {
      headers = ["Booking ID", "Date", "Customer Name", "Phone", "Service Type", "Device Model", "Status", "Estimated Cost (INR)"];
      rows.push(headers.map(escapeCsvField).join(","));

      (bookings || []).forEach((b: any) => {
        const d = new Date(b.booking_date || b.created_at || "");
        if (period !== "all" && !isNaN(d.getTime())) {
          if (d < periodStart || d > periodEnd) return;
        }
        if (statusFilter !== "all" && b.status !== statusFilter) return;

        rows.push([
          b.bookingId || b.id,
          b.booking_date || b.created_at || "",
          b.customerName || b.customer_name || "Customer",
          b.phone || "",
          b.serviceName || b.service_name || "Repair",
          b.device || "Laptop",
          b.status || "pending",
          Number(b.amount || b.cost || b.estimated_cost || 0),
        ].map(escapeCsvField).join(","));
      });
    } else if (category === "inventory") {
      headers = ["SKU Code", "Product Title", "Category", "On-Hand Stock", "Safety Threshold", "Unit Price (INR)", "Total Asset Valuation (INR)", "Stock Status"];
      rows.push(headers.map(escapeCsvField).join(","));

      (products || []).forEach((p: any) => {
        const stock = Math.max(0, Number(p.stock ?? 0));
        const price = Math.max(0, Number(p.price ?? 0));
        const threshold = Number(p.lowStockThreshold || 5);
        const st = stock <= 0 ? "out_of_stock" : stock <= threshold ? "low_stock" : "in_stock";
        if (statusFilter !== "all" && st !== statusFilter) return;

        rows.push([
          p.sku || `SKU-${p.id}`,
          p.title || "",
          p.category || "hardware",
          stock,
          threshold,
          price,
          stock * price,
          st.toUpperCase(),
        ].map(escapeCsvField).join(","));
      });
    } else if (category === "gst") {
      headers = ["Invoice Number", "Invoice Date", "Customer Name", "Customer GSTIN", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total Value (INR)", "Payment Status"];
      rows.push(headers.map(escapeCsvField).join(","));

      (invoices || []).forEach((inv: any) => {
        const d = new Date(inv.invoiceDate || inv.created_at || "");
        if (period !== "all" && !isNaN(d.getTime())) {
          if (d < periodStart || d > periodEnd) return;
        }
        if (statusFilter !== "all" && inv.paymentStatus !== statusFilter) return;

        rows.push([
          inv.invoiceNumber || inv.id,
          inv.invoiceDate || inv.created_at || "",
          inv.customerName || "",
          inv.customerGstin || "Unregistered B2C",
          Number(inv.taxableAmount || 0),
          Number(inv.cgst || 0),
          Number(inv.sgst || 0),
          Number(inv.igst || 0),
          Number(inv.totalAmount || 0),
          inv.paymentStatus || "paid",
        ].map(escapeCsvField).join(","));
      });
    } else {
      // Default / Customers
      headers = ["Customer Phone", "Name", "Email", "City", "Total Orders", "Total Spent (INR)", "Registered Date"];
      rows.push(headers.map(escapeCsvField).join(","));

      (customers || []).forEach((c: any) => {
        rows.push([
          c.phone || "",
          c.name || "",
          c.email || "",
          c.city || "Bengaluru",
          c.orders_count || 0,
          Number(c.total_spent || 0),
          c.created_at || "",
        ].map(escapeCsvField).join(","));
      });
    }

    const csvContent = rows.join("\r\n");
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexbyte-${category}-report-${period}-${dateStamp}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export report CSV." },
      { status: 500 }
    );
  }
}

