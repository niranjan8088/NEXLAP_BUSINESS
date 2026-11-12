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

    const allNotifications = await dbHelper.notifications.list().catch(() => []);

    const headers = [
      "Notification ID",
      "Timestamp",
      "Priority",
      "Category",
      "Status",
      "Title",
      "Message",
      "Recipient Role",
      "Recipient Name",
      "In-App Status",
      "WhatsApp Status",
      "Email Status",
      "Reference Type",
      "Reference ID",
    ];

    const rows: string[] = [];
    rows.push(headers.map(escapeCsvField).join(","));

    allNotifications.forEach((n: any) => {
      rows.push(
        [
          n.id,
          n.created_at,
          (n.priority || "normal").toUpperCase(),
          (n.type || "system_alert").replace(/_/g, " "),
          (n.status || "unread").toUpperCase(),
          n.title || "",
          n.message || "",
          n.recipient_role || "admin",
          n.recipient_name || "All Staff",
          n.channels?.in_app?.status || "delivered",
          n.channels?.whatsapp?.status || "not_configured",
          n.channels?.email?.status || "not_configured",
          n.reference_type || "",
          n.reference_id || "",
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
        "Content-Disposition": `attachment; filename="nexbyte-notifications-audit-${dateStamp}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export notifications CSV." },
      { status: 500 }
    );
  }
}

