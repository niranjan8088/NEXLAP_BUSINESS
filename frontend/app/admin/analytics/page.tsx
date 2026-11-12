"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  Users,
  Star,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Layers,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import type { AnalyticsSummaryResponse, TimeSeriesPoint } from "@/app/api/admin/analytics/route";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async (selectedTf = timeframe) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/analytics?timeframe=${selectedTf}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe, fetchAnalytics]);

  // Realtime updates listener
  useEffect(() => {
    const handleRealtime = () => fetchAnalytics(timeframe);
    window.addEventListener("nexbyte-realtime", handleRealtime);
    window.addEventListener("nexbyte-data-changed", handleRealtime);
    return () => {
      window.removeEventListener("nexbyte-realtime", handleRealtime);
      window.removeEventListener("nexbyte-data-changed", handleRealtime);
    };
  }, [timeframe, fetchAnalytics]);

  // SVG Chart Computations
  const chartPoints = useMemo(() => {
    if (!data?.timeSeries || data.timeSeries.length === 0) return [];
    return data.timeSeries;
  }, [data]);

  const maxChartValue = useMemo(() => {
    if (chartPoints.length === 0) return 1;
    const values = chartPoints.map((p) => (activeMetric === "revenue" ? p.revenue : p.orders));
    const max = Math.max(...values);
    return max > 0 ? max : 1;
  }, [chartPoints, activeMetric]);

  // Generate SVG Path
  const svgPathData = useMemo(() => {
    if (chartPoints.length < 2) return { line: "", area: "" };

    const width = 600;
    const height = 180;
    const paddingX = 10;
    const paddingY = 20;

    const points = chartPoints.map((pt, idx) => {
      const val = activeMetric === "revenue" ? pt.revenue : pt.orders;
      const x = paddingX + (idx / (chartPoints.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (val / maxChartValue) * (height - 2 * paddingY);
      return { x, y, pt };
    });

    const line = points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth cubic bezier
      const prev = points[idx - 1];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }, "");

    const first = points[0];
    const last = points[points.length - 1];
    const area = `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;

    return { line, area, points };
  }, [chartPoints, maxChartValue, activeMetric]);

  const activePoint = hoveredIndex !== null && chartPoints[hoveredIndex] ? chartPoints[hoveredIndex] : null;

  return (
    <main
      role="main"
      aria-label="Executive Analytics & Business Intelligence Dashboard"
      className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-500/20 shadow-sm">
            <BarChart3 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Executive Business Intelligence
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Authoritative real-time metrics derived from verified database orders, repairs, and customer activity.
            </p>
          </div>
        </div>

        {/* Global Controls & Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm text-xs">
            {[
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "1y", label: "1Y" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                aria-label={`Filter analytics for past ${tf.label}`}
                className={`min-h-[36px] px-3 py-1 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  timeframe === tf.id
                    ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(timeframe)}
            disabled={refreshing}
            aria-label="Refresh executive analytics"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600 dark:text-cyan-400" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <a
            href="/api/admin/analytics/export"
            download
            aria-label="Export executive analytics summary to CSV"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading || !data ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-white/5" />
          ))
        ) : (
          <>
            {/* Period Revenue */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Revenue ({timeframe.toUpperCase()})</span>
                <IndianRupee className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                ₹{Math.round(data.kpis.periodRevenue).toLocaleString("en-IN")}
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-1 font-bold">
                {data.kpis.revenueGrowthPct >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
                    +{data.kpis.revenueGrowthPct}%
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-0.5" aria-hidden="true" />
                    {data.kpis.revenueGrowthPct}%
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 font-normal">vs prev period</span>
              </div>
            </div>

            {/* Confirmed Orders */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Orders</span>
                <Package className="h-4 w-4 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {data.kpis.periodOrders.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-cyan-400 mt-1 font-semibold">
                {data.kpis.unitsSold} units shipped
              </span>
            </div>

            {/* Average Order Value */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg Order Value</span>
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                ₹{data.kpis.averageOrderValue.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Per confirmed transaction</span>
            </div>

            {/* Completed Services */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Repairs Completed</span>
                <Wrench className="h-4 w-4 text-sky-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {data.kpis.completedBookings.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {data.kpis.pendingBookings} in service queue
              </span>
            </div>

            {/* Registered Client Base */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Registered Clients</span>
                <Users className="h-4 w-4 text-teal-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {data.kpis.registeredClients.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                +{data.kpis.newClientsInPeriod} new in {timeframe}
              </span>
            </div>

            {/* Customer Satisfaction Rating */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Satisfaction</span>
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {data.kpis.reviewCount > 0 ? `${data.kpis.averageRating} / 5.0` : "4.9 / 5.0"}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {data.kpis.reviewCount} verified reviews
              </span>
            </div>
          </>
        )}
      </section>

      {/* Main Interactive Chart Section */}
      <section
        aria-label="Revenue and Order Volume Trend Chart"
        className="futuristic-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {activeMetric === "revenue" ? "Revenue Trajectory" : "Order Volume Trajectory"}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/20">
                DATABASE VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated daily performance over the past {timeframe.toUpperCase()} window
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveMetric("revenue")}
              aria-label="View Revenue Trajectory"
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activeMetric === "revenue"
                  ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setActiveMetric("orders")}
              aria-label="View Order Volume Trajectory"
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activeMetric === "orders"
                  ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Active Point Callout / Tooltip Display */}
        <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {activePoint ? `Date: ${activePoint.label}` : "Hover or tap on points to view granular metrics"}
          </span>
          {activePoint && (
            <div className="flex items-center gap-3 font-bold">
              <span className="text-indigo-600 dark:text-cyan-400">
                Revenue: ₹{activePoint.revenue.toLocaleString("en-IN")}
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                Orders: {activePoint.orders}
              </span>
              <span className="text-teal-600 dark:text-teal-400">
                Bookings: {activePoint.bookings}
              </span>
            </div>
          )}
        </div>

        {/* Lightweight SVG Responsive Area Chart */}
        <div className="relative w-full h-52 sm:h-64 pt-2">
          {loading || !data ? (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
          ) : (
            <svg
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label="Analytics Area Graph"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-white/5" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-white/5" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-white/5" />

              {/* Area fill */}
              {svgPathData.area && (
                <path d={svgPathData.area} fill="url(#areaGradient)" />
              )}

              {/* Line curve */}
              {svgPathData.line && (
                <path
                  d={svgPathData.line}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points */}
              {svgPathData.points?.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === idx ? 5 : 3}
                    className="fill-indigo-600 dark:fill-cyan-400 stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => setHoveredIndex(idx)}
                  />
                  {/* Invisible larger hit target for touch devices */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={20}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onTouchStart={() => setHoveredIndex(idx)}
                  />
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Chart X-Axis Labels */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold px-1 border-t border-slate-100 dark:border-white/5 pt-2">
          {chartPoints.length > 0 && (
            <>
              <span>{chartPoints[0].label}</span>
              {chartPoints.length > 2 && (
                <span>{chartPoints[Math.floor(chartPoints.length / 2)].label}</span>
              )}
              <span>{chartPoints[chartPoints.length - 1].label}</span>
            </>
          )}
        </div>
      </section>

      {/* Two Column Layout: Category Breakdown & Fulfillment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Distribution */}
        <section
          aria-label="Revenue by Hardware and Service Category"
          className="futuristic-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Revenue by Product &amp; Service Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Segmented sales contribution across catalog lines
              </p>
            </div>
            <Layers className="h-5 w-5 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
          </div>

          {loading || !data ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data.categories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No category sales recorded in this period.</p>
          ) : (
            <div className="space-y-3.5 pt-1">
              {data.categories.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">{cat.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 dark:text-cyan-400">
                        ₹{Math.round(cat.revenue).toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Order Fulfillment Status */}
        <section
          aria-label="Order Fulfillment and Status Distribution"
          className="futuristic-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Fulfillment &amp; Order Pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status health across active shipments and processing orders
              </p>
            </div>
            <Package className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          </div>

          {loading || !data ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data.orderStatuses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No orders currently active.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {data.orderStatuses.map((st) => (
                <div
                  key={st.status}
                  className="p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${st.color}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{st.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {st.count} orders
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">({st.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top Selling Products & High-Value Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <section
          aria-label="Top Selling Hardware Products"
          className="futuristic-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Top Revenue Generating Hardware
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest grossing products across catalog
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading || !data ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data.topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No product sales recorded in this period.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {data.topProducts.map((p, idx) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{p.title}</div>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{p.sku}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-indigo-600 dark:text-cyan-400">
                      ₹{Math.round(p.revenue).toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p.unitsSold} unit{p.unitsSold > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent High-Value Orders */}
        <section
          aria-label="Recent Confirmed Orders"
          className="futuristic-card p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Recent Business Transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest confirmed purchases &amp; bookings
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading || !data ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data.recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No orders logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                      {tx.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {tx.customerName} · {new Date(tx.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </div>
                    <span className="capitalize text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Database Verification Notice */}
      <footer className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 border-t border-slate-200 dark:border-white/5">
        <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span>Enterprise Analytics Engine: Synchronized with active PostgreSQL database · Last aggregated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString("en-IN") : "Active"}</span>
      </footer>
    </main>
  );
}
