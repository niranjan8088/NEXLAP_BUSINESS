import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  bookings: number;
}

export interface CategoryBreakdownItem {
  category: string;
  label: string;
  revenue: number;
  units: number;
  percentage: number;
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopProductItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  revenue: number;
  unitsSold: number;
}

export interface RecentTransactionItem {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  amount: number;
  status: string;
  itemCount: number;
}

export interface AnalyticsSummaryResponse {
  timeframe: string;
  kpis: {
    grossRevenue: number;
    periodRevenue: number;
    previousPeriodRevenue: number;
    revenueGrowthPct: number;
    totalOrders: number;
    periodOrders: number;
    ordersGrowthPct: number;
    averageOrderValue: number;
    unitsSold: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    registeredClients: number;
    newClientsInPeriod: number;
    averageRating: number;
    reviewCount: number;
    totalInventoryValuation: number;
    lowStockCount: number;
  };
  timeSeries: TimeSeriesPoint[];
  categories: CategoryBreakdownItem[];
  orderStatuses: StatusDistributionItem[];
  topProducts: TopProductItem[];
  recentTransactions: RecentTransactionItem[];
  lastUpdated: string;
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

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30d"; // '7d' | '30d' | '90d' | '1y'

    // Determine timeframe boundaries
    const now = new Date();
    let daysInPeriod = 30;
    if (timeframe === "7d") daysInPeriod = 7;
    else if (timeframe === "90d") daysInPeriod = 90;
    else if (timeframe === "1y") daysInPeriod = 365;

    const periodStart = new Date(now.getTime() - daysInPeriod * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - daysInPeriod * 2 * 24 * 60 * 60 * 1000);

    // Fetch actual database records concurrently
    const [orders, bookings, customers, reviews, products] = await Promise.all([
      dbHelper.orders.list().catch(() => []),
      dbHelper.bookings.list().catch(() => []),
      dbHelper.customers.list().catch(() => []),
      dbHelper.reviews.list().catch(() => []),
      dbHelper.products.list().catch(() => []),
    ]);

    // Filter valid orders (ignore cancelled/failed)
    const validOrders = (orders || []).filter(
      (o: any) => o.status !== "cancelled" && o.status !== "failed"
    );

    // 1. Calculate Gross & Period Financial KPIs
    let grossRevenue = 0;
    let periodRevenue = 0;
    let previousPeriodRevenue = 0;
    let periodOrdersCount = 0;
    let previousPeriodOrdersCount = 0;
    let totalUnitsSold = 0;

    const productSalesMap: Record<string, { id: string; title: string; sku: string; category: string; revenue: number; units: number }> = {};
    const categoryRevenueMap: Record<string, { revenue: number; units: number }> = {};
    const statusCountMap: Record<string, number> = {
      completed: 0,
      delivered: 0,
      shipped: 0,
      processing: 0,
      confirmed: 0,
      pending: 0,
    };

    validOrders.forEach((o: any) => {
      const orderDate = new Date(o.created_at || now.toISOString());
      const amount = Number(o.total_amount || o.total || o.amount || 0);
      const isCurrentPeriod = orderDate >= periodStart && orderDate <= now;
      const isPreviousPeriod = orderDate >= previousPeriodStart && orderDate < periodStart;

      grossRevenue += amount;

      if (isCurrentPeriod) {
        periodRevenue += amount;
        periodOrdersCount++;

        // Status tracking
        const st = (o.status || "confirmed").toLowerCase();
        statusCountMap[st] = (statusCountMap[st] || 0) + 1;

        // Process line items
        if (Array.isArray(o.items) && o.items.length > 0) {
          o.items.forEach((item: any) => {
            const qty = Number(item.quantity || 1);
            const price = Number(item.price || item.unit_price || (qty > 0 ? amount / qty : 0));
            const itemRevenue = price * qty;
            totalUnitsSold += qty;

            const pId = String(item.product_id || item.id || `prod-${item.title}`);
            const pTitle = item.title || item.name || "Hardware Product";
            const pSku = item.sku || `SKU-${pId.slice(0, 6).toUpperCase()}`;
            const pCat = (item.category || "hardware").toLowerCase();

            if (!productSalesMap[pId]) {
              productSalesMap[pId] = { id: pId, title: pTitle, sku: pSku, category: pCat, revenue: 0, units: 0 };
            }
            productSalesMap[pId].revenue += itemRevenue;
            productSalesMap[pId].units += qty;

            if (!categoryRevenueMap[pCat]) {
              categoryRevenueMap[pCat] = { revenue: 0, units: 0 };
            }
            categoryRevenueMap[pCat].revenue += itemRevenue;
            categoryRevenueMap[pCat].units += qty;
          });
        } else {
          totalUnitsSold += 1;
          const defaultCat = "hardware";
          if (!categoryRevenueMap[defaultCat]) categoryRevenueMap[defaultCat] = { revenue: 0, units: 0 };
          categoryRevenueMap[defaultCat].revenue += amount;
          categoryRevenueMap[defaultCat].units += 1;
        }
      } else if (isPreviousPeriod) {
        previousPeriodRevenue += amount;
        previousPeriodOrdersCount++;
      }
    });

