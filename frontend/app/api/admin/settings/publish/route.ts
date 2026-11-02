import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function POST(request: Request) {
  try {
    const adminUser = await requireRole(["admin"]);
    let summary = "Admin published live website customization";
    try {
      const body = await request.json();
      if (body?.summary) summary = String(body.summary).trim().slice(0, 200);
    } catch {}

    const result = await dbHelper.storeSettings.publish(
      { email: adminUser.email, name: adminUser.name },
      summary
    );

    return NextResponse.json({
      success: true,
      message: `Configuration version ${result.version} published to live website successfully.`,
      version: result.version,
      settings: result.settings,
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

