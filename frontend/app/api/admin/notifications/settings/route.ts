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

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const settings = await dbHelper.notifications.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load notification settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const updated = await dbHelper.notifications.updateSettings(body);

    // Audit log
    await dbHelper.activityLogs?.create?.({
      user_name: "Admin",
      role: "admin",
      action: "UPDATE_NOTIFICATION_SETTINGS",
      details: "Updated notification preferences, retention policy, and channel rules",
      ip: "Admin Console",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Notification settings updated and persisted successfully.",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update notification settings." },
      { status: 500 }
    );
  }
}

