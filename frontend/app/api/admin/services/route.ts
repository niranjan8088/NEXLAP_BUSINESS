import { NextRequest, NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

/** GET /api/admin/services — List all services with filtering, search, and pagination */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const allServices = await dbHelper.services.list();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status") || "all";
    const categoryParam = (searchParams.get("category") || "").trim().toLowerCase();
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 1. Status Counts
    const counts = {
      all: allServices.length,
      enabled: allServices.filter((s: any) => s.status !== "disabled").length,
      disabled: allServices.filter((s: any) => s.status === "disabled").length,
    };

    // 2. Filter
    let filtered = allServices.filter((s: any) => {
      if (q) {
        const titleMatch = (s.title || "").toLowerCase().includes(q);
        const descMatch = (s.description || "").toLowerCase().includes(q);
        const catMatch = (s.category || "").toLowerCase().includes(q);
        const brandMatch = Array.isArray(s.supportedBrands)
          ? s.supportedBrands.some((b: string) => b.toLowerCase().includes(q))
          : false;
        if (!titleMatch && !descMatch && !catMatch && !brandMatch) return false;
      }

      if (categoryParam && categoryParam !== "all") {
        const sCat = (s.category || "").toLowerCase();
        if (!sCat.includes(categoryParam)) return false;
      }

      if (statusParam === "enabled") {
        return s.status !== "disabled";
      }
      if (statusParam === "disabled") {
        return s.status === "disabled";
      }

      return true;
    });

    // 3. Sort
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === "price") {
        comparison = (Number(a.price) || 0) - (Number(b.price) || 0);
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else {
        const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
        comparison = timeA - timeB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;

    // 4. Pagination
    let pagedServices = filtered;
    let page = 1;
    let limit = total;
    let totalPages = 1;

    if (pageParam !== null || limitParam !== null) {
      page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
      const parsedLimit = parseInt(limitParam || "20", 10);
      limit = parsedLimit > 0 ? parsedLimit : 20;
      totalPages = Math.max(1, Math.ceil(total / limit));
      if (page > totalPages && totalPages > 0) page = totalPages;
      const start = (page - 1) * limit;
      pagedServices = filtered.slice(start, start + limit);
    }

    return NextResponse.json(
      {
        services: pagedServices,
        total,
        totalPages,
        page,
        limit,
        counts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST /api/admin/services — Register a new service offering */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await request.json();

    const {
      title,
      description,
      category,
      price,
      duration,
      iconName,
      serviceType,
      supportedBrands,
      features,
      warranty,
      featured,
    } = body;

    // Validations
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Service title is required." }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
    }

    const payload = {
      title: String(title).trim(),
      description: String(description || "").trim(),
      category: category ? String(category).trim() : "Repairs",
      price: parsedPrice,
      duration: duration || "2-4 Hours",
      iconName: iconName || "Wrench",
      serviceType: serviceType || "both", // "carry_in" | "on_site" | "both"
      supportedBrands: Array.isArray(supportedBrands) ? supportedBrands : ["All Major Brands"],
      features: Array.isArray(features) ? features : [],
      warranty: warranty || "90 Days Service Warranty",
      featured: Boolean(featured),
      status: "enabled",
      created_by: user.id || "admin",
      created_at: new Date().toISOString(),
    };

    const newService = await dbHelper.services.create(payload);

    try {
      await dbHelper.activityLogs.create({
        user_name: user.email || "Admin",
        role: "admin",
        action: "Created Service Profile",
        details: `Service "${payload.title}" created with price Rs. ${payload.price}`,
        ip: "Internal"
      });
    } catch {}

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

