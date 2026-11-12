import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET(request: Request) {
  try {
    const admin = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || "").toLowerCase().trim();
    const status = searchParams.get("status") || "all";
    const typeFilter = searchParams.get("type") || "all";
    const sortBy = searchParams.get("sortBy") || "newest";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const allOffers = await dbHelper.offers.list();
    const todayStr = new Date().toISOString().split("T")[0];

    // Compute stats across all offers
    let activeCount = 0;
    let inactiveCount = 0;
    let expiredCount = 0;
    let totalRedemptions = 0;

    allOffers.forEach((o: any) => {
      const oStatus = o.status || "ACTIVE";
      const expiry = o.expiryDate || o.expiry_date || "2099-12-31";
      const isExpired = todayStr > expiry;
      const usage = Number(o.usageCount ?? o.usage_count) || 0;
      totalRedemptions += usage;

      if (isExpired) {
        expiredCount++;
      } else if (oStatus === "ACTIVE") {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    // Filter
    const filtered = allOffers.filter((o: any) => {
      const code = (o.offerCode || o.offer_code || "").toLowerCase();
      const name = (o.offerName || o.offer_name || "").toLowerCase();
      const desc = (o.description || "").toLowerCase();
      const matchesSearch = !query || code.includes(query) || name.includes(query) || desc.includes(query);

      if (!matchesSearch) return false;

      const oStatus = o.status || "ACTIVE";
      const expiry = o.expiryDate || o.expiry_date || "2099-12-31";
      const isExpired = todayStr > expiry;

      if (status === "active" && (oStatus !== "ACTIVE" || isExpired)) return false;
      if (status === "inactive" && oStatus !== "INACTIVE") return false;
      if (status === "expired" && !isExpired) return false;

      const discType = o.discountType || o.discount_type || "percentage";
      if (typeFilter === "percentage" && discType !== "percentage") return false;
      if (typeFilter === "fixed" && discType !== "fixed") return false;

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime();
      }
      if (sortBy === "most_used") {
        return (Number(b.usageCount ?? b.usage_count) || 0) - (Number(a.usageCount ?? a.usage_count) || 0);
      }
      if (sortBy === "highest_discount") {
        return (Number(b.discountValue ?? b.discount_value) || 0) - (Number(a.discountValue ?? a.discount_value) || 0);
      }
      if (sortBy === "expiring_soon") {
        const expA = a.expiryDate || a.expiry_date || "2099";
        const expB = b.expiryDate || b.expiry_date || "2099";
        return expA.localeCompare(expB);
      }
      // Default: newest
      return new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime();
    });

    // Pagination
    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const offset = (page - 1) * limit;
    const paginatedOffers = sorted.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        offers: paginatedOffers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalCount: allOffers.length,
          activeCount,
          inactiveCount,
          expiredCount,
          totalRedemptions,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["admin"]);

    const body = await request.json();
    const {
      offerName,
      offerCode,
      description,
      discountType,
      discountValue,
      eligibleProducts,
      minimumPurchase,
      maximumDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      status,
      flyerImage,
    } = body;

    if (!offerName || !String(offerName).trim()) {
      return NextResponse.json({ error: "Offer Name is required." }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (!offerCode || !String(offerCode).trim()) {
      return NextResponse.json({ error: "Offer Code is required." }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const normalizedDiscountType = discountType || "percentage";
    const normalizedDiscountValue = Number(discountValue);
    if (!Number.isFinite(normalizedDiscountValue) || normalizedDiscountValue <= 0) {
      return NextResponse.json({ error: "Discount Value must be greater than zero." }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (normalizedDiscountType !== "percentage" && normalizedDiscountType !== "fixed") {
      return NextResponse.json({ error: "Discount Type must be percentage or fixed." }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (normalizedDiscountType === "percentage" && normalizedDiscountValue > 100) {
      return NextResponse.json({ error: "Percentage discounts cannot exceed 100%." }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const maximumDiscountValue = Number(maximumDiscount);
    if (maximumDiscount != null && maximumDiscount !== "" && (!Number.isFinite(maximumDiscountValue) || maximumDiscountValue < 0)) {
      return NextResponse.json({ error: "Maximum discount must be a non-negative amount." }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (startDate && expiryDate && String(expiryDate) < String(startDate)) {
      return NextResponse.json({ error: "Expiry date cannot be earlier than the start date." }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const createdOffer = await dbHelper.offers.create({
      offerName,
      offerCode,
      description,
      discountType: normalizedDiscountType,
      discountValue: normalizedDiscountValue,
      eligibleProducts: Array.isArray(eligibleProducts) ? eligibleProducts : ["all"],
      minimumPurchase: Number(minimumPurchase) || 0,
      maximumDiscount: maximumDiscountValue || 0,
      startDate: startDate || new Date().toISOString().split("T")[0],
      expiryDate: expiryDate || "2026-12-31",
      usageLimit: Number(usageLimit) || 100,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      status: status || "ACTIVE",
      flyerImage: flyerImage || "",
      flyer_image: flyerImage || "",
    });

    return NextResponse.json({ success: true, offer: createdOffer }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    if (err.name === "AuthError") {
      const { status, message } = authErrorResponse(err);
      return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json({ error: err.message || "Failed to create offer." }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}
