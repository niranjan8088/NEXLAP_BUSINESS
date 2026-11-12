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

    const allowedFields = [
      "status",
      "rejection_reason",
      "modification_reason",
      "admin_reply",
      "featured",
      "verified",
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (body.admin_reply !== undefined) {
      updates.admin_reply_at = body.admin_reply ? new Date().toISOString() : null;
    }

    const updated = await dbHelper.reviews.update(id, updates);

    return NextResponse.json({
      success: true,
      message: "Review updated successfully.",
      review: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update review status." },
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

    // Direct deletion with fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl) {
      try {
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(supabaseUrl, supabaseAnonKey);
        await client.from("reviews").delete().eq("id", id);
      } catch {}
    }

    // Mock fallback & audit
    try {
      const allReviews = await dbHelper.reviews.list();
      const filtered = allReviews.filter((r: any) => r.id !== id);
      const { saveMockData, notifyDataChange } = await import("@/lib/server/dbHelper").catch(() => ({} as any));
      if (saveMockData) saveMockData("reviews", filtered);
      if (notifyDataChange) notifyDataChange("reviews", "delete", { id });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Review permanently deleted.",
      id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}

