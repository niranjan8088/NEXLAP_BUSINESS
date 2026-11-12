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

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const enquiries = await dbHelper.laptopEnquiries.list();

    const headers = [
      "Reference ID",
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "Category",
      "Product / Requirement",
      "Budget",
      "Brand Preference",
      "Processor Preference",
      "RAM Preference",
      "Storage Preference",
      "Status",
      "Priority",
      "Assigned Staff",
      "Follow-up Date",
      "Converted Order ID",
      "Created At",
    ];

    const rows = (enquiries || []).map((e: any) => [
      escapeCsvField(e.reference_id || e.id),
      escapeCsvField(e.customer_name),
      escapeCsvField(e.phone),
      escapeCsvField(e.email),
      escapeCsvField(e.city),
      escapeCsvField(e.category || "laptop_purchase"),
      escapeCsvField(e.product_name || e.laptop_type),
      escapeCsvField(e.budget),
      escapeCsvField(e.brand_preference),
      escapeCsvField(e.processor_preference),
      escapeCsvField(e.ram_preference),
      escapeCsvField(e.storage_preference),
      escapeCsvField(e.status || "new"),
      escapeCsvField(e.priority || "Medium"),
      escapeCsvField(e.assigned_to || "Unassigned"),
      escapeCsvField(e.follow_up_date),
      escapeCsvField(e.converted_order_id),
      escapeCsvField(e.created_at ? new Date(e.created_at).toLocaleDateString("en-IN") : ""),
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\r\n");

    const dateStr = new Date().toISOString().split("T")[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexlaptech-enquiries-${dateStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export Enquiries CSV Error:", err);
    return NextResponse.json({ error: "Failed to export enquiries." }, { status: 500 });
  }
}