    // Growth percentage calculation
    const revenueGrowthPct = previousPeriodRevenue > 0
      ? Number((((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1))
      : periodRevenue > 0 ? 100 : 0;

    const ordersGrowthPct = previousPeriodOrdersCount > 0
      ? Number((((periodOrdersCount - previousPeriodOrdersCount) / previousPeriodOrdersCount) * 100).toFixed(1))
      : periodOrdersCount > 0 ? 100 : 0;

    const averageOrderValue = periodOrdersCount > 0 ? Math.round(periodRevenue / periodOrdersCount) : 0;

    // 2. Bookings Metrics
    const validBookings = bookings || [];
    const completedBookings = validBookings.filter((b: any) => b.status === "completed").length;
    const pendingBookings = validBookings.filter((b: any) => b.status === "pending" || b.status === "new" || b.status === "in_progress").length;

    // Add service booking revenue to category map
    validBookings.forEach((b: any) => {
      const bDate = new Date(b.created_at || now.toISOString());
      if (bDate >= periodStart && bDate <= now) {
        const bAmount = Number(b.amount || b.cost || b.estimated_cost || 0);
        if (bAmount > 0) {
          if (!categoryRevenueMap["services"]) categoryRevenueMap["services"] = { revenue: 0, units: 0 };
          categoryRevenueMap["services"].revenue += bAmount;
          categoryRevenueMap["services"].units += 1;
        }
      }
    });

    // 3. Customer & Rating Metrics
    const validCustomers = customers || [];
    const newClientsInPeriod = validCustomers.filter((c: any) => {
      const cDate = new Date(c.created_at || c.registered_at || 0);
      return cDate >= periodStart && cDate <= now;
    }).length;

    const validReviews = reviews || [];
    const sumRatings = validReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
    const averageRating = validReviews.length > 0 ? Number((sumRatings / validReviews.length).toFixed(1)) : 0;

    // 4. Inventory Valuation
    let totalInventoryValuation = 0;
    let lowStockCount = 0;
    (products || []).forEach((p: any) => {
      const stock = Math.max(0, Number(p.stock ?? 0));
      const price = Math.max(0, Number(p.price ?? 0));
      totalInventoryValuation += stock * price;
      if (stock <= Number(p.lowStockThreshold || 5)) {
        lowStockCount++;
      }
    });

    // 5. Time Series Trend Generation
    const timeSeriesMap: Record<string, { date: string; label: string; revenue: number; orders: number; bookings: number }> = {};
    const daysArr: string[] = [];

    // Bucket by days (7d, 30d) or 7-day intervals (90d, 1y)
    const intervalDays = daysInPeriod <= 30 ? 1 : daysInPeriod <= 90 ? 3 : 14;
    const bucketCount = Math.ceil(daysInPeriod / intervalDays);

    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        ...(daysInPeriod > 90 ? { year: "2-digit" } : {}),
      });
      daysArr.push(dateKey);
      timeSeriesMap[dateKey] = {
        date: dateKey,
        label,
        revenue: 0,
        orders: 0,
        bookings: 0,
      };
    }

    // Populate order data into closest bucket
    validOrders.forEach((o: any) => {
      if (!o.created_at) return;
      const oDate = new Date(o.created_at);
      if (oDate < periodStart || oDate > now) return;
      const oDateKey = oDate.toISOString().split("T")[0];
      const amount = Number(o.total_amount || o.total || 0);

      // Find closest or matching key
      if (timeSeriesMap[oDateKey]) {
        timeSeriesMap[oDateKey].revenue += amount;
        timeSeriesMap[oDateKey].orders += 1;
      } else {
        // Find nearest bucket
        let nearestKey = daysArr[0];
        let minDiff = Infinity;
        for (const k of daysArr) {
          const diff = Math.abs(new Date(k).getTime() - oDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            nearestKey = k;
          }
        }
        if (timeSeriesMap[nearestKey]) {
          timeSeriesMap[nearestKey].revenue += amount;
          timeSeriesMap[nearestKey].orders += 1;
        }
      }
    });

    // Populate bookings into timeSeries
    validBookings.forEach((b: any) => {
      if (!b.created_at) return;
      const bDate = new Date(b.created_at);
      if (bDate < periodStart || bDate > now) return;
      const bDateKey = bDate.toISOString().split("T")[0];

      if (timeSeriesMap[bDateKey]) {
        timeSeriesMap[bDateKey].bookings += 1;
      } else {
        let nearestKey = daysArr[0];
        let minDiff = Infinity;
        for (const k of daysArr) {
          const diff = Math.abs(new Date(k).getTime() - bDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            nearestKey = k;
          }
        }
        if (timeSeriesMap[nearestKey]) {
          timeSeriesMap[nearestKey].bookings += 1;
        }
      }
    });

    const timeSeries = daysArr.map((k) => timeSeriesMap[k]);

    // 6. Category Breakdown
    const totalCatRevenue = Object.values(categoryRevenueMap).reduce((s, c) => s + c.revenue, 0) || 1;
    const categoryLabels: Record<string, string> = {
      laptops: "Business & Gaming Laptops",
      desktops: "Custom Desktops & Workstations",
      accessories: "Computer Accessories",
      services: "Diagnostics & Doorstep Repairs",
      hardware: "Hardware Components",
    };

    const categories: CategoryBreakdownItem[] = Object.entries(categoryRevenueMap).map(([cat, val]) => ({
      category: cat,
      label: categoryLabels[cat] || cat.replace(/_/g, " ").toUpperCase(),
      revenue: val.revenue,
      units: val.units,
      percentage: Math.round((val.revenue / totalCatRevenue) * 100),
    })).sort((a, b) => b.revenue - a.revenue);

    // 7. Order Status Distribution
    const totalStatusOrders = Object.values(statusCountMap).reduce((s, c) => s + c, 0) || 1;
    const statusConfigMap: Record<string, { label: string; color: string }> = {
      completed: { label: "Completed", color: "bg-emerald-500" },
      delivered: { label: "Delivered", color: "bg-teal-500" },
      shipped: { label: "Shipped / In Transit", color: "bg-indigo-500" },
      processing: { label: "Processing", color: "bg-cyan-500" },
      confirmed: { label: "Confirmed", color: "bg-blue-500" },
      pending: { label: "Pending Verification", color: "bg-amber-500" },
    };

    const orderStatuses: StatusDistributionItem[] = Object.entries(statusCountMap)
      .filter(([_, count]) => count > 0)
      .map(([st, count]) => ({
        status: st,
        label: statusConfigMap[st]?.label || st.toUpperCase(),
        count,
        percentage: Math.round((count / totalStatusOrders) * 100),
        color: statusConfigMap[st]?.color || "bg-slate-400",
      }))
      .sort((a, b) => b.count - a.count);

    // 8. Top Selling Products
    const topProducts: TopProductItem[] = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        category: p.category,
        revenue: p.revenue,
        unitsSold: p.units,
      }));

    // 9. Recent High-Value Transactions
    const recentTransactions: RecentTransactionItem[] = validOrders
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6)
      .map((o: any) => ({
        id: o.id,
        orderNumber: o.order_id || `#${(o.id || "").toString().slice(-6).toUpperCase()}`,
        customerName: o.customer?.name || o.customerName || "Verified Customer",
        date: o.created_at || now.toISOString(),
        amount: Number(o.total_amount || o.total || o.amount || 0),
        status: o.status || "confirmed",
        itemCount: Array.isArray(o.items) ? o.items.length : 1,
      }));

    const responsePayload: AnalyticsSummaryResponse = {
      timeframe,
      kpis: {
        grossRevenue,
        periodRevenue,
        previousPeriodRevenue,
        revenueGrowthPct,
        totalOrders: validOrders.length,
        periodOrders: periodOrdersCount,
        ordersGrowthPct,
        averageOrderValue,
        unitsSold: totalUnitsSold,
        totalBookings: validBookings.length,
        completedBookings,
        pendingBookings,
        registeredClients: validCustomers.length,
        newClientsInPeriod,
        averageRating,
        reviewCount: validReviews.length,
        totalInventoryValuation,
        lowStockCount,
      },
      timeSeries,
      categories,
      orderStatuses,
      topProducts,
      recentTransactions,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(
      { success: true, ...responsePayload },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate analytics intelligence." },
      { status: 500 }
    );
  }
}

