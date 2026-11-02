import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { CustomerPreferences } from "@/lib/types/settings";

async function resolveCustomer() {
  const session = await getServerSession();
  if (session && session.role === "user") {
    return session;
  }
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("nexbyte_customer_session")?.value;
  if (rawSession) {
    const parts = rawSession.split(":");
    const id = parts[1] || parts[0] || "cust-1";
    const email = cookieStore.get("nexbyte_customer_email")?.value || (parts[2] || "customer@nexbyte.com");
    return { id, email, role: "user" as const, name: "Customer" };
  }
  return null;
}

export async function GET() {
  try {
    const customer = await resolveCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Customer authentication required." }, { status: 401 });
    }

    const [preferences, storeSettings] = await Promise.all([
      dbHelper.customerPreferences.get(customer.id),
      dbHelper.storeSettings.get(),
    ]);

    const isThemeLocked = storeSettings.appearance.customerThemePolicy === "forced";

    return NextResponse.json({
      success: true,
      preferences,
      policy: {
        isThemeLocked,
        forcedTheme: storeSettings.appearance.forcedTheme,
        customerThemePolicy: storeSettings.appearance.customerThemePolicy,
        defaultDensity: storeSettings.customerPreferencesDefaults.defaultDensity,
        defaultFontScale: storeSettings.customerPreferencesDefaults.defaultFontScale,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load preferences." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const customer = await resolveCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Customer authentication required." }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid preferences payload." }, { status: 400 });
    }

    // Strict validation: only allowed customer preference fields can be changed
    const allowedUpdates: Partial<CustomerPreferences> = {};

    if (body.theme !== undefined) {
      if (!["day", "night", "system"].includes(body.theme)) {
        return NextResponse.json({ error: "Invalid theme selection." }, { status: 400 });
      }
      // Check if global policy prevents personal override
      const storeSettings = await dbHelper.storeSettings.get();
      if (storeSettings.appearance.customerThemePolicy !== "forced") {
        allowedUpdates.theme = body.theme;
      }
    }

    if (body.interfaceDensity !== undefined) {
      if (!["compact", "comfortable", "spacious"].includes(body.interfaceDensity)) {
        return NextResponse.json({ error: "Invalid density option." }, { status: 400 });
      }
      allowedUpdates.interfaceDensity = body.interfaceDensity;
    }

    if (body.fontScale !== undefined) {
      if (!["sm", "base", "lg"].includes(body.fontScale)) {
        return NextResponse.json({ error: "Invalid font scale." }, { status: 400 });
      }
      allowedUpdates.fontScale = body.fontScale;
    }

    if (typeof body.emailOrderUpdates === "boolean") {
      allowedUpdates.emailOrderUpdates = body.emailOrderUpdates;
    }
    if (typeof body.smsTechnicianAlerts === "boolean") {
      allowedUpdates.smsTechnicianAlerts = body.smsTechnicianAlerts;
    }
    if (typeof body.marketingEmails === "boolean") {
      allowedUpdates.marketingEmails = body.marketingEmails;
    }
    if (typeof body.marketingSms === "boolean") {
      allowedUpdates.marketingSms = body.marketingSms;
    }
    if (typeof body.preferredPickupPincode === "string") {
      const pin = body.preferredPickupPincode.trim();
      if (pin === "" || /^\d{6}$/.test(pin)) {
        allowedUpdates.preferredPickupPincode = pin;
      }
    }

    // Scoped strictly to authenticated customer ID
    const updated = await dbHelper.customerPreferences.update(customer.id, allowedUpdates);

    return NextResponse.json({
      success: true,
      message: "Customer preferences successfully updated.",
      preferences: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update preferences." },
      { status: 500 }
    );
  }
}

