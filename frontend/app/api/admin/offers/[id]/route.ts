import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const offer = await dbHelper.offers.getById(id);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ offer }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const body = await request.json();
    const updatedOffer = await dbHelper.offers.update(id, body);

    return NextResponse.json({ success: true, offer: updatedOffer }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    if (err.name === "AuthError") {
      const { status, message } = authErrorResponse(err);
      return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json({ error: err.message || "Failed to update offer." }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const toggled = await dbHelper.offers.toggleStatus(id);
    return NextResponse.json({ success: true, offer: toggled }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const result = await dbHelper.offers.deleteOrArchive(id);
    return NextResponse.json(
      {
        success: true,
        result,
        message: result.archived ? "Offer archived (deactivated) to preserve usage history." : "Offer deleted successfully.",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    if (err.name === "AuthError") {
      const { status, message } = authErrorResponse(err);
      return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json({ error: err.message || "Failed to delete/archive offer." }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}
