"use client";

import React, { useState, useEffect, useDeferredValue } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Reply,
  Search,
  Download,
  ShieldAlert,
  Check,
  ChevronDown,
  Printer,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Building,
} from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import Counter from "@/components/ui/Counter";
import { cn } from "@/lib/utils";
import { dbHelper } from "@/lib/dbHelper";

export type Review = {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  city: string;
  service_used: string | null;
  product_purchased: string | null;
  overall_experience: string | null;
  rating: number;
  review_message: string;
  recommend: boolean;
  image_urls: string[];
  status: "pending" | "approved" | "rejected" | "need_modification";
  rejection_reason?: string | null;
  modification_reason?: string | null;
  verified: boolean;
  created_at: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
  featured?: boolean;
};

type Props = {
  initialReviews: Review[];
};

export default function AdminReviewsContainer({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Search and Filter State
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "need_modification">("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Reply inline UI state
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  // Modal States for Reject & Modify
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("Inappropriate or abusive language");
  const [customRejectNote, setCustomRejectNote] = useState("");

  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [modifyNote, setModifyNote] = useState("");

  // Action Feedback state
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadReviews = async () => {
    try {
      // Try dedicated server API first
      let list: Review[] | null = null;
      try {
        const res = await fetch("/api/admin/reviews");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.reviews)) {
            list = json.reviews;
          }
        }
      } catch {}

      if (!list) {
        list = await dbHelper.reviews.list();
      }
      setReviews(list || []);
    } catch {}
  };

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    const handleRealtime = (e: any) => {
      const { table, eventType, new: newRecord } = e.detail || {};
      if (table === "reviews") {
        loadReviews();
        if (eventType === "INSERT" && newRecord?.id) {
          setNewlyAddedIds((prev) => new Set(prev).add(newRecord.id));
          setTimeout(() => {
            setNewlyAddedIds((prev) => {
              const next = new Set(prev);
              next.delete(newRecord.id);
              return next;
            });
          }, 5000);
        }
      }
    };
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, []);

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setLoadingId(id);
    setActionMessage("");
    setActionError("");

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update review status.");

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, featured: !currentFeatured } : r))
      );
      setActionMessage(`Review successfully ${!currentFeatured ? "featured" : "unfeatured"}!`);
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to update review.");
      setTimeout(() => setActionError(""), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  // Statistics calculation
  const totalCount = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;
  const modificationCount = reviews.filter((r) => r.status === "need_modification").length;

  const averageRating = totalCount > 0
    ? parseFloat((reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / totalCount).toFixed(1))
    : 0;

  let recommendCount = 0;
  reviews.forEach((r) => {
    if (r.recommend) recommendCount++;
  });
  const recommendPercent = totalCount > 0 ? Math.round((recommendCount / totalCount) * 100) : 0;

  // Breakdown by Service Used
  const serviceCountMap: Record<string, number> = {};
  reviews.forEach((r) => {
    if (r.service_used) {
      serviceCountMap[r.service_used] = (serviceCountMap[r.service_used] || 0) + 1;
    }
  });
  const sortedServices = Object.entries(serviceCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Handlers for Admin actions
  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected" | "need_modification", extraData?: any) => {
    setLoadingId(id);
    setActionMessage("");
    setActionError("");

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update review status.");

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus, ...extraData } : r))
      );
      setActionMessage(`Review status updated to ${newStatus.replace("_", " ")}!`);
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to update review.");
      setTimeout(() => setActionError(""), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    const finalReason = customRejectNote.trim() ? `${rejectReason} - ${customRejectNote.trim()}` : rejectReason;
    await handleUpdateStatus(rejectingId, "rejected", { rejection_reason: finalReason });
    setRejectingId(null);
    setCustomRejectNote("");
  };

  const handleConfirmModification = async () => {
    if (!modifyingId || !modifyNote.trim()) return;
    await handleUpdateStatus(modifyingId, "need_modification", { modification_reason: modifyNote.trim() });
    setModifyingId(null);
    setModifyNote("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to permanently delete this review?")) return;
    setLoadingId(id);
    setActionMessage("");
    setActionError("");

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete review.");

      setReviews((prev) => prev.filter((r) => r.id !== id));
      setActionMessage("Review permanently deleted.");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete review.");
      setTimeout(() => setActionError(""), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePostReply = async (id: string) => {
    setLoadingId(id);
    setActionMessage("");
    setActionError("");

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_reply: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post reply.");

      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                admin_reply: replyText.trim() || null,
                admin_reply_at: replyText.trim() ? new Date().toISOString() : null,
              }
            : r
        )
      );
      setActionMessage("Official reply updated successfully.");
      setTimeout(() => setActionMessage(""), 3000);
      setReplyingToId(null);
      setReplyText("");
    } catch (err: any) {
      setActionError(err.message || "Failed to post reply.");
      setTimeout(() => setActionError(""), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  // Filter & Search calculations
  const filteredReviews = reviews.filter((r) => {
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      const matchesSearch =
        r.customer_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.service_used && r.service_used.toLowerCase().includes(q)) ||
        (r.product_purchased && r.product_purchased.toLowerCase().includes(q)) ||
        r.review_message.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (ratingFilter !== null && Math.round(Number(r.rating) || 0) !== ratingFilter) return false;

    return true;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ratingFilter, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedReviews = filteredReviews.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main role="main" className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* ─── Toast Notifications ─── */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>{actionMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-rose-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-2xl flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ─── Top Header & Export Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Customer Sentiment &amp; Moderation
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Approve, reject, revise, publish technician replies, and monitor overall customer satisfaction ratings.
          </p>
        </div>

        {/* Action & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print or save reviews as PDF"
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold flex items-center gap-2"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <a
            href={`/api/admin/reviews/export?status=${statusFilter}${ratingFilter ? `&rating=${ratingFilter}` : ""}`}
            download
            aria-label="Export reviews to CSV"
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ─── Executive KPI Cards (Zero CLS) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Feedback */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Feedback</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-white">
            <Counter value={totalCount} />
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 font-medium">
            <span className="text-emerald-400 font-bold">{approvedCount} Approved</span>
            <span>·</span>
            <span className="text-amber-400 font-bold">{pendingCount} Pending</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Rating</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-white">
            {averageRating} <span className="text-base text-slate-400 font-normal">/ 5.0</span>
          </p>
          <div className="mt-2">
            <StarRating rating={Math.round(averageRating)} readOnly size="sm" />
          </div>
        </div>

        {/* Recommendation Rate */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recommendation</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-indigo-400">
            <Counter value={recommendPercent} suffix="%" />
          </p>
          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-3">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
              style={{ width: `${recommendPercent}%` }}
            />
          </div>
        </div>

        {/* Most Reviewed Services */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Top Service Reviews</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Building className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {sortedServices.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No service data</p>
              ) : (
                sortedServices.slice(0, 2).map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 truncate max-w-[120px] font-medium">{name}</span>
                    <span className="text-cyan-400 font-bold font-mono">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Moderation Controls & Filter Toolbar ─── */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/95 p-4 backdrop-blur-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Mobile Dropdown Selector (Visible on < 640px) */}
        <div className="block sm:hidden w-full">
          <label htmlFor="review-status-select" className="sr-only">
            Select Review Status Filter
          </label>
          <div className="relative">
            <select
              id="review-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full min-h-[44px] appearance-none rounded-xl border border-white/10 bg-[#070B1A] px-4 py-2.5 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {[
                { label: `All Feedbacks (${totalCount})`, val: "all" },
                { label: `Pending (${pendingCount})`, val: "pending" },
                { label: `Approved (${approvedCount})`, val: "approved" },
                { label: `Need Modification (${modificationCount})`, val: "need_modification" },
                { label: `Rejected (${rejectedCount})`, val: "rejected" },
              ].map((tab) => (
                <option key={tab.val} value={tab.val}>
                  {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" aria-hidden="true" />
          </div>
        </div>

        {/* Touch-Scrollable Horizontal Pill Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: "All Feedbacks", val: "all", count: totalCount },
            { label: "Pending", val: "pending", count: pendingCount },
            { label: "Approved", val: "approved", count: approvedCount },
            { label: "Need Modification", val: "need_modification", count: modificationCount },
            { label: "Rejected", val: "rejected", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setStatusFilter(tab.val as any)}
              aria-label={`Show ${tab.label} reviews`}
              className={cn(
                "min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5",
                statusFilter === tab.val
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400/40 shadow-md shadow-cyan-500/20"
                  : "bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10"
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-mono font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Rating Filter & Search Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <label htmlFor="review-rating-filter" className="sr-only">Filter by Rating</label>
          <select
            id="review-rating-filter"
            value={ratingFilter ?? ""}
            onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
            className="min-h-[44px] rounded-xl bg-[#070B1A] border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search reviewer, city, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search reviews by reviewer name, city, service or message"
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ─── Moderation Reviews Feed ─── */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-white/5 bg-[#0B0F1E] text-slate-400">
          <MessageSquare className="h-12 w-12 text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-base sm:text-lg text-white font-bold">No customer reviews yet.</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Genuine customer feedback will appear here after customers submit their reviews.
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-white/5 bg-[#0B0F1E] text-slate-400">
          <Search className="h-10 w-10 text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-base text-white font-bold">No reviews found matching current filter.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status or keyword search query.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedReviews.map((review) => {
            const isReplying = replyingToId === review.id;
            const isNew = newlyAddedIds.has(review.id);

            return (
              <div
                key={review.id}
                className={cn(
                  "rounded-3xl p-5 sm:p-6 bg-[#0B0F1E]/95 border transition-all relative overflow-hidden backdrop-blur-xl shadow-lg",
                  isNew
                    ? "border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)] animate-pulse"
                    : review.status === "pending"
                    ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                    : review.status === "approved"
                    ? "border-white/10"
                    : review.status === "need_modification"
                    ? "border-purple-500/30"
                    : "border-rose-500/30 opacity-75"
                )}
              >
                {/* Realtime Notification Banner */}
                {isNew && (
                  <span className="absolute top-0 right-0 bg-cyan-400 text-black text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-xl shadow-md uppercase">
                    NEW REALTIME
                  </span>
                )}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left Column: Author info + Review contents */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-base font-bold text-white flex items-center gap-1.5">
                        {review.customer_name}
                        {review.verified && (
                          <span
                            title="Verified Booking"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400"
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                      </h2>
                      <span className="text-xs text-slate-400">{review.city}</span>
                      <span className="text-xs text-white/30">·</span>
                      <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>

                      {/* Status Pill */}
                      <span
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
                          review.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : review.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : review.status === "need_modification"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        )}
                      >
                        {review.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Contact Info (if available) */}
                    {(review.phone || review.email) && (
                      <p className="text-xs text-slate-400 flex flex-wrap gap-x-4">
                        {review.email && <span>Email: <strong className="text-slate-200">{review.email}</strong></span>}
                        {review.phone && <span>Phone: <strong className="text-slate-200">{review.phone}</strong></span>}
                      </p>
                    )}

                    {/* Rejection / Modification Reason Notes */}
                    {review.rejection_reason && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                        <strong className="font-bold">Rejection Reason:</strong> {review.rejection_reason}
                      </div>
                    )}
                    {review.modification_reason && (
                      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-300">
                        <strong className="font-bold">Requested Modification Note:</strong> {review.modification_reason}
                      </div>
                    )}

                    {/* Service & Product Tags */}
                    {(review.service_used || review.product_purchased || review.overall_experience) && (
                      <div className="flex flex-wrap gap-2 items-center">
                        {review.service_used && (
                          <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs text-cyan-300 font-bold">
                            Service: {review.service_used}
                          </span>
                        )}
                        {review.product_purchased && (
                          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300 font-bold">
                            Product: {review.product_purchased}
                          </span>
                        )}
                        {review.overall_experience && (
                          <span className="text-xs text-slate-300 font-semibold italic">
                            &ldquo;{review.overall_experience}&rdquo;
                          </span>
                        )}
                      </div>
                    )}

                    {/* Review Rating & Message Box */}
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-white/[0.03] border border-white/5 rounded-2xl p-4 whitespace-pre-line">
                      <StarRating rating={review.rating} readOnly size="sm" />
                      <p className="mt-2.5 font-medium">{review.review_message}</p>
                    </div>

                    {/* Image Attachments */}
                    {review.image_urls && review.image_urls.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {review.image_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View full customer image ${idx + 1}`}
                            className="relative h-14 w-14 border border-white/10 rounded-xl overflow-hidden shrink-0 hover:border-cyan-400 transition-colors"
                          >
                            <img src={url} alt="Review attachment" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Existing Admin Reply */}
                    {review.admin_reply && (
                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs sm:text-sm text-slate-200 relative">
                        <p className="font-bold text-cyan-400">Official Response from NexLapTech Support:</p>
                        <p className="mt-1 leading-relaxed">{review.admin_reply}</p>
                        {review.admin_reply_at && (
                          <p className="text-[10px] text-slate-400 mt-2">Replied on {formatDate(review.admin_reply_at)}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(review.id);
                            setReplyText(review.admin_reply || "");
                          }}
                          aria-label={`Edit official response for ${review.customer_name}`}
                          className="min-h-[36px] absolute right-3.5 top-3.5 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Moderation Action Controls */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t border-white/5 lg:border-0 print:hidden">
                    {/* Approve Button */}
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review.id, "approved")}
                        disabled={loadingId === review.id}
                        aria-label={`Approve review by ${review.customer_name}`}
                        className="min-h-[44px] rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Request Edit Button */}
                    {review.status !== "need_modification" && (
                      <button
                        type="button"
                        onClick={() => setModifyingId(review.id)}
                        disabled={loadingId === review.id}
                        aria-label={`Request review modification from ${review.customer_name}`}
                        className="min-h-[44px] rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Reply className="h-4 w-4" aria-hidden="true" />
                        <span>Request Edit</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => setRejectingId(review.id)}
                        disabled={loadingId === review.id}
                        aria-label={`Reject review by ${review.customer_name}`}
                        className="min-h-[44px] rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Write / Edit Reply Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId(review.id);
                        setReplyText(review.admin_reply || "");
                      }}
                      aria-label={`Compose official reply to ${review.customer_name}`}
                      className="min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white hover:border-cyan-400 hover:text-cyan-300 px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Reply className="h-4 w-4" aria-hidden="true" />
                      <span>{review.admin_reply ? "Edit Reply" : "Reply"}</span>
                    </button>

                    {/* Feature Review Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(review.id, !!review.featured)}
                      disabled={loadingId === review.id}
                      aria-label={`${review.featured ? "Unfeature" : "Feature"} review on homepage`}
                      className={cn(
                        "min-h-[44px] rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm",
                        review.featured
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-white"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-amber-400 hover:text-amber-300"
                      )}
                    >
                      <Star className={cn("h-4 w-4", review.featured && "fill-current")} aria-hidden="true" />
                      <span>{review.featured ? "Featured" : "Feature"}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={loadingId === review.id}
                      aria-label={`Delete review by ${review.customer_name}`}
                      className="min-h-[44px] rounded-xl bg-white/5 border border-transparent text-slate-400 hover:border-rose-500 hover:text-rose-400 px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 lg:mt-3"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <label htmlFor={`reply-text-${review.id}`} className="block text-xs font-bold text-cyan-300">
                      Compose Official Support Response:
                    </label>
                    <textarea
                      id={`reply-text-${review.id}`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write an official response to this customer review..."
                      className="w-full rounded-2xl bg-[#070B1A] border border-white/10 p-3.5 text-base sm:text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none min-h-[90px] leading-relaxed"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText("");
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostReply(review.id)}
                        disabled={loadingId === review.id}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
                      >
                        Publish Response
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* ─── Pagination Controls ─── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/5">
              <span className="text-xs text-slate-400 font-medium">
                Showing {(safeCurrentPage - 1) * pageSize + 1}–{Math.min(safeCurrentPage * pageSize, filteredReviews.length)} of {filteredReviews.length} reviews
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  aria-label="Previous Page"
                  className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={safeCurrentPage === pageNum ? "page" : undefined}
                    className={cn(
                      "min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center border",
                      safeCurrentPage === pageNum
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Next Page"
                  className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Reject Modal ─── */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-reject-title">
          <div className="rounded-3xl p-6 bg-[#0B0F1E] border border-rose-500/30 max-w-md w-full shadow-2xl space-y-4 text-white">
            <h2 id="modal-reject-title" className="font-display text-base sm:text-lg font-bold flex items-center gap-2 text-rose-400">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              Reject Customer Review
            </h2>
            <p className="text-xs text-slate-400">Select a formal reason for rejection:</p>

            <div className="space-y-1.5">
              {[
                "Inappropriate or abusive language",
                "Spam or fake review",
                "Duplicate entry",
                "Incomplete details",
                "Other / Custom Reason",
              ].map((reason) => (
                <label key={reason} className="min-h-[44px] flex items-center gap-2.5 text-xs text-white cursor-pointer px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5">
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="h-4 w-4 text-rose-500 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Additional explanation or note for customer..."
              value={customRejectNote}
              onChange={(e) => setCustomRejectNote(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#070B1A] border border-white/10 p-3 text-base sm:text-xs text-white focus:border-rose-400 focus:outline-none"
            />

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modify Modal ─── */}
      {modifyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-modify-title">
          <div className="rounded-3xl p-6 bg-[#0B0F1E] border border-purple-500/30 max-w-md w-full shadow-2xl space-y-4 text-white">
            <h2 id="modal-modify-title" className="font-display text-base sm:text-lg font-bold flex items-center gap-2 text-purple-400">
              <Reply className="h-5 w-5" aria-hidden="true" />
              Request Review Modification
            </h2>
            <p className="text-xs text-slate-400">Specify what the customer should update (e.g. clarify model or issue):</p>

            <textarea
              placeholder="E.g. Please specify which branch or laptop model you serviced..."
              value={modifyNote}
              onChange={(e) => setModifyNote(e.target.value)}
              className="w-full min-h-[80px] rounded-xl bg-[#070B1A] border border-white/10 p-3 text-base sm:text-xs text-white focus:border-purple-400 focus:outline-none leading-relaxed"
            />

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModifyingId(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModification}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
