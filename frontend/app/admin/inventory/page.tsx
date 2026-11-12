"use client";

import { useEffect, useState, useMemo, useDeferredValue, useCallback } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlusCircle,
  TrendingDown,
  RefreshCw,
  Download,
  History,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  IndianRupee,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  itemKey: string;
  productId: string;
  variantId?: string;
  sku: string;
  productTitle: string;
  variantName?: string;
  category: string;
  stock: number;
  price: number;
  threshold: number;
  status: StockStatus;
  valuation: number;
  image?: string;
  lastUpdated: string;
}

export interface InventoryStats {
  totalSkus: number;
  totalStockUnits: number;
  healthyStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeAlertsCount: number;
  totalInventoryValuation: number;
  categories: string[];
}

export interface InventoryTransaction {
  id: string;
  product_id?: string;
  variant_id?: string;
  sku?: string;
  product_title?: string;
  type: "stock_in" | "stock_out" | "adjustment";
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string;
  admin_name?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; badgeClass: string; icon: React.ReactNode; barColor: string }
> = {
  in_stock: {
    label: "In Stock",
    badgeClass: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    icon: <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    barColor: "bg-emerald-500",
  },
  low_stock: {
    label: "Low Stock Alert",
    badgeClass: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    icon: <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    barColor: "bg-amber-500",
  },
  out_of_stock: {
    label: "Out of Stock",
    badgeClass: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    barColor: "bg-rose-500",
  },
};

const ADJUSTMENT_REASONS = [
  "Supplier / Purchase Order Delivery",
  "Physical Warehouse Audit Count Correction",
  "Customer Order Return & Restock",
  "Damaged / Defective Stock Write-off",
  "Offline Walk-in Store Sale Allocation",
  "Sample / Marketing Display Unit Allocation",
  "Standard Inventory Adjustment",
];

