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
    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    // 1. Fetch customer from primary customers list or users
    const [rawCustomers, rawUsers] = await Promise.all([
      dbHelper.customers.list().catch(() => []),
      dbHelper.users.list().catch(() => []),
    ]);

    const targetCustomer =
      (rawCustomers || []).find((c: any) => c.id === id || c.customerId === id) ||
      (rawUsers || []).find((u: any) => u.id === id);

    if (!targetCustomer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const email = (targetCustomer.email || "").toLowerCase().trim();
    const phone = (targetCustomer.phone || "").replace(/\D/g, "");

    // 2. Fetch on-demand sub-resources
    const [allOrders, allBookings, allEnquiries, allInvoices] = await Promise.all([
      dbHelper.orders.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.laptopEnquiries.list().catch(() => []),
      dbHelper.invoices.list().catch(() => []),
    ]);

    const matchedOrders = (allOrders || []).filter((o: any) => {
      const oEmail = (o.email || o.customer_email || "").toLowerCase().trim();
      const oPhone = (o.phone || o.customer_phone || "").replace(/\D/g, "");
      const oUserId = o.user_id || o.customerId;
      return (
        (email && oEmail === email) ||
        (phone && oPhone && oPhone.slice(-10) === phone.slice(-10)) ||
        oUserId === id
      );
    });

    const matchedBookings = (allBookings || []).filter((b: any) => {
      const bEmail = (b.email || "").toLowerCase().trim();
      const bPhone = (b.phone || "").replace(/\D/g, "");
      const bCustId = b.customer_id;
      return (
        (email && bEmail === email) ||
        (phone && bPhone && bPhone.slice(-10) === phone.slice(-10)) ||
        bCustId === id
      );
    });

    const matchedEnquiries = (allEnquiries || []).filter((e: any) => {
      const eEmail = (e.email || "").toLowerCase().trim();
      const ePhone = (e.phone || "").replace(/\D/g, "");
      return (
        (email && eEmail === email) ||
        (phone && ePhone && ePhone.slice(-10) === phone.slice(-10))
      );
    });

    const matchedInvoices = (allInvoices || []).filter((inv: any) => {
      const invEmail = (inv.customerEmail || inv.email || "").toLowerCase().trim();
      const invPhone = (inv.customerPhone || inv.phone || "").replace(/\D/g, "");
      const invCustId = inv.customerId;
      return (
        (email && invEmail === email) ||
        (phone && invPhone && invPhone.slice(-10) === phone.slice(-10)) ||
        invCustId === id
      );
    });

    // Compute aggregated metrics
    const totalSpend =
      matchedOrders.reduce((sum: number, o: any) => sum + (o.status !== "cancelled" ? Number(o.total || o.amount || 0) : 0), 0) +
      matchedBookings.reduce((sum: number, b: any) => sum + (b.status !== "cancelled" ? Number(b.amount || b.service_cost || 0) : 0), 0);

    const fullProfile = {
      ...targetCustomer,
      orders: matchedOrders,
      bookings: matchedBookings,
      enquiries: matchedEnquiries,
      invoices: matchedInvoices,
      metrics: {
        totalOrders: matchedOrders.length,
        totalBookings: matchedBookings.length,
        totalEnquiries: matchedEnquiries.length,
        totalInvoices: matchedInvoices.length,
        totalSpend,
        averageOrderValue: (matchedOrders.length + matchedBookings.length) > 0
          ? Math.round(totalSpend / (matchedOrders.length + matchedBookings.length))
          : 0,
      },
    };

    const res = NextResponse.json({ success: true, customer: fullProfile });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Customer by ID Error:", err);
    return NextResponse.json({ error: "Failed to fetch customer profile." }, { status: 500 });
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

    const updated = await dbHelper.customers.update(id, {
      ...body,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    console.error("PUT Customer Error:", err);
    return NextResponse.json({ error: "Failed to update customer." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    await dbHelper.customers.delete(id);
    return NextResponse.json({ success: true, message: "Customer profile deleted successfully." });
  } catch (err: any) {
    console.error("DELETE Customer Error:", err);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}

