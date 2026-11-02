import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const versions = await dbHelper.storeSettings.getVersions();

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

