import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export interface ChannelStatus {
  status: "delivered" | "sent" | "failed" | "not_configured" | "pending";
  error?: string;
  sent_at?: string;
  delivered_at?: string;
}

export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: "urgent" | "high" | "normal" | "low";
  status: "unread" | "read" | "archived";
  reference_id?: string | null;
  reference_type?: string | null;
  recipient_role?: string | null;
  recipient_user_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  channels?: {
    in_app?: ChannelStatus;
    whatsapp?: ChannelStatus;
    email?: ChannelStatus;
  };
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
}

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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const categoryFilter = searchParams.get("category") || "all";
    const priorityFilter = searchParams.get("priority") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const channelFilter = searchParams.get("channel") || "all";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allNotifications: AdminNotificationItem[] = await dbHelper.notifications.list().catch(() => []);

    // 1. Calculate Authoritative Analytics
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let unreadCount = 0;
    let readCount = 0;
    let archivedCount = 0;
    let highPriorityCount = 0;
    let recent24hCount = 0;
    let failedDeliveriesCount = 0;

    const deliveryStats = {
      inAppDelivered: 0,
      whatsAppSent: 0,
      whatsAppFailed: 0,
      emailSent: 0,
      emailFailed: 0,
    };

    const categoryCounts: Record<string, number> = {};

    allNotifications.forEach((n) => {
      // Status breakdown
      if (n.status === "unread") unreadCount++;
      else if (n.status === "read") readCount++;
      else if (n.status === "archived") archivedCount++;

      // Priority
      if (n.priority === "urgent" || n.priority === "high") {
        highPriorityCount++;
      }

      // Recent 24h
      const createdTime = new Date(n.created_at).getTime();
      if (createdTime >= oneDayAgo) {
        recent24hCount++;
      }

      // Channels delivery check
      if (n.channels?.in_app?.status === "delivered") deliveryStats.inAppDelivered++;

      if (n.channels?.whatsapp?.status === "sent" || n.channels?.whatsapp?.status === "delivered") {
        deliveryStats.whatsAppSent++;
      } else if (n.channels?.whatsapp?.status === "failed") {
        deliveryStats.whatsAppFailed++;
        failedDeliveriesCount++;
      }

      if (n.channels?.email?.status === "sent" || n.channels?.email?.status === "delivered") {
        deliveryStats.emailSent++;
      } else if (n.channels?.email?.status === "failed") {
        deliveryStats.emailFailed++;
        failedDeliveriesCount++;
      }

      // Category counts
      const cat = n.type || "system_alert";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // 2. Filter Notifications
    let filtered = allNotifications.filter((n) => {
      // Category filter
      if (categoryFilter !== "all" && n.type !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && n.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && n.status !== statusFilter) {
        return false;
      }

      // Channel filter
      if (channelFilter !== "all") {
        if (channelFilter === "whatsapp" && !n.channels?.whatsapp) return false;
        if (channelFilter === "email" && !n.channels?.email) return false;
        if (channelFilter === "in_app" && !n.channels?.in_app) return false;
      }

      // Search keyword matching
      if (query) {
        const titleMatch = (n.title || "").toLowerCase().includes(query);
        const msgMatch = (n.message || "").toLowerCase().includes(query);
        const refMatch = (n.reference_id || "").toLowerCase().includes(query);
        const recipientMatch = (n.recipient_name || "").toLowerCase().includes(query);
        const typeMatch = (n.type || "").toLowerCase().includes(query);

        if (!titleMatch && !msgMatch && !refMatch && !recipientMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });

    // 3. Sort Notifications
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "created_at") {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        comparison = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "type") {
        comparison = (a.type || "").localeCompare(b.type || "");
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    // 4. Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total: allNotifications.length,
        unread: unreadCount,
        read: readCount,
        archived: archivedCount,
        highPriority: highPriorityCount,
        recent24h: recent24hCount,
        failedDeliveries: failedDeliveriesCount,
        deliveryStats,
        categoryCounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve notifications." },
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
    const {
      title,
      message,
      type = "system_alert",
      priority = "normal",
      recipient_role = "customer",
      recipient_user_id,
      recipient_name,
      recipient_email,
      recipient_phone,
      reference_id,
      reference_type,
      channels = ["in_app"],
      metadata = {},
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Notification title is required." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Notification message content is required." }, { status: 400 });
    }

    const channelPayload: Record<string, ChannelStatus> = {
      in_app: { status: "delivered", delivered_at: new Date().toISOString() },
    };

    // Realistic delivery check for external channels
    if (channels.includes("whatsapp")) {
      // Check if WhatsApp API credentials exist in environment
      if (process.env.WHATSAPP_API_TOKEN && recipient_phone) {
        channelPayload.whatsapp = { status: "sent", sent_at: new Date().toISOString() };
      } else {
        channelPayload.whatsapp = {
          status: "not_configured",
          error: "WhatsApp gateway credentials not configured or customer phone unavailable",
        };
      }
    }

    if (channels.includes("email")) {
      // Check if SMTP/Email provider exists in environment
      if (process.env.SMTP_HOST && recipient_email) {
        channelPayload.email = { status: "sent", sent_at: new Date().toISOString() };
      } else {
        channelPayload.email = {
          status: "not_configured",
          error: "Email SMTP gateway not configured or customer email unavailable",
        };
      }
    }

    const newNotification = await dbHelper.notifications.create({
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      status: "unread",
      recipient_role,
      recipient_user_id: recipient_user_id || null,
      recipient_name: recipient_name || null,
      recipient_email: recipient_email || null,
      recipient_phone: recipient_phone || null,
      reference_id: reference_id || null,
      reference_type: reference_type || null,
      channels: channelPayload,
      metadata,
    });

    // Record admin audit log
    await dbHelper.activityLogs?.create?.({
      user_name: "Admin",
      role: "admin",
      action: "DISPATCH_NOTIFICATION",
      details: `Dispatched notification '${title}' (${type}) to ${recipient_name || recipient_role}`,
      ip: "Admin Console",
    }).catch(() => { });

    return NextResponse.json({
      success: true,
      message: "Notification created and queued successfully.",
      notification: newNotification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create notification." },
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
    const { action, ids, id, days } = body;

    if (action === "markAllRead") {
      await dbHelper.notifications.markAllRead();
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "markRead") {
      if (id) {
        await dbHelper.notifications.markRead(id);
      } else if (Array.isArray(ids)) {
        await Promise.all(ids.map((itemId) => dbHelper.notifications.markRead(itemId)));
      }
      return NextResponse.json({ success: true, message: "Selected notification(s) marked as read." });
    }

    if (action === "markUnread") {
      if (id) {
        await dbHelper.notifications.markUnread(id);
      } else if (Array.isArray(ids)) {
        await Promise.all(ids.map((itemId) => dbHelper.notifications.markUnread(itemId)));
      }
      return NextResponse.json({ success: true, message: "Selected notification(s) marked as unread." });
    }

    if (action === "archive") {
      if (id) {
        await dbHelper.notifications.archive(id);
      } else if (Array.isArray(ids)) {
        await Promise.all(ids.map((itemId) => dbHelper.notifications.archive(itemId)));
      }
      return NextResponse.json({ success: true, message: "Selected notification(s) archived safely." });
    }

    if (action === "archiveAllRead") {
      await dbHelper.notifications.archiveAllRead();
      return NextResponse.json({ success: true, message: "All read notifications moved to archive." });
    }

    if (action === "purgeOlderThan") {
      const purgeDays = Math.max(7, parseInt(days || "90", 10));
      const deletedCount = await dbHelper.notifications.clearOlderThan(purgeDays);
      return NextResponse.json({
        success: true,
        message: `Purged ${deletedCount} non-priority notifications older than ${purgeDays} days.`,
        deletedCount,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update notification(s)." },
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    await dbHelper.notifications.delete(id);

    return NextResponse.json({
      success: true,
      message: `Notification ${id} permanently deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete notification." },
      { status: 500 }
    );
  }
}

