"use client";

import React, { useEffect, useState, useDeferredValue, useCallback } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Layers,
  Wrench,
  Package,
  Laptop,
  Users,
  IndianRupee,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import type { ReportKPIs } from "@/app/api/admin/reports/route";

export interface ReportItem {
  id: string;
  refCode: string;
  primaryText: string;
  secondaryText: string;
  metaText: string;
  amount: number;
  badgeText: string;
  status: string;
  date: string;
}

const CATEGORY_TABS = [
  { id: "sales", label: "Sales & Orders", icon: <Layers className="h-4 w-4" aria-hidden="true" /> },
  { id: "services", label: "Service Repairs", icon: <Wrench className="h-4 w-4" aria-hidden="true" /> },
  { id: "inventory", label: "Inventory Valuation", icon: <Package className="h-4 w-4" aria-hidden="true" /> },
  { id: "gst", label: "GST & Tax Invoices", icon: <Receipt className="h-4 w-4" aria-hidden="true" /> },
  { id: "enquiries", label: "Laptop Leads", icon: <Laptop className="h-4 w-4" aria-hidden="true" /> },
  { id: "customers", label: "Client Accounts", icon: <Users className="h-4 w-4" aria-hidden="true" /> },
];

const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "month", label: "This Month" },
  { id: "quarter", label: "This Quarter" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
];

export default function AdminReportsDashboard() {
  const [category, setCategory] = useState<string>("sales");
  const [period, setPeriod] = useState<string>("30d");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [items, setItems] = useState<ReportItem[]>([]);
  const [kpis, setKpis] = useState<ReportKPIs>({
    totalRevenue: 0,
    totalOrders: 0,
    totalServices: 0,
    completedServices: 0,
    inventoryValuation: 0,
    totalCustomers: 0,
    totalEnquiries: 0,
    totalGstCollected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReports = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        category,
        period,
        status: statusFilter,
        q: deferredSearch,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();

      if (data.success) {
        setItems(data.items || []);
        if (data.kpis) setKpis(data.kpis);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, period, statusFilter, deferredSearch, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset page when category or filters change
  useEffect(() => {
    setPage(1);
  }, [category, period, statusFilter, deferredSearch]);

  // Handle Print
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main
      role="main"
      aria-label="Executive Business Reports & Tax Ledgers Console"
      className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:p-0 print:max-w-none print:m-0"
    >
      {/* Top Header - Hidden in Print */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-500/20 shadow-sm">
            <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Executive Business Reports &amp; Ledgers
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Exportable audit records, sales ledgers, GST tax breakdowns, and equipment inventory assets.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={() => fetchReports()}
            disabled={refreshing}
            aria-label="Refresh report dataset"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600 dark:text-cyan-400" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            aria-label="Print report or save as PDF"
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors flex items-center justify-center gap-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Print / PDF</span>
          </button>

          {/* Export CSV */}
          <a
            href={`/api/admin/reports/export?category=${category}&period=${period}&status=${statusFilter}`}
            download
            aria-label={`Export ${category} report to CSV`}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
        </div>
      </header>

      {/* Print-Only Branded Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">NEXLAPTECH SERVICES PVT LTD</h1>
            <p className="text-xs text-slate-600">Executive Business Ledger &amp; Operations Audit Report</p>
            <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold uppercase tracking-wider block">Category: {category.toUpperCase()}</span>
            <span className="text-slate-600">Period: {period.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section aria-label="Executive Financial Summary" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-white/5" />
          ))
        ) : (
          <>
            {/* Total Revenue */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Revenue</span>
              <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                ₹{Math.round(kpis.totalRevenue).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                {kpis.totalOrders} confirmed orders
              </span>
            </div>

            {/* Inventory Valuation */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inventory Assets</span>
              <div className="text-xl sm:text-2xl font-display font-extrabold text-indigo-700 dark:text-cyan-300 mt-1 truncate">
                ₹{Math.round(kpis.inventoryValuation).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">On-hand hardware stock</span>
            </div>

            {/* GST Tax Collected */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">GST Collected</span>
              <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                ₹{Math.round(kpis.totalGstCollected).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">CGST + SGST + IGST</span>
            </div>

            {/* Service Repairs */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Repairs Done</span>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {kpis.completedServices}
              </div>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-medium">
                {kpis.totalServices} total bookings
              </span>
            </div>

            {/* Laptop Enquiries */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Laptop Leads</span>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {kpis.totalEnquiries}
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-medium">Verified corporate inquiries</span>
            </div>

            {/* Registered Clients */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client Base</span>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {kpis.totalCustomers}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Active customer database</span>
            </div>
          </>
        )}
      </section>

      {/* Category Tab Pills - Hidden in Print */}
      <section aria-label="Report Category Tabs" className="print:hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              aria-label={`Select ${tab.label} report category`}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                category === tab.id
                  ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filters & Search Toolbar - Hidden in Print */}
      <section
        aria-label="Report Filtering and Search Toolbar"
        className="futuristic-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-3 print:hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Period Selector */}
          <div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Select report time period"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  Period: {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter report items by status"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed / Delivered</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by ID, customer name, SKU, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search report items"
              className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search input"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Report Table Section */}
      <section aria-label="Detailed Business Report Dataset">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 futuristic-card rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 space-y-3 shadow-sm">
            <FileSpreadsheet className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No records found for active filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No entries match the chosen category, date period, or search query.
            </p>
            <button
              onClick={() => {
                setPeriod("all");
                setStatusFilter("all");
                setSearch("");
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-cyan-400 text-xs font-bold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards Layout (< 1024px) - Hidden in Print */}
            <div className="block lg:hidden space-y-3 print:hidden">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                        {item.refCode}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">
                        {item.primaryText}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.secondaryText}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.metaText}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Value</span>
                      <strong className="text-base font-extrabold text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Date</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 2. Desktop High-Density Table Layout (>= 1024px & Print) */}
            <div className="hidden lg:block print:block futuristic-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] print:bg-slate-100 print:text-slate-900">
                      <th scope="col" className="py-3.5 px-4">Reference</th>
                      <th scope="col" className="py-3.5 px-4">Primary Entity / Customer</th>
                      <th scope="col" className="py-3.5 px-4">Details / Category</th>
                      <th scope="col" className="py-3.5 px-4">Metadata</th>
                      <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                      <th scope="col" className="py-3.5 px-4 text-right">Amount / Valuation</th>
                      <th scope="col" className="py-3.5 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200 print:text-slate-900">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400 print:text-slate-950">
                          {item.refCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white print:text-slate-950">{item.primaryText}</div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.secondaryText}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {item.badgeText}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.metaText}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 print:border-slate-400 print:text-slate-900">
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-slate-900 dark:text-white print:text-slate-950">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400 text-[11px]">
                          {new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Pagination Footer - Hidden in Print */}
      {totalPages > 1 && (
        <nav aria-label="Reports Pagination Navigation" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 print:hidden">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{(page - 1) * limit + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(page * limit, totalCount)}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{totalCount}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Go to previous reports page"
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold px-3 text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Go to next reports page"
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      {/* Verification Footer */}
      <footer className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 border-t border-slate-200 dark:border-white/5 print:hidden">
        <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span>Verified Ledger Engine: Synchronized with PostgreSQL transactional database · All monetary values reported in Indian Rupees (INR)</span>
      </footer>
    </main>
  );
}
