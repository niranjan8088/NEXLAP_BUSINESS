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

    // Search by email or phone
    if (targetRole === "admin") {
      // Find admin account
      account = users.find(
        (u: any) =>
          (u.email?.toLowerCase() === input || u.phone?.replace(/\D/g, "") === input.replace(/\D/g, "")) &&
          (u.role === "admin" || u.email?.toLowerCase() === "admin@nexbyte.com")
      );

      // Default Dev Admin check
      if (!account && (input === "admin@nexbyte.com" || input === "admin")) {
        account = {
          id: "admin-1",
          email: "admin@nexbyte.com",
          full_name: "NexLapTech Admin",
          phone: "8088979706",
          role: "admin",
          is_active: true,
        };
      }

      if (!account || (account.role !== "admin" && account.email?.toLowerCase() !== "admin@nexbyte.com")) {
        return NextResponse.json(
          { error: "Access Denied: Account does not have administrative privileges." },
          { status: 403 }
        );
      }

      // Validate password against environment configuration or account record
      const expectedAdminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD;
      const isPasswordValid = account.password
        ? account.password === password
        : expectedAdminPassword
        ? password === expectedAdminPassword
        : process.env.NODE_ENV !== "production"; // In production, always require ADMIN_PASSWORD

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
        };
      }

      if (!account) {
        return NextResponse.json(
          { error: "No registered reseller account found for these credentials." },
          { status: 404 }
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

    // Default USER Role
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
      account = {
        id: `cust-${Date.now()}`,
        email: input.includes("@") ? input : `${input}@customer.nexbyte.com`,
        full_name: "Customer",
        phone: input.includes("@") ? "9876543210" : cleanPhone,
        password: password.trim(),
        role: "user",
        status: "active",
        created_at: new Date().toISOString(),
      };
      await dbHelper.users.create(account);
    }

    // Ensure customer profile exists in database
    try {
      const existingProfile = await dbHelper.profiles.getById(account.id);
      if (!existingProfile) {
        await dbHelper.profiles.update(account.id, {
          id: account.id,
          email: account.email,
          full_name: account.full_name || "Customer",
          phone: account.phone || "9876543210",
          date_of_birth: account.date_of_birth || "1998-05-20",
          role: "user",
          status: "active",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
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
