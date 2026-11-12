import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/server/auth";

async function resolveAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionUser = await getServerSession();
  if (sessionUser && sessionUser.role === "user") {
    return { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name };
  }

  const userSession = cookieStore.get("nexbyte_customer_session")?.value;
  if (!userSession) return null;

  const emailCookie = cookieStore.get("nexbyte_customer_email")?.value;
  const nameCookie = cookieStore.get("nexbyte_customer_name")?.value;
  let decodedName = nameCookie ? decodeURIComponent(nameCookie) : "";
  if (decodedName === "Demo Customer") decodedName = "";

  let id = "cust-1";
  let email = emailCookie || "customer@nexbyte.com";

  if (userSession.startsWith("mock-user:")) {
    const parts = userSession.replace("mock-user:", "").split(":");
    id = parts[0] || "cust-1";
    email = parts[1] || emailCookie || "customer@nexbyte.com";
  } else {
    const parts = userSession.split(":");
    if (parts.length >= 3) {
      id = parts[1];
      email = parts[2];
    } else if (parts.length === 2 && parts[0] === "mock-user") {
      id = parts[1];
      email = emailCookie || parts[1];
    } else {
      id = userSession;
      email = emailCookie || (userSession.includes("@") ? userSession : `${userSession}@customer.nexbyte.com`);
    }
  }

  // Check registered user in db for authoritative name
  try {
    const users = await dbHelper.users.list();
    const matchedUser = users.find(
      (u: any) => u.id === id || (email && u.email?.toLowerCase() === email.toLowerCase())
    );
    if (matchedUser && matchedUser.full_name && matchedUser.full_name !== "Demo Customer") {
      decodedName = matchedUser.full_name;
    }
  } catch { }

  if (!decodedName && email) {
    const prefix = email.split("@")[0];
    decodedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  return {
    id,
    email,
    name: decodedName || "Customer",
  };
}

export async function GET() {
  try {
    const authUser = await resolveAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Lookup profile by authenticated ID, fallback to email
    let profile = await dbHelper.profiles.getById(authUser.id);
    if (!profile && authUser.email) {
      profile = await dbHelper.profiles.getById(authUser.email);
    }

    // Lookup user record to get registered name, phone, dob if available
    let registeredUser: any = null;
    try {
      const users = await dbHelper.users.list();
      registeredUser = users.find(
        (u: any) => u.id === authUser.id || (authUser.email && u.email?.toLowerCase() === authUser.email.toLowerCase())
      );
    } catch { }

    const isCleanName = (n?: string | null) => {
      if (!n || typeof n !== "string") return false;
      const l = n.trim().toLowerCase();
      return l.length > 0 && !l.includes("demo") && l !== "customer";
    };

    const emailPrefix = authUser.email ? authUser.email.split("@")[0] : "";
    const emailDerivedName = emailPrefix
      ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
      : "Customer";

    const resolvedName =
      (isCleanName(registeredUser?.full_name) ? registeredUser.full_name : null) ||
      (isCleanName(profile?.full_name) ? profile.full_name : null) ||
      (isCleanName(authUser.name) ? authUser.name : null) ||
      emailDerivedName;

    if (!profile) {
      // First-time visit: initialize with user's real registered details
      const initialProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: resolvedName,
        phone: registeredUser?.phone || "",
        date_of_birth: registeredUser?.date_of_birth || "",
        avatar_url: "",
        gender: registeredUser?.gender || "Not Specified",
        address: registeredUser?.address || "",
        city: registeredUser?.city || "",
        state: registeredUser?.state || "",
        pincode: registeredUser?.pincode || "",
        country: registeredUser?.country || "India",
        role: "user",
        status: "active",
      };
      profile = await dbHelper.profiles.update(authUser.id, initialProfile);
    } else if (!isCleanName(profile.full_name)) {
      // Clean up legacy placeholder
      profile = await dbHelper.profiles.update(authUser.id, {
        full_name: resolvedName,
      });
      try {
        await dbHelper.users.update(authUser.id, { full_name: resolvedName });
      } catch { }
    }

    // Strip sensitive internal fields
    const { password, reset_token, reset_token_expiry, ...safeProfile } = profile;

    const res = NextResponse.json({ profile: safeProfile });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  } catch (err: any) {
    console.error("GET Customer Profile Error:", err);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await resolveAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      phone,
      dateOfBirth,
      dob,
      date_of_birth,
      gender,
      address,
      city,
      state,
      pincode,
      country,
      avatar_url,
    } = body;

    const updates: Record<string, any> = {};

    // 1. Full Name Validation & Sanitization
    if (fullName !== undefined) {
      const cleanName = String(fullName).replace(/[<>]/g, "").trim();
      if (!cleanName) {
        return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 });
      }
      if (cleanName.length > 100) {
        return NextResponse.json({ error: "Full name must not exceed 100 characters." }, { status: 400 });
      }
      updates.full_name = cleanName;
    }

    // 2. Phone Validation & Sanitization
    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length > 0) {
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
          return NextResponse.json({ error: "Phone number must be at least 10 digits." }, { status: 400 });
        }
        updates.phone = cleanPhone;
      }
    }

    // 3. Date of Birth Validation
    const birthDateInput = dateOfBirth || dob || date_of_birth;
    if (birthDateInput !== undefined) {
      const cleanDob = String(birthDateInput).trim();
      if (cleanDob) {
        const parsedDate = new Date(cleanDob);
        if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
          return NextResponse.json({ error: "Date of Birth cannot be in the future or invalid." }, { status: 400 });
        }
        updates.date_of_birth = cleanDob;
      }
    }

    // 4. Gender Validation
    if (gender !== undefined) {
      const allowedGenders = ["Male", "Female", "Other", "Not Specified", "Prefer not to say"];
      const cleanGender = String(gender).trim();
      updates.gender = allowedGenders.includes(cleanGender) ? cleanGender : "Not Specified";
    }

    // 5. Address, City, State, Country
    if (address !== undefined) {
      updates.address = String(address).replace(/[<>]/g, "").trim().slice(0, 255);
    }
    if (city !== undefined) {
      updates.city = String(city).replace(/[<>]/g, "").trim().slice(0, 100);
    }
    if (state !== undefined) {
      updates.state = String(state).replace(/[<>]/g, "").trim().slice(0, 100);
    }
    if (country !== undefined) {
      updates.country = String(country).replace(/[<>]/g, "").trim().slice(0, 100) || "India";
    }

    // 6. Pincode Validation (6-digit Indian PIN)
    if (pincode !== undefined) {
      const cleanPin = String(pincode).trim();
      if (cleanPin.length > 0) {
        if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
          return NextResponse.json({ error: "Pincode must be a valid 6-digit Indian postal code." }, { status: 400 });
        }
        updates.pincode = cleanPin;
      }
    }

    // 7. Avatar URL
    if (avatar_url !== undefined) {
      updates.avatar_url = String(avatar_url).trim();
    }

    // Strict Authorization: Update authenticated customer's record ONLY
    const updatesWithAuthEmail = { ...updates, email: authUser.email };
    const updated = await dbHelper.profiles.update(authUser.id, updatesWithAuthEmail);

    // Keep dbHelper.users in sync as well
    try {
      await dbHelper.users.update(authUser.id, updatesWithAuthEmail);
    } catch { }

    // Strip sensitive fields
    const { password, reset_token, reset_token_expiry, ...safeProfile } = updated;

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: safeProfile,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    if (updates.full_name) {
      response.cookies.set("nexbyte_customer_name", encodeURIComponent(updates.full_name), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err: any) {
    console.error("PUT Customer Profile Error:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
