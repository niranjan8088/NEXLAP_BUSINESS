import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, userId, fullName } = await request.json();

    if (!email || !userId) {
      return NextResponse.json({ error: "Missing authentication fields" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    // Set customer session token cookie
    response.cookies.set("nexbyte_customer_session", `mock-user:${userId}:${email}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
      path: "/"
    });

    // Also store customer email & name in custom cookie for simple client layout displays
    response.cookies.set("nexbyte_customer_email", email, { path: "/", maxAge: 7 * 24 * 60 * 60 });
    response.cookies.set("nexbyte_customer_name", encodeURIComponent(fullName || email.split("@")[0]), { path: "/", maxAge: 7 * 24 * 60 * 60 });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to establish session" }, { status: 500 });
  }
}
