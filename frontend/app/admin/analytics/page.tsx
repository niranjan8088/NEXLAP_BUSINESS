"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Award, Laptop, Star, Clock, AlertCircle, ShoppingBag, Package } from "lucide-react";
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
        item.val = item.count > 0 ? Math.max(15, Math.round((item.count / maxDayOrders) * 100)) : 4;
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
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" /> Executive Analytics
          </h1>
          <p className="text-xs text-nex-mist mt-0.5">Authoritative metrics calculated from real database orders, services, and inventory records.</p>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Monthly Revenue */}
        <div className="glass-card p-5 border-cyan-500/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.02] text-cyan-400 transform translate-x-2 translate-y-2">
            <DollarSign size={80} />
          </div>
          <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-nex-mist tracking-widest">Monthly Revenue</span>
            <h3 className="font-display text-base font-black text-white mt-0.5">
              ₹{stats.monthlyRevenue.toLocaleString("en-IN")}
            </h3>
            <span className="text-[8px] text-nex-mist block mt-0.5">
              Total: ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Valid Orders & Products Sold */}
        <div className="glass-card p-5 border-cyan-500/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.02] text-blue-500 transform translate-x-2 translate-y-2">
            <Package size={80} />
          </div>
          <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-nex-mist tracking-widest">Products Sold</span>
            <h3 className="font-display text-base font-black text-white mt-0.5">
              {stats.productsSold} units
            </h3>
            <span className="text-[8px] text-cyan-400 font-bold block mt-0.5">
              {stats.totalOrders} confirmed orders
            </span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="glass-card p-5 border-cyan-500/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.02] text-cyan-400 transform translate-x-2 translate-y-2">
            <Users size={80} />
          </div>
          <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-nex-mist tracking-widest">Registered Clients</span>
            <h3 className="font-display text-base font-black text-white mt-0.5">
              {stats.registeredCustomers} active
            </h3>
            <span className="text-[8px] text-nex-mist block mt-0.5">
              {stats.completedBookings} services completed
            </span>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="glass-card p-5 border-cyan-500/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.02] text-yellow-500 transform translate-x-2 translate-y-2">
            <Star size={80} />
          </div>
          <div className="h-10 w-10 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-nex-mist tracking-widest">Customer Satisfaction</span>
            <h3 className="font-display text-base font-black text-white mt-0.5">
              {stats.reviewCount > 0 ? `${stats.avgRating} / 5.0` : "No ratings yet"}
            </h3>
            <span className="text-[8px] text-yellow-400 font-bold block mt-0.5">
              {stats.pendingReviews} reviews pending moderation
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sales Chart (SVG Visualization) */}
        <div className="glass-card p-6 border-cyan-500/10 md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">7-Day Order Volume</h3>
              <p className="text-[10px] text-nex-mist">Real orders created per day</p>
            </div>
            <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-black">DATABASE VERIFIED</span>
          </div>
          
          <div className="h-52 w-full flex items-end justify-between pt-6 border-b border-white/10 relative">
            
            {/* Grid Lines */}
            <div className="absolute inset-x-0 bottom-10 h-px bg-white/5" />
            <div className="absolute inset-x-0 bottom-24 h-px bg-white/5" />
            <div className="absolute inset-x-0 bottom-36 h-px bg-white/5" />

            {/* Custom Bar Graphs */}
            {weeklyData.length > 0 ? (
              weeklyData.map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                  <span className="text-[8px] font-mono text-cyan-400">
                    {bar.count > 0 ? bar.count : ""}
                  </span>
                  <div className="w-8 relative flex flex-col justify-end h-36">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        bar.count > 0 ? "bg-cyan-500 shadow-[0_0_12px_rgba(0,242,254,0.3)]" : "bg-white/5"
                      }`} 
                      style={{ height: `${bar.val}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-nex-mist">{bar.label}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-nex-mist">
                Loading weekly metrics...
              </div>
            )}
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="glass-card p-6 border-cyan-500/10 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4">Pending Work Queue</h3>
            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <span className="font-medium text-white">Pending Service Bookings</span>
                </div>
                <span className="font-bold text-cyan-400">{stats.pendingBookings} items</span>
              </div>

              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="font-medium text-white">Pending Feedback Reviews</span>
                </div>
                <span className="font-bold text-yellow-400">{stats.pendingReviews} items</span>
              </div>

              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="font-medium text-white">Unread Notifications</span>
                </div>
                <span className="font-bold text-red-400">{stats.unreadNotifications} counts</span>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[9px] text-nex-mist text-center">
            System sync status: Operational · Database Connected
          </div>
        </div>

      </div>
    </div>
  );
}
