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

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const [rawCustomers, rawOrders, rawUsers, rawBookings] = await Promise.all([
      dbHelper.customers.list().catch(() => []),
      dbHelper.orders.list().catch(() => []),
      dbHelper.users.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
    ]);

    const customerMap = new Map<string, any>();

    // Build consolidated list
    (rawCustomers || []).forEach((c: any, idx: number) => {
      const key = (c.email || c.phone || c.id || `idx-${idx}`).toLowerCase().trim();
      customerMap.set(key, {
        customerId: c.customerId || `CUST-${String(idx + 1).padStart(3, "0")}`,
        name: c.name || "Customer",
        phone: c.phone || "",
        email: c.email || "",
        city: c.city || "Bengaluru",
        address: c.address || "",
        status: c.status || "active",
        tag: c.tag || "Standard",
        totalBookings: Number(c.totalBookings || 0),
        ordersCount: 0,
        totalSpend: 0,
        created_at: c.created_at || new Date().toISOString(),
      });
    });

    (rawUsers || []).forEach((u: any, idx: number) => {
      if (u.role === "admin" || u.role === "reseller") return;
      const key = (u.email || u.id || `user-${idx}`).toLowerCase().trim();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: u.full_name || u.name || "Customer",
          phone: u.phone || "",
          email: u.email || "",
          city: u.city || "Bengaluru",
          address: u.address || "",
          status: "active",
          tag: "Standard",
          totalBookings: 0,
          ordersCount: 0,
          totalSpend: 0,
          created_at: u.created_at || new Date().toISOString(),
        });
      }
    });

    (rawOrders || []).forEach((o: any) => {
      const email = (o.email || o.customer_email || "").toLowerCase().trim();
      const phone = (o.phone || o.customer_phone || "").replace(/\D/g, "");
      const key = email || phone || o.user_id;
      let target = customerMap.get(key);
      if (!target && email) target = customerMap.get(email);
      if (!target && phone) target = customerMap.get(phone);

      const amount = Number(o.total || o.amount || 0);
      if (target) {
        target.ordersCount += 1;
        if (o.status !== "cancelled") target.totalSpend += amount;
      }
    });

    (rawBookings || []).forEach((b: any) => {
      const email = (b.email || "").toLowerCase().trim();
      const phone = (b.phone || "").replace(/\D/g, "");
      const key = email || phone || b.customer_id;
      let target = customerMap.get(key);
      if (!target && email) target = customerMap.get(email);
      if (!target && phone) target = customerMap.get(phone);

      const amount = Number(b.amount || b.service_cost || 0);
      if (target) {
        target.totalBookings += 1;
        if (b.status !== "cancelled") target.totalSpend += amount;
      }
    });

    const headers = [
      "Customer ID",
      "Full Name",
      "Phone Number",
      "Email Address",
      "City",
      "Full Address",
      "Status",
      "Customer Segment",
      "Total Orders",
      "Total Bookings",
      "Total Spend (INR)",
      "Registered Date",
    ];

    const rows = Array.from(customerMap.values()).map((c) => [
      escapeCsvField(c.customerId),
      escapeCsvField(c.name),
      escapeCsvField(c.phone),
      escapeCsvField(c.email),
      escapeCsvField(c.city),
      escapeCsvField(c.address),
      escapeCsvField(c.status),
      escapeCsvField(c.tag),
      escapeCsvField(c.ordersCount),
      escapeCsvField(c.totalBookings),
      escapeCsvField(c.totalSpend),
      escapeCsvField(c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : ""),
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\r\n");

    const dateStr = new Date().toISOString().split("T")[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexlaptech-customers-${dateStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export Customers CSV Error:", err);
    return NextResponse.json({ error: "Failed to export customer directory." }, { status: 500 });
  }
}

