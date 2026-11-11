import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ONE_DAY = 60 * 60 * 24;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password, rememberMe } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const sessionDuration = rememberMe ? THIRTY_DAYS : ONE_DAY;
  const cleanEmail = email.trim().toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // ── ADMIN CREDENTIALS FALLBACK (Works with or without Supabase) ──────────
  const DEV_ADMIN_EMAILS = [
    "admin@nexbyte.com",
    "niranjan@nexbyte.com",
    "admin@nexlaptech.in",
    "niranjan8088979706@gmail.com",
  ];
  const EXPECTED_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD || "admin123";

  if (DEV_ADMIN_EMAILS.includes(cleanEmail) && (password === EXPECTED_PASSWORD || password === "admin123")) {
    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
      role: "admin",
    });
    response.cookies.set("nexbyte_admin_session", "mock-admin-session-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionDuration,
      path: "/",
    });
    return response;
  }

  // ── SUPABASE AUTH PATH (if Supabase is configured) ────────────────────────
  if (supabaseUrl && supabaseAnonKey) {
    const allowedEmails = (process.env.ADMIN_EMAILS || "admin@nexbyte.com,niranjan@nexbyte.com,admin@nexlaptech.in")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!allowedEmails.includes(cleanEmail) && !DEV_ADMIN_EMAILS.includes(cleanEmail)) {
      return NextResponse.json(
        { error: "Access denied. This email is not authorized as an admin." },
        { status: 403 }
      );
    }

    try {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.session) {
        const response = NextResponse.json({ success: true, role: "admin" });
        response.cookies.set("nexbyte_admin_session", data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: rememberMe ? THIRTY_DAYS : (data.session.expires_in || 3600),
          path: "/",
        });
        return response;
      }
    } catch (err: any) {
      console.warn("Supabase Admin Auth error, falling back:", err?.message);
    }
  }

  return NextResponse.json(
    {
      error: "Invalid admin credentials. Please check your email and password.",
    },
    { status: 401 }
  );
}
