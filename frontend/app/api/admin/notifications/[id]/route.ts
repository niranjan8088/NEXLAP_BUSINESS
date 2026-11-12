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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const all = await dbHelper.notifications.list();
    const item = all.find((n: any) => n.id === id);

    if (!item) {
      return NextResponse.json({ error: `Notification with ID '${id}' was not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: item });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve notification." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status === "read") {
      await dbHelper.notifications.markRead(id);
    } else if (status === "unread") {
      await dbHelper.notifications.markUnread(id);
    } else if (status === "archived") {
      await dbHelper.notifications.archive(id);
    } else {
      return NextResponse.json({ error: "Invalid status. Use 'read', 'unread', or 'archived'." }, { status: 400 });
    }

    const all = await dbHelper.notifications.list();
    const updated = all.find((n: any) => n.id === id);

    return NextResponse.json({
      success: true,
      message: `Notification updated to ${status}.`,
      notification: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    await dbHelper.notifications.delete(id);

    return NextResponse.json({
      success: true,
      message: `Notification '${id}' removed.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete notification." },
      { status: 500 }
    );
  }
}

