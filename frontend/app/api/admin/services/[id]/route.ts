import { NextRequest, NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const all = await dbHelper.services.list();
    const service = all.find((s: any) => s.id === id);
    if (!service) {
      return NextResponse.json({ error: "Service profile not found." }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;
    const body = await request.json();

    const all = await dbHelper.services.list();
    const existing = all.find((s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Service profile not found." }, { status: 404 });
    }

    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
      }
    }

    const updated = await dbHelper.services.update(id, {
      ...body,
      updated_at: new Date().toISOString(),
    });

    try {
      await dbHelper.activityLogs.create({
        user_name: user.email || "Admin",
        role: "admin",
        action: "Updated Service Profile",
        details: `Service "${existing.title}" updated`,
        ip: "Internal"
      });
    } catch {}

    return NextResponse.json({ service: updated });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["admin"]);
    const { id } = await params;

    const all = await dbHelper.services.list();
    const existing = all.find((s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Service profile not found." }, { status: 404 });
    }

    await dbHelper.services.delete(id);

    try {
      await dbHelper.activityLogs.create({
        user_name: user.email || "Admin",
        role: "admin",
        action: "Deleted Service Profile",
        details: `Service "${existing.title}" deleted`,
        ip: "Internal"
      });
    } catch {}

    return NextResponse.json({ success: true, message: `Service "${existing.title}" removed.` });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

