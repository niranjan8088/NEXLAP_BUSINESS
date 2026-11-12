import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export interface ReportKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalServices: number;
  completedServices: number;
  inventoryValuation: number;
  totalCustomers: number;
  totalEnquiries: number;
  totalGstCollected: number;
}

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

function parsePeriodCutoff(period: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = customEnd ? new Date(customEnd) : now;

  if (customStart) {
    return { start: new Date(customStart), end };
  }

  let start = new Date(0); // All time default
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
    const category = searchParams.get("category") || "sales"; // 'sales' | 'services' | 'inventory' | 'enquiries' | 'gst' | 'customers'
    const period = searchParams.get("period") || "30d";
    const customStart = searchParams.get("startDate") || undefined;
    const customEnd = searchParams.get("endDate") || undefined;
    const statusFilter = searchParams.get("status") || "all";
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const { start: periodStart, end: periodEnd } = parsePeriodCutoff(period, customStart, customEnd);

    // Fetch authoritative database records concurrently
    const [orders, bookings, products, enquiries, customers, invoices] = await Promise.all([
      dbHelper.orders.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.products.list().catch(() => []),
      dbHelper.laptopEnquiries.list().catch(() => []),
      dbHelper.customers.list().catch(() => []),
      dbHelper.invoices.list().catch(() => []),
    ]);

    // 1. Calculate Authoritative Global KPIs
    const validOrders = (orders || []).filter(
      (o: any) => o.status !== "cancelled" && o.status !== "failed"
    );

    let totalRevenue = 0;
    validOrders.forEach((o: any) => {
      totalRevenue += Number(o.total_amount || o.total || o.amount || 0);
    });

    let inventoryValuation = 0;
    (products || []).forEach((p: any) => {
      const stock = Math.max(0, Number(p.stock ?? 0));
      const price = Math.max(0, Number(p.price ?? 0));
      inventoryValuation += stock * price;
    });

    const validBookings = bookings || [];
    const completedServices = validBookings.filter((b: any) => b.status === "completed").length;

    let totalGstCollected = 0;
    (invoices || []).forEach((inv: any) => {
      totalGstCollected += Number(inv.gstAmount || inv.gst_amount || 0);
    });

    const kpis: ReportKPIs = {
      totalRevenue,
      totalOrders: validOrders.length,
      totalServices: validBookings.length,
      completedServices,
      inventoryValuation,
      totalCustomers: (customers || []).length,
      totalEnquiries: (enquiries || []).length,
      totalGstCollected,
    };

    // 2. Build Category Specific Report Items
    let rawItems: any[] = [];

    if (category === "sales") {
      rawItems = validOrders.map((o: any) => ({
        id: o.id,
        refCode: o.order_id || `#ORD-${(o.id || "").toString().slice(-6).toUpperCase()}`,
        primaryText: o.customer?.name || o.customerName || "Customer",
        secondaryText: o.customer?.phone || o.phone || "Phone N/A",
        metaText: Array.isArray(o.items) ? `${o.items.length} item(s)` : "1 item",
        amount: Number(o.total_amount || o.total || 0),
        badgeText: o.payment_method || o.paymentMethod || "Razorpay / UPI",
        status: o.status || "confirmed",
        date: o.created_at || new Date().toISOString(),
      }));
    } else if (category === "services") {
      rawItems = validBookings.map((b: any) => ({
        id: b.id,
        refCode: b.bookingId || `#SRV-${(b.id || "").toString().slice(-6).toUpperCase()}`,
        primaryText: b.customerName || b.customer_name || "Customer",
        secondaryText: b.serviceName || b.service_name || "Laptop Diagnostics",
        metaText: b.preferredContact || b.phone || "Doorstep Service",
        amount: Number(b.amount || b.cost || b.estimated_cost || 0),
        badgeText: b.device || "Laptop / PC",
        status: b.status || "pending",
        date: b.booking_date || b.created_at || new Date().toISOString(),
      }));
    } else if (category === "inventory") {
      rawItems = (products || []).map((p: any) => {
        const stock = Math.max(0, Number(p.stock ?? 0));
        const price = Math.max(0, Number(p.price ?? 0));
        const threshold = Number(p.lowStockThreshold || 5);
        const st = stock <= 0 ? "out_of_stock" : stock <= threshold ? "low_stock" : "in_stock";

        return {
          id: p.id,
          refCode: p.sku || `SKU-${(p.id || "").toString().toUpperCase()}`,
          primaryText: p.title || "Untitled Product",
          secondaryText: (p.category || "hardware").replace(/_/g, " ").toUpperCase(),
          metaText: `${stock} units on-hand (Safety: ${threshold})`,
          amount: stock * price,
          badgeText: `Unit: ₹${price.toLocaleString("en-IN")}`,
          status: st,
          date: p.updated_at || p.created_at || new Date().toISOString(),
        };
      });
    } else if (category === "enquiries") {
      rawItems = (enquiries || []).map((e: any) => ({
        id: e.id,
        refCode: e.reference_id || `#ENQ-${(e.id || "").toString().slice(-6).toUpperCase()}`,
        primaryText: e.customer_name || "Enquiry Lead",
        secondaryText: e.product_name || e.laptop_type || e.category || "Business Laptop",
        metaText: `Budget: ${e.budget || "Unspecified"} · Specs: ${e.processor_preference || "Standard"}`,
        amount: Number(e.estimated_budget || 0),
        badgeText: e.priority || "normal",
        status: e.status || "new",
        date: e.created_at || new Date().toISOString(),
      }));
    } else if (category === "gst") {
      rawItems = (invoices || []).map((inv: any) => ({
        id: inv.id,
        refCode: inv.invoiceNumber || inv.invoice_number || `#INV-${(inv.id || "").toString().slice(-6).toUpperCase()}`,
        primaryText: inv.customerName || inv.customer_name || "B2B Client",
        secondaryText: inv.customerGstin ? `GSTIN: ${inv.customerGstin}` : "B2C Consumer",
        metaText: `Taxable: ₹${Number(inv.taxableAmount || 0).toLocaleString("en-IN")} · GST: ₹${Number(inv.gstAmount || 0).toLocaleString("en-IN")}`,
        amount: Number(inv.totalAmount || inv.total_amount || 0),
        badgeText: `Tax: ₹${Number(inv.gstAmount || 0).toLocaleString("en-IN")}`,
        status: inv.paymentStatus || inv.payment_status || "paid",
        date: inv.invoiceDate || inv.created_at || new Date().toISOString(),
      }));
    } else if (category === "customers") {
      rawItems = (customers || []).map((c: any) => ({
        id: c.id,
        refCode: c.phone || `CUST-${(c.id || "").toString().slice(-6).toUpperCase()}`,
        primaryText: c.name || "Registered Client",
        secondaryText: c.email || "Email unavailable",
        metaText: `${c.city || "Bengaluru"} · ${c.orders_count || 0} order(s)`,
        amount: Number(c.total_spent || 0),
        badgeText: c.role || "client",
        status: (c.status || "active").toLowerCase(),
        date: c.created_at || new Date().toISOString(),
      }));
    }

    // 3. Filter Items
    let filtered = rawItems.filter((item) => {
      // Date filtering (except inventory where valuation is current on-hand asset)
      if (category !== "inventory" && period !== "all") {
        const itemDate = new Date(item.date);
        if (!isNaN(itemDate.getTime())) {
          if (itemDate < periodStart || itemDate > periodEnd) return false;
        }
      }

      // Status filtering
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search keyword matching
      if (query) {
        const refMatch = (item.refCode || "").toLowerCase().includes(query);
        const primMatch = (item.primaryText || "").toLowerCase().includes(query);
        const secMatch = (item.secondaryText || "").toLowerCase().includes(query);
        const metaMatch = (item.metaText || "").toLowerCase().includes(query);
        if (!refMatch && !primMatch && !secMatch && !metaMatch) return false;
      }

      return true;
    });

    // 4. Sort Items
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "amount") {
        comparison = (b.amount || 0) - (a.amount || 0);
      } else if (sortBy === "name") {
        comparison = (a.primaryText || "").localeCompare(b.primaryText || "");
      } else if (sortBy === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    // 5. Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json(
      {
        success: true,
        category,
        period,
        kpis,
        items: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate report dataset." },
      { status: 500 }
    );
  }
}

