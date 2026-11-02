import { NextResponse } from "next/server";
import { visitorAnalytics } from "@/lib/visitorAnalytics";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, title, referrer, device, visitorId } = body;

    // Do not count internal admin routes as customer visits
    if (path && (path.startsWith("/admin") || path.startsWith("/api"))) {
      return NextResponse.json({ success: true, ignored: true, reason: "admin_route" });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const recorded = await visitorAnalytics.recordVisit({
      path: path || "/customer",
      title: title || "Customer Portal",
      referrer: referrer || "",
      device: device || "desktop",
      visitorId: visitorId || undefined,
      ip,
      role: path?.startsWith("/customer") ? "customer" : "guest",
    });

    return NextResponse.json({
      success: true,
      visitId: recorded.id,
      timestamp: recorded.timestamp,
    });
  } catch (err: any) {
    console.error("Track Visitor Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

