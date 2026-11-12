"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  PlusCircle,
  X,
  Filter,
  ShoppingBag,
  ShieldCheck
} from "lucide-react";

export interface ProductReviewItem {
  id: string;
  productId?: string;
  productTitle: string;
  productCategory: string;
  reviewerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerCity, setReviewerCity] = useState("");
  const [votingId, setVotingId] = useState<string | null>(null);

  // Modal
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewProduct, setNewReviewProduct] = useState("Samsung 980 PRO 1TB NVMe SSD");
  const [isManualProduct, setIsManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState("");
  const [productOptions, setProductOptions] = useState<string[]>([
    "Samsung 980 PRO 1TB NVMe SSD",
    "Lenovo ThinkPad T490 (Refurbished)",
    "NexLapTech ROG Slayer R15 Gaming PC",
    "Dell Latitude 5440 Pro Laptop",
    "EVM 512GB NVMe M.2 SSD",
    "Dell Latitude 7420 (Core i7 11th Gen)",
    "Lenovo ThinkPad T14 Gen 2 (Ryzen 7 Pro)",
    "HP EliteBook 840 G8 (Core i5 11th Gen)",
    "Apple MacBook Pro 14\" M1 Pro",
    "Dell OptiPlex 7090 Micro Desktop",
    "Crucial 16GB DDR4 3200MHz Laptop RAM",
    "Laptop Chip-Level Motherboard Repair",
    "Broken Screen & Display Replacement",
    "Custom Gaming & Workstation PC Assembly",
  ]);
  const [successMsg, setSuccessMsg] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setLoadError("");
    try {
      try {
        const prodRes = await fetch("/api/products", { cache: "no-store" });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items = Array.isArray(prodData) ? prodData : (prodData.products || []);
          const titles = items.map((p: any) => p.name || p.title).filter(Boolean);
          if (titles.length > 0) {
            setProductOptions((prev) => Array.from(new Set([...titles, ...prev])));
          }
        }
      } catch {}

      const response = await fetch("/api/reviews?sort=newest&limit=100", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load reviews.");
      setReviews((data.reviews || []).map((review: any) => {
        const createdAt = review.created_at ? new Date(review.created_at) : null;
        return {
          id: String(review.id),
          productId: review.product_id,
          productTitle: review.product_purchased || review.product_title || "NexLapTech product or service",
          productCategory: review.product_category || review.category || "Customer experience",
          reviewerName: review.customer_name || review.customerName || "NexLapTech customer",
          rating: Number(review.rating) || 0,
          title: review.overall_experience || "Customer review",
          comment: review.review_message || review.review || "",
          date: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleDateString("en-IN") : "Recently",
          verifiedPurchase: review.verified === true && review.source === "purchase",
          helpfulCount: Number(review.helpful_count) || 0,
        };
      }));
    } catch (error: any) {
      setLoadError(error.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleHelpful = async (id: string) => {
    if (votingId) return;
    setVotingId(id);
    try {
      const response = await fetch("/api/reviews/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: id, vote_type: "helpful" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record your vote.");
      setReviews((current) => current.map((review) => review.id === id
        ? { ...review, helpfulCount: Number(data.count) || review.helpfulCount + 1 }
        : review));
    } catch (error: any) {
      setLoadError(error.message || "Unable to record your vote.");
    } finally {
      setVotingId(null);
    }
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerCity.trim() || !newReviewTitle.trim() || !newReviewComment.trim()) return;
    const chosenProduct = isManualProduct
      ? manualProductName.trim()
      : (newReviewProduct === "__custom__" ? manualProductName.trim() : newReviewProduct.trim());

    if (!chosenProduct) {
      setLoadError("Please select or enter the product name.");
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: reviewerName.trim(),
          city: reviewerCity.trim(),
          product_purchased: chosenProduct,
          overall_experience: newReviewTitle.trim(),
          review_message: newReviewComment.trim(),
          rating: newReviewRating,
          recommend: true,
          source: "public_form",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit review.");
      setSuccessMsg("Thank you. Your review has been submitted for moderation.");
    } catch (error: any) {
      setLoadError(error.message || "Failed to submit review.");
    }
  };

  const filteredReviews = reviews.filter((r) => filterRating === "all" || r.rating === filterRating);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pt-24 pb-16 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> Verified Customer Reviews
            </span>
            <h1 className="heading-h1">
              Customer Feedback &amp; Hardware Ratings
            </h1>
            <p className="text-xs sm:text-sm text-readable-secondary font-medium">
              Read real performance reviews from verified buyers across India.
            </p>
          </div>

          {/* Rating Summary Box */}
          <div className="futuristic-card p-6 sm:p-8 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center rounded-3xl">
            <div className="text-center md:border-r border-slate-200 dark:border-white/10 pr-0 md:pr-6 space-y-1">
              <div className="font-display text-5xl font-extrabold text-slate-900 dark:text-white">{avgRating}</div>
              <div className="flex justify-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-readable-secondary font-semibold pt-1">Based on {reviews.length} published reviews</p>
            </div>

            <div className="space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => r.rating === stars).length;
                const pct = Math.round((count / (reviews.length || 1)) * 100);
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-12 font-bold text-slate-700 dark:text-slate-300">{stars} Stars</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-readable-muted font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="text-center space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Bought from NEXLAPTECH?</h3>
              <p className="text-xs text-readable-secondary">Share your hardware experience with other buyers.</p>
              <button
                onClick={() => { setLoadError(""); setShowWriteModal(true); }}
                className="futuristic-btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-1.5 shadow-md font-bold rounded-xl"
              >
                <PlusCircle className="h-4 w-4" /> Write a Review
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Ratings:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {["all", 5, 4, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => setFilterRating(val as any)}
                  className={`px-3 py-1 rounded-full font-bold transition-all border ${
                    filterRating === val
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {val === "all" ? "All Reviews" : `${val} ★ Stars`}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-4">
            {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</p>}
            {loading && <p role="status" className="py-8 text-center text-sm text-readable-secondary">Loading published reviews...</p>}
            {!loading && !reviews.length && (
              <div className="futuristic-card p-12 text-center rounded-2xl space-y-2">
                <MessageSquare className="h-10 w-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-base font-bold text-slate-900 dark:text-white">No customer reviews yet.</p>
                <p className="text-xs text-readable-secondary max-w-md mx-auto">
                  Genuine customer feedback will appear here after customers submit their reviews.
                </p>
              </div>
            )}
            {!loading && reviews.length > 0 && !filteredReviews.length && (
              <p className="futuristic-card p-8 text-center text-sm text-readable-secondary rounded-2xl">
                No published reviews match this rating yet.
              </p>
            )}
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="futuristic-card p-6 shadow-md space-y-3 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{rev.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-readable-secondary font-semibold">
                      <span className="text-slate-900 dark:text-white font-bold">{rev.reviewerName}</span>
                      <span>•</span>
                      <span>{rev.date}</span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {rev.productCategory}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  &quot;{rev.comment}&quot;
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-readable-secondary">
                  <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
                    Product: {rev.productTitle}
                  </span>

                  <button
                    onClick={() => handleHelpful(rev.id)}
                    disabled={votingId !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Helpful ({rev.helpfulCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* WRITE REVIEW MODAL */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowWriteModal(false)} />

          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0718] p-6 shadow-2xl z-10 text-slate-900 dark:text-white space-y-4">
            <button
              onClick={() => setShowWriteModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="heading-h3">Write a Hardware Performance Review</h3>

            {successMsg ? (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 p-4 text-xs text-emerald-800 dark:text-emerald-300 font-bold text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p>{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleWriteSubmit} className="space-y-4">
                {loadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{loadError}</p>}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Name *
                    <input required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} maxLength={100}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs" />
                  </label>
                  <label className="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    City *
                    <input required value={reviewerCity} onChange={(e) => setReviewerCity(e.target.value)} maxLength={100}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs" />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Product or Service *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isManualProduct;
                        setIsManualProduct(next);
                        if (next && !manualProductName && newReviewProduct && newReviewProduct !== "__custom__") {
                          setManualProductName(newReviewProduct);
                        }
                      }}
                      className="text-[11px] font-semibold text-nex-blue hover:text-nex-blueLight flex items-center gap-1 transition-colors underline decoration-dotted"
                    >
                      {isManualProduct ? "📋 Choose from list" : "✏️ Enter product manually"}
                    </button>
                  </div>

                  {isManualProduct ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={manualProductName}
                        onChange={(e) => setManualProductName(e.target.value)}
                        placeholder="Type product or service name (e.g. Dell XPS 15, Custom Gaming PC, Screen Repair...)"
                        className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0B0718] border-nex-blue/40"
                      />
                      <p className="text-[10px] text-nex-mist">
                        You can type any laptop model, desktop, component, or repair service.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={newReviewProduct}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsManualProduct(true);
                          if (!manualProductName) setManualProductName("");
                        } else {
                          setNewReviewProduct(e.target.value);
                        }
                      }}
                      className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0B0718]"
                    >
                      {productOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="__custom__">✏️ Other (Enter manually)...</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className={`p-2 rounded-xl border transition-all ${
                          newReviewRating >= star ? "bg-amber-500/10 border-amber-500 text-amber-500" : "border-slate-200 dark:border-white/10 text-slate-400"
                        }`}
                      >
                        <Star className={`h-5 w-5 ${newReviewRating >= star ? "fill-amber-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Review Headline *</label>
                  <input
                    type="text"
                    required
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="e.g. Blazing fast read speed and smooth performance"
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Review Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share boot time, benchmark speeds, build quality, battery life..."
                    className="futuristic-input w-full rounded-xl px-3.5 py-2.5 text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowWriteModal(false)} className="futuristic-btn-secondary py-2 px-4 text-xs rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="futuristic-btn-primary py-2 px-5 text-xs flex items-center gap-1.5 shadow-md rounded-xl font-bold">
                    <PlusCircle className="h-4 w-4" /> Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