export default function AdminInventoryControl() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalSkus: 0,
    totalStockUnits: 0,
    healthyStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    activeAlertsCount: 0,
    totalInventoryValuation: 0,
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination state
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [globalThreshold, setGlobalThreshold] = useState<number>(5);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Restock & Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"stock_in" | "stock_out" | "adjustment">("stock_in");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>(ADJUSTMENT_REASONS[0]);
  const [adjustAdmin, setAdjustAdmin] = useState<string>("Admin");
  const [submitting, setSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Movement History Drawer state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<InventoryTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: deferredSearch,
        status: statusFilter,
        category: categoryFilter,
        threshold: String(globalThreshold),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load inventory data");
      const data = await res.json();

      if (data.success) {
        setItems(data.items || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, deferredSearch, statusFilter, categoryFilter, globalThreshold, sortBy, sortOrder]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Realtime updates listener
  useEffect(() => {
    const handleRealtime = () => fetchInventory();
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, [fetchInventory]);

  // Handle open restock modal
  const openRestockModal = (item: InventoryItem, initialType: "stock_in" | "stock_out" | "adjustment" = "stock_in") => {
    setSelectedItem(item);
    setAdjustType(initialType);
    setAdjustQty(initialType === "adjustment" ? item.stock : 10);
    setAdjustReason(
      initialType === "stock_in"
        ? ADJUSTMENT_REASONS[0]
        : initialType === "stock_out"
          ? ADJUSTMENT_REASONS[3]
          : ADJUSTMENT_REASONS[1]
    );
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  // Handle open history drawer
  const openHistoryDrawer = async (item: InventoryItem) => {
    setHistoryItem(item);
    setIsHistoryDrawerOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${item.productId}`);
      if (res.ok) {
        const data = await res.json();
        const txs: InventoryTransaction[] = data.transactions || [];
        // Filter by variant or SKU if item has variant
        const filteredTxs = item.variantId
          ? txs.filter((t) => t.variant_id === item.variantId || t.sku === item.sku)
          : txs;
        setHistoryTransactions(filteredTxs.length > 0 ? filteredTxs : txs);
      } else {
        setHistoryTransactions([]);
      }
    } catch {
      setHistoryTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Preview resulting stock
  const computedResultStock = useMemo(() => {
    if (!selectedItem) return 0;
    const current = selectedItem.stock;
    const qty = Math.max(0, Number(adjustQty) || 0);

    if (adjustType === "stock_in") return current + qty;
    if (adjustType === "stock_out") return Math.max(0, current - qty);
    return qty;
  }, [selectedItem, adjustType, adjustQty]);

  // Submit stock adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (adjustType === "stock_out" && selectedItem.stock < adjustQty) {
      setAdjustError(`Cannot deduct ${adjustQty} units. Current stock is ${selectedItem.stock}. Negative stock is prohibited.`);
      return;
    }

    setSubmitting(true);
    setAdjustError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedItem.productId,
          variantId: selectedItem.variantId,
          type: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason,
          adminName: adjustAdmin || "Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update stock");
      }

      setIsAdjustModalOpen(false);
      setSelectedItem(null);
      fetchInventory();
      // Dispatch realtime event to keep other tabs/windows in sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
      }
    } catch (err: any) {
      setAdjustError(err.message || "Failed to record stock update.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      role="main"
      aria-label="Hardware Inventory & Stock Alerts Management"
      className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-500/20 shadow-sm">
              <Package className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hardware Inventory &amp; Stock Alerts
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Enterprise stock control, warehouse inventory valuation, low-stock alerts, and audit tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Low stock threshold selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Alert Threshold:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={globalThreshold}
              onChange={(e) => setGlobalThreshold(Math.max(1, Number(e.target.value)))}
              aria-label="Global low-stock threshold in units"
              className="w-12 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white text-xs"
            />
            <span className="text-slate-500 dark:text-slate-400 font-medium">units</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchInventory()}
            disabled={refreshing}
            aria-label="Refresh inventory data"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600 dark:text-cyan-400" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export to CSV Button */}
          <a
            href="/api/admin/inventory/export"
            download
            aria-label="Export inventory data to CSV"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section aria-label="Inventory Key Performance Indicators" className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Tracked SKUs */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total SKUs</span>
            <Layers className="h-4 w-4 text-indigo-500 dark:text-cyan-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            {stats.totalSkus.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Catalog items &amp; variants</span>
        </div>

        {/* Physical Stock Units */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Units</span>
            <Package className="h-4 w-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            {stats.totalStockUnits.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">On-hand physical stock</span>
        </div>

        {/* Healthy In Stock */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Stock</span>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-display font-extrabold text-emerald-700 dark:text-emerald-400">
            {stats.healthyStockCount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 font-medium">Healthy inventory level</span>
        </div>

        {/* Low Stock Alerts */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-display font-extrabold text-amber-700 dark:text-amber-400">
            {stats.lowStockCount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-1 font-medium">At or below threshold</span>
        </div>

        {/* Out of Stock */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-display font-extrabold text-rose-700 dark:text-rose-400">
            {stats.outOfStockCount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/70 mt-1 font-medium">Zero stock on-hand</span>
        </div>

        {/* Total Valuation */}
        <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-indigo-200 dark:border-cyan-500/20 bg-indigo-50/40 dark:bg-cyan-950/20 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-700 dark:text-cyan-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valuation</span>
            <IndianRupee className="h-4 w-4 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-extrabold text-indigo-900 dark:text-cyan-300 truncate">
            ₹{Math.round(stats.totalInventoryValuation).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-indigo-600/80 dark:text-cyan-400/70 mt-1 font-medium">Estimated stock value</span>
        </div>
      </section>

      {/* Alert Notice Banner */}
      {stats.activeAlertsCount > 0 ? (
        <section
          aria-label="Active Inventory Attention Notice"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/25 px-5 py-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-200/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-100">
                {stats.activeAlertsCount} inventory SKU(s) require replenishment attention.
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                {stats.outOfStockCount} SKU(s) are completely out of stock and {stats.lowStockCount} SKU(s) are at or below the minimum threshold ({globalThreshold} units).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter("low_stock");
              setPage(1);
            }}
            aria-label="Filter low stock items"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-bold text-xs hover:bg-amber-700 dark:hover:bg-amber-400 dark:text-slate-950 transition-colors shadow-sm shrink-0 self-stretch sm:self-auto flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Filter Active Alerts
          </button>
        </section>
      ) : (
        <section
          aria-label="Inventory Health Notice"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-3 text-xs text-emerald-800 dark:text-emerald-300 shadow-sm"
        >
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold">
            Healthy Stock Levels: All catalog hardware items are currently above the safety threshold.
          </span>
        </section>
      )}

      {/* Filters and View Controls */}
      <section
        aria-label="Inventory Filtering and Search Controls"
        className="futuristic-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-4"
      >
        {/* Top Filter Buttons / Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          {[
            { id: "all", label: "All Items", count: stats.totalSkus },
            { id: "low_stock", label: "Low Stock", count: stats.lowStockCount },
            { id: "out_of_stock", label: "Out of Stock", count: stats.outOfStockCount },
            { id: "in_stock", label: "In Stock", count: stats.healthyStockCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setPage(1);
              }}
              aria-label={`Filter by ${tab.label} (${tab.count})`}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusFilter === tab.id
                ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusFilter === tab.id
                  ? "bg-white/20 text-white dark:text-slate-950"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Category, and Sorting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by SKU, product, variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search hardware inventory by SKU or product title"
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

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter items by hardware category"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Hardware Categories</option>
              {stats.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort inventory items"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="status">Sort: Urgency / Stock Status</option>
              <option value="stock">Sort: Stock Quantity</option>
              <option value="valuation">Sort: Inventory Valuation</option>
              <option value="price">Sort: Unit Price</option>
              <option value="title">Sort: Product Title</option>
              <option value="sku">Sort: SKU Code</option>
              <option value="updated_at">Sort: Last Updated</option>
            </select>
          </div>

          {/* Sort Direction & Limit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              aria-label={`Toggle sort order to ${sortOrder === "asc" ? "descending" : "ascending"}`}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
            </button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Select items per page"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Inventory Content (Mobile Cards + Desktop Table) */}
      <section aria-label="Inventory Listings">
        {loading ? (
          /* Skeletons */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-white/5"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 futuristic-card rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 space-y-3 shadow-sm">
            <Package className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No hardware inventory items found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No items match your active search &quot;{search}&quot; or filter criteria. Try adjusting the filter or threshold.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              aria-label="Reset all search and filter parameters"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-cyan-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards Layout (Visible below lg, 360px - 1023px) */}
            <div className="block lg:hidden space-y-3">
              {items.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                const percentage = Math.min(100, Math.round((item.stock / Math.max(1, item.threshold * 2)) * 100));

                return (
                  <article
                    key={item.itemKey}
                    aria-label={`Inventory card for SKU ${item.sku}`}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    {/* Header: SKU & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400 tracking-wide">
                          {item.sku}
                        </span>
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">
                          {item.productTitle}
                        </h2>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${cfg.badgeClass}`}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Variant & Category Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {item.variantName && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/20 font-semibold">
                          Config: {item.variantName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium capitalize">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Stock Level Bar & Counts */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">On-hand Stock:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-base font-extrabold ${item.status === "out_of_stock"
                              ? "text-rose-600 dark:text-rose-400"
                              : item.status === "low_stock"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-900 dark:text-white"
                              }`}
                          >
                            {item.stock}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">units</span>
                        </div>
                      </div>

                      {/* Visual gauge */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${cfg.barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                        <span>Threshold: {item.threshold} units</span>
                        <span>Valuation: ₹{item.valuation.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Pricing & Last Updated */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500 dark:text-slate-400">Unit Price:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{new Date(item.lastUpdated).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Action Buttons (Touch targets >= 44px) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => openRestockModal(item, "stock_in")}
                        aria-label={`Restock or adjust stock for ${item.sku}`}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold text-xs hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <PlusCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Restock / Adjust</span>
                      </button>

                      <button
                        onClick={() => openHistoryDrawer(item)}
                        aria-label={`View movement history for ${item.sku}`}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <History className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        <span>Movement Log</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 2. Desktop Table Layout (Visible >= lg, 1024px+) */}
            <div className="hidden lg:block futuristic-card rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                      <th scope="col" className="py-3.5 px-4">SKU / Item Key</th>
                      <th scope="col" className="py-3.5 px-4">Product &amp; Configuration</th>
                      <th scope="col" className="py-3.5 px-4">Category</th>
                      <th scope="col" className="py-3.5 px-4 text-center">Stock Level</th>
                      <th scope="col" className="py-3.5 px-4 text-center">Threshold</th>
                      <th scope="col" className="py-3.5 px-4">Status</th>
                      <th scope="col" className="py-3.5 px-4">Unit Price</th>
                      <th scope="col" className="py-3.5 px-4">Valuation</th>
                      <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                    {items.map((item) => {
                      const cfg = STATUS_CONFIG[item.status];
                      const percentage = Math.min(100, Math.round((item.stock / Math.max(1, item.threshold * 2)) * 100));

                      return (
                        <tr
                          key={item.itemKey}
                          className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${item.status === "out_of_stock"
                            ? "bg-rose-50/40 dark:bg-rose-950/10"
                            : item.status === "low_stock"
                              ? "bg-amber-50/30 dark:bg-amber-950/10"
                              : ""
                            }`}
                        >
                          {/* SKU */}
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400">
                            {item.sku}
                          </td>

                          {/* Product Title & Variant */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {item.productTitle}
                            </div>
                            {item.variantName && (
                              <div className="text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold mt-0.5">
                                Config: {item.variantName}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4">
                            <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">
                              {item.category.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Stock Qty & Bar */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`font-mono font-extrabold text-sm ${item.status === "out_of_stock"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : item.status === "low_stock"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-900 dark:text-white"
                                  }`}
                              >
                                {item.stock} units
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${cfg.barColor}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Threshold */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400 font-semibold">
                            {item.threshold}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}
                            >
                              {cfg.icon}
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          {/* Unit Price */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            ₹{item.price.toLocaleString("en-IN")}
                          </td>

                          {/* Total Valuation */}
                          <td className="py-3.5 px-4 font-bold text-indigo-700 dark:text-cyan-300">
                            ₹{item.valuation.toLocaleString("en-IN")}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => openRestockModal(item, "stock_in")}
                                aria-label={`Quick restock ${item.sku}`}
                                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 dark:hover:bg-cyan-500/20 font-bold text-xs inline-flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Adjust</span>
                              </button>
                              <button
                                onClick={() => openHistoryDrawer(item)}
                                aria-label={`View audit logs for ${item.sku}`}
                                className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <History className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <nav
          aria-label="Inventory Pagination Navigation"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
        >
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{(page - 1) * limit + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(page * limit, totalCount)}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{totalCount}</strong> items
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Go to previous page"
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              aria-label="Go to next page"
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      {/* Restock & Adjustment Modal */}
      {isAdjustModalOpen && selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !submitting && setIsAdjustModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 space-y-4 text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                  {selectedItem.sku}
                </span>
                <h3 id="adjust-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Stock Replenishment &amp; Adjustment
                </h3>
              </div>
              <button
                onClick={() => !submitting && setIsAdjustModalOpen(false)}
                aria-label="Close adjustment modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Error Message */}
            {adjustError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{adjustError}</span>
              </div>
            )}

            {/* Product Summary */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{selectedItem.productTitle}</div>
              {selectedItem.variantName && (
                <div className="text-slate-600 dark:text-slate-400">Configuration: {selectedItem.variantName}</div>
              )}
              <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                <span>Current on-hand stock:</span>
                <strong className="text-slate-900 dark:text-white font-mono text-sm">
                  {selectedItem.stock} units
                </strong>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
              {/* Adjustment Mode Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Adjustment Operation:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "stock_in", label: "Stock In (+)", desc: "Replenish" },
                    { id: "stock_out", label: "Stock Out (-)", desc: "Deduct" },
                    { id: "adjustment", label: "Manual Count (=)", desc: "Direct" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAdjustType(mode.id as any)}
                      aria-label={`Select ${mode.label}`}
                      className={`min-h-[44px] p-2.5 rounded-xl text-center border font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${adjustType === mode.id
                        ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-indigo-600 dark:border-cyan-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      <div className="text-xs">{mode.label}</div>
                      <div className="text-[10px] opacity-75">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input with Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {adjustType === "stock_in"
                    ? "Units to Add:"
                    : adjustType === "stock_out"
                      ? "Units to Deduct:"
                      : "Absolute Target Physical Units:"}
                </label>
                <input
                  type="number"
                  min={adjustType === "stock_out" ? 1 : 0}
                  max={adjustType === "stock_out" ? selectedItem.stock : 99999}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, Number(e.target.value)))}
                  aria-label="Adjustment quantity"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick preset buttons */}
                {adjustType === "stock_in" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Presets:</span>
                    {[5, 10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAdjustQty(preset)}
                        aria-label={`Set quantity to +${preset}`}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-cyan-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 text-[10px] font-bold transition-colors"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Standardized Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Audit Movement Reason:</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  aria-label="Stock movement reason"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ADJUSTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Administrator Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Auditor / Staff In-Charge:</label>
                <input
                  type="text"
                  value={adjustAdmin}
                  onChange={(e) => setAdjustAdmin(e.target.value)}
                  aria-label="Staff member recording this adjustment"
                  placeholder="e.g. Operations Manager"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Resulting stock preview callout */}
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-cyan-500/20 bg-indigo-50/50 dark:bg-cyan-950/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900 dark:text-cyan-200">
                  New Resulting Stock:
                </span>
                <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-cyan-400">
                  {computedResultStock} units
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  disabled={submitting}
                  aria-label="Cancel stock adjustment"
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Confirm and save stock adjustment"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-extrabold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>{submitting ? "Saving..." : "Confirm & Save"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Drawer */}
      {isHistoryDrawerOpen && historyItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-drawer-title"
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 flex flex-col space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                    {historyItem.sku}
                  </span>
                </div>
                <h3 id="history-drawer-title" className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                  Stock Movement Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {historyItem.productTitle}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                aria-label="Close history drawer"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Current Item Summary */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Current Stock:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{historyItem.stock} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Safety Threshold:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{historyItem.threshold} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Valuation:</span>
                <span className="font-bold text-indigo-600 dark:text-cyan-400">₹{historyItem.valuation.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Transaction Logs */}
            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Logged Movements
              </h4>

              {historyLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : historyTransactions.length === 0 ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6">
                  <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" aria-hidden="true" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">No prior stock movements logged</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Stock adjustments performed via the restock tool will record here with immutable audit timestamps.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${tx.type === "stock_in"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : tx.type === "stock_out"
                              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300"
                              : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300"
                            }`}
                        >
                          {tx.type === "stock_in" ? "+ Stock In" : tx.type === "stock_out" ? "- Stock Out" : "Adjustment"}
                        </span>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                          {tx.type === "stock_in" ? `+${tx.quantity}` : tx.type === "stock_out" ? `-${tx.quantity}` : `Qty: ${tx.quantity}`}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">{tx.reason}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5">
                        <span>By: {tx.admin_name || "Admin"}</span>
                        <span>{new Date(tx.created_at).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => {
                  setIsHistoryDrawerOpen(false);
                  openRestockModal(historyItem, "stock_in");
                }}
                aria-label="Add new movement from history drawer"
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold text-xs hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>Record New Movement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
