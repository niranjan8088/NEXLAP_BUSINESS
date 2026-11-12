import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function GET() {
  try {
    const session = await getServerSession();
    // Return empty notifications array with 200 for guest visitors to avoid console 401 errors
    if (!session) {
      return NextResponse.json(
        { success: true, notifications: [], unreadCount: 0 },
        { status: 200, headers: JSON_HEADERS }
      );
    }

    const allNotifications = await dbHelper.notifications.list();

    // Security Filter: Role-based & User-specific notification isolation
    const userNotifications = allNotifications.filter((n: any) => {
      // 1. Exact match on recipient user ID
      if (n.recipient_user_id && n.recipient_user_id === session.id) {
        return true;
      }
      // 2. Exact match on recipient role
      if (n.recipient_role) {
        if (session.role === "admin" && n.recipient_role === "admin") return true;
        if (session.role === "reseller" && n.recipient_role === "reseller") return true;
        if (session.role === "user" && n.recipient_role === "user") return true;
        return false;
      }
      // 3. Admin legacy fallback notifications (where no recipient specified)
      if (session.role === "admin" && !n.recipient_user_id && !n.recipient_role) {
        return true;
      }
      return false;
    });

    const unreadCount = userNotifications.filter((n: any) => n.status === "unread" || !n.is_read).length;

    return NextResponse.json(
      { success: true, notifications: userNotifications, unreadCount },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Error", error: error.message },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401, headers: JSON_HEADERS }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const { action, id } = body;

    if (action === "markAllRead") {
      await dbHelper.notifications.markAllRead();
      return NextResponse.json({ success: true, message: "All notifications marked as read." }, { status: 200, headers: JSON_HEADERS });
    }

    if (action === "markRead" && id) {
      await dbHelper.notifications.markRead(id);
      return NextResponse.json({ success: true, message: "Notification marked as read." }, { status: 200, headers: JSON_HEADERS });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action. Use 'markAllRead' or 'markRead' with id." },
      { status: 400, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal Error" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
