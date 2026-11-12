import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";
import { toPaise, toRupees } from "@/lib/billingUtils";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const invoice = await dbHelper.invoices.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ invoice }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const invoice = await dbHelper.invoices.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();
    const {
      paymentStatus,
      amountPaid,
      paymentMethod,
      paymentReference,
      paymentBank,
      refundAmount,
      refundReason,
      notes,
    } = body;

    const grandTotalPaise = invoice.grandTotalPaise ?? toPaise(Number(invoice.grandTotal ?? invoice.grand_total) || 0);
    let newAmountPaidPaise = invoice.amountPaidPaise ?? toPaise(Number(invoice.amountPaid ?? invoice.amount_paid) || 0);

    const validStatuses = ["paid", "pending", "partially_paid", "refunded", "cancelled"];
    const targetStatus = paymentStatus && validStatuses.includes(paymentStatus) ? paymentStatus : invoice.paymentStatus || invoice.payment_status || "pending";

    // Handle payment status transitions
    if (targetStatus === "paid") {
      newAmountPaidPaise = grandTotalPaise;
    } else if (amountPaid !== undefined) {
      newAmountPaidPaise = Math.min(grandTotalPaise, toPaise(Number(amountPaid) || 0));
    }

    const newBalanceDuePaise = Math.max(0, grandTotalPaise - newAmountPaidPaise);

    // Audit trail logging
    const existingAudit = Array.isArray(invoice.auditTrail || invoice.audit_trail)
      ? [...(invoice.auditTrail || invoice.audit_trail)]
      : [];

    const actor = admin.name || admin.email || "Admin Officer";
    let auditAction = "STATUS_UPDATED";
    let auditNotes = `Status changed to ${targetStatus}.`;

    if (refundAmount) {
      auditAction = "REFUND_ISSUED";
      auditNotes = `Refund of ₹${refundAmount} issued. Reason: ${refundReason || "Not specified"}.`;
    } else if (paymentStatus === "paid") {
      auditAction = "PAYMENT_RECORDED_FULL";
      auditNotes = `Marked full payment of ₹${toRupees(grandTotalPaise)} via ${paymentMethod || invoice.paymentMethod || "standard"}.`;
    } else if (notes) {
      auditNotes = notes;
    }

    existingAudit.push({
      action: auditAction,
      timestamp: new Date().toISOString(),
      actor,
      notes: auditNotes,
    });

    const updatePayload: Record<string, any> = {
      paymentStatus: targetStatus,
      payment_status: targetStatus,
      amountPaidPaise: newAmountPaidPaise,
      amountPaid: toRupees(newAmountPaidPaise),
      amount_paid: toRupees(newAmountPaidPaise),
      balanceDuePaise: newBalanceDuePaise,
      balanceDue: toRupees(newBalanceDuePaise),
      balance_due: toRupees(newBalanceDuePaise),
      auditTrail: existingAudit,
      audit_trail: existingAudit,
    };

    if (paymentMethod) {
      updatePayload.paymentMethod = paymentMethod;
      updatePayload.payment_method = paymentMethod;
    }
    if (paymentReference !== undefined) {
      updatePayload.paymentReference = paymentReference;
      updatePayload.payment_reference = paymentReference;
    }
    if (paymentBank !== undefined) {
      updatePayload.paymentBank = paymentBank;
      updatePayload.payment_bank = paymentBank;
    }
    if (refundAmount !== undefined) {
      updatePayload.refundAmount = Number(refundAmount) || 0;
      updatePayload.refund_amount = Number(refundAmount) || 0;
      updatePayload.refundReason = refundReason || "";
      updatePayload.refund_reason = refundReason || "";
      updatePayload.refundDate = new Date().toISOString();
      updatePayload.refund_date = new Date().toISOString();
    }

    const updated = await dbHelper.invoices.update(id, updatePayload);

    return NextResponse.json(
      {
        success: true,
        invoice: updated,
        message: `Invoice ${invoice.invoiceNumber || invoice.invoice_number} updated successfully.`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["admin"]);
    const { id } = await params;

    const invoice = await dbHelper.invoices.getById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const existingAudit = Array.isArray(invoice.auditTrail || invoice.audit_trail)
      ? [...(invoice.auditTrail || invoice.audit_trail)]
      : [];

    existingAudit.push({
      action: "INVOICE_CANCELLED",
      timestamp: new Date().toISOString(),
      actor: admin.name || admin.email || "Admin Officer",
      notes: "Invoice cancelled by administrator.",
    });

    const cancelled = await dbHelper.invoices.update(id, {
      status: "cancelled",
      paymentStatus: "cancelled",
      payment_status: "cancelled",
      auditTrail: existingAudit,
      audit_trail: existingAudit,
    });

    return NextResponse.json(
      { invoice: cancelled, message: "Invoice status set to cancelled." },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
  }
}
