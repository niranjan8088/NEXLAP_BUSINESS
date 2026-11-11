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

    const rawCustomers = await dbHelper.customers.list().catch(() => []);
    const rawOrders = await dbHelper.orders.list().catch(() => []);
    const rawUsers = await dbHelper.users.list().catch(() => []);

    // Create a unified customer map by email / phone / id
    const customerMap = new Map<string, any>();

    // 1. Populate registered customers table
    rawCustomers.forEach((c: any, idx: number) => {
      const key = (c.email || c.phone || c.id || `idx-${idx}`).toLowerCase();
      const cleanName = c.name === "Demo Customer" ? "" : c.name;
      customerMap.set(key, {
        id: c.id || `cust-${idx + 1}`,
        customerId: c.customerId || `CUST-${String(idx + 1).padStart(3, "0")}`,
        name: cleanName || "Customer",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "",
        totalBookings: Number(c.totalBookings || 0),
        reviewsCount: Number(c.reviewsCount || 0),
        certificatesCount: Number(c.certificatesCount || 0),
        productsPurchased: c.productsPurchased || "",
        servicesTaken: c.servicesTaken || "",
        created_at: c.created_at || new Date().toISOString(),
      });
    });

    // 2. Merge registered user accounts (role === "user" or customer)
    rawUsers.forEach((u: any, idx: number) => {
      if (u.role === "admin" || u.role === "reseller") return;
      const key = (u.email || u.id || `user-${idx}`).toLowerCase();
      const existing = customerMap.get(key);
      const cleanName = u.full_name === "Demo Customer" ? "" : (u.full_name || u.name);

      if (!existing) {
        customerMap.set(key, {
          id: u.id || `cust-${customerMap.size + 1}`,
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: cleanName || (u.email ? u.email.split("@")[0] : "Customer"),
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          city: u.city || "",
          totalBookings: 0,
          reviewsCount: 0,
          certificatesCount: 0,
          productsPurchased: "",
          servicesTaken: "",
          created_at: u.created_at || new Date().toISOString(),
        });
      } else {
        if (!existing.phone && u.phone) existing.phone = u.phone;
        if (cleanName && (!existing.name || existing.name === "Customer")) existing.name = cleanName;
      }
    });

    // 4. Integrate customer info from orders (including Order #NB-ORD-...)
    rawOrders.forEach((o: any) => {
      const email = (o.email || o.customer_email || "").toLowerCase();
      const phone = o.phone || o.customer_phone || "";
      const name = o.customer_name === "Demo Customer" ? "" : (o.customer_name || o.name || "");
      const key = (email || phone || o.user_id || o.id).toLowerCase();

      const existing = customerMap.get(key);
      const itemsPurchased = Array.isArray(o.items)
        ? o.items.map((i: any) => i.title || i.name).filter(Boolean).join(", ")
        : "";

      if (existing) {
        existing.totalBookings = Math.max(existing.totalBookings, 1);
        if (itemsPurchased && !existing.productsPurchased.includes(itemsPurchased)) {
          existing.productsPurchased = [existing.productsPurchased, itemsPurchased].filter(Boolean).join(", ");
        }
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.address && o.shipping_address) {
          existing.address =
            typeof o.shipping_address === "string"
              ? o.shipping_address
              : `${o.shipping_address.addressLine1 || ""}, ${o.shipping_address.city || ""}`;
          existing.city = o.shipping_address.city || existing.city;
        }
      } else if (email || phone) {
        customerMap.set(key, {
          id: o.user_id || `cust-${customerMap.size + 1}`,
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: name || (email ? email.split("@")[0] : "Customer"),
          email: email || "",
          phone: phone || "",
          address:
            typeof o.shipping_address === "string"
              ? o.shipping_address
              : o.shipping_address
              ? `${o.shipping_address.addressLine1 || ""}, ${o.shipping_address.city || ""}`
              : "",
          city: o.shipping_address?.city || "Bengaluru",
          totalBookings: 1,
          reviewsCount: 0,
          certificatesCount: 0,
          productsPurchased: itemsPurchased || "Hardware Product",
          servicesTaken: "",
          created_at: o.created_at || new Date().toISOString(),
        });
      }
    });

    const customers = Array.from(customerMap.values());
    const res = NextResponse.json({ success: true, customers });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Admin Customers Error:", err);
    return NextResponse.json({ error: "Failed to fetch customer directories." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    const updated = await dbHelper.customers.update(id, updates);
    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    console.error("PATCH Admin Customer Error:", err);
    return NextResponse.json({ error: "Failed to update customer directory." }, { status: 500 });
  }
}
