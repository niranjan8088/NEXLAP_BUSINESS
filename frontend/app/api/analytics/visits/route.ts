import { NextResponse } from "next/server";
import { visitorAnalytics } from "@/lib/visitorAnalytics";

export async function GET() {
  try {
    const analytics = await visitorAnalytics.getAnalytics();
    const res = NextResponse.json({
      success: true,
      analytics,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Customer Visits Analytics Error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, device, title } = body;

    const cfIp = request.headers.get("cf-connecting-ip");
    const realIp = request.headers.get("x-real-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = cfIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

    await visitorAnalytics.recordVisit({
      path: path || "/",
      title: title || "Live Visit",
      device: device || "desktop",
      referrer: "admin_test",
      ip,
      role: "customer",
    });

    const updated = await visitorAnalytics.getAnalytics();
    return NextResponse.json({
      success: true,
      message: "Customer visit logged successfully",
      analytics: updated,
    });
  } catch (err: any) {
    console.error("POST Customer Visit Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await visitorAnalytics.resetVisits();
    const fresh = await visitorAnalytics.getAnalytics();
    return NextResponse.json({
      success: true,
      message: "Visitor analytics logs reset successfully",
      analytics: fresh,
    });
  } catch (err: any) {
    console.error("DELETE Customer Visits Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
