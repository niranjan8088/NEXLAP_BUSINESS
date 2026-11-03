"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  RefreshCw,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Eye,
  Filter,
  Sparkles,
} from "lucide-react";
import type {
  CustomerVisitsAnalyticsData,
  DailyTrendPoint,
  MonthlyTrendPoint,
} from "@/lib/visitorAnalytics";

export default function CustomerVisitsAnalyticsSection() {
  const [data, setData] = useState<CustomerVisitsAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & view controls
  const [timeframe, setTimeframe] = useState<"7d" | "14d" | "30d" | "monthly">("30d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [metricType, setMetricType] = useState<"visits" | "unique">("visits");
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    // Live polling every 15 seconds to stream real visitors without page refresh
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/analytics/visits", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: "Failed to load customer visitor analytics." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogTestVisit = async () => {
    try {
      setSimulating(true);
      setFeedback(null);
      const res = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "/products",
          title: "Hardware Storefront (Live Test)",
          device: window.innerWidth < 768 ? "mobile" : "desktop",
          referrer: "admin_test_trigger",
        }),
      });
      if (res.ok) {
        await fetchAnalytics();
        setFeedback({
          type: "success",
          text: "Live test visit recorded! Telemetry charts and streams updated in real time.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to record live test visit." });
    } finally {
      setSimulating(false);
    }
  };

  const handleResetAnalytics = async () => {
    try {
      setRefreshing(true);
      setShowResetConfirm(false);
      const res = await fetch("/api/analytics/visits", { method: "DELETE" });
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
        setFeedback({
          type: "success",
          text: "Visitor analytics logs cleared. Fresh tracking active from zero.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to reset analytics." });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;

    let csv = "Date/Month,Total Visits,Unique Customers\n";
    if (timeframe === "monthly") {
      data.monthlyTrends.forEach((m) => {
        csv += `"${m.label}",${m.visits},${m.uniqueVisitors}\n`;
      });
    } else {
      data.dailyTrends.forEach((d) => {
        csv += `"${d.date}",${d.visits},${d.uniqueVisitors}\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexlaptech-customer-visits-${timeframe}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute active dataset based on timeframe filter
  const activeDataset = useMemo(() => {
    if (!data) return [];
    if (timeframe === "7d") return data.dailyTrends.slice(-7);
    if (timeframe === "14d") return data.dailyTrends.slice(-14);
    if (timeframe === "30d") return data.dailyTrends;
    return data.monthlyTrends; // 12 months
  }, [data, timeframe]);

  // Chart dimensions & calculations
  const chartHeight = 260;
  const chartWidth = 740;
  const paddingX = 45;
  const paddingY = 30;

  const maxVal = useMemo(() => {
    if (!activeDataset.length) return 100;
    const vals = activeDataset.map((d: any) =>
      metricType === "unique" ? d.uniqueVisitors : d.visits
    );
    const peak = Math.max(...vals, 10);
    return Math.ceil(peak * 1.15); // headroom for top labels
  }, [activeDataset, metricType]);

  const points = useMemo(() => {
    if (!activeDataset.length) return [];
    const count = activeDataset.length;
    const step = (chartWidth - paddingX * 2) / Math.max(count - 1, 1);

    return activeDataset.map((item: any, i) => {
      const val = metricType === "unique" ? item.uniqueVisitors : item.visits;
      const x = paddingX + i * step;
      const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
      return { x, y, val, item, i };
    });
  }, [activeDataset, maxVal, metricType]);

  // Smooth SVG Bézier curve path
  const curvePath = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  // Area closed path for gradient fill
  const areaPath = useMemo(() => {
    if (points.length < 2) return "";
    const bottomY = chartHeight - paddingY;
    return `${curvePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [curvePath, points]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading customer visitor traffic and monthly counts...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ── SECTION HEADER & CONTROLS ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry Active
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                100% Real Customer Traffic
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customer Visits &amp; Monthly Traffic Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time monitoring of actual daily and monthly customer visits, unique users, device breakdown, and peak shopping hours across nexlaptech.in.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleLogTestVisit}
              disabled={simulating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-3.5 py-2 text-xs font-bold hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors disabled:opacity-50"
              title="Record a test visit from this device to verify live telemetry streaming"
            >
              <Eye className={`h-3.5 w-3.5 ${simulating ? "animate-spin" : ""}`} />
              {simulating ? "Recording..." : "Test Storefront Visit"}
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 px-3.5 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Download customer visit analytics as CSV"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Export CSV
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2.5 py-2 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
              title="Reset visitor analytics"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-2.5 border ${feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
              }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* ── KPI HIGHLIGHT CARDS (DAILY, MONTHLY, TOTAL, UNIQUE) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today&apos;s Customer Visits */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today&apos;s Customer Visits
            </span>
            <div className="h-8 w-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-900 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {data.todayVisits.toLocaleString()}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold ${data.dailyGrowthPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
            >
              {data.dailyGrowthPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(data.dailyGrowthPct)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            vs. Yesterday: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.yesterdayVisits}</span> ({data.uniqueVisitorsToday} unique customers today)
          </p>
        </div>

        {/* Card 2: This Month&apos;s Visits */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              This Month&apos;s Visits
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {data.thisMonthVisits.toLocaleString()}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold ${data.monthlyGrowthPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
            >
              {data.monthlyGrowthPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(data.monthlyGrowthPct)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            vs. Last Month: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.lastMonthVisits.toLocaleString()}</span> ({data.uniqueVisitorsThisMonth} unique customers)
          </p>
        </div>

        {/* Card 3: All-Time Total Visits */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Customer Visits
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {data.totalVisits.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
              All-Time
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Total unique customers: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.totalUniqueVisitors.toLocaleString()}</span>
          </p>
        </div>

        {/* Card 4: Daily Average & Peak Hour */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Daily Run-Rate
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ~{data.avgDailyVisits}
            </span>
            <span className="text-xs text-slate-500">visits/day</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Busiest time: <span className="font-semibold text-amber-600 dark:text-amber-400">{data.peakHourLabel}</span> ({data.peakDayLabel}s)
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE MAIN GRAPH (DAILY & MONTHLY VISITS) ────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
        {/* Graph Header & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-cyan-500" />
              {timeframe === "monthly" ? "Monthly Customer Visits Overview (12 Months)" : "Daily Customer Visits Trend"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Hover over data points to inspect detailed visitor counts and unique customer metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 text-xs font-semibold">
              <button
                onClick={() => setTimeframe("7d")}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === "7d"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe("14d")}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === "14d"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setTimeframe("30d")}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === "30d"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeframe("monthly")}
                className={`px-3 py-1.5 rounded-lg transition-all ${timeframe === "monthly"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                Monthly (12M)
              </button>
            </div>

            {/* Metric Toggle: Total Visits vs Unique Visitors */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 text-xs font-semibold">
              <button
                onClick={() => setMetricType("visits")}
                className={`px-3 py-1.5 rounded-lg transition-all ${metricType === "visits"
                  ? "bg-cyan-600 text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                Total Visits
              </button>
              <button
                onClick={() => setMetricType("unique")}
                className={`px-3 py-1.5 rounded-lg transition-all ${metricType === "unique"
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                Unique Customers
              </button>
            </div>

            {/* Chart Type Toggle: Curve vs Bar */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 text-xs font-semibold">
              <button
                onClick={() => setChartType("area")}
                className={`p-1.5 rounded-lg transition-all ${chartType === "area"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
                  }`}
                title="Area Curve Chart"
              >
                <LineChartIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-lg transition-all ${chartType === "bar"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
                  }`}
                title="Column Bar Chart"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* SVG Chart Rendering */}
        <div className="pt-6 relative">
          <div className="w-full overflow-x-auto pb-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-[280px] sm:h-[320px] select-none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Electric Cyan to Neon Violet Gradient for Area */}
                <linearGradient id="customerTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="1" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const labelVal = Math.round(ratio * maxVal);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      className="text-slate-400 dark:text-slate-500 font-medium"
                    >
                      {labelVal.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* ── AREA / CURVE MODE ── */}
              {chartType === "area" && (
                <>
                  {/* Shaded Area */}
                  {areaPath && <path d={areaPath} fill="url(#customerTrafficGradient)" />}

                  {/* Main Line Curve */}
                  {curvePath && (
                    <path
                      d={curvePath}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Points */}
                  {points.map((pt, idx) => {
                    const isHovered = hoveredPoint?.i === idx;
                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-transform"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Hover vertical guide line */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={paddingY}
                            x2={pt.x}
                            y2={chartHeight - paddingY}
                            stroke="#38BDF8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            strokeOpacity="0.6"
                          />
                        )}

                        {/* Outer Glow Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 7 : 3.5}
                          fill={isHovered ? "#22D3EE" : "#0F172A"}
                          stroke={metricType === "unique" ? "#A855F7" : "#22D3EE"}
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all duration-150"
                        />

                        {/* Point value label if selected or hovered */}
                        {isHovered && (
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="#F8FAFC"
                            className="drop-shadow"
                          >
                            {pt.val.toLocaleString()}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* ── COLUMN BAR MODE ── */}
              {chartType === "bar" && (
                <>
                  {points.map((pt, idx) => {
                    const isHovered = hoveredPoint?.i === idx;
                    const barWidth = Math.max(
                      8,
                      Math.min(28, (chartWidth - paddingX * 2) / (points.length * 1.5))
                    );
                    const barHeight = chartHeight - paddingY - pt.y;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <rect
                          x={pt.x - barWidth / 2}
                          y={pt.y}
                          width={barWidth}
                          height={Math.max(barHeight, 2)}
                          rx="4"
                          fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                          className="transition-all duration-150"
                        />
                        {isHovered && (
                          <text
                            x={pt.x}
                            y={pt.y - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#F8FAFC"
                          >
                            {pt.val}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* X-axis Date Labels */}
              {points.map((pt, idx) => {
                // Show subset of labels if many points to avoid overlap
                const total = points.length;
                const shouldShow =
                  total <= 12 ||
                  idx === 0 ||
                  idx === total - 1 ||
                  (total <= 16 && idx % 2 === 0) ||
                  (total > 16 && idx % 4 === 0);

                if (!shouldShow) return null;

                const labelText = pt.item.label || pt.item.date;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    className="text-slate-400 dark:text-slate-500 font-medium"
                  >
                    {labelText}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Floating Hover Card (Details popup) */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 rounded-2xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-md p-3 text-white shadow-xl z-20 pointer-events-none min-w-[170px] space-y-1">
              <p className="text-[11px] font-bold text-cyan-400 flex items-center justify-between">
                <span>{hoveredPoint.item.label || hoveredPoint.item.date}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  {hoveredPoint.item.dayOfWeek || "Monthly"}
                </span>
              </p>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Total Visits:</span>
                <span className="font-extrabold text-cyan-300">
                  {hoveredPoint.item.visits?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Unique Customers:</span>
                <span className="font-extrabold text-purple-300">
                  {hoveredPoint.item.uniqueVisitors?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 24-HOUR HOURLY TRAFFIC & DEVICE BREAKDOWN ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-Hour Diurnal Customer Traffic Pattern */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Hourly Visiting Distribution (24h)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Shows when customers visit throughout the day. Peak window:{" "}
                <span className="font-bold text-amber-500">{data.peakHourLabel}</span>.
              </p>
            </div>
          </div>

          {/* 24-Hour Bar Graph */}
          <div className="h-40 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2">
            {data.hourlyDistribution.map((h, i) => {
              const isPeak = h.percentage >= 85;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    {h.hour}: {h.visits} visits
                  </div>

                  <div
                    style={{ height: `${Math.max(h.percentage, 4)}%` }}
                    className={`w-full rounded-t-sm transition-all ${isPeak
                      ? "bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm shadow-amber-500/20"
                      : "bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500/70"
                      }`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[8px] text-slate-400 mt-1">{h.hour.slice(0, 2)}h</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
            <span>Morning: 08:00 - 12:00</span>
            <span className="font-bold text-amber-500">Evening Peak: 17:00 - 21:00</span>
            <span>Night: 22:00 - 04:00</span>
          </div>
        </div>

        {/* Right: Device & Platform Distribution */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-500" /> Device &amp; Platform Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Breakdown of customer visits by browsing device.
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3.5 pt-2">
            {/* Mobile */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-500" /> Mobile Devices
                </span>
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                  {data.deviceBreakdown.mobilePct}% ({data.deviceBreakdown.mobile.toLocaleString()})
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${data.deviceBreakdown.mobilePct}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* Desktop */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-purple-500" /> Desktop &amp; Laptops
                </span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                  {data.deviceBreakdown.desktopPct}% ({data.deviceBreakdown.desktop.toLocaleString()})
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${data.deviceBreakdown.desktopPct}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            {/* Tablet */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Tablet className="h-3.5 w-3.5 text-amber-500" /> Tablet &amp; iPads
                </span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {data.deviceBreakdown.tabletPct}% ({data.deviceBreakdown.tablet.toLocaleString()})
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${data.deviceBreakdown.tabletPct}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP VISITED PAGES & RECENT LIVE VISITS ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Visited Pages */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" /> Most Visited Customer Pages
          </h3>
          <p className="text-[11px] text-slate-400">
            Top routes driving customer engagement across the storefront and portal.
          </p>

          <div className="space-y-2 pt-2">
            {data.topPages.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                <Eye className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">Awaiting live customer traffic</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top visited routes will display here as visitors browse nexlaptech.in.</p>
              </div>
            ) : (
              data.topPages.map((page, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {page.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{page.path}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {page.visits.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">({page.percentage}%)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Real-Time Visits Log */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" /> Live Customer Stream
              </h3>
              <p className="text-[11px] text-slate-400">Real-time recorded customer visits.</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              Latest 10
            </span>
          </div>

          <div className="space-y-1.5 max-h-[310px] overflow-y-auto pr-1">
            {data.recentVisits.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                <Sparkles className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">Live tracker is active</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Visits will stream here as visitors browse nexlaptech.in.</p>
              </div>
            ) : (
              data.recentVisits.slice(0, 10).map((v) => {
                const timeStr = new Date(v.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-white/5 text-xs hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {v.path}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{v.date}</span>
                        <span>•</span>
                        <span>{timeStr}</span>
                        <span>•</span>
                        <span className="capitalize">{v.device}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 shrink-0">
                      {v.ipAnonymized}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── RESET CONFIRMATION MODAL ────────────────────────────────────────── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Reset Visitor Analytics?
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will reset the customer visits logs back to the clean baseline. Live counts will start afresh from today.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAnalytics}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Yes, Reset Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

