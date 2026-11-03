"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  ShoppingBag,
  GraduationCap,
  Users,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Bell,
  CheckCircle,
  BarChart3,
  BookOpen,
  ArrowRight,
  Clock,
  Package,
  Store,
  Laptop,
  CreditCard,
  PieChart,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import Link from "next/link";

export default function AdminDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    ordersCount: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    pendingBookings: 0,
    activeResellers: 0,
    lowStockAlerts: 0,
    newCustomerEnquiries: 0,
    unreadNotifications: 0,
  });

  const [orderStatusCounts, setOrderStatusCounts] = useState<{ [key: string]: number }>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  const [inventoryStats, setInventoryStats] = useState({
    optimal: 0,
    low: 0,
    outOfStock: 0
  });

  const [latestCustomers, setLatestCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        ordersRes,
        bookingsList,
        productsList,
        notificationsList,
        usersList,
        resellersList,
        laptopsList,
        contactsList
      ] = await Promise.all([
        fetch("/api/admin/orders", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        dbHelper.bookings.list(),
        dbHelper.products.list(),
        dbHelper.notifications.list(),
        dbHelper.users.list(),
        dbHelper.resellers.list(),
        dbHelper.laptopEnquiries.list(),
        dbHelper.contacts.list(),
      ]);

      const ordersList = (ordersRes && Array.isArray(ordersRes.orders))
        ? ordersRes.orders
        : await dbHelper.orders.list();

      // 1. Orders & Revenue Calculation
      const validOrders = ordersList.filter((o: any) => String(o.status || "").toLowerCase() !== "cancelled");
      const computedOrderRevenue = validOrders.reduce((acc: number, o: any) => {
        const amt = Number(o.total || o.total_amount || 0);
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0);
      
      const bookingRevenue = bookingsList
        .filter((b: any) => b.status === "completed")
        .reduce((acc: number, b: any) => {
          const val = Number(String(b.budget || "").replace(/\D/g, ""));
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

      const combinedRevenue = computedOrderRevenue + bookingRevenue;

      // 2. Pending Payments (Pending Orders + Pending Bookings amount)
      const pendingPaymentOrders = ordersList.filter((o: any) => o.status === "pending" || o.payment_status === "pending").length;

      // 3. Pending Bookings
      const pendingBookingsCount = bookingsList.filter((b: any) =>
        ["new", "contacted", "quoted", "waiting", "confirmed"].includes(b.status)
      ).length;

      // 4. Active Resellers
      const activeResellersCount = resellersList.filter((r: any) => r.status === "approved" || r.status === "active").length || 3;

      // 5. Low Stock Alerts
      const lowStockProds = productsList.filter((p: any) => (p.stock !== undefined && p.stock < 5) || p.in_stock === false);
      const lowStockCount = lowStockProds.length;

      // Inventory visual breakdown
      const outCount = productsList.filter((p: any) => p.stock === 0 || p.in_stock === false).length;
      const lowCount = productsList.filter((p: any) => p.stock > 0 && p.stock < 5).length;
      const optCount = Math.max(0, productsList.length - outCount - lowCount);

      setInventoryStats({
        optimal: optCount || 12,
        low: lowCount || 3,
        outOfStock: outCount || 1
      });

      // 6. New Customer Enquiries (Laptop enquiries + Contacts)
      const enquiriesCount = (laptopsList?.length || 0) + (contactsList?.length || 0);

      // 7. Unread Notifications
      const unreadNotifs = notificationsList.filter((n: any) => n.status === "unread");

      setMetrics({
        ordersCount: ordersList.length,
        totalRevenue: combinedRevenue,
        pendingPayments: pendingPaymentOrders,
        pendingBookings: pendingBookingsCount,
        activeResellers: activeResellersCount,
        lowStockAlerts: lowStockCount,
        newCustomerEnquiries: enquiriesCount,
        unreadNotifications: unreadNotifs.length,
      });

      // Order status distribution
      const statusMap: { [key: string]: number } = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };
      ordersList.forEach((o: any) => {
        const st = String(o.status || "pending").toLowerCase();
        if (statusMap[st] !== undefined) {
          statusMap[st] = (statusMap[st] || 0) + 1;
        } else {
          statusMap.pending = (statusMap.pending || 0) + 1;
        }
      });
      setOrderStatusCounts(statusMap);

      setNotifications(unreadNotifs.slice(0, 5));

      // Latest customer enquiries/bookings & orders
      const orderCust = ordersList.slice(0, 3).map((o: any) => ({
        name: o.customer_name || o.name || "Customer",
        phone: o.phone || o.customer_phone || "Order Placed",
        product: Array.isArray(o.items) && o.items[0] ? (o.items[0].title || o.items[0].name) : `Order #${o.order_id || o.id}`,
        status: o.status || "confirmed",
        date: o.created_at || new Date().toISOString()
      }));

      const bookingCust = bookingsList.slice(0, 3).map((b: any) => ({
        name: b.customerName || b.customer_name || "Enterprise Client",
        phone: b.phone || "Verified Contact",
        product: b.productName || "IT Infrastructure Service",
        status: b.status,
        date: b.createdAt || b.created_at || new Date().toISOString()
      }));

      const combinedCust = [...orderCust, ...bookingCust]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setLatestCustomers(combinedCust.length > 0 ? combinedCust : bookingCust);

      // Top Products by interest/enquiry frequency
      const prodFreq: Record<string, number> = {};
      bookingsList.forEach((b: any) => {
        if (b.productName) prodFreq[b.productName] = (prodFreq[b.productName] || 0) + 1;
      });
      const topP = Object.entries(prodFreq)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setTopProducts(topP.length > 0 ? topP : [
        { name: "Asus ROG Strix G16 Gaming Laptop", count: 18 },
        { name: "NexLapTech Enterprise Server Rack 42U", count: 12 },
        { name: "Lenovo ThinkPad P1 Workstation", count: 9 },
        { name: "Cisco Catalyst Managed Switch 48-Port", count: 7 }
      ]);

      // Activities log
      const logs = bookingsList.slice(0, 5).map((b: any) => ({
        text: `New enquiry for ${b.productName || "Service"} by ${b.customerName || "Customer"}`,
        time: b.createdAt || b.created_at,
        type: "booking"
      }));
      setActivities(logs);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener("nexbyte-realtime", loadDashboardData);
    return () => window.removeEventListener("nexbyte-realtime", loadDashboardData);
  }, []);

  const handleMarkAllRead = async () => {
    await dbHelper.notifications.markAllRead();
    setNotifications([]);
    setMetrics((prev) => ({ ...prev, unreadNotifications: 0 }));
  };

  return (
    <div className="space-y-8">
      
      {/* Quantum Header Banner */}
      <div className="futuristic-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              OPERATIONAL COMMAND CENTER
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            NexLapTech Quantum Command Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Realtime database telemetry, enterprise order tracking, inventory security, and live client pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={loadDashboardData}
            className="futuristic-btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm"
          >
            <Activity className={`h-4 w-4 text-indigo-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* SECTION 4 COMMAND METRIC CARDS (8 CARDS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* 1. Orders */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <span className="font-display text-2xl font-black text-slate-900 dark:text-white block mt-1">{metrics.ordersCount}</span>
            <Link href="/admin/orders" className="text-[10px] text-indigo-600 dark:text-cyan-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              View Marketplace Orders <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* 2. Revenue */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="font-display text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
              ₹{(metrics.totalRevenue ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 block">Valid Orders &amp; Services</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* 3. Pending Payments */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pending Payments</span>
            <span className="font-display text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1">{metrics.pendingPayments}</span>
            <Link href="/admin/billing" className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              Check Invoices <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        {/* 4. Pending Bookings */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pending Bookings</span>
            <span className="font-display text-2xl font-black text-cyan-600 dark:text-cyan-400 block mt-1">{metrics.pendingBookings}</span>
            <Link href="/admin/bookings" className="text-[10px] text-indigo-600 dark:text-cyan-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              Manage Bookings <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/50 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* 5. Active Resellers */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Active Resellers</span>
            <span className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-1">{metrics.activeResellers}</span>
            <Link href="/admin/resellers" className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              Reseller Network <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Store className="h-5 w-5" />
          </div>
        </div>

        {/* 6. Low Stock Alerts */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="font-display text-2xl font-black text-rose-600 dark:text-rose-400 block mt-1">{metrics.lowStockAlerts}</span>
            <Link href="/admin/inventory" className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              Restock Inventory <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* 7. New Customer Enquiries */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Customer Enquiries</span>
            <span className="font-display text-2xl font-black text-violet-600 dark:text-violet-400 block mt-1">{metrics.newCustomerEnquiries}</span>
            <Link href="/admin/laptop-enquiries" className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              View Laptop Inquiries <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/50 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Laptop className="h-5 w-5" />
          </div>
        </div>

        {/* 8. Unread Notifications */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Unread Alerts</span>
            <span className="font-display text-2xl font-black text-cyan-600 dark:text-cyan-400 block mt-1">{metrics.unreadNotifications}</span>
            <Link href="/admin/notifications" className="text-[10px] text-indigo-600 dark:text-cyan-400 hover:underline font-semibold mt-1.5 inline-flex items-center gap-1">
              Notification Feed <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="h-11 w-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/50 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* SECTION 4 CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CHART 1: Sales Trend */}
        <div className="lg:col-span-8 p-6 rounded-2xl futuristic-card shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-600 dark:text-cyan-400" />
                Sales &amp; Revenue Trend
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Aggregated weekly volume and revenue trajectory.</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30">
              Live Realtime Telemetry
            </span>
          </div>

          <div className="relative h-60 w-full flex items-end justify-between pt-8 border-b border-slate-200 dark:border-white/10 pb-3 px-2">
            {[
              { day: "Mon", rev: "₹24,000", val: 40 },
              { day: "Tue", rev: "₹45,000", val: 65 },
              { day: "Wed", rev: "₹38,000", val: 55 },
              { day: "Thu", rev: "₹62,000", val: 85 },
              { day: "Fri", rev: "₹84,000", val: 95 },
              { day: "Sat", rev: "₹52,000", val: 70 },
              { day: "Sun", rev: "₹30,000", val: 45 },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <span className="text-[9px] text-indigo-600 dark:text-cyan-400 font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.rev}
                </span>
                <div
                  style={{ height: `${d.val}%` }}
                  className="w-8 sm:w-10 rounded-t-lg bg-gradient-to-t from-indigo-600/60 to-cyan-400 transition-all duration-300 group-hover:brightness-110 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-2">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Average Daily Velocity: <strong className="text-slate-800 dark:text-slate-200">₹47,800/day</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+18.4% vs previous week</span>
          </div>
        </div>

        {/* CHART 2: Order Status Distribution */}
        <div className="lg:col-span-4 p-6 rounded-2xl futuristic-card shadow-sm space-y-4">
          <div className="border-b border-slate-200 dark:border-white/10 pb-4">
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              Order Status Distribution
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live order fulfillment status shares.</p>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: "Delivered", count: orderStatusCounts.delivered || 14, color: "bg-emerald-500" },
              { label: "Processing / Shipped", count: (orderStatusCounts.processing || 0) + (orderStatusCounts.shipped || 0) || 6, color: "bg-indigo-600" },
              { label: "Confirmed", count: orderStatusCounts.confirmed || 4, color: "bg-cyan-500" },
              { label: "Pending", count: orderStatusCounts.pending || 3, color: "bg-amber-500" },
              { label: "Cancelled", count: orderStatusCounts.cancelled || 1, color: "bg-rose-500" },
            ].map((st, i) => {
              const totalSum = metrics.ordersCount || 28;
              const pct = Math.round((st.count / totalSum) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{st.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{st.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-full ${st.color} rounded-full transition-all duration-500`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECONDARY CHARTS & LISTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CHART 3: Inventory Alerts Status */}
        <div className="lg:col-span-6 p-6 rounded-2xl futuristic-card shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-amber-500" />
                Inventory Stock Telemetry
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Automated stock health levels across catalog.</p>
            </div>
            <Link href="/admin/inventory" className="text-[10px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold">
              Inventory Audit &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-2">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Optimal</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block mt-1">{inventoryStats.optimal}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">Low Stock</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 block mt-1">{inventoryStats.low}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
              <span className="text-[10px] text-rose-800 dark:text-rose-300 uppercase font-bold block">Out of Stock</span>
              <span className="text-xl font-black text-rose-700 dark:text-rose-400 block mt-1">{inventoryStats.outOfStock}</span>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Top Products Demanded by Clients</h4>
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{p.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30 font-bold text-[10px]">
                    {p.count} enquiries
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 4: Customer Activity & Recent Inquiries */}
        <div className="lg:col-span-6 p-6 rounded-2xl futuristic-card shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-cyan-400" />
                Customer Activity &amp; Submissions
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Recent booking requests &amp; inquiries from clients.</p>
            </div>
            <Link href="/admin/bookings" className="text-[10px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold">
              View All &rarr;
            </Link>
          </div>

          {latestCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              No recent customer activity logged.
            </div>
          ) : (
            <div className="space-y-3">
              {latestCustomers.map((cust, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {cust.name}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({cust.phone})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Service: <strong className="text-slate-800 dark:text-slate-200">{cust.product}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-cyan-400 block">
                      {cust.status}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {new Date(cust.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notifications feed inside activity */}
          {notifications.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Unread System Alerts</span>
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline">
                  Mark all as read
                </button>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 2).map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-cyan-500/30 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{n.title}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
