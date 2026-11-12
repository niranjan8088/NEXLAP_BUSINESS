import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";
import {
  calculateInvoiceTotals,
  sanitizeInvoiceItems,
  validateMobile,
  validateEmail,
  validatePincode,
  validateGSTIN,
  toPaise,
  toRupees,
} from "@/lib/billingUtils";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET(request: Request) {
  try {
    const admin = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || "").toLowerCase().trim();
    const status = searchParams.get("status") || "all";
    const gstFilter = searchParams.get("gst") || "all";
    const sourceFilter = searchParams.get("source") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const allInvoices = await dbHelper.invoices.list();

    // 1. Filter dataset
    const filtered = allInvoices.filter((inv: any) => {
      // Search matching: Invoice #, Customer Name, Phone, Email
      const numStr = (inv.invoiceNumber || inv.invoice_number || "").toLowerCase();
      const nameStr = (inv.customerName || inv.customer_name || "").toLowerCase();
      const mobileStr = (inv.mobile || "").toLowerCase();
      const emailStr = (inv.email || "").toLowerCase();

      const matchesSearch =
        !query ||
        numStr.includes(query) ||
        nameStr.includes(query) ||
        mobileStr.includes(query) ||
        emailStr.includes(query);

      if (!matchesSearch) return false;

      // Status Filter
      const payStatus = inv.paymentStatus || inv.payment_status || "pending";
      if (status !== "all" && payStatus !== status) return false;

      // GST Filter
      const isGst = !!(inv.gstEnabled ?? inv.gst_enabled);
      if (gstFilter === "enabled" && !isGst) return false;
      if (gstFilter === "disabled" && isGst) return false;

      // Source Filter (manual, order, booking)
      const invSource = inv.source || (inv.referenceOrderNumber ? "order" : inv.referenceBookingId ? "booking" : "manual");
      if (sourceFilter !== "all" && invSource !== sourceFilter) return false;

      // Date Range Filter (inclusive)
      const invDateStr = inv.invoiceDate || inv.invoice_date || (inv.createdAt || inv.created_at || "").slice(0, 10);
      if (startDate && invDateStr && invDateStr < startDate) return false;
      if (endDate && invDateStr && invDateStr > endDate) return false;

      return true;
    });

    // 2. Aggregate statistics across entire filtered dataset (integer paise accuracy)
    let totalRevenuePaise = 0;
    let totalPaidPaise = 0;
    let totalDuePaise = 0;
    let totalGstPaise = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;

    for (const inv of filtered) {
      const pStatus = inv.paymentStatus || inv.payment_status || "pending";
      const isCancelled = pStatus === "cancelled";

      if (pStatus === "paid") paidCount++;
      else if (pStatus === "refunded") refundedCount++;
      else if (!isCancelled) pendingCount++;

      if (!isCancelled) {
        const grandTotal = Number(inv.grandTotal ?? inv.grand_total) || 0;
        const amountPaid = Number(inv.amountPaid ?? inv.amount_paid) || 0;
        const balanceDue = Number(inv.balanceDue ?? inv.balance_due) || 0;
        const gstTotal = Number(inv.gstTotal ?? inv.gst_total) || 0;

        totalRevenuePaise += toPaise(grandTotal);
        totalPaidPaise += toPaise(amountPaid);
        totalDuePaise += toPaise(balanceDue);
        totalGstPaise += toPaise(gstTotal);
      }
    }

    // 3. Sorting
    const sorted = [...filtered].sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === "amount") {
        const amtA = Number(a.grandTotal ?? a.grand_total) || 0;
        const amtB = Number(b.grandTotal ?? b.grand_total) || 0;
        comparison = amtA - amtB;
      } else if (sortBy === "customer") {
        const nameA = (a.customerName || a.customer_name || "").toLowerCase();
        const nameB = (b.customerName || b.customer_name || "").toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "number") {
        const numA = (a.invoiceNumber || a.invoice_number || "").toLowerCase();
        const numB = (b.invoiceNumber || b.invoice_number || "").toLowerCase();
        comparison = numA.localeCompare(numB);
      } else {
        // Default: date descending
        const dateA = new Date(a.createdAt || a.created_at || a.invoiceDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || b.invoiceDate || 0).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // 4. Server-Side Pagination
    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const offset = (page - 1) * limit;
    const paginatedInvoices = sorted.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        invoices: paginatedInvoices,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalCount,
          paidCount,
          pendingCount,
          refundedCount,
          totalRevenue: toRupees(totalRevenuePaise),
          totalPaid: toRupees(totalPaidPaise),
          totalDue: toRupees(totalDuePaise),
          totalGst: toRupees(totalGstPaise),
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["admin"]);

    const body = await request.json();
    const {
      customerId,
      customerName,
      mobile,
      email,
      address,
      city,
      state,
      pincode,
      items,
      globalDiscount,
      gstEnabled,
      gstin,
      paymentMethod,
      paymentStatus,
      amountPaid,
      paymentReference,
      paymentBank,
      bankTransferType,
      cardType,
      source,
      referenceOrderNumber,
      referenceBookingId,
    } = body;

    if (!customerName || !String(customerName).trim()) {
      return NextResponse.json(
        { error: "Customer Name is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const cleanMobile = String(mobile || "").trim();
    if (!cleanMobile || !validateMobile(cleanMobile)) {
      return NextResponse.json(
        { error: "Mobile number must be exactly 10 Indian digits starting with 6-9." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address format." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (pincode && !validatePincode(pincode)) {
      return NextResponse.json(
        { error: "Invalid Indian 6-digit Pincode format." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    if (gstEnabled && gstin && !validateGSTIN(gstin)) {
      return NextResponse.json(
        { error: "Invalid 15-character Indian GSTIN format." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // ── DUPLICATE INVOICE PREVENTION ──────────────────────────────────────────
    // If billing an order or booking, prevent duplicate invoices for the same reference
    if (referenceOrderNumber || referenceBookingId) {
      const existingInvoices = await dbHelper.invoices.list();
      const duplicate = existingInvoices.find((inv: any) => {
        if (inv.status === "cancelled") return false;
        if (referenceOrderNumber && (inv.referenceOrderNumber === referenceOrderNumber || inv.reference_order_number === referenceOrderNumber)) {
          return true;
        }
        if (referenceBookingId && (inv.referenceBookingId === referenceBookingId || inv.reference_booking_id === referenceBookingId)) {
          return true;
        }
        return false;
      });

      if (duplicate) {
        const dupNum = duplicate.invoiceNumber || duplicate.invoice_number;
        return NextResponse.json(
          {
            error: `An active invoice (${dupNum}) already exists for this ${referenceOrderNumber ? "order" : "booking"}.`,
            existingInvoice: duplicate,
          },
          { status: 409, headers: NO_CACHE_HEADERS }
        );
      }
    }

    const validPaymentMethods = ["cash", "upi", "bank_transfer", "card", "other"];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    for (const [label, value] of [
      ["Payment reference", paymentReference],
      ["Bank name", paymentBank],
    ] as const) {
      if (value != null && (typeof value !== "string" || value.length > 120)) {
        return NextResponse.json(
          { error: `${label} must be 120 characters or fewer.` },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
    }

    if (bankTransferType && !["neft", "rtgs"].includes(bankTransferType)) {
      return NextResponse.json({ error: "Invalid bank transfer type." }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (cardType && !["debit", "credit"].includes(cardType)) {
      return NextResponse.json({ error: "Invalid card type." }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const sanitizedItems = sanitizeInvoiceItems(items);
    if (sanitizedItems.length === 0) {
      return NextResponse.json(
        { error: "At least one valid product/service item with a name is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Decimal-safe calculations using integer paise
    const calculated = calculateInvoiceTotals({
      items,
      globalDiscount: Number(globalDiscount) || 0,
      gstEnabled: !!gstEnabled,
      gstin: (gstin || "").trim(),
      paymentStatus: paymentStatus || "pending",
      amountPaid: Number(amountPaid) || 0,
    });

    const invoiceRecord = await dbHelper.invoices.create({
      customerId: customerId || null,
      customerName: String(customerName).trim(),
      mobile: cleanMobile,
      email: email ? String(email).trim() : "",
      address: address ? String(address).trim() : "",
      city: city ? String(city).trim() : "",
      state: state ? String(state).trim() : "",
      pincode: pincode ? String(pincode).trim() : "",
      items: calculated.items,
      subtotalPaise: calculated.subtotalPaise,
      subtotal: calculated.subtotal,
      globalDiscountPaise: calculated.globalDiscountPaise,
      globalDiscount: calculated.globalDiscount,
      taxableAmountPaise: calculated.taxableAmountPaise,
      taxableAmount: calculated.taxableAmount,
      gstEnabled: calculated.gstEnabled,
      gstin: calculated.gstin,
      cgstPaise: calculated.cgstPaise,
      cgst: calculated.cgst,
      sgstPaise: calculated.sgstPaise,
      sgst: calculated.sgst,
      gstTotalPaise: calculated.gstTotalPaise,
      gstTotal: calculated.gstTotal,
      grandTotalPaise: calculated.grandTotalPaise,
      grandTotal: calculated.grandTotal,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: calculated.paymentStatus,
      paymentReference: ["upi", "bank_transfer", "card"].includes(paymentMethod)
        ? String(paymentReference || "").trim()
        : "",
      paymentBank: ["bank_transfer", "card"].includes(paymentMethod)
        ? String(paymentBank || "").trim()
        : "",
      bankTransferType: paymentMethod === "bank_transfer" ? bankTransferType || "neft" : "",
      cardType: paymentMethod === "card" ? cardType || "debit" : "",
      amountPaidPaise: calculated.amountPaidPaise,
      amountPaid: calculated.amountPaid,
      balanceDuePaise: calculated.balanceDuePaise,
      balanceDue: calculated.balanceDue,
      source: source || (referenceOrderNumber ? "order" : referenceBookingId ? "booking" : "manual"),
      referenceOrderNumber: referenceOrderNumber || null,
      referenceBookingId: referenceBookingId || null,
      createdBy: admin.name || admin.email || "Admin Officer",
      auditTrail: [
        {
          action: "INVOICE_CREATED",
          timestamp: new Date().toISOString(),
          actor: admin.name || admin.email || "Admin Officer",
          notes: `Created invoice with ${calculated.items.length} items. Grand Total: ₹${calculated.grandTotal}.`,
        },
      ],
    });

    // PIPELINE EVENT (ADMIN -> CUSTOMER BILLING INVOICE)
    const invNum = invoiceRecord.invoiceNumber || invoiceRecord.invoice_number;
    await dispatchPipelineEvent({
      eventType: "INVOICE_CREATED",
      title: "New Tax Invoice Issued 📄",
      message: `Your official invoice ${invNum} for ₹${calculated.grandTotal.toLocaleString("en-IN")} is now available.`,
      recipientRole: "user",
      recipientUserId: customerId || undefined,
      referenceType: "invoice",
      referenceId: invNum,
      actorRole: "admin",
    });

    return NextResponse.json({ invoice: invoiceRecord }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}
