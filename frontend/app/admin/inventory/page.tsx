"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  PlusCircle,
  Trash2,
  TrendingDown,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpDown
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
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  low_stock: {
    label: "Low Stock Alert",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
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
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-nex-blueLight" />
            Inventory &amp; Alert Management
          </h1>
          <p className="text-xs text-nex-mist mt-0.5">
            Real-time stock monitoring derived from authoritative product and variant SKU quantities. Alerts resolve automatically upon restocking.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/90">
          <span className="text-nex-mist font-semibold">Low-Stock Threshold:</span>
          <input
            type="number"
            min={1}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-xl bg-nex-black border border-white/20 px-3 py-1.5 text-center text-white font-bold focus:outline-none"
          />
          <span className="text-nex-mist">units</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tracked SKUs", value: totalItems, color: "text-white" },
          { label: "Healthy In Stock", value: inStockCount, color: "text-emerald-400" },
          { label: "Low Stock Alerts", value: lowStockCount, color: "text-amber-400" },
          { label: "Out of Stock SKUs", value: outOfStockCount, color: "text-rose-400" },
        ].map((card) => (
          <div key={card.label} className="glass-panel bg-nex-ink/80 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[10px] text-nex-mist font-bold uppercase tracking-wider">{card.label}</span>
            <span className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {activeAlertsCount > 0 ? (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <span>
              <strong>{activeAlertsCount} active inventory alert(s)</strong> require replenishment attention ({outOfStockCount} out of stock, {lowStockCount} below threshold).
            </span>
          </div>
          <button
            onClick={() => { setActiveTab("alerts"); setStatusFilter("all"); }}
            className="rounded-lg bg-amber-500/20 px-3 py-1 font-bold text-amber-300 hover:bg-amber-500/30 text-[11px]"
          >
            Filter Alerts
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>All hardware catalog SKUs and variants are above the minimum stock threshold.</span>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-nex-ink flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "alerts"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber"
                : "bg-white/5 text-nex-mist hover:text-white"
            }`}
          >
            Active Stock Alerts ({activeAlertsCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-nex-blue text-white shadow-glow-blue"
                : "bg-white/5 text-nex-mist hover:text-white"
            }`}
          >
            All Inventory Items ({totalItems})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nex-mist" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-nex-black border border-white/10 pl-8 pr-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl bg-nex-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none font-bold"
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
        <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 bg-nex-ink space-y-2">
          <Package className="h-8 w-8 text-nex-mist mx-auto" />
          <p className="text-xs text-white font-semibold">No inventory items match the current filter.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 bg-nex-ink overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-nex-mist font-bold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-white/[0.03]">
                {filteredItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const isEditing = editingKey === item.itemKey;

                  return (
                    <tr
                      key={item.itemKey}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        item.status === "out_of_stock" ? "bg-rose-500/[0.02]" : ""
                      }`}
                    >
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-nex-blueLight">
                        {item.sku}
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{item.productTitle}</div>
                        {item.variantName && (
                          <div className="text-[10px] text-nex-blueLight font-semibold mt-0.5">
                            Config: {item.variantName}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-nex-mist">{item.category.replace(/_/g, " ")}</span>
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
                              className="w-16 rounded-lg bg-black border border-nex-blue px-2 py-1 text-xs text-white font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(item, editQty)}
                              className="h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center"
                              title="Save quantity"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="h-6 w-6 rounded-md bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingKey(item.itemKey); setEditQty(item.stock); }}
                            className="font-mono font-bold text-sm text-white hover:text-nex-blueLight underline decoration-dotted"
                            title="Click to edit quantity inline"
                          >
                            {item.stock}
                          </button>
                        )}
                      </td>

                      {/* Threshold */}
                      <td className="py-3.5 px-4 text-nex-mist font-mono">
                        {item.threshold} units
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        ₹{item.price.toLocaleString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setModalItem(item); setAddQty(10); setIsModalOpen(true); }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-nex-blue/30 bg-nex-blue/10 px-3 py-1.5 text-[11px] font-bold text-nex-blueLight hover:bg-nex-blue/20 transition-all"
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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="glass-panel relative w-full max-w-md rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-nex-blueLight font-bold uppercase">{modalItem.sku}</span>
                <h3 className="font-display text-base font-bold text-white">Restock Hardware Units</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-white font-bold">{modalItem.productTitle}</div>
              {modalItem.variantName && <div className="text-nex-mist text-[11px]">Variant: {modalItem.variantName}</div>}
              <div className="text-nex-mist text-[11px]">Current on-hand inventory: <strong className="text-white">{modalItem.stock} units</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/90">Add Additional Stock Units:</label>
              <input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl bg-nex-black border border-white/10 px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none"
              />
              <span className="text-[10px] text-nex-mist">
                New resulting inventory will be: <strong>{modalItem.stock + Math.max(0, Number(addQty))} units</strong>
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary !py-2 !px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestockSubmit}
                className="btn-primary !py-2 !px-5 font-bold"
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
