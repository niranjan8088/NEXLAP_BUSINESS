"use client";

import { useEffect, useState, useMemo, useTransition, useDeferredValue } from "react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Power,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Calendar,
  X,
  Copy,
  TrendingUp,
  Percent,
  DollarSign,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { formatRupees } from "@/lib/billingUtils";

interface OfferItem {
  id: string;
  offerName: string;
  offerCode: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  eligibleProducts: string[];
  minimumPurchase: number;
  maximumDiscount: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  perCustomerLimit: number;
  usageCount: number;
  status: "ACTIVE" | "INACTIVE";
  flyerImage?: string;
  flyer_image?: string;
  archived?: boolean;
  createdAt: string;
}

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isPending, startTransition] = useTransition();

  // Mobile Pagination State (12 offers per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [viewingOffer, setViewingOffer] = useState<OfferItem | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<OfferItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState<number | string>(10);
  const [formEligible, setFormEligible] = useState<string[]>(["all"]);
  const [formMinPurchase, setFormMinPurchase] = useState<number | string>(1000);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | string>(2000);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formExpiryDate, setFormExpiryDate] = useState("2026-12-31");
  const [formUsageLimit, setFormUsageLimit] = useState<number | string>(100);
  const [formPerCustomer, setFormPerCustomer] = useState<number | string>(1);
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formFlyer, setFormFlyer] = useState<string>("");
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  useEffect(() => {
    loadOffersData();
  }, []);

  const loadOffersData = async () => {
    setLoading(true);
    try {
      const [offerResponse, pList] = await Promise.all([
        fetch("/api/admin/offers"),
        dbHelper.products.list(),
      ]);
      const offerData = await offerResponse.json();
      if (!offerResponse.ok) throw new Error(offerData.error || "Failed to load offers.");
      setOffers(offerData.offers || []);
      setProductsCatalog(pList || []);
    } catch (e) {
      console.error("Failed to load offers:", e);
    } finally {
      setLoading(false);
    }
  };

  // Copy Code with transient visual confirmation
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setFormType("percentage");
    setFormValue(10);
    setFormEligible(["all"]);
    setFormMinPurchase(1000);
    setFormMaxDiscount(2000);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormExpiryDate("2026-12-31");
    setFormUsageLimit(100);
    setFormPerCustomer(1);
    setFormStatus("ACTIVE");
    setFormFlyer("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (offer: OfferItem) => {
    setEditingOffer(offer);
    setFormName(offer.offerName || (offer as any).offer_name || "");
    setFormCode(offer.offerCode || (offer as any).offer_code || "");
    setFormDesc(offer.description || "");
    setFormType(offer.discountType || (offer as any).discount_type || "percentage");
    setFormValue(offer.discountValue ?? (offer as any).discount_value ?? 10);
    setFormEligible(offer.eligibleProducts || (offer as any).eligible_products || ["all"]);
    setFormMinPurchase(offer.minimumPurchase ?? (offer as any).minimum_purchase ?? 0);
    setFormMaxDiscount(offer.maximumDiscount ?? (offer as any).maximum_discount ?? 0);
    setFormStartDate(offer.startDate || (offer as any).start_date || new Date().toISOString().split("T")[0]);
    setFormExpiryDate(offer.expiryDate || (offer as any).expiry_date || "2026-12-31");
    setFormUsageLimit(offer.usageLimit ?? (offer as any).usage_limit ?? 100);
    setFormPerCustomer(offer.perCustomerLimit ?? (offer as any).per_customer_limit ?? 1);
    setFormStatus(offer.status || "ACTIVE");
    setFormFlyer(offer.flyerImage || (offer as any).flyer_image || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Handle Flyer File Upload
  const handleFlyerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Flyer image must be under 2 MB.");
      return;
    }

    setUploadingFlyer(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormFlyer(reader.result as string);
      setUploadingFlyer(false);
      setErrorMsg("");
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file.");
      setUploadingFlyer(false);
    };
    reader.readAsDataURL(file);
  };

  // Save / Submit Offer
  const handleSaveOffer = async () => {
    setErrorMsg("");

    if (!formName.trim()) {
      setErrorMsg("Offer Name is required.");
      return;
    }

    if (!formCode.trim()) {
      setErrorMsg("Offer Code is required.");
      return;
    }

    if (Number(formValue) <= 0) {
      setErrorMsg("Discount Value must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        offerName: formName.trim(),
        offerCode: formCode.trim().toUpperCase(),
        description: formDesc.trim(),
        discountType: formType,
        discountValue: Number(formValue),
        eligibleProducts: formEligible,
        minimumPurchase: Number(formMinPurchase) || 0,
        maximumDiscount: Number(formMaxDiscount) || 0,
        startDate: formStartDate,
        expiryDate: formExpiryDate,
        usageLimit: Number(formUsageLimit) || 100,
        perCustomerLimit: Number(formPerCustomer) || 1,
        status: formStatus,
        flyerImage: formFlyer || undefined,
      };

      if (editingOffer) {
        const res = await fetch(`/api/admin/offers/${editingOffer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update offer.");
        setSuccessMsg(`Offer "${formCode.toUpperCase()}" updated successfully.`);
      } else {
        const res = await fetch("/api/admin/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create offer.");
        setSuccessMsg(`Offer "${formCode.toUpperCase()}" created successfully.`);
      }

      setIsModalOpen(false);
      loadOffersData();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Optimistic Toggle ON/OFF Status (Zero Input Delay - INP Optimized)
  const handleToggleStatus = async (offer: OfferItem) => {
    const currentStatus = offer.status || "ACTIVE";
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // 1. Immediately reflect status in local React state
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: nextStatus } : o))
    );

    // 2. Perform network update in background
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle status.");
      setSuccessMsg(`Offer "${offer.offerCode}" set to ${nextStatus}.`);
    } catch (err: any) {
      // Revert if network failed
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: currentStatus } : o))
      );
      alert(err.message || "Failed to toggle status. Changes reverted.");
    }
  };

  // Delete or Archive Offer (Non-blocking Dialog)
  const handleConfirmDeleteOrArchive = async () => {
    if (!offerToDelete) return;
    try {
      const res = await fetch(`/api/admin/offers/${offerToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete offer.");

      setSuccessMsg(data.message || "Operation successful.");
      setOfferToDelete(null);
      loadOffersData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  // Real Stats Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    let activeCount = 0;
    let inactiveCount = 0;
    let expiredCount = 0;
    let totalRedemptions = 0;

    offers.forEach((o) => {
      const status = o.status || "ACTIVE";
      const expiry = o.expiryDate || (o as any).expiry_date || "2099-12-31";
      const usage = Number(o.usageCount ?? (o as any).usage_count) || 0;
      totalRedemptions += usage;

      if (todayStr > expiry) {
        expiredCount++;
      } else if (status === "ACTIVE") {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return { activeCount, inactiveCount, expiredCount, totalRedemptions };
  }, [offers]);

  // Filtered & Sorted Offers (using deferredSearch for INP responsiveness)
  const filteredOffers = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const q = deferredSearch.toLowerCase().trim();

    const result = offers.filter((o) => {
      const code = (o.offerCode || (o as any).offer_code || "").toLowerCase();
      const name = (o.offerName || (o as any).offer_name || "").toLowerCase();
      const desc = (o.description || "").toLowerCase();
      const matchesSearch = !q || code.includes(q) || name.includes(q) || desc.includes(q);

      if (!matchesSearch) return false;

      const status = o.status || "ACTIVE";
      const expiry = o.expiryDate || (o as any).expiry_date || "2099-12-31";
      const isExpired = todayStr > expiry;

      if (statusFilter === "active" && (status !== "ACTIVE" || isExpired)) return false;
      if (statusFilter === "inactive" && status !== "INACTIVE") return false;
      if (statusFilter === "expired" && !isExpired) return false;

      const discType = o.discountType || (o as any).discount_type || "percentage";
      if (typeFilter === "percentage" && discType !== "percentage") return false;
      if (typeFilter === "fixed" && discType !== "fixed") return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "most_used") {
        return (Number(b.usageCount ?? 0)) - (Number(a.usageCount ?? 0));
      }
      if (sortBy === "highest_discount") {
        return (Number(b.discountValue ?? 0)) - (Number(a.discountValue ?? 0));
      }
      if (sortBy === "expiring_soon") {
        const expA = a.expiryDate || "2099";
        const expB = b.expiryDate || "2099";
        return expA.localeCompare(expB);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [offers, deferredSearch, statusFilter, typeFilter, sortBy]);

  // Paginated Slicing
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, currentPage, pageSize]);

  return (
    <div className="admin-offers space-y-6 max-w-full overflow-hidden">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#26364D] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              Offers &amp; Referral Campaigns
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Promotional codes, customer referral discounts &amp; marketing flyers.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Create New Offer
        </button>
      </div>

      {/* ── REALTIME STATS BAR ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Offers</span>
          <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.activeCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Inactive Offers</span>
          <span className="font-display text-xl font-bold text-slate-800 dark:text-white mt-1 block">{stats.inactiveCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Expired Offers</span>
          <span className="font-display text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">{stats.expiredCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">Total Redemptions</span>
          <span className="font-display text-xl font-bold text-blue-600 dark:text-cyan-400 mt-1 block">{stats.totalRedemptions}</span>
        </div>
      </div>

      {/* ── NOTIFICATION TOASTS ──────────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 p-1" aria-label="Dismiss message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── SEARCH & FILTERS TOOLBAR ─────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search offer code, title, or details..."
            className="w-full rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] pl-9 pr-8 py-2 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
            aria-label="Search promotional offers"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#17243B] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#26364D]">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none py-1"
              aria-label="Filter by offer status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#17243B] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#26364D]">
            <span className="text-slate-400 text-[11px]">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none py-1"
              aria-label="Filter by discount type"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#17243B] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#26364D]">
            <span className="text-slate-400 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none py-1"
              aria-label="Sort offers"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_used">Most Redeemed</option>
              <option value="highest_discount">Highest Value</option>
              <option value="expiring_soon">Expiring Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MOBILE-RESPONSIVE VIEW (< 1024px: CARDS; >= 1024px: TABLE) ──────── */}
      {loading ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-[#111B32] rounded-2xl border border-slate-200 dark:border-[#26364D]">
          <RefreshCw className="h-8 w-8 text-blue-600 dark:text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading promotional campaigns...</p>
        </div>
      ) : paginatedOffers.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-[#111B32] rounded-2xl border border-slate-200 dark:border-[#26364D]">
          <Tag className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">No promotional offers match your search criteria.</p>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards Layout (< 1024px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {paginatedOffers.map((offer) => {
              const code = offer.offerCode || (offer as any).offer_code;
              const name = offer.offerName || (offer as any).offer_name;
              const discType = offer.discountType || (offer as any).discount_type;
              const discVal = offer.discountValue ?? (offer as any).discount_value;
              const minPur = offer.minimumPurchase ?? (offer as any).minimum_purchase;
              const maxDisc = offer.maximumDiscount ?? (offer as any).maximum_discount;
              const startDate = offer.startDate || (offer as any).start_date;
              const expiryDate = offer.expiryDate || (offer as any).expiry_date;
              const usageCount = Number(offer.usageCount ?? (offer as any).usage_count) || 0;
              const usageLimit = Number(offer.usageLimit ?? (offer as any).usage_limit) || 100;
              const status = offer.status || "ACTIVE";
              const todayStr = new Date().toISOString().split("T")[0];
              const isExpired = todayStr > expiryDate;
              const isNotStarted = todayStr < startDate;
              const usagePercent = Math.min(100, Math.round((usageCount / Math.max(1, usageLimit)) * 100));

              return (
                <div
                  key={offer.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Code + Discount + Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code)}
                          className="font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-400 px-2.5 py-1 rounded-md flex items-center gap-1 min-h-[36px]"
                          title="Click to copy coupon code"
                          aria-label={`Copy code ${code}`}
                        >
                          {copiedCode === code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {code}
                        </button>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {discType === "percentage" ? `${discVal}% OFF` : `${formatRupees(discVal)} OFF`}
                        </span>
                      </div>

                      {/* Accessible Switch Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(offer)}
                        role="switch"
                        aria-checked={status === "ACTIVE"}
                        className={`min-w-[48px] h-8 px-2 rounded-full text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                        aria-label={`Toggle active state for ${code}`}
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span>{status === "ACTIVE" ? "ON" : "OFF"}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] leading-snug">{name}</h3>
                      {offer.description && (
                        <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 mt-0.5">{offer.description}</p>
                      )}
                    </div>

                    {/* Tags row: Min purchase, Max discount, Validity */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                        Min: {minPur > 0 ? formatRupees(minPur) : "₹0"}
                      </span>
                      {maxDisc > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                          Max Disc: {formatRupees(maxDisc)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Valid till {expiryDate}
                      </span>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Redemptions</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {usageCount} / {usageLimit} ({usagePercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-cyan-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#1E2D4A] pt-3 mt-2">
                    <span className="text-[10px]">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                          EXPIRED
                        </span>
                      ) : isNotStarted ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                          SCHEDULED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingOffer(offer)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                        aria-label={`View details of ${code}`}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(offer)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                        aria-label={`Edit offer ${code}`}
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferToDelete(offer)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-500 hover:text-rose-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete or Archive Offer"
                        aria-label={`Delete offer ${code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop High-Density Table Layout (>= 1024px) */}
          <div className="hidden lg:block rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#0E172A] border-b border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-[#94A3B8] uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-4">Offer Code</th>
                    <th scope="col" className="py-3 px-4">Campaign Name</th>
                    <th scope="col" className="py-3 px-4">Discount</th>
                    <th scope="col" className="py-3 px-4">Min. Purchase</th>
                    <th scope="col" className="py-3 px-4">Max. Discount</th>
                    <th scope="col" className="py-3 px-4">Validity</th>
                    <th scope="col" className="py-3 px-4 text-center">Usage</th>
                    <th scope="col" className="py-3 px-4 text-center">Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D4A]">
                  {paginatedOffers.map((offer) => {
                    const code = offer.offerCode || (offer as any).offer_code;
                    const name = offer.offerName || (offer as any).offer_name;
                    const discType = offer.discountType || (offer as any).discount_type;
                    const discVal = offer.discountValue ?? (offer as any).discount_value;
                    const minPur = offer.minimumPurchase ?? (offer as any).minimum_purchase;
                    const maxDisc = offer.maximumDiscount ?? (offer as any).maximum_discount;
                    const startDate = offer.startDate || (offer as any).start_date;
                    const expiryDate = offer.expiryDate || (offer as any).expiry_date;
                    const usageCount = Number(offer.usageCount ?? (offer as any).usage_count) || 0;
                    const usageLimit = Number(offer.usageLimit ?? (offer as any).usage_limit) || 100;
                    const status = offer.status || "ACTIVE";
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isExpired = todayStr > expiryDate;
                    const isNotStarted = todayStr < startDate;

                    return (
                      <tr key={offer.id} className="hover:bg-slate-50/70 dark:hover:bg-[#17243B]/60 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(code)}
                            className="font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-400 px-2 py-0.5 rounded flex items-center gap-1"
                            title="Click to copy"
                            aria-label={`Copy code ${code}`}
                          >
                            {copiedCode === code ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {code}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">{name}</div>
                          {offer.description && (
                            <div className="text-[10px] text-slate-500 line-clamp-1">{offer.description}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {discType === "percentage" ? (
                            <span className="text-blue-600 dark:text-cyan-400">{discVal}% OFF</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">{formatRupees(discVal)} OFF</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {minPur > 0 ? formatRupees(minPur) : "₹0 (No Min)"}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {maxDisc > 0 ? formatRupees(maxDisc) : "Uncapped"}
                        </td>

                        <td className="py-3 px-4 text-[10px] text-slate-500">
                          <div>From: {startDate}</div>
                          <div>To: {expiryDate}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-900 dark:text-white">
                          {usageCount} / {usageLimit}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isExpired ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                              EXPIRED
                            </span>
                          ) : isNotStarted ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              UPCOMING
                            </span>
                          ) : status === "ACTIVE" ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              INACTIVE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(offer)}
                              title={status === "ACTIVE" ? "Deactivate Offer" : "Activate Offer"}
                              className={`p-1.5 rounded-lg border transition-all ${
                                status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              }`}
                              aria-label={`Toggle active state for ${code}`}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewingOffer(offer)}
                              title="View Details"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                              aria-label={`View details of ${code}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(offer)}
                              title="Edit Offer"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600"
                              aria-label={`Edit offer ${code}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setOfferToDelete(offer)}
                              title="Delete or Archive Offer"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-500 hover:text-rose-600"
                              aria-label={`Delete offer ${code}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages} ({filteredOffers.length} offers)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 disabled:opacity-40 min-h-[36px] font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 disabled:opacity-40 min-h-[36px] font-semibold flex items-center gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL 1: CREATE / EDIT OFFER ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0E172A] rounded-2xl border border-slate-200 dark:border-[#26364D] max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#1E2D4A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingOffer ? "Edit Promotional Offer" : "Create New Promotional Offer"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure discount parameters, flyer image &amp; validity rules.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offer Code * (e.g. NEX10)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                    placeholder="SUMMER2026"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offer Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Summer Tech Upgrade Discount"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description &amp; Terms
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Get ₹500 off on laptop screen replacement and servicing orders."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Rupees (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Value * ({formType === "percentage" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formType === "percentage" ? 100 : undefined}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min. Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max. Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Redemption Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  >
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="INACTIVE">INACTIVE (Draft)</option>
                  </select>
                </div>

                {/* Promotional Flyer Upload */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Promotional Flyer / Banner (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-2 min-h-[40px]">
                      <Upload className="h-4 w-4" />
                      <span>{uploadingFlyer ? "Reading..." : "Select Flyer Image"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFlyerUpload}
                        className="hidden"
                      />
                    </label>
                    {formFlyer && (
                      <button
                        type="button"
                        onClick={() => setFormFlyer("")}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Remove Flyer
                      </button>
                    )}
                  </div>
                  {formFlyer && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#26364D] max-h-36 w-full max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formFlyer} alt="Flyer Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#1E2D4A] bg-slate-50 dark:bg-[#0E172A] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOffer}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 min-h-[40px] disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Saving Campaign..." : editingOffer ? "Update Offer" : "Save & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VIEW OFFER DETAILS ──────────────────────────────────────── */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0E172A] rounded-2xl border border-slate-200 dark:border-[#26364D] max-w-md w-full p-5 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Offer Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Flyer Image Preview */}
            {(viewingOffer.flyerImage || (viewingOffer as any).flyer_image) && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#26364D] max-h-48 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingOffer.flyerImage || (viewingOffer as any).flyer_image}
                  alt={viewingOffer.offerName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#17243B] p-2.5 rounded-lg border border-slate-200 dark:border-[#26364D]">
                <span className="text-slate-500">Promo Code:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-cyan-400 text-sm">
                  {viewingOffer.offerCode || (viewingOffer as any).offer_code}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Campaign Title</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingOffer.offerName || (viewingOffer as any).offer_name}
                </span>
              </div>

              {viewingOffer.description && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Description</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingOffer.description}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                  <span className="text-slate-400 block">Discount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {viewingOffer.discountType === "percentage"
                      ? `${viewingOffer.discountValue}%`
                      : formatRupees(viewingOffer.discountValue)}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                  <span className="text-slate-400 block">Redemptions</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewingOffer.usageCount || 0} / {viewingOffer.usageLimit || 100}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                  <span className="text-slate-400 block">Valid From</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingOffer.startDate || (viewingOffer as any).start_date}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D]">
                  <span className="text-slate-400 block">Valid Until</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingOffer.expiryDate || (viewingOffer as any).expiry_date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2D4A]">
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: INLINE NON-BLOCKING DELETE / ARCHIVE CONFIRMATION ───────── */}
      {offerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0E172A] rounded-2xl border border-slate-200 dark:border-[#26364D] max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {Number(offerToDelete.usageCount ?? (offerToDelete as any).usage_count) > 0
                    ? "Archive Redeemed Offer?"
                    : "Delete Offer?"}
                </h3>
                <p className="text-xs text-slate-500">
                  {offerToDelete.offerCode || (offerToDelete as any).offer_code}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {Number(offerToDelete.usageCount ?? (offerToDelete as any).usage_count) > 0
                ? `This offer has been redeemed ${offerToDelete.usageCount} times. To protect historical order and invoice records, it will be deactivated and archived rather than permanently purged.`
                : `Are you sure you want to permanently delete this offer? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E2D4A]">
              <button
                type="button"
                onClick={() => setOfferToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrArchive}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm min-h-[40px]"
              >
                {Number(offerToDelete.usageCount ?? (offerToDelete as any).usage_count) > 0 ? "Archive Offer" : "Delete Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
