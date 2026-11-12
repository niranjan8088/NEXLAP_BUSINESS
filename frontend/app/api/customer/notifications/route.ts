import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";

function getAuthUser(cookieStore: any) {
  const userSession = cookieStore.get("nexbyte_customer_session")?.value;
  if (!userSession) return null;
  const parts = userSession.split(":");
  return { id: parts[1] || parts[0], email: parts[2] || parts[0] };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authUser = getAuthUser(cookieStore);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const notifications = await dbHelper.notifications.list();
    const ownNotifications = notifications.filter(
      (n: any) =>
        (n.user_id && n.user_id === authUser.id) ||
        (n.recipient_user_id && n.recipient_user_id === authUser.id) ||
        (n.customer_email && n.customer_email.toLowerCase() === authUser.email.toLowerCase()) ||
        (n.recipient_email && n.recipient_email.toLowerCase() === authUser.email.toLowerCase()) ||
        n.recipient_role === "user" ||
        n.type === "general"
    );

    const unreadCount = ownNotifications.filter((n: any) => n.status === "unread").length;

    return NextResponse.json({
      notifications: ownNotifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error("GET Customer Notifications Error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}
