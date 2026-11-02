import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function POST() {
  try {
    const adminUser = await requireRole(["admin"]);
    const resetSettings = await dbHelper.storeSettings.reset({
      email: adminUser.email,
      name: adminUser.name,
    });

    return NextResponse.json({
      success: true,
      message: "Store settings have been reset to verified factory defaults.",
      settings: resetSettings,
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

