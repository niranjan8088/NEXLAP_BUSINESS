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

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const rawOrders = await dbHelper.orders.list();
    // Normalize fields so admin portal gets consistent total, order_id, customer_name, and items
    const orders = rawOrders.map((o: any) => ({
      ...o,
      id: o.id || o.order_id,
      order_id: o.order_id || o.order_number || o.id,
      customer_name: o.customer_name || o.name || "Customer",
      customer_email: o.email || o.customer_email || "",
      phone: o.phone || o.customer_phone || "",
      total: Number(o.total || o.total_amount || o.grandTotal || 0),
      total_amount: Number(o.total_amount || o.total || 0),
      status: o.status || "Pending",
      created_at: o.created_at || new Date().toISOString(),
      items: Array.isArray(o.items) ? o.items : [],
    }));

    const res = NextResponse.json({ success: true, orders });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Admin Orders Error:", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, tracking_id, tracking_carrier } = body;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (tracking_id !== undefined) updates.tracking_id = tracking_id;
    if (tracking_carrier !== undefined) updates.tracking_carrier = tracking_carrier;

    const updated = await dbHelper.orders.update(id, updates);

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("PATCH Admin Order Error:", err);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
