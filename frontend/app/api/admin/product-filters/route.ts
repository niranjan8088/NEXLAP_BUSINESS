import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";
import { DEFAULT_FILTER_DEFINITIONS } from "@/lib/filterEngine";
import { FilterDefinition } from "@/lib/types/ecommerce";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

const CATEGORY_OPTIONS = [
  { val: "all", label: "Global (All Categories)" },
  { val: "business_laptops", label: "Business Laptops & Refurbished" },
  { val: "storage", label: "Storage (SSD / HDD)" },
  { val: "ram", label: "RAM / Memory" },
  { val: "cctv", label: "CCTV Systems" },
  { val: "peripherals", label: "Peripherals & Accessories" },
];

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    let rawFilters: FilterDefinition[] = await dbHelper.filterDefinitions.list().catch(() => []);
    if (!rawFilters || rawFilters.length === 0) {
      rawFilters = DEFAULT_FILTER_DEFINITIONS;
    }

    let filtered = rawFilters;
    if (category !== "all") {
      filtered = filtered.filter((f) => f.categoryId === "all" || f.categoryId === category);
    }

    if (q) {
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    const total = rawFilters.length;
    const active = rawFilters.filter((f) => f.enabled).length;
    const disabled = total - active;

    return NextResponse.json(
      {
        success: true,
        filters: filtered,
        categories: CATEGORY_OPTIONS,
        stats: {
          total,
          active,
          disabled,
          categoriesCount: CATEGORY_OPTIONS.length,
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
      { error: error?.message || "Failed to retrieve filter definitions." },
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
    const { filters, filter } = body;

    let existing: FilterDefinition[] = await dbHelper.filterDefinitions.list().catch(() => []);
    if (!existing || existing.length === 0) {
      existing = DEFAULT_FILTER_DEFINITIONS;
    }

    let updatedList: FilterDefinition[] = [];

    if (Array.isArray(filters)) {
      // Bulk update (e.g. reordering or saving all)
      updatedList = filters.map((f: any, idx: number) => ({
        ...f,
        sortOrder: Number(f.sortOrder) || idx + 1,
        updatedAt: new Date().toISOString(),
      }));
    } else if (filter && typeof filter === "object") {
      // Single filter create or update
      if (!filter.name || !filter.key) {
        return NextResponse.json(
          { error: "Filter 'name' and 'key' are mandatory fields." },
          { status: 400 }
        );
      }

      const cleanFilter: FilterDefinition = {
        id: filter.id || `flt-${Date.now()}`,
        name: String(filter.name).trim(),
        key: String(filter.key).trim(),
        categoryId: filter.categoryId || "business_laptops",
        type: filter.type || "multi-select",
        unit: filter.unit ? String(filter.unit).trim() : undefined,
        enabled: filter.enabled !== false,
        sortOrder: Number(filter.sortOrder) || existing.length + 1,
        options: Array.isArray(filter.options) ? filter.options : undefined,
        createdAt: filter.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existsIdx = existing.findIndex((f) => f.id === cleanFilter.id);
      if (existsIdx >= 0) {
        existing[existsIdx] = cleanFilter;
        updatedList = existing;
      } else {
        updatedList = [...existing, cleanFilter];
      }
    } else {
      return NextResponse.json(
        { error: "Invalid payload: provide 'filters' array or 'filter' object." },
        { status: 400 }
      );
    }

    await dbHelper.filterDefinitions.save(updatedList);

    return NextResponse.json({
      success: true,
      message: "Filter definitions saved successfully.",
      count: updatedList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save filter definitions." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get("id");

    if (!filterId) {
      return NextResponse.json({ error: "Missing required 'id' parameter." }, { status: 400 });
    }

    let existing: FilterDefinition[] = await dbHelper.filterDefinitions.list().catch(() => []);
    if (!existing || existing.length === 0) {
      existing = DEFAULT_FILTER_DEFINITIONS;
    }

    const updatedList = existing.filter((f) => f.id !== filterId);
    await dbHelper.filterDefinitions.save(updatedList);

    return NextResponse.json({
      success: true,
      message: `Filter '${filterId}' removed successfully.`,
      remainingCount: updatedList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete filter definition." },
      { status: 500 }
    );
  }
}

