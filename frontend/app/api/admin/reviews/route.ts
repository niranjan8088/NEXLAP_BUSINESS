import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const ratingParam = searchParams.get("rating");
    const ratingFilter = ratingParam ? parseInt(ratingParam, 10) : null;
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const rawReviews: any[] = await dbHelper.reviews.list().catch(() => []);

    // 1. Calculate Authoritative Global Statistics
    const totalCount = rawReviews.length;
    const pendingCount = rawReviews.filter((r) => r.status === "pending").length;
    const approvedCount = rawReviews.filter((r) => r.status === "approved").length;
    const rejectedCount = rawReviews.filter((r) => r.status === "rejected").length;
    const modificationCount = rawReviews.filter((r) => r.status === "need_modification").length;

    const averageRating = totalCount > 0
      ? parseFloat((rawReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / totalCount).toFixed(1))
      : 0;

    const starDistribution = [0, 0, 0, 0, 0];
    let recommendCount = 0;

    rawReviews.forEach((r) => {
      const rNum = Math.round(Number(r.rating) || 0);
      if (rNum >= 1 && rNum <= 5) {
        starDistribution[5 - rNum]++;
      }
      if (r.recommend) recommendCount++;
    });

    const recommendPercent = totalCount > 0 ? Math.round((recommendCount / totalCount) * 100) : 0;

    const serviceCountMap: Record<string, number> = {};
    rawReviews.forEach((r) => {
      if (r.service_used) {
        serviceCountMap[r.service_used] = (serviceCountMap[r.service_used] || 0) + 1;
      }
    });
    const sortedServices = Object.entries(serviceCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // 2. Filter Reviews
    let filtered = rawReviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (ratingFilter !== null && Math.round(Number(r.rating) || 0) !== ratingFilter) return false;

      if (q) {
        const matchesName = (r.customer_name || "").toLowerCase().includes(q);
        const matchesCity = (r.city || "").toLowerCase().includes(q);
        const matchesService = (r.service_used || "").toLowerCase().includes(q);
        const matchesProduct = (r.product_purchased || "").toLowerCase().includes(q);
        const matchesMsg = (r.review_message || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesService && !matchesProduct && !matchesMsg) {
          return false;
        }
      }
      return true;
    });

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : null;
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : null;

    const totalFiltered = filtered.length;
    let paginated = filtered;
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      paginated = filtered.slice(startIndex, startIndex + limit);
    }

    return NextResponse.json(
      {
        success: true,
        reviews: paginated,
        allReviewsCount: filtered.length,
        pagination: {
          page: page || 1,
          limit: limit || totalFiltered,
          totalPages: limit ? Math.max(1, Math.ceil(totalFiltered / limit)) : 1,
          totalItems: totalFiltered,
        },
        stats: {
          totalCount,
          pendingCount,
          approvedCount,
          rejectedCount,
          modificationCount,
          averageRating,
          recommendPercent,
          starDistribution,
          sortedServices,
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve reviews dataset." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    if (!body.customer_name || !body.rating || !body.review_message) {
      return NextResponse.json(
        { error: "Customer name, rating, and review message are required." },
        { status: 400 }
      );
    }

    const created = await dbHelper.reviews.create(body);
    return NextResponse.json({
      success: true,
      message: "Review created successfully.",
      review: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create review." },
      { status: 500 }
    );
  }
}

