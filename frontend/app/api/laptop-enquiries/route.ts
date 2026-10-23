import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";
import { getServerSession } from "@/lib/auth";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    },
  });
}

export async function POST(req: Request) {
  try {
    const authUser = await getServerSession();
    if (!authUser || (authUser.role !== "user" && authUser.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Sign in with a customer account to submit an enquiry.", code: "AUTH_REQUIRED" },
        { status: 401, headers: JSON_HEADERS }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload.", error: "Invalid JSON", code: "BAD_REQUEST" },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const name = (body.customer_name || body.customerName || body.name || "").trim();
    const phone = (body.phone || "").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Customer name and phone number are required.", error: "Missing required fields.", code: "VALIDATION_ERROR" },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const category = body.category || "laptop_purchase";
    const productName = (body.product_name || body.productName || body.laptop_type || body.laptopRequirement || "General Tech Enquiry").trim();
    const userMessage = (body.message || body.requirements || body.additionalRequirements || "").trim();

    const saved = await dbHelper.laptopEnquiries.create({
      customer_name: name,
      phone,
      email: body.email || "",
      city: body.city || "",
      category,
      product_name: productName,
      laptop_type: productName,
      budget: body.budget || "Unspecified",
      brand_preference: body.brand_preference || body.preferredBrand || "Any Brand",
      processor_preference: body.processor_preference || body.processor || "No Preference",
      ram_preference: body.ram_preference || body.ram || "No Preference",
      storage_preference: body.storage_preference || body.storage || "No Preference",
      gpu_preference: body.gpu_preference || body.gpu || "No Preference",
      quantity: body.quantity || "1 Unit",
      condition: body.condition || "Any",
      use_case: body.use_case || body.use || "General",
      specs: body.specs || null,
      requirements: userMessage,
      message: userMessage,
      preferred_contact: body.preferred_contact || body.preferredContact || "WhatsApp",
      user_id: authUser.id,
      customer_id: authUser.id,
      status: "new",
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: "customer",
          sender_name: name,
          text: userMessage || `Enquiry for ${productName} (${category}) with budget ${body.budget || "flexible"}.`,
          timestamp: new Date().toISOString(),
          is_internal: false,
        }
      ]
    });

    // Real-time Admin Notification
    await dispatchPipelineEvent({
      eventType: "LAPTOP_ENQUIRY_CREATED",
      title: "💻 New Customer Enquiry",
      message: `${name} submitted an enquiry for ${productName} (${category}). Budget: ${saved.budget || "Unspecified"}. Ref: ${saved.reference_id || saved.id}`,
      recipientRole: "admin",
      referenceType: "laptop_enquiry",
      referenceId: saved.reference_id || saved.id,
      metadata: { enquiryId: saved.id, referenceId: saved.reference_id, category, customerName: name, phone }
    });

    return NextResponse.json(
      {
        success: true,
        referenceId: saved.reference_id,
        enquiry: saved,
        message: "Enquiry submitted successfully! Our tech experts will contact you shortly.",
      },
      { status: 201, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error("Enquiry POST API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit enquiry.", error: error.message, code: "SERVER_ERROR" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await getServerSession();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Sign in to view enquiries.", code: "AUTH_REQUIRED" },
        { status: 401, headers: JSON_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const allEnquiries = await dbHelper.laptopEnquiries.list();

    if (authUser.role === "admin") {
      let filtered = allEnquiries;
      if (category && category !== "all") {
        filtered = filtered.filter((e: any) => e.category === category);
      }
      if (status && status !== "all") {
        filtered = filtered.filter((e: any) => e.status === status);
      }
      if (id) {
        const match = filtered.find((e: any) => e.id === id || e.reference_id?.toLowerCase() === id.toLowerCase());
        if (!match) return NextResponse.json({ success: false, message: "Enquiry not found." }, { status: 404, headers: JSON_HEADERS });
        return NextResponse.json({ success: true, enquiry: match }, { status: 200, headers: JSON_HEADERS });
      }
      return NextResponse.json({ success: true, enquiries: filtered }, { status: 200, headers: JSON_HEADERS });
    }

    // Customer View: Privacy filter (customers only see their own records, and internal notes are omitted)
    const customerEnquiries = allEnquiries.filter((enquiry: any) =>
      enquiry.user_id === authUser.id ||
      enquiry.customer_id === authUser.id ||
      enquiry.email?.toLowerCase() === authUser.email?.toLowerCase()
    );

    const sanitizeForCustomer = (enquiry: any) => {
      const { admin_notes, ...safeRecord } = enquiry;
      const rawMessages = Array.isArray(safeRecord.messages) ? safeRecord.messages : [];
      // Strictly remove any internal notes from customer visible messages
      safeRecord.messages = rawMessages.filter((m: any) => !m.is_internal);
      return safeRecord;
    };

    if (id) {
      const match = customerEnquiries.find((e: any) => e.id === id || e.reference_id?.toLowerCase() === id.toLowerCase());
      if (!match) {
        return NextResponse.json(
          { success: false, message: "Enquiry not found or access denied." },
          { status: 404, headers: JSON_HEADERS }
        );
      }
      return NextResponse.json({ success: true, enquiry: sanitizeForCustomer(match) }, { status: 200, headers: JSON_HEADERS });
    }

    return NextResponse.json(
      { success: true, enquiries: customerEnquiries.map(sanitizeForCustomer) },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch enquiries.", error: error.message, code: "SERVER_ERROR" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getServerSession();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401, headers: JSON_HEADERS });
    }

    const body = await req.json();
    const { id, message, is_internal, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Enquiry ID is required for update." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const existingList = await dbHelper.laptopEnquiries.list();
    const existing = existingList.find((e: any) => e.id === id || e.reference_id === id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Enquiry not found." }, { status: 404, headers: JSON_HEADERS });
    }

    // Customer security check
    if (authUser.role !== "admin") {
      if (existing.user_id !== authUser.id && existing.customer_id !== authUser.id && existing.email?.toLowerCase() !== authUser.email?.toLowerCase()) {
        return NextResponse.json({ success: false, message: "Access denied." }, { status: 403, headers: JSON_HEADERS });
      }
    }

    let updated: any;

    // Handle adding a new conversation message or reply
    if (message && String(message).trim()) {
      const sender = authUser.role === "admin" ? "admin" : "customer";
      const isInternalNote = authUser.role === "admin" && Boolean(is_internal);

      updated = await dbHelper.laptopEnquiries.addMessage(existing.id, {
        sender,
        sender_name: authUser.role === "admin" ? "NexLapTech Tech Expert" : (existing.customer_name || "Customer"),
        text: String(message).trim(),
        is_internal: isInternalNote,
      });

      // Status adjustment
      if (updates.status) {
        updated = await dbHelper.laptopEnquiries.update(existing.id, { status: updates.status });
      }

      // Notify recipient
      if (sender === "admin" && !isInternalNote) {
        if (existing.user_id || existing.customer_id) {
          await dispatchPipelineEvent({
            eventType: "LAPTOP_ENQUIRY_UPDATED",
            title: "💬 New Reply on Your Enquiry",
            message: `NexLapTech replied to your enquiry (${existing.reference_id || existing.id}): "${String(message).trim().slice(0, 100)}..."`,
            recipientUserId: existing.user_id || existing.customer_id,
            referenceType: "laptop_enquiry",
            referenceId: existing.reference_id || existing.id,
            metadata: { enquiryId: existing.id }
          });
        }
      } else if (sender === "customer") {
        await dispatchPipelineEvent({
          eventType: "LAPTOP_ENQUIRY_UPDATED",
          title: "💬 Customer Replied to Enquiry",
          message: `${existing.customer_name} replied to enquiry ${existing.reference_id || existing.id}`,
          recipientRole: "admin",
          referenceType: "laptop_enquiry",
          referenceId: existing.reference_id || existing.id,
          metadata: { enquiryId: existing.id }
        });
      }
    } else {
      // General field update (e.g. status, admin_notes, recommended_products)
      if (authUser.role !== "admin") {
        return NextResponse.json({ success: false, message: "Only administrators can update enquiry details." }, { status: 403, headers: JSON_HEADERS });
      }
      updated = await dbHelper.laptopEnquiries.update(existing.id, updates);

      if (updates.status && updates.status !== existing.status) {
        if (existing.user_id || existing.customer_id) {
          await dispatchPipelineEvent({
            eventType: "LAPTOP_ENQUIRY_UPDATED",
            title: "💻 Enquiry Status Updated",
            message: `Your enquiry (${existing.reference_id || existing.id}) status is now: ${updates.status}.`,
            recipientUserId: existing.user_id || existing.customer_id,
            referenceType: "laptop_enquiry",
            referenceId: existing.reference_id || existing.id,
            metadata: { enquiryId: existing.id, status: updates.status }
          });
        }
      }
    }

    return NextResponse.json(
      { success: true, enquiry: updated, message: "Enquiry updated successfully." },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update enquiry.", error: error.message, code: "SERVER_ERROR" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getServerSession();
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin authorization required." }, { status: 403, headers: JSON_HEADERS });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Enquiry ID is required for deletion." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    await dbHelper.laptopEnquiries.delete(id);

    return NextResponse.json(
      { success: true, message: "Enquiry deleted successfully." },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete enquiry.", error: error.message, code: "SERVER_ERROR" },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
