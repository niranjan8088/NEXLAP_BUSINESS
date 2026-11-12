import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET() {
  try {
    const admin = await requireRole(["admin"]);

    const [orders, bookings, invoices] = await Promise.all([
      dbHelper.orders.list(),
      dbHelper.bookings.list(),
      dbHelper.invoices.list(),
    ]);

    // Build lookup set of already billed order and booking IDs (excluding cancelled invoices)
    const activeInvoices = invoices.filter((inv: any) => inv.status !== "cancelled");
    const billedOrderNumbers = new Set(
      activeInvoices
        .map((inv: any) => inv.referenceOrderNumber || inv.reference_order_number)
        .filter(Boolean)
    );
    const billedBookingIds = new Set(
      activeInvoices
        .map((inv: any) => inv.referenceBookingId || inv.reference_booking_id)
        .filter(Boolean)
    );

    // Map unbilled orders
    const pendingOrders = (orders || []).map((ord: any) => {
      const orderNum = ord.order_number || ord.order_id || ord.id;
      const isBilled = billedOrderNumbers.has(orderNum);
      const matchedInvoice = isBilled
        ? activeInvoices.find(
            (inv: any) =>
              inv.referenceOrderNumber === orderNum ||
              inv.reference_order_number === orderNum
          )
        : null;

      return {
        id: ord.id,
        orderNumber: orderNum,
        customerName: ord.customer_name || ord.shipping_address?.name || "Customer",
        mobile: ord.customer_phone || ord.shipping_address?.phone || "",
        email: ord.customer_email || ord.shipping_address?.email || "",
        address: ord.shipping_address?.address || "",
        city: ord.shipping_address?.city || "Bengaluru",
        items: Array.isArray(ord.items)
          ? ord.items.map((i: any) => ({
              id: i.id || i.product_id || `item-${Date.now()}`,
              name: i.title || i.name || "Product Item",
              quantity: i.quantity || 1,
              unitPrice: i.price || 0,
              discount: 0,
            }))
          : [],
        totalAmount: ord.total_amount || ord.total || 0,
        paymentStatus: ord.payment_status || "pending",
        orderStatus: ord.status || "confirmed",
        createdAt: ord.created_at || new Date().toISOString(),
        isBilled,
        invoiceNumber: matchedInvoice ? matchedInvoice.invoiceNumber || matchedInvoice.invoice_number : null,
      };
    });

    // Map unbilled bookings
    const pendingBookings = (bookings || []).map((b: any) => {
      const isBilled = billedBookingIds.has(b.id);
      const matchedInvoice = isBilled
        ? activeInvoices.find(
            (inv: any) =>
              inv.referenceBookingId === b.id ||
              inv.reference_booking_id === b.id
          )
        : null;

      return {
        id: b.id,
        customerName: b.customer_name || b.name || "Customer",
        mobile: b.phone || b.mobile || "",
        email: b.email || "",
        address: b.address || "",
        city: b.city || "Bengaluru",
        serviceName: b.service_name || b.service || "IT Support Service",
        servicePrice: Number(b.price || b.cost || 800),
        bookingDate: b.booking_date || b.date || (b.created_at || "").slice(0, 10),
        status: b.status || "pending",
        isBilled,
        invoiceNumber: matchedInvoice ? matchedInvoice.invoiceNumber || matchedInvoice.invoice_number : null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        orders: pendingOrders,
        bookings: pendingBookings,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

