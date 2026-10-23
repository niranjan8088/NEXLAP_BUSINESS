import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

export async function GET() {
  try {
    const allPlans = await dbHelper.protectionPlans.list();
    const activePlans = allPlans.filter((p: any) => p.isActive !== false);
    return NextResponse.json({ success: true, plans: activePlans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
