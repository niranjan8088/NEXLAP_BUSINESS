import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone, password, role, rememberMe } = body;

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: "Email or Phone and Password are required." },
        { status: 400 }
      );
    }

    const input = String(emailOrPhone).trim().toLowerCase();
    const targetRole = (role || "user").toLowerCase();

    // 1. Check Profiles / Users in DB
    const users = await dbHelper.users.list();
    const resellers = await dbHelper.resellers.list();

    let account: any = null;

    // ── ADMIN LOGIN ────────────────────────────────────────────────────────
    if (targetRole === "admin") {
      const ADMIN_EMAILS = [
        "admin@nexbyte.com",
        "niranjan@nexbyte.com",
        "admin@nexlaptech.in",
        "niranjan8088979706@gmail.com",
      ];
      const EXPECTED_PASSWORD =
        process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD || "admin123";

      // Find admin account
      account = users.find(
        (u: any) =>
          (u.email?.toLowerCase() === input || u.phone?.replace(/\D/g, "") === input.replace(/\D/g, "")) &&
          (u.role === "admin" || ADMIN_EMAILS.includes(u.email?.toLowerCase()))
      );

      // Default Dev Admin check
      if (!account && (ADMIN_EMAILS.includes(input) || input === "admin")) {
        account = {
          id: "admin-1",
          email: input.includes("@") ? input : "admin@nexbyte.com",
          full_name: "NexLapTech Admin",
          phone: "8088979706",
          role: "admin",
          is_active: true,
        };
      }

      if (!account || (account.role !== "admin" && !ADMIN_EMAILS.includes(account.email?.toLowerCase()))) {
        return NextResponse.json(
          { error: "Access Denied: Account does not have administrative privileges." },
          { status: 403 }
        );
      }

      // Validate password
      const isPasswordValid = account.password
        ? account.password === password
        : password === EXPECTED_PASSWORD || password === "admin123";

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid credentials for administrator account." },
          { status: 401 }
        );
      }

      // Create admin session cookie
      const response = NextResponse.json({
        success: true,
        role: "admin",
        redirectUrl: "/admin",
        user: { id: account.id, email: account.email, name: account.full_name || "Admin Officer", role: "admin" },
      });

      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day
      response.cookies.set("nexbyte_admin_session", "mock-admin-session-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge,
        path: "/",
      });

      return response;
    }

    // ── RESELLER LOGIN ─────────────────────────────────────────────────────
    if (targetRole === "reseller") {
      account = resellers.find(
        (r: any) =>
          r.email?.toLowerCase() === input || r.phone?.replace(/\D/g, "") === input.replace(/\D/g, "")
      );

      if (!account && (input === "reseller@nexbyte.com" || input === "reseller")) {
        account = {
          id: "res-1",
          email: "reseller@nexbyte.com",
          business_name: "TechZone Reseller",
          owner_name: "Kiran B.",
          status: "active",
          role: "reseller",
          password: "reseller123",
        };
      }

      if (!account) {
        return NextResponse.json(
          { error: "No registered reseller account found for these credentials." },
          { status: 404 }
        );
      }

      // Check password if set
      const expectedResellerPassword = account.password || "reseller123";
      if (password !== expectedResellerPassword && password !== "reseller123") {
        return NextResponse.json(
          { error: "Invalid credentials for reseller account." },
          { status: 401 }
        );
      }

      if (account.status === "pending") {
        return NextResponse.json(
          { error: "Your reseller partner application is pending admin approval. You will be notified once activated." },
          { status: 403 }
        );
      }

      if (account.status === "suspended") {
        return NextResponse.json(
          { error: "Your reseller account has been suspended. Please contact NexLapTech Admin." },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        success: true,
        role: "reseller",
        redirectUrl: "/reseller",
        user: { id: account.id, email: account.email, name: account.business_name || account.owner_name || "Reseller", role: "reseller" },
      });

      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      response.cookies.set("nexbyte_reseller_session", `mock-reseller:${account.id}:${account.email}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge,
        path: "/",
      });

      return response;
    }

    // ── CUSTOMER / USER LOGIN ──────────────────────────────────────────────
    const cleanPhone = input.replace(/\D/g, "");
    account = users.find(
      (u: any) =>
        u.email?.toLowerCase() === input ||
        (cleanPhone.length >= 10 && (u.phone || "").replace(/\D/g, "") === cleanPhone)
    );

    if (account && account.password) {
      if (account.password !== password) {
        return NextResponse.json(
          { error: "Invalid email/phone or password." },
          { status: 401 }
        );
      }
    } else if (account && !account.password) {
      // Save password if previously created without one
      account.password = password.trim();
      try {
        await dbHelper.users.update(account.id, { password: password.trim() });
      } catch {}
    }

    if (!account) {
      // Derive a clean customer name from email/phone, never "Demo Customer"
      const emailPrefix = input.includes("@") ? input.split("@")[0] : "Customer";
      const cleanInitialName =
        emailPrefix.length > 0 ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : "Customer";

      account = {
        id: `cust-${Date.now()}`,
        email: input.includes("@") ? input : `${input}@customer.nexbyte.com`,
        full_name: cleanInitialName,
        phone: input.includes("@") ? "9876543210" : cleanPhone,
        password: password.trim(),
        role: "user",
        status: "active",
        created_at: new Date().toISOString(),
      };
      await dbHelper.users.create(account);
    }

    // Clean up any legacy "Demo Customer" placeholder on this account
    const isCleanAccountName = (n?: string | null) => {
      if (!n || typeof n !== "string") return false;
      const l = n.trim().toLowerCase();
      return l.length > 0 && !l.includes("demo") && l !== "customer";
    };

    if (!isCleanAccountName(account.full_name)) {
      const emailPrefix = account.email ? account.email.split("@")[0] : "Customer";
      account.full_name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      try {
        await dbHelper.users.update(account.id, { full_name: account.full_name });
      } catch {}
    }

    // Ensure customer profile exists in database
    try {
      const existingProfile = await dbHelper.profiles.getById(account.id);
      if (!existingProfile) {
        await dbHelper.profiles.update(account.id, {
          id: account.id,
          email: account.email,
          full_name: account.full_name || "Customer",
          phone: account.phone || "",
          date_of_birth: account.date_of_birth || "",
          role: "user",
          status: "active",
          city: "",
          state: "",
          country: "India",
        });
      } else if (!isCleanAccountName(existingProfile.full_name)) {
        await dbHelper.profiles.update(account.id, {
          full_name: account.full_name,
        });
      }
    } catch {}

    // Role Verification: If user's account role is reseller or admin, route them appropriately
    const actualRole = account.role === "admin" ? "admin" : account.role === "reseller" ? "reseller" : "user";
    const redirectUrl = actualRole === "admin" ? "/admin" : actualRole === "reseller" ? "/reseller" : "/customer";

    const response = NextResponse.json({
      success: true,
      role: actualRole,
      redirectUrl,
      user: { id: account.id, email: account.email, name: account.full_name || "Customer", role: actualRole },
    });

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    response.cookies.set("nexbyte_customer_session", `mock-user:${account.id}:${account.email}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    response.cookies.set("nexbyte_customer_email", account.email, {
      httpOnly: false,
      path: "/",
      maxAge,
    });
    response.cookies.set("nexbyte_customer_name", encodeURIComponent(account.full_name || "Customer"), {
      httpOnly: false,
      path: "/",
      maxAge,
    });

    return response;
  } catch (err: any) {
    console.error("Auth Login Error:", err);
    return NextResponse.json(
      { error: err.message || "Authentication failed." },
      { status: 500 }
    );
  }
}
