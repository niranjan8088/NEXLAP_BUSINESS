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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const categoryFilter = searchParams.get("category") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const priorityFilter = searchParams.get("priority") || "all";
    const assignedFilter = searchParams.get("assigned_to") || "all";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const [allEnquiries, allProducts] = await Promise.all([
      dbHelper.laptopEnquiries.list().catch(() => []),
      dbHelper.products.list().catch(() => []),
    ]);

    // Parse numeric budget from string (e.g. "30000-40000", "₹50,000", "Under ₹25,000")
    const parseBudgetNum = (b?: string | number): number => {
      if (!b) return 0;
      if (typeof b === "number") return b;
      const digits = b.replace(/[^\d]/g, "");
      return parseInt(digits.slice(0, 6), 10) || 0;
    };

    // Enrich enquiries with computed metadata
    const enrichedList = (allEnquiries || []).map((e: any, idx: number) => {
      const budgetNum = parseBudgetNum(e.budget);
      const isHighBudget = budgetNum >= 50000 || e.category === "amc_b2b" || e.category === "bulk_hardware";
      
      const priority = e.priority || (isHighBudget ? "High" : e.budget ? "Medium" : "Normal");
      const assigned_to = e.assigned_to || e.assignedStaff || "Unassigned";

      // Count inventory items matching category and budget within reasonable range
      const matchingCount = (allProducts || []).filter((p: any) => {
        const prodPrice = Number(p.price || 0);
        if (budgetNum > 0) {
          return prodPrice <= budgetNum * 1.25 && (p.in_stock > 0 || p.stock > 0);
        }
        return p.category === e.category && (p.in_stock > 0 || p.stock > 0);
      }).length;

      return {
        ...e,
        reference_id: e.reference_id || `LE-2026-${String(idx + 1).padStart(6, "0")}`,
        priority,
        assigned_to,
        budgetNum,
        matchingInventoryCount: matchingCount,
        quotationCount: e.quotations ? e.quotations.length : e.quotation ? 1 : 0,
      };
    });

    // Real KPI Summary Metrics
    const stats = {
      total: enrichedList.length,
      newCount: enrichedList.filter((e) => e.status === "new").length,
      inDiscussionCount: enrichedList.filter((e) =>
        ["reviewed", "assigned", "matching", "replied", "quotation_sent", "awaiting_customer"].includes(e.status)
      ).length,
      convertedCount: enrichedList.filter((e) => e.status === "converted").length,
      closedCount: enrichedList.filter((e) => e.status === "closed" || e.status === "cancelled").length,
      urgentCount: enrichedList.filter((e) => e.priority === "Urgent" || e.priority === "High").length,
      totalPipelineValue: enrichedList.reduce((acc, e) => acc + (e.quotation?.finalAmount || e.budgetNum || 0), 0),
    };

    // Filtering
    let filtered = enrichedList;

    if (query) {
      filtered = filtered.filter((e) => {
        return (
          e.reference_id?.toLowerCase().includes(query) ||
          e.customer_name?.toLowerCase().includes(query) ||
          e.phone?.includes(query) ||
          e.email?.toLowerCase().includes(query) ||
          e.product_name?.toLowerCase().includes(query) ||
          e.laptop_type?.toLowerCase().includes(query) ||
          e.city?.toLowerCase().includes(query) ||
          e.brand_preference?.toLowerCase().includes(query) ||
          e.specs?.toLowerCase().includes(query) ||
          e.message?.toLowerCase().includes(query)
        );
      });
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((e) => e.priority?.toLowerCase() === priorityFilter.toLowerCase());
    }

    if (assignedFilter !== "all") {
      filtered = filtered.filter((e) => e.assigned_to === assignedFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "customer_name") {
        comp = (a.customer_name || "").localeCompare(b.customer_name || "");
      } else if (sortBy === "budget") {
        comp = (a.budgetNum || 0) - (b.budgetNum || 0);
      } else if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Normal: 1, Low: 0 };
        comp = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      } else {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comp = dateA - dateB;
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    const res = NextResponse.json({
      success: true,
      enquiries: paginatedItems,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Admin Laptop Enquiries Error:", err);
    return NextResponse.json({ error: "Failed to fetch enquiries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer_name,
      phone,
      email,
      city,
      category,
      product_name,
      budget,
      brand_preference,
      processor_preference,
      ram_preference,
      storage_preference,
      gpu_preference,
      quantity,
      condition,
      use_case,
      message,
      priority,
      assigned_to,
      follow_up_date,
    } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Customer phone number is required." }, { status: 400 });
    }

    const newEnquiry = await dbHelper.laptopEnquiries.create({
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      city: (city || "Bengaluru").trim(),
      category: category || "laptop_purchase",
      product_name: (product_name || "Laptop Lead").trim(),
      laptop_type: (product_name || "Laptop Lead").trim(),
      budget: budget || "Flexible",
      brand_preference: brand_preference || "Any Brand",
      processor_preference: processor_preference || "No Preference",
      ram_preference: ram_preference || "No Preference",
      storage_preference: storage_preference || "No Preference",
      gpu_preference: gpu_preference || "No Preference",
      quantity: quantity || "1 Unit",
      condition: condition || "Any",
      use_case: use_case || "Office & Daily Use",
      message: (message || "").trim(),
      requirements: (message || "").trim(),
      priority: priority || "Medium",
      assigned_to: assigned_to || "Unassigned",
      follow_up_date: follow_up_date || null,
      status: "new",
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: "admin",
          sender_name: "Staff Initial Entry",
          text: `Direct lead registered: ${product_name || "Laptop"} for ${customer_name.trim()}. Budget: ${budget || "Unspecified"}.`,
          timestamp: new Date().toISOString(),
          is_internal: true,
        },
      ],
    });

    return NextResponse.json({ success: true, enquiry: newEnquiry }, { status: 201 });
  } catch (err: any) {
    console.error("POST Admin Laptop Enquiry Error:", err);
    return NextResponse.json({ error: "Failed to create enquiry." }, { status: 500 });
  }
}

