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

function getInitials(name?: string): string {
  if (!name || typeof name !== "string") return "CU";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizeKey(str?: string | null): string {
  return (str || "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "all").toLowerCase();
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const [rawCustomers, rawOrders, rawUsers, rawBookings, rawEnquiries] = await Promise.all([
      dbHelper.customers.list().catch(() => []),
      dbHelper.orders.list().catch(() => []),
      dbHelper.users.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.laptopEnquiries.list().catch(() => []),
    ]);

    const customerMap = new Map<string, any>();

    const isCleanCustomerName = (n?: string | null) =>
      Boolean(n && typeof n === "string" && !n.toLowerCase().includes("demo") && n.trim().toLowerCase() !== "customer");

    // 1. Populate registered customers table
    (rawCustomers || []).forEach((c: any, idx: number) => {
      const key = (c.email || c.phone || c.id || `idx-${idx}`).toLowerCase().trim();
      const cleanName = isCleanCustomerName(c.name) ? c.name : "";
      customerMap.set(key, {
        id: c.id || `cust-${idx + 1}`,
        customerId: c.customerId || `CUST-${String(idx + 1).padStart(3, "0")}`,
        name: cleanName || "Customer",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "Bengaluru",
        notes: c.notes || "",
        status: c.status || "active",
        tag: c.tag || "Standard",
        totalBookings: Number(c.totalBookings || 0),
        reviewsCount: Number(c.reviewsCount || 0),
        certificatesCount: Number(c.certificatesCount || 0),
        productsPurchased: c.productsPurchased || "",
        servicesTaken: c.servicesTaken || "",
        ordersCount: 0,
        bookingsCount: 0,
        enquiriesCount: 0,
        totalSpend: 0,
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || c.created_at || new Date().toISOString(),
      });
    });

    // 2. Merge registered user accounts (role === "user" or "customer")
    (rawUsers || []).forEach((u: any, idx: number) => {
      if (u.role === "admin" || u.role === "reseller") return;
      const key = (u.email || u.id || `user-${idx}`).toLowerCase().trim();
      const existing = customerMap.get(key);
      const cleanName = isCleanCustomerName(u.full_name) ? u.full_name : (isCleanCustomerName(u.name) ? u.name : "");

      if (!existing) {
        customerMap.set(key, {
          id: u.id || `cust-${customerMap.size + 1}`,
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: cleanName || (u.email ? u.email.split("@")[0] : "Customer"),
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          city: u.city || "Bengaluru",
          notes: "",
          status: "active",
          tag: "Standard",
          totalBookings: 0,
          reviewsCount: 0,
          certificatesCount: 0,
          productsPurchased: "",
          servicesTaken: "",
          ordersCount: 0,
          bookingsCount: 0,
          enquiriesCount: 0,
          totalSpend: 0,
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.created_at || new Date().toISOString(),
        });
      } else {
        if (!existing.phone && u.phone) existing.phone = u.phone;
        if (cleanName && (!existing.name || existing.name === "Customer")) existing.name = cleanName;
        if (!existing.city && u.city) existing.city = u.city;
        if (!existing.address && u.address) existing.address = u.address;
      }
    });

    // 3. Integrate customer orders
    (rawOrders || []).forEach((o: any) => {
      const email = normalizeKey(o.email || o.customer_email);
      const phone = normalizeKey(o.phone || o.customer_phone);
      const name = isCleanCustomerName(o.customer_name) ? o.customer_name : (isCleanCustomerName(o.name) ? o.name : "");
      const key = email || phone || normalizeKey(o.user_id) || normalizeKey(o.id);

      let target = customerMap.get(key);
      if (!target && email) target = customerMap.get(email);
      if (!target && phone) target = customerMap.get(phone);

      const itemsPurchased = Array.isArray(o.items)
        ? o.items.map((i: any) => i.title || i.name).filter(Boolean).join(", ")
        : "";
      const orderAmount = Number(o.total || o.amount || o.final_amount || 0);

      if (target) {
        target.ordersCount += 1;
        if (o.status !== "cancelled") {
          target.totalSpend += orderAmount;
        }
        if (itemsPurchased && !target.productsPurchased.includes(itemsPurchased)) {
          target.productsPurchased = [target.productsPurchased, itemsPurchased].filter(Boolean).join(", ");
        }
        if (!target.phone && phone) target.phone = o.phone || o.customer_phone || "";
        if (!target.address && o.shipping_address) {
          target.address =
            typeof o.shipping_address === "string"
              ? o.shipping_address
              : `${o.shipping_address.addressLine1 || ""}, ${o.shipping_address.city || ""}`;
          target.city = o.shipping_address.city || target.city;
        }
      } else if (email || phone) {
        const newId = o.user_id || `cust-${customerMap.size + 1}`;
        customerMap.set(key, {
          id: newId,
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: name || (email ? email.split("@")[0] : "Customer"),
          email: o.email || o.customer_email || "",
          phone: o.phone || o.customer_phone || "",
          address:
            typeof o.shipping_address === "string"
              ? o.shipping_address
              : o.shipping_address
              ? `${o.shipping_address.addressLine1 || ""}, ${o.shipping_address.city || ""}`
              : "",
          city: o.shipping_address?.city || "Bengaluru",
          notes: "",
          status: "active",
          tag: orderAmount > 25000 ? "VIP" : "Standard",
          totalBookings: 0,
          reviewsCount: 0,
          certificatesCount: 0,
          productsPurchased: itemsPurchased || "Hardware Product",
          servicesTaken: "",
          ordersCount: 1,
          bookingsCount: 0,
          enquiriesCount: 0,
          totalSpend: o.status !== "cancelled" ? orderAmount : 0,
          created_at: o.created_at || new Date().toISOString(),
          updated_at: o.created_at || new Date().toISOString(),
        });
      }
    });

    // 4. Integrate Service Bookings
    (rawBookings || []).forEach((b: any) => {
      const email = normalizeKey(b.email);
      const phone = normalizeKey(b.phone);
      const name = isCleanCustomerName(b.customer_name) ? b.customer_name : (isCleanCustomerName(b.name) ? b.name : "");
      const key = email || phone || normalizeKey(b.customer_id) || normalizeKey(b.id);

      let target = customerMap.get(key);
      if (!target && email) target = customerMap.get(email);
      if (!target && phone) target = customerMap.get(phone);

      const serviceName = b.service_name || b.serviceTitle || b.service || "IT Service";
      const bookingAmount = Number(b.amount || b.service_cost || b.estimated_charges || 0);

      if (target) {
        target.bookingsCount += 1;
        target.totalBookings = Math.max(target.totalBookings, target.bookingsCount);
        if (bookingAmount && b.status !== "cancelled") {
          target.totalSpend += bookingAmount;
        }
        if (serviceName && !target.servicesTaken.includes(serviceName)) {
          target.servicesTaken = [target.servicesTaken, serviceName].filter(Boolean).join(", ");
        }
        if (!target.phone && b.phone) target.phone = b.phone;
        if (!target.email && b.email) target.email = b.email;
      } else if (email || phone) {
        const newId = b.customer_id || `cust-${customerMap.size + 1}`;
        customerMap.set(key, {
          id: newId,
          customerId: `CUST-${String(customerMap.size + 1).padStart(3, "0")}`,
          name: name || (email ? email.split("@")[0] : "Customer"),
          email: b.email || "",
          phone: b.phone || "",
          address: b.address || "",
          city: b.city || "Bengaluru",
          notes: b.notes || "",
          status: "active",
          tag: "Standard",
          totalBookings: 1,
          reviewsCount: 0,
          certificatesCount: 0,
          productsPurchased: "",
          servicesTaken: serviceName,
          ordersCount: 0,
          bookingsCount: 1,
          enquiriesCount: 0,
          totalSpend: b.status !== "cancelled" ? bookingAmount : 0,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.created_at || new Date().toISOString(),
        });
      }
    });

    // 5. Integrate Laptop Enquiries
    (rawEnquiries || []).forEach((e: any) => {
      const email = normalizeKey(e.email);
      const phone = normalizeKey(e.phone);
      const key = email || phone || normalizeKey(e.id);

      let target = customerMap.get(key);
      if (!target && email) target = customerMap.get(email);
      if (!target && phone) target = customerMap.get(phone);

      if (target) {
        target.enquiriesCount += 1;
        const item = e.laptop_type || e.brand || e.model;
        if (item && !target.productsPurchased.includes(item)) {
          target.productsPurchased = [target.productsPurchased, item].filter(Boolean).join(", ");
        }
      }
    });

    // Compute tags, initials, and AOV
    const allCustomers = Array.from(customerMap.values()).map((c) => {
      const totalActivities = (c.ordersCount || 0) + (c.bookingsCount || 0);
      const aov = totalActivities > 0 ? Math.round(c.totalSpend / totalActivities) : 0;
      
      let computedTag = c.tag || "Standard";
      if (c.totalSpend >= 25000 || c.totalBookings >= 3 || (c.ordersCount + c.bookingsCount) >= 3) {
        computedTag = "VIP";
      } else if (
        (c.address && c.address.toLowerCase().includes("ltd")) ||
        (c.notes && c.notes.toLowerCase().includes("amc")) ||
        (c.servicesTaken && c.servicesTaken.toLowerCase().includes("amc"))
      ) {
        computedTag = "Business";
      }

      return {
        ...c,
        tag: computedTag,
        aov,
        initials: getInitials(c.name),
      };
    });

    // Real KPI Stats computed over all customers
    const stats = {
      totalCustomers: allCustomers.length,
      activeAccounts: allCustomers.filter((c) => c.status === "active").length,
      vipAccounts: allCustomers.filter((c) => c.tag === "VIP" || c.tag === "Business").length,
      totalRevenue: allCustomers.reduce((acc, c) => acc + (c.totalSpend || 0), 0),
      totalBookingsAndOrders: allCustomers.reduce((acc, c) => acc + (c.ordersCount || 0) + (c.bookingsCount || 0), 0),
    };

    // Filter by Search Query
    let filtered = allCustomers;
    if (query) {
      filtered = filtered.filter((c) => {
        return (
          c.name?.toLowerCase().includes(query) ||
          c.phone?.includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query) ||
          c.customerId?.toLowerCase().includes(query) ||
          c.productsPurchased?.toLowerCase().includes(query) ||
          c.servicesTaken?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by Status / Tag
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        if (statusFilter === "active") return c.status === "active";
        if (statusFilter === "inactive") return c.status === "inactive";
        if (statusFilter === "vip") return c.tag === "VIP";
        if (statusFilter === "business") return c.tag === "Business";
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "name") {
        comp = (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "totalSpend") {
        comp = (a.totalSpend || 0) - (b.totalSpend || 0);
      } else if (sortBy === "totalBookings") {
        comp = (a.totalBookings || 0) - (b.totalBookings || 0);
      } else {
        // default: created_at
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comp = dateA - dateB;
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = filtered.slice(startIndex, startIndex + limit);

    const res = NextResponse.json({
      success: true,
      customers: paginatedCustomers,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Admin Customers Error:", err);
    return NextResponse.json({ error: "Failed to fetch customer directories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, city, address, notes, status, tag } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Customer phone number is required." }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please provide a valid 10-digit phone number." }, { status: 400 });
    }

    // Check duplicate customer by phone or email
    const existingList = await dbHelper.customers.list().catch(() => []);
    const isDuplicate = existingList.some((c: any) => {
      const matchPhone = c.phone && c.phone.replace(/\D/g, "") === cleanPhone;
      const matchEmail = email && c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase();
      return matchPhone || matchEmail;
    });

    if (isDuplicate) {
      return NextResponse.json(
        { error: "A customer with this phone number or email address already exists in the directory." },
        { status: 409 }
      );
    }

    const newCustomer = await dbHelper.customers.create({
      name: name.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      city: (city || "Bengaluru").trim(),
      address: (address || "").trim(),
      notes: (notes || "").trim(),
      status: status || "active",
      tag: tag || "Standard",
      totalBookings: 0,
      reviewsCount: 0,
      certificatesCount: 0,
      productsPurchased: "",
      servicesTaken: "",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (err: any) {
    console.error("POST Admin Customer Error:", err);
    return NextResponse.json({ error: "Failed to create customer record." }, { status: 500 });
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

    // Sanitize updates
    if (updates.email) updates.email = updates.email.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.name) updates.name = updates.name.trim();
    updates.updated_at = new Date().toISOString();

    const updated = await dbHelper.customers.update(id, updates);
    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    console.error("PATCH Admin Customer Error:", err);
    return NextResponse.json({ error: "Failed to update customer directory." }, { status: 500 });
  }
}
