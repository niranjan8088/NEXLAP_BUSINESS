import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, role, businessName, gstin, businessDescription } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const requestedRole = (role || "user").toLowerCase();

    // SECURITY: Admin role cannot be self-assigned
    if (requestedRole === "admin") {
      return NextResponse.json(
        { error: "Security Restriction: Admin role cannot be self-assigned. Admin accounts are created by authorized administrators." },
        { status: 403 }
      );
    }

    if (requestedRole !== "user" && requestedRole !== "reseller") {
      return NextResponse.json(
        { error: "Invalid role specified. Allowed roles: 'user' or 'reseller'." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (requestedRole === "reseller") {
      // Check for existing reseller
      const resellers = await dbHelper.resellers.list();
      const existing = resellers.find((r: any) => r.email?.toLowerCase() === cleanEmail);

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists." },
          { status: 409 }
        );
      }

      // Create reseller with status "pending" — requires admin approval
      const newReseller = {
        id: `res-${Date.now()}`,
        business_name: businessName || fullName,
        owner_name: fullName,
        email: cleanEmail,
        phone: cleanPhone,
        gstin: gstin || "",
        description: businessDescription || "",
        address: "",
        city: "",
        state: "",
        business_type: "individual",
        status: "pending",
        role: "reseller",
      };

      await dbHelper.resellers.create(newReseller);

      // Create admin notification for reseller application
      await dbHelper.notifications.create({
        title: "🏪 New Reseller Application",
        message: `${fullName} (${businessName || "Individual"}) applied as a Reseller Partner. Email: ${cleanEmail}`,
        type: "reseller_application",
        meta: { reseller_id: newReseller.id, email: cleanEmail },
      });

      return NextResponse.json({
        success: true,
        message: "Reseller application submitted. Pending admin approval.",
        role: "reseller",
        status: "pending",
      });
    }

    // Default USER role registration
    if (!body.dateOfBirth) {
      return NextResponse.json(
        { error: "Date of Birth is required for customer accounts." },
        { status: 400 }
      );
    }

    const dobDate = new Date(body.dateOfBirth);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      return NextResponse.json(
        { error: "Date of Birth cannot be a future date or invalid." },
        { status: 400 }
      );
    }

    const users = await dbHelper.users.list();
    const existingEmail = users.find((u: any) => u.email?.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const existingPhone = users.find((u: any) => (u.phone || "").replace(/\D/g, "") === cleanPhone);
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 }
      );
    }

    const newUser = {
      id: `cust-${Date.now()}`,
      email: cleanEmail,
      full_name: fullName,
      phone: cleanPhone,
      date_of_birth: body.dateOfBirth,
      password: password.trim(),
      role: "user",
      status: "active",
      created_at: new Date().toISOString(),
    };

    await dbHelper.users.create(newUser);

    try {
      await dbHelper.profiles.update(newUser.id, {
        id: newUser.id,
        email: cleanEmail,
        full_name: fullName,
        phone: cleanPhone,
        date_of_birth: body.dateOfBirth,
        role: "user",
        status: "active",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
      });
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: "Customer account created successfully.",
      role: "user",
      redirectUrl: "/customer",
    });

    response.cookies.set("nexbyte_customer_session", `mock-user:${newUser.id}:${newUser.email}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    response.cookies.set("nexbyte_customer_email", cleanEmail, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set("nexbyte_customer_name", encodeURIComponent(fullName), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error("Auth Signup Error:", err);
    return NextResponse.json(
      { error: err.message || "Registration failed." },
      { status: 500 }
    );
  }
}
