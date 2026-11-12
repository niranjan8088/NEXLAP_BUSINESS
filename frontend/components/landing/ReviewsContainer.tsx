"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ThumbsUp, HelpCircle, MessageSquare, ShieldCheck, Heart, Maximize2, X } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  customer_name: string;
  city: string;
  service_used: string | null;
  product_purchased: string | null;
  overall_experience: string | null;
  rating: number;
  review_message: string;
  recommend: boolean;
  image_urls: string[];
  verified: boolean;
  created_at: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
  likes_count: number;
  helpful_count: number;
};

type Props = {
  initialReviews: Review[];
  initialTotalCount: number;
  initialAverageRating: number;
};

export default function ReviewsContainer({
  initialReviews,
  initialTotalCount,
  initialAverageRating,
}: Props) {
  // State
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [offset, setOffset] = useState<number>(initialReviews.length);
  const [hasMore, setHasMore] = useState<boolean>(initialReviews.length < initialTotalCount);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Voting tracking (prevent multi-clicks)
  const [votedLikes, setVotedLikes] = useState<Record<string, boolean>>({});
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({});
  const [voteError, setVoteError] = useState<string>("");

  // Lightbox overlay
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Infinite Scroll Trigger
  const loaderRef = useRef<HTMLDivElement>(null);

  // Compute Stats
  const starDistribution = [0, 0, 0, 0, 0]; // 5 stars down to 1
  let recommendCount = 0;

  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      starDistribution[5 - r.rating]++;
    }
    if (r.recommend) recommendCount++;
  });

  const recommendPercent = reviews.length > 0 
    ? Math.round((recommendCount / reviews.length) * 100) 
    : 100;

  // Load reviews when filter or sort changes
  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const ratingQuery = ratingFilter ? `&rating=${ratingFilter}` : "";
        const res = await fetch(`/api/reviews?sort=${sortBy}${ratingQuery}&limit=12&offset=0`);
        const data = await res.json();
        if (res.ok) {
          setReviews(data.reviews || []);
          setTotalCount(data.totalCount || 0);
          setAverageRating(data.averageRating || 0);
          setOffset(data.reviews?.length || 0);
          setHasMore((data.reviews?.length || 0) < (data.totalCount || 0));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    // Skip on first render since we have initialReviews
    if (ratingFilter !== null || sortBy !== "newest") {
      fetchFiltered();
    }

    window.addEventListener("nexbyte-realtime", fetchFiltered);
    return () => window.removeEventListener("nexbyte-realtime", fetchFiltered);
  }, [ratingFilter, sortBy]);

  // Infinite scroll hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setLoading(true);
          try {
            const ratingQuery = ratingFilter ? `&rating=${ratingFilter}` : "";
            const res = await fetch(
              `/api/reviews?sort=${sortBy}${ratingQuery}&limit=12&offset=${offset}`
            );
            const data = await res.json();
            if (res.ok) {
              const newReviews = data.reviews || [];
              setReviews((prev) => [...prev, ...newReviews]);
              setOffset((prev) => prev + newReviews.length);
              setHasMore((offset + newReviews.length) < (data.totalCount || 0));
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, offset, ratingFilter, sortBy]);

  const handleVote = async (reviewId: string, type: "like" | "helpful") => {
    if (type === "like" && votedLikes[reviewId]) return;
    if (type === "helpful" && votedHelpful[reviewId]) return;

    try {
      const res = await fetch("/api/reviews/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, vote_type: type }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVoteError(data.error || "Failed to vote.");
        setTimeout(() => setVoteError(""), 3000);
        return;
      }

      // Update local review state counts
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              likes_count: type === "like" ? data.count : r.likes_count,
              helpful_count: type === "helpful" ? data.count : r.helpful_count,
            };
          }
          return r;
        })
      );

      if (type === "like") {
        setVotedLikes((prev) => ({ ...prev, [reviewId]: true }));
      } else {
        setVotedHelpful((prev) => ({ ...prev, [reviewId]: true }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-12">
      {voteError && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-500 px-6 py-2 text-xs font-semibold text-white shadow-glow-blue animate-bounce">
          {voteError}
        </div>
      )}

      {/* Aggregate Statistics Header Banner */}
      <div className="grid grid-cols-1 gap-8 rounded-2xl glass-panel p-6 sm:p-10 lg:grid-cols-[1fr_1.5fr_1fr]">
        {/* Rating Score Summary */}
        <div className="flex flex-col items-center justify-center text-center border-b border-white/5 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="font-display text-6xl font-bold text-white">
            {averageRating}
          </p>
          <div className="mt-3">
            <StarRating rating={Math.round(averageRating)} readOnly size="md" />
          </div>
          <p className="mt-3 text-xs text-nex-mist">
            Based on {totalCount} verified customer review{totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rating distribution meters */}
        <div className="flex flex-col justify-center space-y-2 border-b border-white/5 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:px-8">
          {starDistribution.map((count, index) => {
            const starNum = 5 - index;
            const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs text-nex-mist">
                <span className="w-3 font-semibold text-white/90">{starNum}</span>
                <Star className="h-3.5 w-3.5 fill-nex-blueLight text-nex-blueLight shrink-0" />
                <div className="relative h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-nex-blueLight rounded-full shadow-glow-blue"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium">{percent}%</span>
              </div>
            );
          })}
        </div>

        {/* Highlight Recommendation percentage */}
        <div className="flex flex-col items-center justify-center text-center lg:pl-8">
          <p className="font-display text-5xl font-bold text-gradient-blue">
            {recommendPercent}%
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            Recommendation Rate
          </p>
          <p className="mt-2 text-xs text-nex-mist max-w-[200px] leading-relaxed">
            of reviews recommend our computer setup & repair services.
          </p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRatingFilter(null)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-all border",
              ratingFilter === null
                ? "bg-nex-blue border-nex-blue text-white shadow-glow-blue"
                : "glass-panel text-white/80 border-transparent hover:border-white/10"
            )}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setRatingFilter(stars)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all border flex items-center gap-1",
                ratingFilter === stars
                  ? "bg-nex-blue border-nex-blue text-white shadow-glow-blue"
                  : "glass-panel text-white/80 border-transparent hover:border-white/10"
              )}
            >
              {stars} ★
            </button>
          ))}
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full bg-nex-ink border border-white/[0.08] px-4 py-2.5 text-xs text-white/90 focus:border-nex-blue/50 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_rated">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 rounded-2xl glass-panel">
          <MessageSquare className="h-10 w-10 text-nex-mist mx-auto mb-4" />
          <p className="text-base text-white font-medium">No customer reviews yet.</p>
          <p className="text-xs text-nex-mist mt-1 max-w-md mx-auto">Genuine customer feedback will appear here after customers submit their reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass-card flex flex-col justify-between p-6 bg-nex-ink border border-white/5"
            >
              <div>
                {/* Header: Avatar, Name, Badge, Date */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nex-blue/10 text-xs font-bold text-nex-blueLight border border-nex-blue/20">
                      {getInitials(review.customer_name)}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-semibold text-white flex items-center gap-1.5">
                        {review.customer_name}
                        {review.verified && (
                          <span
                            title="Verified Booking"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-nex-blue/15 text-nex-blueLight"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-nex-mist">{review.city}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-nex-mist">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Stars and categories */}
                <div className="mt-4 flex flex-col gap-1.5">
                  <StarRating rating={review.rating} readOnly size="sm" />
                  
                  {/* Service Used / Product Purchased Tags */}
                  {(review.service_used || review.product_purchased) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {review.service_used && (
                        <span className="rounded bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-nex-blueLight font-medium">
                          Service: {review.service_used}
                        </span>
                      )}
                      {review.product_purchased && (
                        <span className="rounded bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/60 font-medium">
                          Product: {review.product_purchased}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Overall experience header */}
                {review.overall_experience && (
                  <p className="mt-3 text-xs font-bold text-white/90 italic">
                    &ldquo;{review.overall_experience}&rdquo;
                  </p>
                )}

                {/* Review message */}
                <p className="mt-3 text-xs leading-relaxed text-white/80 whitespace-pre-line">
                  {review.review_message}
                </p>

                {/* Uploaded images */}
                {review.image_urls && review.image_urls.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {review.image_urls.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImage(url)}
                        className="group relative h-14 w-14 cursor-zoom-in overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Attached review photo"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                          <Maximize2 className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Admin Reply & Likes/Helpful buttons */}
              <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                {/* Admin Reply Render */}
                {review.admin_reply && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-[11px] leading-relaxed text-white/80">
                    <p className="font-semibold text-nex-blueLight flex items-center gap-1">
                      Response from NexLapTech:
                    </p>
                    <p className="mt-1">{review.admin_reply}</p>
                    {review.admin_reply_at && (
                      <p className="text-[9px] text-nex-mist mt-1">
                        Replied on {formatDate(review.admin_reply_at)}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(review.id, "like")}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-semibold transition-colors",
                      votedLikes[review.id]
                        ? "text-nex-blueLight"
                        : "text-nex-mist hover:text-white"
                    )}
                    disabled={votedLikes[review.id]}
                  >
                    <Heart className={cn("h-3.5 w-3.5", votedLikes[review.id] && "fill-nex-blueLight")} />
                    <span>Like ({review.likes_count})</span>
                  </button>

                  <button
                    onClick={() => handleVote(review.id, "helpful")}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-semibold transition-colors",
                      votedHelpful[review.id]
                        ? "text-nex-blueLight"
                        : "text-nex-mist hover:text-white"
                    )}
                    disabled={votedHelpful[review.id]}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Helpful ({review.helpful_count})</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite Scroll Loader Ref */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-nex-blueLight border-t-transparent" />
        </div>
      )}

      {/* Image Lightbox Overlay */}
      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setActiveImage(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />
          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-nex-ink">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Enlarged review photo"
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
