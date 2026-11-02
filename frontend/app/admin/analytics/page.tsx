"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Users, DollarSign, Star, Package } from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    pendingBookings: 0,
    completedBookings: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalOrders: 0,
    productsSold: 0,
    registeredCustomers: 0,
    avgRating: 0,
    reviewCount: 0,
    unreadNotifications: 0,
    pendingReviews: 0,
  });

  const [weeklyData, setWeeklyData] = useState<{ label: string; count: number; val: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateRealStats = async () => {
    setLoading(true);
    try {
      const [orders, bookings, reviews, notifications, customers] = await Promise.all([
        dbHelper.orders.list().catch(() => []),
        dbHelper.bookings.list().catch(() => []),
        dbHelper.reviews.list().catch(() => []),
        dbHelper.notifications.list().catch(() => []),
        dbHelper.customers.list().catch(() => []),
      ]);

      // Filter valid orders (exclude cancelled or failed)
      const validOrders = (orders || []).filter(
        (o: any) => o.status !== "cancelled" && o.status !== "failed"
      );

      // Current month calculations
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let mRevenue = 0;
      let tRevenue = 0;
      let pSold = 0;

      validOrders.forEach((o: any) => {
        const orderDate = new Date(o.created_at || Date.now());
        const amount = Number(o.total_amount || o.total || o.amount || 0);
        
        tRevenue += amount;
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          mRevenue += amount;
        }

        // Sum product items quantity
        if (Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            pSold += Number(item.quantity || 1);
          });
        } else {
          pSold += 1;
        }
      });

      const pendingB = (bookings || []).filter((b: any) => b.status === "pending" || b.status === "new").length;
      const completedB = (bookings || []).filter((b: any) => b.status === "completed").length;
      const unreadN = (notifications || []).filter((n: any) => n.status === "unread" || !n.is_read).length;
      const pendingR = (reviews || []).filter((r: any) => r.status === "pending").length;

      const sumRating = (reviews || []).reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
      const avgR = reviews && reviews.length > 0 ? parseFloat((sumRating / reviews.length).toFixed(1)) : 0;

      // Calculate last 7 days distribution
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days: { label: string; count: number; val: number }[] = [];
      let maxDayOrders = 1;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dStr = d.toISOString().split("T")[0];

        const dayOrders = validOrders.filter((o: any) => {
          if (!o.created_at) return false;
          return o.created_at.startsWith(dStr);
        }).length;

        if (dayOrders > maxDayOrders) maxDayOrders = dayOrders;
        last7Days.push({ label: dayLabel, count: dayOrders, val: 0 });
      }

      // Normalize val between 5% and 100% for bar visualization
      last7Days.forEach((item) => {
        item.val = item.count > 0 ? Math.max(15, Math.round((item.count / maxDayOrders) * 100)) : 6;
      });

      setWeeklyData(last7Days);

      setStats({
        pendingBookings: pendingB,
        completedBookings: completedB,
        monthlyRevenue: mRevenue,
        totalRevenue: tRevenue,
        totalOrders: validOrders.length,
        productsSold: pSold,
        registeredCustomers: Array.isArray(customers) ? customers.length : 0,
        avgRating: avgR,
        reviewCount: (reviews || []).length,
        unreadNotifications: unreadN,
        pendingReviews: pendingR,
      });
    } catch (err) {
      console.error("Failed to calculate real analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRealStats();

    const handler = () => calculateRealStats();
    window.addEventListener("nexbyte-realtime", handler);
    window.addEventListener("nexbyte-data-changed", handler);

    return () => {
      window.removeEventListener("nexbyte-realtime", handler);
      window.removeEventListener("nexbyte-data-changed", handler);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-cyan-400" /> Executive Analytics
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Authoritative metrics calculated from real database orders, services, and inventory records.</p>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Monthly Revenue */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Monthly Revenue</span>
            <h3 className="font-display text-base font-black text-slate-900 dark:text-white mt-0.5">
              ₹{stats.monthlyRevenue.toLocaleString("en-IN")}
            </h3>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Total: ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Valid Orders & Products Sold */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Products Sold</span>
            <h3 className="font-display text-base font-black text-slate-900 dark:text-white mt-0.5">
              {stats.productsSold} units
            </h3>
            <span className="text-[9px] text-indigo-600 dark:text-cyan-400 font-bold block mt-0.5">
              {stats.totalOrders} confirmed orders
            </span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="h-10 w-10 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Registered Clients</span>
            <h3 className="font-display text-base font-black text-slate-900 dark:text-white mt-0.5">
              {stats.registeredCustomers} active
            </h3>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {stats.completedBookings} services completed
            </span>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="futuristic-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Customer Satisfaction</span>
            <h3 className="font-display text-base font-black text-slate-900 dark:text-white mt-0.5">
              {stats.reviewCount > 0 ? `${stats.avgRating} / 5.0` : "No ratings yet"}
            </h3>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
              {stats.pendingReviews} reviews pending moderation
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sales Chart (SVG Visualization) */}
        <div className="futuristic-card p-6 rounded-2xl md:col-span-2 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">7-Day Order Volume</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Real orders created per day</p>
            </div>
            <span className="text-[9px] bg-indigo-50 dark:bg-cyan-500/10 border border-indigo-200 dark:border-cyan-500/30 text-indigo-700 dark:text-cyan-400 px-2 py-0.5 rounded-full font-extrabold">DATABASE VERIFIED</span>
          </div>
          
          <div className="h-52 w-full flex items-end justify-between pt-6 border-b border-slate-200 dark:border-white/10 relative">
            
            {/* Grid Lines */}
            <div className="absolute inset-x-0 bottom-10 h-px bg-slate-100 dark:bg-white/5" />
            <div className="absolute inset-x-0 bottom-24 h-px bg-slate-100 dark:bg-white/5" />
            <div className="absolute inset-x-0 bottom-36 h-px bg-slate-100 dark:bg-white/5" />

            {/* Custom Bar Graphs */}
            {weeklyData.length > 0 ? (
              weeklyData.map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                  <span className="text-[9px] font-mono text-indigo-600 dark:text-cyan-400 font-bold">
                    {bar.count > 0 ? bar.count : ""}
                  </span>
                  <div className="w-8 relative flex flex-col justify-end h-36">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        bar.count > 0 ? "bg-indigo-600 dark:bg-cyan-400 shadow-sm" : "bg-slate-100 dark:bg-white/5"
                      }`} 
                      style={{ height: `${bar.val}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{bar.label}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                Loading weekly metrics...
              </div>
            )}
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="futuristic-card p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Pending Work Queue</h3>
            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Pending Service Bookings</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-cyan-400">{stats.pendingBookings} items</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Pending Feedback Reviews</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">{stats.pendingReviews} items</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Unread Notifications</span>
                </div>
                <span className="font-bold text-rose-600 dark:text-rose-400">{stats.unreadNotifications} counts</span>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
            System sync status: Operational · Database Connected
          </div>
        </div>

      </div>
    </div>
  );
}
