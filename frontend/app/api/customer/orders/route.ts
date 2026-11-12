import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const cookieStore = await cookies();
    const userSession = cookieStore.get("nexbyte_customer_session")?.value;
    const adminSession = cookieStore.get("nexbyte_admin_session")?.value;

    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email");
    const queryPhone = url.searchParams.get("phone");

    let authUser: { id?: string; email?: string; phone?: string; role?: string } | null = null;
    if (session) {
      authUser = { id: session.id, email: session.email, phone: (session as any).phone, role: session.role };
    } else if (userSession) {
      const parts = userSession.split(":");
      // Format is mock-user:id:email or id:email or phone:email
      const first = parts[0] || "";
      const isMockPrefix = first === "mock-user";
      const id = isMockPrefix ? parts[1] : (parts[1] || parts[0]);
      const email = isMockPrefix ? parts[2] : (parts[2] || (first.includes("@") ? first : undefined));
      const phoneCandidate = !first.includes("@") && !isMockPrefix ? first : undefined;

      authUser = { id, email, phone: phoneCandidate };
    }

    const isAdmin = (session && session.role === "admin") || Boolean(adminSession);

    if (!authUser && !queryEmail && !queryPhone && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const allOrders = await dbHelper.orders.list();
    // If admin is testing/viewing, return all orders
    if (isAdmin || authUser?.role === "admin") {
      const res = NextResponse.json({ orders: allOrders });
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return res;
    }

    // Try finding phone from user record if missing in session
    let userPhone = authUser?.phone;
    if (!userPhone && authUser?.id) {
      try {
        const allUsers = await dbHelper.users.list();
        const u = allUsers.find((usr: any) => usr.id === authUser.id);
        if (u?.phone) userPhone = u.phone;
      } catch {}
    }

    const cleanUserPhone = userPhone ? userPhone.replace(/\D/g, "").slice(-10) : "";
    const cleanQueryPhone = queryPhone ? queryPhone.replace(/\D/g, "").slice(-10) : "";
    const targetEmail = (authUser?.email || queryEmail || "").toLowerCase();

    const ownOrders = allOrders.filter((o: any) => {
      const orderPhone = (o.phone || "").replace(/\D/g, "").slice(-10);
      const orderEmail = (o.email || "").toLowerCase();

      const matchId = authUser?.id && (o.user_id === authUser.id || o.customer_id === authUser.id);
      const matchEmail = targetEmail && orderEmail && orderEmail === targetEmail;
      const matchPhone = (cleanUserPhone && orderPhone && orderPhone === cleanUserPhone) ||
                         (cleanQueryPhone && orderPhone && orderPhone === cleanQueryPhone);

      return matchId || matchEmail || matchPhone;
    });

    const res = NextResponse.json({ orders: ownOrders });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Customer Orders Error:", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
