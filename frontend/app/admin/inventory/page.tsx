"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X,
  PlusCircle,
  TrendingDown,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  itemKey: string; // Unique key: productId + (variantId || 'base')
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
  lastUpdated: string;
}

function computeStatus(qty: number, threshold: number): StockStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; icon: React.ReactNode }> = {
  in_stock: {
    label: "In Stock",
    color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  low_stock: {
    label: "Low Stock Alert",
    color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export default function AdminInventoryControl() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [threshold, setThreshold] = useState(5);
  const [activeTab, setActiveTab] = useState<"all" | "alerts">("alerts");

  // Inline editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  // Add stock modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState(0);

  const loadData = async () => {
    const list = await dbHelper.products.list();
    setProducts(list);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("nexbyte-realtime", handler);
    return () => window.removeEventListener("nexbyte-realtime", handler);
  }, []);

  // Deterministically derive inventory items from actual products & variants
  const inventoryItems: InventoryItem[] = useMemo(() => {
    const items: InventoryItem[] = [];

    products.forEach((p) => {
      const pSku = p.sku || `SKU-${p.id.toUpperCase()}`;
      const pUpdated = p.updated_at || p.created_at || new Date().toISOString();

      if (Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v: any, vIdx: number) => {
          const vSku = v.sku || `${pSku}-V${vIdx + 1}`;
          const vStock = Math.max(0, Number(v.stock ?? p.stock ?? 0));
          const vPrice = Number(v.price ?? p.price ?? 0);
          const vThreshold = Number(v.lowStockThreshold ?? threshold);
          const vKey = `${p.id}:${v.id || vIdx}`;

          items.push({
            itemKey: vKey,
            productId: p.id,
            variantId: v.id || String(vIdx),
            sku: vSku,
            productTitle: p.title,
            variantName: v.name || v.label,
            category: p.category || "hardware",
            stock: vStock,
            price: vPrice,
            threshold: vThreshold,
            status: computeStatus(vStock, vThreshold),
            lastUpdated: v.updated_at || pUpdated,
          });
        });
      } else {
        const pStock = Math.max(0, Number(p.stock ?? 0));
        const pPrice = Number(p.price ?? 0);
        const pKey = `${p.id}:base`;

        items.push({
          itemKey: pKey,
          productId: p.id,
          sku: pSku,
          productTitle: p.title,
          category: p.category || "hardware",
          stock: pStock,
          price: pPrice,
          threshold,
          status: computeStatus(pStock, threshold),
          lastUpdated: pUpdated,
        });
      }
    });

    return items;
  }, [products, threshold]);

  const handleSaveStock = async (item: InventoryItem, newQty: number) => {
    const sanitizedQty = Math.max(0, Number(newQty)); // Prevent negative stock
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return;

    if (item.variantId && Array.isArray(prod.variants)) {
      const updatedVariants = prod.variants.map((v: any, idx: number) => {
        if ((v.id && v.id === item.variantId) || String(idx) === item.variantId) {
          return { ...v, stock: sanitizedQty, updated_at: new Date().toISOString() };
        }
        return v;
      });
      const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
      await dbHelper.products.update(prod.id, {
        variants: updatedVariants,
        stock: totalStock,
        updated_at: new Date().toISOString()
      });
    } else {
      await dbHelper.products.update(prod.id, {
        stock: sanitizedQty,
        updated_at: new Date().toISOString()
      });
    }

    setEditingKey(null);
    loadData();
  };

  const handleRestockSubmit = async () => {
    if (!modalItem) return;
    const currentStock = modalItem.stock;
    const additional = Math.max(0, Number(addQty));
    await handleSaveStock(modalItem, currentStock + additional);
    setIsModalOpen(false);
    setModalItem(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.productTitle.toLowerCase().includes(q) ||
        (item.variantName || "").toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchTab = activeTab === "all" || item.status === "low_stock" || item.status === "out_of_stock";

      return matchSearch && matchStatus && matchTab;
    });
  }, [inventoryItems, search, statusFilter, activeTab]);

  // Alert summary metrics
  const totalItems = inventoryItems.length;
  const inStockCount = inventoryItems.filter((i) => i.status === "in_stock").length;
  const lowStockCount = inventoryItems.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = inventoryItems.filter((i) => i.status === "out_of_stock").length;
  const activeAlertsCount = lowStockCount + outOfStockCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600 dark:text-cyan-400" />
            Inventory &amp; Alert Management
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time stock monitoring derived from authoritative product and variant SKU quantities. Alerts resolve automatically upon restocking.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Low-Stock Threshold:</span>
          <input
            type="number"
            min={1}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-xl futuristic-input px-3 py-1.5 text-center font-bold"
          />
          <span className="text-slate-500 dark:text-slate-400">units</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tracked SKUs", value: totalItems, color: "text-slate-900 dark:text-white" },
          { label: "Healthy In Stock", value: inStockCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Low Stock Alerts", value: lowStockCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "Out of Stock SKUs", value: outOfStockCount, color: "text-rose-600 dark:text-rose-400" },
        ].map((card) => (
          <div key={card.label} className="futuristic-card rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
            <span className={`text-2xl font-display font-extrabold ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {activeAlertsCount > 0 ? (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-5 py-3 text-xs text-amber-800 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>{activeAlertsCount} active inventory alert(s)</strong> require replenishment attention ({outOfStockCount} out of stock, {lowStockCount} below threshold).
            </span>
          </div>
          <button
            onClick={() => { setActiveTab("alerts"); setStatusFilter("all"); }}
            className="rounded-xl bg-amber-200/80 dark:bg-amber-500/20 px-3 py-1 font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-300 dark:hover:bg-amber-500/30 text-[11px] transition-colors"
          >
            Filter Alerts
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-5 py-3 text-xs text-emerald-800 dark:text-emerald-300 shadow-sm">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>All hardware catalog SKUs and variants are above the minimum stock threshold.</span>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="futuristic-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "alerts"
                ? "bg-amber-500 text-white shadow-sm font-extrabold"
                : "futuristic-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Active Stock Alerts ({activeAlertsCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                : "futuristic-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Inventory Items ({totalItems})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="futuristic-input w-full pl-8 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="futuristic-input px-3 py-2 text-xs font-bold w-36"
          >
            <option value="all">All Levels</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="in_stock">In Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 futuristic-card rounded-2xl space-y-2">
          <Package className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-900 dark:text-white font-semibold">No inventory items match the current filter.</p>
        </div>
      ) : (
        <div className="futuristic-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">SKU / Item Key</th>
                  <th className="py-3 px-4">Product &amp; Configuration</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Qty</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.03] text-slate-800 dark:text-white/90">
                {filteredItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const isEditing = editingKey === item.itemKey;

                  return (
                    <tr
                      key={item.itemKey}
                      className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${
                        item.status === "out_of_stock" ? "bg-rose-50/50 dark:bg-rose-500/[0.02]" : ""
                      }`}
                    >
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400">
                        {item.sku}
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.productTitle}</div>
                        {item.variantName && (
                          <div className="text-[10px] text-indigo-600 dark:text-cyan-400 font-semibold mt-0.5">
                            Config: {item.variantName}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-600 dark:text-slate-400">{item.category.replace(/_/g, " ")}</span>
                      </td>

                      {/* Stock Qty (Inline editable) */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editQty}
                              onChange={(e) => setEditQty(Math.max(0, Number(e.target.value)))}
                              className="w-16 rounded-lg futuristic-input px-2 py-1 text-xs font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(item, editQty)}
                              className="h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center"
                              title="Save quantity"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="h-6 w-6 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingKey(item.itemKey); setEditQty(item.stock); }}
                            className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-cyan-400 underline decoration-dotted"
                            title="Click to edit quantity inline"
                          >
                            {item.stock}
                          </button>
                        )}
                      </td>

                      {/* Threshold */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {item.threshold} units
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        ₹{item.price.toLocaleString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setModalItem(item); setAddQty(10); setIsModalOpen(true); }}
                          className="futuristic-btn-secondary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isModalOpen && modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 dark:bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="futuristic-card relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-bold uppercase">{modalItem.sku}</span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Restock Hardware Units</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-900 dark:text-white font-bold">{modalItem.productTitle}</div>
              {modalItem.variantName && <div className="text-slate-500 dark:text-slate-400 text-[11px]">Variant: {modalItem.variantName}</div>}
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Current on-hand inventory: <strong className="text-slate-900 dark:text-white">{modalItem.stock} units</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-white/90">Add Additional Stock Units:</label>
              <input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                className="futuristic-input w-full font-bold"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                New resulting inventory will be: <strong>{modalItem.stock + Math.max(0, Number(addQty))} units</strong>
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="futuristic-btn-secondary !py-2 !px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestockSubmit}
                className="futuristic-btn-primary !py-2 !px-5 font-bold"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
