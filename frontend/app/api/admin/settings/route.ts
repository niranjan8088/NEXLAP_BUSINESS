import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { StoreSettings } from "@/lib/types/settings";

export async function GET() {
  try {
    const adminUser = await requireRole(["admin"]);
    const settings = await dbHelper.storeSettings.get();
    const auditLog = await dbHelper.storeSettings.getAuditLog(30);
    const versions = await dbHelper.storeSettings.getVersions();

    return NextResponse.json({
      success: true,
      settings,
      auditLog,
      versions,
      adminUser: {
        email: adminUser.email,
        name: adminUser.name,
      },
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const adminUser = await requireRole(["admin"]);
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid settings payload." },
        { status: 400 }
      );
    }

    // Server-side validation
    if (body.deliveryWarranty) {
      const { deliveryEstimateMinDays, deliveryEstimateMaxDays, defaultPickupPincode, replacementPolicyDays, defaultWarrantyDays } = body.deliveryWarranty;
      if (deliveryEstimateMinDays !== undefined && (typeof deliveryEstimateMinDays !== "number" || deliveryEstimateMinDays < 0)) {
        return NextResponse.json({ success: false, error: "Minimum delivery estimate must be 0 or greater." }, { status: 400 });
      }
      if (deliveryEstimateMaxDays !== undefined && (typeof deliveryEstimateMaxDays !== "number" || deliveryEstimateMaxDays < deliveryEstimateMinDays)) {
        return NextResponse.json({ success: false, error: "Maximum delivery estimate must be greater than or equal to minimum days." }, { status: 400 });
      }
      if (defaultPickupPincode && !/^\d{6}$/.test(String(defaultPickupPincode).trim())) {
        return NextResponse.json({ success: false, error: "Default pickup pincode must be a valid 6-digit Indian pincode." }, { status: 400 });
      }
      if (replacementPolicyDays !== undefined && (typeof replacementPolicyDays !== "number" || replacementPolicyDays < 0)) {
        return NextResponse.json({ success: false, error: "Replacement policy days must be 0 or greater." }, { status: 400 });
      }
      if (defaultWarrantyDays !== undefined && (typeof defaultWarrantyDays !== "number" || defaultWarrantyDays < 0)) {
        return NextResponse.json({ success: false, error: "Default warranty days must be 0 or greater." }, { status: 400 });
      }
    }

    if (body.appearance) {
      const { primaryColor, accentColor, customerThemePolicy, forcedTheme } = body.appearance;
      if (primaryColor && !/^#([0-9A-F]{3}){1,2}$/i.test(primaryColor)) {
        return NextResponse.json({ success: false, error: "Primary color must be a valid hex color code." }, { status: 400 });
      }
      if (accentColor && !/^#([0-9A-F]{3}){1,2}$/i.test(accentColor)) {
        return NextResponse.json({ success: false, error: "Accent color must be a valid hex color code." }, { status: 400 });
      }
      if (customerThemePolicy && !["personal", "forced"].includes(customerThemePolicy)) {
        return NextResponse.json({ success: false, error: "Customer theme policy must be 'personal' or 'forced'." }, { status: 400 });
      }
      if (forcedTheme && !["day", "night"].includes(forcedTheme)) {
        return NextResponse.json({ success: false, error: "Forced theme must be 'day' or 'night'." }, { status: 400 });
      }
    }

    if (body.backgroundEffects) {
      const { opacity, blur, solidColor, gradientStart, gradientEnd } = body.backgroundEffects;
      if (opacity !== undefined && (typeof opacity !== "number" || opacity < 0 || opacity > 1)) {
        return NextResponse.json({ success: false, error: "Background opacity must be a decimal between 0 and 1." }, { status: 400 });
      }
      if (blur !== undefined && (typeof blur !== "number" || blur < 0 || blur > 100)) {
        return NextResponse.json({ success: false, error: "Background blur must be between 0 and 100 pixels." }, { status: 400 });
      }
      if (solidColor && !/^#([0-9A-F]{3}){1,2}$/i.test(solidColor)) {
        return NextResponse.json({ success: false, error: "Solid background color must be a valid hex color code." }, { status: 400 });
      }
      if (gradientStart && !/^#([0-9A-F]{3}){1,2}$/i.test(gradientStart)) {
        return NextResponse.json({ success: false, error: "Gradient start must be a valid hex color code." }, { status: 400 });
      }
      if (gradientEnd && !/^#([0-9A-F]{3}){1,2}$/i.test(gradientEnd)) {
        return NextResponse.json({ success: false, error: "Gradient end must be a valid hex color code." }, { status: 400 });
      }
    }

    if (body.animations) {
      const { preset } = body.animations;
      if (preset && !["subtle", "standard", "enhanced", "none"].includes(preset)) {
        return NextResponse.json({ success: false, error: "Animation preset must be subtle, standard, enhanced, or none." }, { status: 400 });
      }
    }

    if (body.generalStore) {
      const { supportEmail, supportPhone, gstin } = body.generalStore;
      if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
        return NextResponse.json({ success: false, error: "Invalid support email address format." }, { status: 400 });
      }
      if (gstin && gstin.trim().length > 0 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim())) {
        return NextResponse.json({ success: false, error: "Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)." }, { status: 400 });
      }
    }

    // Set publishWorkflow status to draft on PUT edits
    const payloadWithDraftStatus = {
      ...body,
      publishWorkflow: {
        ...(body.publishWorkflow || {}),
        status: "draft",
        draftVersion: (body.version || 1) + 1,
      },
    };

    const updatedSettings = await dbHelper.storeSettings.update(payloadWithDraftStatus, {
      email: adminUser.email,
      name: adminUser.name,
    });

    return NextResponse.json({
      success: true,
      message: "Draft settings saved successfully. Preview or publish when ready.",
      settings: updatedSettings,
    });
  } catch (error: any) {
    const { status, message } = authErrorResponse(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
