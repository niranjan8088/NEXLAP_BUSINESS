import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const allEnquiries = await dbHelper.laptopEnquiries.list();
    const enquiry = allEnquiries.find((e: any) => e.id === id || e.reference_id === id);

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    // Duplicate Prevention: Check if already converted
    if (enquiry.status === "converted" && enquiry.converted_order_id) {
      return NextResponse.json(
        {
          error: `This enquiry was already converted into Order #${enquiry.converted_order_id}. Duplicate conversions are prevented.`,
          orderId: enquiry.converted_order_id,
        },
        { status: 409 }
      );
    }

    // Determine items for the order (from quotation, or recommended products, or the enquiry subject)
    const quote = enquiry.quotation || {};
    const items = Array.isArray(quote.items) && quote.items.length > 0
      ? quote.items
      : Array.isArray(enquiry.recommended_products) && enquiry.recommended_products.length > 0
      ? enquiry.recommended_products.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          unitPrice: p.price,
          quantity: 1,
          total: p.price,
          image: p.image,
        }))
      : [
          {
            id: `item-${Date.now()}`,
            title: enquiry.product_name || enquiry.laptop_type || "Custom Laptop Procurement",
            price: quote.finalAmount || quote.subtotal || 35000,
            unitPrice: quote.finalAmount || quote.subtotal || 35000,
            quantity: 1,
            total: quote.finalAmount || quote.subtotal || 35000,
          },
        ];

    const subtotal = items.reduce((sum: number, it: any) => sum + Number(it.total || it.price || 0), 0);
    const discount = Number(quote.discount || 0);
    const gst = Number(quote.gst || Math.round((subtotal - discount) * 0.18));
    const shipping = Number(quote.shipping || 0);
    const finalTotal = subtotal - discount + gst + shipping;

    const orderPayload = {
      customer_name: enquiry.customer_name,
      customer_email: enquiry.email || "",
      email: enquiry.email || "",
      customer_phone: enquiry.phone,
      phone: enquiry.phone,
      user_id: enquiry.user_id || enquiry.customer_id || null,
      items,
      subtotal,
      discount,
      tax: gst,
      gst_amount: gst,
      shipping_fee: shipping,
      total: finalTotal,
      final_amount: finalTotal,
      payment_method: body.payment_method || "Invoice / Bank Transfer",
      payment_status: body.payment_status || "Pending",
      status: "Confirmed",
      shipping_address: {
        customerName: enquiry.customer_name,
        phone: enquiry.phone,
        city: enquiry.city || "Bengaluru",
        addressLine1: enquiry.address || "Padmanabhanagar, Bengaluru",
      },
      notes: `Converted from Lead Reference #${enquiry.reference_id || enquiry.id}. ${body.notes || ""}`.trim(),
    };

    // 1. Create order
    const createdOrder = await dbHelper.orders.create(orderPayload);
    const orderId = createdOrder.order_id || createdOrder.id;

    // 2. Update enquiry record
    const updatedEnquiry = await dbHelper.laptopEnquiries.update(enquiry.id, {
      status: "converted",
      converted_order_id: orderId,
      converted_at: new Date().toISOString(),
      admin_notes: `${enquiry.admin_notes || ""}\n[${new Date().toLocaleDateString("en-IN")}] Converted into Order #${orderId} by Staff.`.trim(),
    });

    // 3. Add system audit message
    await dbHelper.laptopEnquiries.addMessage(enquiry.id, {
      sender: "admin",
      sender_name: "NEXLAPTECH System",
      text: `🎉 Enquiry successfully converted into official Order #${orderId}. Total payable: ₹${finalTotal.toLocaleString("en-IN")}.`,
      is_internal: true,
    });

    // 4. Update customer directory
    await dbHelper.customers.autoCreateOrUpdate(enquiry.phone, {
      name: enquiry.customer_name,
      email: enquiry.email,
      city: enquiry.city,
      actionType: "order",
      actionItem: enquiry.product_name || enquiry.laptop_type || "Hardware Order",
    });

    // 5. Realtime Notification
    await dispatchPipelineEvent({
      eventType: "ORDER_CREATED",
      title: "🎉 New Converted Order",
      message: `Enquiry ${enquiry.reference_id || enquiry.id} converted into Order #${orderId} for ${enquiry.customer_name} (₹${finalTotal.toLocaleString("en-IN")}).`,
      recipientRole: "admin",
      referenceType: "order",
      referenceId: orderId,
      metadata: { enquiryId: enquiry.id, orderId },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Enquiry converted into Order #${orderId} successfully.`,
        order: createdOrder,
        enquiry: updatedEnquiry,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Convert Enquiry to Order Error:", err);
    return NextResponse.json({ error: "Failed to convert enquiry to order." }, { status: 500 });
  }
}

