import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();
    const cookieStore = await cookies();
    const userSession = cookieStore.get("nexbyte_customer_session")?.value;

    let authUser: { id?: string; email?: string; phone?: string; role?: string } | null = null;
    if (session) {
      authUser = { id: session.id, email: session.email, phone: (session as any).phone, role: session.role };
    } else if (userSession) {
      const parts = userSession.split(":");
      authUser = { id: parts[1] || parts[0], email: parts[2] || parts[0], phone: parts[0] };
    }

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const allOrders = await dbHelper.orders.list();
    // If admin is testing/viewing, return all orders; otherwise filter to customer's own orders
    if (authUser.role === "admin") {
      return NextResponse.json({ orders: allOrders });
    }

    const ownOrders = allOrders.filter((o: any) => {
      const matchId = authUser?.id && (o.user_id === authUser.id || o.customer_id === authUser.id);
      const matchEmail = authUser?.email && o.email && o.email.toLowerCase() === authUser.email.toLowerCase();
      const matchPhone = authUser?.phone && o.phone && o.phone.replace(/\D/g, "") === authUser.phone.replace(/\D/g, "");
      return matchId || matchEmail || matchPhone;
    });

    return NextResponse.json({ orders: ownOrders });
  } catch (err: any) {
    console.error("GET Customer Orders Error:", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
