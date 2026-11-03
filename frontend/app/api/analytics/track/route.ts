import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { visitorAnalytics } from "@/lib/visitorAnalytics";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      try {
        body = await request.json();
      } catch {}
    }

    const { path, title, referrer, visitorId } = body;

    // Do not count administrative, build, or internal API routes as customer visits
    if (
      !path ||
      path.startsWith("/admin") ||
      path.startsWith("/api") ||
      path.includes("_next") ||
      path.includes("favicon") ||
      path.includes(".png") ||
      path.includes(".jpg") ||
      path.includes(".svg")
    ) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Capture authentic client IP from Cloudflare / Nginx / Reverse Proxy
    const cfIp = request.headers.get("cf-connecting-ip");
    const realIp = request.headers.get("x-real-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = cfIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

    // Detect device type from payload or User-Agent header
    let device: "desktop" | "mobile" | "tablet" = body.device;
    if (!device || (device !== "mobile" && device !== "tablet" && device !== "desktop")) {
      const ua = (request.headers.get("user-agent") || "").toLowerCase();
      if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
        device = "tablet";
      } else if (/mobile|iphone|ipod|blackberry|opera mini|windows phone/i.test(ua)) {
        device = "mobile";
      } else {
        device = "desktop";
      }
    }

    // Role check: customer if signed-in session cookie is active, else guest
    const cookieStore = await cookies();
    const hasCustomerSession = Boolean(cookieStore.get("nexbyte_customer_session")?.value);
    const role: "customer" | "guest" = hasCustomerSession ? "customer" : "guest";

    const recorded = await visitorAnalytics.recordVisit({
      path,
      title: title || path,
      referrer: referrer || "",
      device,
      visitorId: visitorId || undefined,
      ip,
      role,
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
