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
    const { action, path, device } = body;

    if (action === "simulate") {
      // Simulate a real-time customer visit for live testing
      const samplePaths = [
        { path: "/customer/shop", title: "All Products" },
        { path: "/products", title: "Laptops & Hardware" },
        { path: "/customer/orders", title: "Order Tracking" },
        { path: "/customer/bookings", title: "Repair Booking" },
        { path: "/services", title: "IT Services" },
      ];
      const selected = samplePaths[Math.floor(Math.random() * samplePaths.length)];
      const devices: ("mobile" | "desktop" | "tablet")[] = ["mobile", "desktop", "tablet"];
      const randomDevice = device || devices[Math.floor(Math.random() * devices.length)];

      await visitorAnalytics.recordVisit({
        path: path || selected.path,
        title: selected.title,
        device: randomDevice,
        referrer: "https://google.com",
        role: "customer",
      });
    }

    const updated = await visitorAnalytics.getAnalytics();
    return NextResponse.json({
      success: true,
      message: "Customer visit recorded successfully",
      analytics: updated,
    });
  } catch (err: any) {
    console.error("POST Customer Visit Simulation Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await visitorAnalytics.resetVisits();
    const fresh = await visitorAnalytics.getAnalytics();
    return NextResponse.json({
      success: true,
      message: "Visitor analytics reset to baseline successfully",
      analytics: fresh,
    });
  } catch (err: any) {
    console.error("DELETE Customer Visits Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

