"use client";

import React, { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  PlusCircle,
  Tag,
  Search,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  AlertCircle,
  Package,
  CheckCircle,
  Filter,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { DEFAULT_FILTER_DEFINITIONS, buildDynamicCatalogFilters } from "@/lib/filterEngine";
import { FilterDefinition, FilterOption, FilterType } from "@/lib/types/ecommerce";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  { val: "all", label: "Global (All Categories)" },
  { val: "business_laptops", label: "Business Laptops & Refurbished" },
  { val: "storage", label: "Storage (SSD / HDD)" },
  { val: "ram", label: "RAM / Memory" },
  { val: "cctv", label: "CCTV Systems" },
  { val: "peripherals", label: "Peripherals & Accessories" },
];

const FILTER_TYPES: { type: FilterType; label: string }[] = [
  { type: "multi-select", label: "Multi-Select Checkboxes" },
  { type: "single-select", label: "Single Select Dropdown" },
  { type: "boolean", label: "Boolean Toggle (Yes / No)" },
  { type: "price-range", label: "Price Range Slider" },
  { type: "range", label: "Numeric Range" },
  { type: "rating", label: "Customer Ratings" },
  { type: "checkbox", label: "Single Checkbox" },
];

export default function AdminProductFiltersPage() {
  const [filters, setFilters] = useState<FilterDefinition[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterDefinition | null>(null);

  // Form Fields
  const [filterId, setFilterId] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [categoryId, setCategoryId] = useState("business_laptops");
  const [type, setType] = useState<FilterType>("multi-select");
  const [unit, setUnit] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [options, setOptions] = useState<FilterOption[]>([]);

  // Option Input State
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  // Preview State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCategory, setPreviewCategory] = useState("business_laptops");

  const loadData = async () => {
    try {
      setLoading(true);
      // Try dedicated server API first
      let filterList: FilterDefinition[] | null = null;
      try {
        const res = await fetch("/api/admin/product-filters");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.filters)) {
            filterList = json.filters;
          }
        }
      } catch {}

      if (!filterList || filterList.length === 0) {
        filterList = await dbHelper.filterDefinitions.list();
      }

      const prodList = await dbHelper.products.list().catch(() => []);
      setFilters(filterList && filterList.length > 0 ? filterList : DEFAULT_FILTER_DEFINITIONS);
      setProducts(prodList || []);
    } catch (e) {
      console.error("Failed to load filter definitions", e);
      setFilters(DEFAULT_FILTER_DEFINITIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRealtime = () => loadData();
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, []);

  // Filter List Display
  const filteredList = useMemo(() => {
    return filters
      .filter((f) => {
        if (selectedCategoryTab !== "all" && f.categoryId !== "all" && f.categoryId !== selectedCategoryTab) {
          return false;
        }
        if (deferredSearch) {
          const q = deferredSearch.toLowerCase();
          return f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  }, [filters, selectedCategoryTab, deferredSearch]);

  // Executive KPI Stats
  const stats = useMemo(() => {
    const total = filters.length;
    const active = filters.filter((f) => f.enabled).length;
    const disabled = total - active;
    const globalCount = filters.filter((f) => f.categoryId === "all").length;
    return { total, active, disabled, globalCount };
  }, [filters]);

  const handleOpenAdd = () => {
    setEditingFilter(null);
    setFilterId(`flt-custom-${Date.now()}`);
    setName("");
    setKey("");
    setCategoryId("business_laptops");
    setType("multi-select");
    setUnit("");
    setEnabled(true);
    setSortOrder(filters.length + 1);
    setOptions([]);
    setNewOptionLabel("");
    setNewOptionValue("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FilterDefinition) => {
    setEditingFilter(f);
    setFilterId(f.id);
    setName(f.name);
    setKey(f.key);
    setCategoryId(f.categoryId);
    setType(f.type);
    setUnit(f.unit || "");
    setEnabled(f.enabled);
    setSortOrder(f.sortOrder);
    setOptions(f.options ? [...f.options] : []);
    setNewOptionLabel("");
    setNewOptionValue("");
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const val = newOptionValue.trim() || newOptionLabel.trim();
    if (options.some((o) => o.value === val)) return;
    setOptions([...options, { label: newOptionLabel.trim(), value: val }]);
    setNewOptionLabel("");
    setNewOptionValue("");
  };

  const handleRemoveOption = (val: string) => {
    setOptions(options.filter((o) => o.value !== val));
  };

  const persistFilters = async (updated: FilterDefinition[]) => {
    setSaving(true);
    try {
      // 1. Try server API
      try {
        await fetch("/api/admin/product-filters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters: updated }),
        });
      } catch {}

      // 2. Client fallback
      await dbHelper.filterDefinitions.save(updated);
      setFilters(updated);
      setFeedbackMsg("Saved successfully!");
      setTimeout(() => setFeedbackMsg(""), 2000);
    } catch (e: any) {
      alert("Failed to save changes: " + (e?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    const payload: FilterDefinition = {
      id: filterId || `flt-${Date.now()}`,
      name: name.trim(),
      key: key.trim(),
      categoryId,
      type,
      unit: unit.trim() || undefined,
      enabled,
      sortOrder: Number(sortOrder) || 1,
      options: options.length > 0 ? options : undefined,
      createdAt: editingFilter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedList: FilterDefinition[];
    if (editingFilter) {
      updatedList = filters.map((f) => (f.id === editingFilter.id ? payload : f));
    } else {
      updatedList = [...filters, payload];
    }

    await persistFilters(updatedList);
    setIsModalOpen(false);
  };

  const handleToggleEnabled = async (id: string) => {
    const updated = filters.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
    await persistFilters(updated);
  };

  const handleDeleteFilter = async (id: string) => {
    if (confirm("Are you sure you want to delete this filter configuration?")) {
      const updated = filters.filter((f) => f.id !== id);
      await persistFilters(updated);
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filteredList.length) return;

    const currentItem = filteredList[index];
    const targetItem = filteredList[targetIdx];

    const tempOrder = currentItem.sortOrder;
    currentItem.sortOrder = targetItem.sortOrder;
    targetItem.sortOrder = tempOrder;

    const updated = filters.map((f) => {
      if (f.id === currentItem.id) return { ...f, sortOrder: currentItem.sortOrder };
      if (f.id === targetItem.id) return { ...f, sortOrder: targetItem.sortOrder };
      return f;
    });

    await persistFilters(updated);
  };

  const handleResetDefaults = async () => {
    if (confirm("Reset all catalog filters to system default configuration?")) {
      await persistFilters(DEFAULT_FILTER_DEFINITIONS);
    }
  };

  // Preview Filter Data Calculation
  const previewFilterGroups = useMemo(() => {
    return buildDynamicCatalogFilters(products, previewCategory, filters);
  }, [products, previewCategory, filters]);

  return (
    <main role="main" className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Catalog Filter Engine &amp; Specifications
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dynamic Product Filters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure category-specific hardware specifications, reorder facet priority, manage dynamic option values, and preview live customer sidebars.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            aria-label="Open customer sidebar filter preview dialog"
            className="min-h-[44px] rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Preview Sidebar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            aria-label="Create a new catalog filter definition"
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>Create Filter</span>
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Cards (Zero CLS) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Filters</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
          <span className="text-[11px] text-cyan-400 font-medium">System specifications</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Live</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-emerald-400">{stats.active}</p>
          <span className="text-[11px] text-emerald-300 font-medium">Visible to shoppers</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Disabled Filters</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20">
              <X className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-slate-300">{stats.disabled}</p>
          <span className="text-[11px] text-slate-400 font-medium">Draft / Offline</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Global Attributes</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Tag className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-indigo-300">{stats.globalCount}</p>
          <span className="text-[11px] text-indigo-400 font-medium">All categories covered</span>
        </div>
      </div>

      {/* ─── Category Filter Navigation & Search Bar ─── */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 backdrop-blur-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mobile Dropdown Selector (Visible on < 640px) */}
        <div className="block sm:hidden w-full">
          <label htmlFor="filter-cat-select" className="sr-only">
            Select Category Filter
          </label>
          <div className="relative">
            <select
              id="filter-cat-select"
              value={selectedCategoryTab}
              onChange={(e) => setSelectedCategoryTab(e.target.value)}
              className="w-full min-h-[44px] appearance-none rounded-xl border border-white/10 bg-[#070B1A] px-4 py-2.5 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.val} value={cat.val}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" aria-hidden="true" />
          </div>
        </div>

        {/* Touch-Scrollable Horizontal Pill Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.val}
              type="button"
              onClick={() => setSelectedCategoryTab(cat.val)}
              aria-label={`Show filters for ${cat.label}`}
              className={cn(
                "min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                selectedCategoryTab === cat.val
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400/40 shadow-md shadow-cyan-500/20"
                  : "bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input & Reset Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search filter name or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search filter definitions by title or attribute key"
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            aria-label="Reset all filters to default system configuration"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Reset Filters to Default"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ─── Loading Skeleton Placeholder (Zero CLS) ─── */}
      {loading ? (
        <div className="space-y-3 animate-pulse rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-6 backdrop-blur-xl">
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-14 rounded-xl bg-white/5" />
          <div className="h-14 rounded-xl bg-white/5" />
          <div className="h-14 rounded-xl bg-white/5" />
        </div>
      ) : (
        <>
          {/* ─── MOBILE VIEW: Responsive Cards (< 768px) ─── */}
          <div className="block md:hidden space-y-3">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-white/5 bg-[#0B0F1E] text-slate-400">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-500 mb-2" aria-hidden="true" />
                <p className="text-xs">No filter definitions found for this view.</p>
              </div>
            ) : (
              filteredList.map((f, idx) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 backdrop-blur-xl shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 font-mono text-[10px] font-bold text-cyan-300">
                          #{f.sortOrder}
                        </span>
                        <h3 className="font-bold text-white text-sm">{f.name}</h3>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        key: <span className="text-cyan-400">{f.key}</span> {f.unit && `(${f.unit})`}
                      </div>
                    </div>

                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {CATEGORY_OPTIONS.find((c) => c.val === f.categoryId)?.label || f.categoryId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-indigo-300 font-semibold">
                      {FILTER_TYPES.find((t) => t.type === f.type)?.label || f.type}
                    </span>
                    {f.options && f.options.length > 0 ? (
                      <span className="rounded bg-white/5 px-2 py-0.5 text-slate-300">
                        {f.options.length} options defined
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Auto Dynamic Options</span>
                    )}
                  </div>

                  {/* Mobile Action Controls Bar */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorder(idx, "up")}
                        aria-label={`Move filter ${f.name} up`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filteredList.length - 1}
                        onClick={() => handleReorder(idx, "down")}
                        aria-label={`Move filter ${f.name} down`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(f.id)}
                        aria-label={`Set filter ${f.name} ${f.enabled ? "offline" : "online"}`}
                        className={cn(
                          "min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border flex items-center gap-1.5",
                          f.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        <span className={`h-2 w-2 rounded-full ${f.enabled ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {f.enabled ? "Active" : "Disabled"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(f)}
                        aria-label={`Edit settings for filter ${f.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFilter(f.id)}
                        aria-label={`Delete filter definition ${f.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ─── DESKTOP VIEW: High-Density Table (>= 768px) ─── */}
          <div className="hidden md:block rounded-2xl border border-white/10 bg-[#0B0F1E]/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-white border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th scope="col" className="py-3.5 px-4 w-20 text-center">Order</th>
                    <th scope="col" className="py-3.5 px-4">Filter Name &amp; Key</th>
                    <th scope="col" className="py-3.5 px-4">Category Assignment</th>
                    <th scope="col" className="py-3.5 px-4">Filter Type</th>
                    <th scope="col" className="py-3.5 px-4">Configured Options</th>
                    <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                    <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No filter definitions configured for this category tab.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((f, idx) => (
                      <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Sort Order & Reorder Controls */}
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-white text-xs">{f.sortOrder}</span>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorder(idx, "up")}
                                aria-label={`Move filter ${f.name} up`}
                                className="min-h-[24px] min-w-[24px] flex items-center justify-center p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowUp className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === filteredList.length - 1}
                                onClick={() => handleReorder(idx, "down")}
                                aria-label={`Move filter ${f.name} down`}
                                className="min-h-[24px] min-w-[24px] flex items-center justify-center p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowDown className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Filter Name & Key */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            key: <span className="text-cyan-400">{f.key}</span> {f.unit && `(unit: ${f.unit})`}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
                            {CATEGORY_OPTIONS.find((c) => c.val === f.categoryId)?.label || f.categoryId}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 font-semibold text-slate-300">
                          {FILTER_TYPES.find((t) => t.type === f.type)?.label || f.type}
                        </td>

                        {/* Options Pills */}
                        <td className="py-3 px-4">
                          {f.options && f.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {f.options.slice(0, 3).map((opt) => (
                                <span key={opt.value} className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-white/5">
                                  {opt.label}
                                </span>
                              ))}
                              {f.options.length > 3 && (
                                <span className="text-[10px] text-cyan-400 font-bold self-center">
                                  +{f.options.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Auto Dynamic Options</span>
                          )}
                        </td>

                        {/* Enabled Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleEnabled(f.id)}
                            aria-label={`Toggle filter ${f.name} ${f.enabled ? "offline" : "online"}`}
                            className={cn(
                              "min-h-[44px] min-w-[75px] inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all border",
                              f.enabled
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}
                          >
                            {f.enabled ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            aria-label={`Edit settings for filter ${f.name}`}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            title="Edit Filter Settings"
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFilter(f.id)}
                            aria-label={`Delete filter definition ${f.name}`}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Filter Definition"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── CREATE / EDIT FILTER MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-filter-title">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-3xl border border-white/10 bg-[#0B0F1E] p-6 sm:p-8 shadow-2xl z-10 text-white">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close dialog"
              className="min-h-[44px] min-w-[44px] absolute right-4 top-4 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h2 id="modal-filter-title" className="font-display text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              {editingFilter ? "Modify Filter Definition" : "Create New Catalog Filter"}
            </h2>

            <form onSubmit={handleSaveFilter} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-name" className="block text-xs font-bold text-slate-200">
                    Filter Title *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. RAM Capacity"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-key" className="block text-xs font-bold text-slate-200">
                    Spec Key / Attribute *
                  </label>
                  <input
                    id="modal-key"
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. ramCapacity"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-cat" className="block text-xs font-bold text-slate-200">
                    Target Category
                  </label>
                  <select
                    id="modal-cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#070B1A] px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.val} value={c.val}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-type" className="block text-xs font-bold text-slate-200">
                    Filter UI Type
                  </label>
                  <select
                    id="modal-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as FilterType)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#070B1A] px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {FILTER_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="modal-sort" className="block text-xs font-bold text-slate-200">
                    Sort Order
                  </label>
                  <input
                    id="modal-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-unit" className="block text-xs font-bold text-slate-200">
                    Unit (Optional)
                  </label>
                  <input
                    id="modal-unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. GB, GHz, ₹"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-white/10 bg-white/5 min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-white">Active on Store</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Option Management */}
              {type !== "boolean" && type !== "price-range" && (
                <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Configured Option Presets ({options.length})
                    </h3>
                    <span className="text-[10px] text-slate-400">e.g. 8 GB, 16 GB</span>
                  </div>

                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-black/40 rounded-xl">
                      {options.map((opt) => (
                        <span key={opt.value} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                          <span>{opt.label}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt.value)}
                            aria-label={`Remove option ${opt.label}`}
                            className="min-h-[24px] min-w-[24px] flex items-center justify-center text-slate-400 hover:text-rose-400"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      placeholder="Option label e.g. 16 GB"
                      className="flex-1 min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder="Value (optional)"
                      className="flex-1 min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      aria-label="Add configured option to filter"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  {saving ? "Saving..." : "Save Filter Definition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PREVIEW CUSTOMER FILTERS MODAL ─── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-preview-title">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)} />

          <div className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-3xl border border-white/10 bg-[#0B0F1E] p-6 shadow-2xl z-10 text-white">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              aria-label="Close customer filter preview"
              className="min-h-[44px] min-w-[44px] absolute right-4 top-4 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="mb-4">
              <h2 id="modal-preview-title" className="font-display text-base font-bold flex items-center gap-2 text-purple-300">
                <Eye className="h-5 w-5" aria-hidden="true" /> Customer Sidebar Filter Preview
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Renders active dynamic options and live product counts on the store.
              </p>
            </div>

            {/* Category Selector for Preview */}
            <div className="mb-4">
              <label htmlFor="preview-cat" className="text-xs font-bold text-slate-300 block mb-1.5">
                Select Category to Preview:
              </label>
              <select
                id="preview-cat"
                value={previewCategory}
                onChange={(e) => setPreviewCategory(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#070B1A] px-4 py-2.5 text-xs font-bold text-white focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.val} value={c.val}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Simulated Customer Sidebar */}
            <div className="space-y-4 rounded-2xl bg-[#070B1A] p-4 border border-white/10 max-h-96 overflow-y-auto">
              {previewFilterGroups.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No active filters configured for this category.</div>
              ) : (
                previewFilterGroups.map((group) => (
                  <div key={group.definition.id} className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                      {group.definition.name} {group.definition.unit && `(${group.definition.unit})`}
                    </h3>

                    {group.definition.type === "boolean" ? (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer min-h-[44px]">
                        <input type="checkbox" className="rounded text-cyan-500 h-4 w-4" />
                        <span>Enable Filter</span>
                      </label>
                    ) : group.definition.type === "price-range" ? (
                      <div className="space-y-1 py-2">
                        <input type="range" min={0} max={200000} className="w-full accent-cyan-400" />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>₹0</span>
                          <span>₹2,00,000</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {group.availableOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer py-1.5">
                            <span className="flex items-center gap-2">
                              <input type="checkbox" className="rounded border-white/20 bg-slate-900 text-cyan-500 h-4 w-4" />
                              <span>{opt.label}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                              {opt.count}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
