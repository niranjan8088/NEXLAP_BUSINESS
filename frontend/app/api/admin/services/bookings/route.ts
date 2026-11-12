import { NextRequest, NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";

/** GET /api/admin/services/bookings — List service bookings with pipeline status filter and technician tracking */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const allBookings = await dbHelper.bookings.list();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status") || "all";
    const technicianParam = (searchParams.get("technician") || "").trim().toLowerCase();
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    // Pipeline counts
    const counts = {
      all: allBookings.length,
      new: allBookings.filter((b: any) => b.status === "new" || !b.status).length,
      confirmed: allBookings.filter((b: any) => b.status === "confirmed").length,
      assigned: allBookings.filter((b: any) => b.status === "assigned" || (b.technician && b.status !== "completed" && b.status !== "delivered")).length,
      in_progress: allBookings.filter((b: any) => b.status === "in_progress" || b.status === "progress").length,
      quality_check: allBookings.filter((b: any) => b.status === "quality_check").length,
      completed: allBookings.filter((b: any) => b.status === "completed").length,
      delivered: allBookings.filter((b: any) => b.status === "delivered").length,
      cancelled: allBookings.filter((b: any) => b.status === "cancelled").length,
    };

    // Filter
    let filtered = allBookings.filter((b: any) => {
      if (q) {
        const idMatch = (b.bookingId || b.id || "").toLowerCase().includes(q);
        const nameMatch = (b.customerName || b.customer_name || "").toLowerCase().includes(q);
        const phoneMatch = (b.phone || "").toLowerCase().includes(q);
        const emailMatch = (b.email || "").toLowerCase().includes(q);
        const serviceMatch = (b.productName || b.service_name || "").toLowerCase().includes(q);
        const techMatch = (b.technician || b.assignedTo || "").toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !emailMatch && !serviceMatch && !techMatch) {
          return false;
        }
      }

      if (statusParam && statusParam !== "all") {
        if (statusParam === "new") {
          if (b.status !== "new" && b.status) return false;
        } else if (b.status !== statusParam) {
          return false;
        }
      }

      if (technicianParam && technicianParam !== "all") {
        const tech = (b.technician || b.assignedTo || "").toLowerCase();
        if (!tech.includes(technicianParam)) return false;
      }

      return true;
    });

    // Sort newest first
    filtered.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const total = filtered.length;

    // Pagination
    let paged = filtered;
    let page = 1;
    let limit = total;
    let totalPages = 1;

    if (pageParam !== null || limitParam !== null) {
      page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
      const parsedLimit = parseInt(limitParam || "20", 10);
      limit = parsedLimit > 0 ? parsedLimit : 20;
      totalPages = Math.max(1, Math.ceil(total / limit));
      if (page > totalPages && totalPages > 0) page = totalPages;
      const start = (page - 1) * limit;
      paged = filtered.slice(start, start + limit);
    }

    return NextResponse.json(
      {
        bookings: paged,
        total,
        totalPages,
        page,
        limit,
        counts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** PUT /api/admin/services/bookings — Update booking status, assign technician, add charges & notes */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await request.json();

    const { id, bookingId } = body;
    const targetId = id || bookingId;

    if (!targetId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const allBookings = await dbHelper.bookings.list();
    const existing = allBookings.find((b: any) => b.id === targetId || b.bookingId === targetId);

    if (!existing) {
      return NextResponse.json({ error: "Booking record not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newStatus = body.status || existing.status;
    const assignedTechnician = body.technician !== undefined ? body.technician : (body.assignedTo !== undefined ? body.assignedTo : existing.technician);
    const estimatedCompletion = body.estimatedCompletion || existing.estimatedCompletion;

    // Timeline event creation
    const timeline = Array.isArray(existing.timeline) ? [...existing.timeline] : [];
    if (newStatus && newStatus !== existing.status) {
      timeline.push({
        status: newStatus,
        timestamp: now,
        message: `Status updated to ${newStatus.toUpperCase().replace("_", " ")}`,
        by: user.email || "Admin",
      });
    }

    if (assignedTechnician && assignedTechnician !== existing.technician) {
      timeline.push({
        status: newStatus,
        timestamp: now,
        message: `Assigned to technician ${assignedTechnician}`,
        by: user.email || "Admin",
      });
    }

    if (body.customerUpdate && body.customerUpdate !== existing.replyMessage) {
      timeline.push({
        status: newStatus,
        timestamp: now,
        message: `Customer notice: "${body.customerUpdate}"`,
        by: user.email || "Admin",
      });
    }

    const updates = {
      status: newStatus,
      technician: assignedTechnician,
      assignedTo: assignedTechnician,
      estimatedCompletion,
      labourCharge: body.labourCharge !== undefined ? Number(body.labourCharge) : existing.labourCharge,
      partsCost: body.partsCost !== undefined ? Number(body.partsCost) : existing.partsCost,
      totalAmount: body.totalAmount !== undefined ? Number(body.totalAmount) : existing.totalAmount,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      replyMessage: body.customerUpdate !== undefined ? body.customerUpdate : existing.replyMessage,
      replyDate: now,
      replyBy: user.email || "Admin",
      timeline,
      updatedAt: now,
      updated_at: now,
    };

    const updated = await dbHelper.bookings.update(existing.id, updates);

    // Dispatch real-time customer event if status or message changed
    if (newStatus !== existing.status || body.customerUpdate) {
      try {
        await dispatchPipelineEvent({
          eventType: (newStatus === "completed" ? "SERVICE_COMPLETED" : newStatus === "in_progress" ? "SERVICE_IN_PROGRESS" : "SERVICE_CONFIRMED") as any,
          title: `Service Booking Update (${existing.bookingId || existing.id})`,
          message: body.customerUpdate || `Your service booking status is now: ${newStatus.toUpperCase().replace("_", " ")}`,
          recipientRole: "user",
          recipientUserId: existing.user_id || undefined,
          referenceType: "booking",
          referenceId: existing.bookingId || existing.id,
          actorRole: "admin",
        });
      } catch (evtErr) {
        console.warn("Pipeline event dispatch notice:", evtErr);
      }
    }

    return NextResponse.json({ booking: updated, success: true });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}
