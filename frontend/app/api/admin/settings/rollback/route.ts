import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function POST(request: Request) {
  try {
    const adminUser = await requireRole(["admin"]);
    const body = await request.json();
    const targetVersion = Number(body?.version);

    if (!targetVersion || isNaN(targetVersion) || targetVersion < 1) {
      return NextResponse.json(
        { success: false, error: "A valid positive target version number is required for rollback." },
        { status: 400 }
      );
    }

    const restoredSettings = await dbHelper.storeSettings.rollback(targetVersion, {
      email: adminUser.email,
      name: adminUser.name,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion}. Active version is now ${restoredSettings.version}.`,
      version: restoredSettings.version,
      settings: restoredSettings,
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

