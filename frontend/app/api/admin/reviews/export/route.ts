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

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
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

    const rawReviews: any[] = await dbHelper.reviews.list().catch(() => []);

    const filtered = rawReviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (ratingFilter !== null && Math.round(Number(r.rating) || 0) !== ratingFilter) return false;
      return true;
    });

    const headers = [
      "Review ID",
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "Service Used",
      "Product Purchased",
      "Rating",
      "Recommend",
      "Status",
      "Review Message",
      "Admin Reply",
      "Date",
    ];

    const rows: string[] = [headers.map(escapeCsvField).join(",")];

    filtered.forEach((r) => {
      rows.push(
        [
          r.id,
          r.customer_name || "",
          r.phone || "",
          r.email || "",
          r.city || "",
          r.service_used || "",
          r.product_purchased || "",
          Number(r.rating) || 0,
          r.recommend ? "Yes" : "No",
          r.status || "pending",
          r.review_message || "",
          r.admin_reply || "",
          r.created_at || "",
        ]
          .map(escapeCsvField)
          .join(",")
      );
    });

    const csvContent = rows.join("\r\n");
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexbyte-reviews-export-${statusFilter}-${dateStamp}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export reviews CSV." },
      { status: 500 }
    );
  }
}

