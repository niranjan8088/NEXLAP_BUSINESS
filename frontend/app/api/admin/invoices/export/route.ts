import { NextResponse } from "next/server";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { dbHelper } from "@/lib/dbHelper";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || "").toLowerCase().trim();
    const status = searchParams.get("status") || "all";
    const gstFilter = searchParams.get("gst") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const allInvoices = await dbHelper.invoices.list();

    const filtered = allInvoices.filter((inv: any) => {
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

      const payStatus = inv.paymentStatus || inv.payment_status || "pending";
      if (status !== "all" && payStatus !== status) return false;

      const isGst = !!(inv.gstEnabled ?? inv.gst_enabled);
      if (gstFilter === "enabled" && !isGst) return false;
      if (gstFilter === "disabled" && isGst) return false;

      const invDateStr = inv.invoiceDate || inv.invoice_date || (inv.createdAt || inv.created_at || "").slice(0, 10);
      if (startDate && invDateStr && invDateStr < startDate) return false;
      if (endDate && invDateStr && invDateStr > endDate) return false;

      return true;
    });

    // Format CSV safely
    const escapeCsv = (val: any) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Invoice Number",
      "Date",
      "Customer Name",
      "Mobile",
      "Email",
      "City",
      "GST Enabled",
      "GSTIN",
      "Items Count",
      "Subtotal (₹)",
      "Global Discount (₹)",
      "Taxable Amount (₹)",
      "CGST (₹)",
      "SGST (₹)",
      "Total GST (₹)",
      "Grand Total (₹)",
      "Amount Paid (₹)",
      "Balance Due (₹)",
      "Payment Status",
      "Payment Method",
      "Source",
      "Created By",
    ];

    const rows = filtered.map((inv: any) => {
      const isGst = !!(inv.gstEnabled ?? inv.gst_enabled);
      const itemsCount = Array.isArray(inv.items) ? inv.items.length : 0;
      return [
        escapeCsv(inv.invoiceNumber || inv.invoice_number || ""),
        escapeCsv(inv.invoiceDate || inv.invoice_date || (inv.createdAt || "").slice(0, 10)),
        escapeCsv(inv.customerName || inv.customer_name || ""),
        escapeCsv(inv.mobile || ""),
        escapeCsv(inv.email || ""),
        escapeCsv(inv.city || "Bengaluru"),
        escapeCsv(isGst ? "YES" : "NO"),
        escapeCsv(inv.gstin || "N/A"),
        escapeCsv(itemsCount),
        escapeCsv(Number(inv.subtotal || 0).toFixed(2)),
        escapeCsv(Number(inv.globalDiscount || 0).toFixed(2)),
        escapeCsv(Number(inv.taxableAmount || 0).toFixed(2)),
        escapeCsv(Number(inv.cgst || 0).toFixed(2)),
        escapeCsv(Number(inv.sgst || 0).toFixed(2)),
        escapeCsv(Number(inv.gstTotal || 0).toFixed(2)),
        escapeCsv(Number(inv.grandTotal ?? inv.grand_total ?? 0).toFixed(2)),
        escapeCsv(Number(inv.amountPaid ?? inv.amount_paid ?? 0).toFixed(2)),
        escapeCsv(Number(inv.balanceDue ?? inv.balance_due ?? 0).toFixed(2)),
        escapeCsv(inv.paymentStatus || inv.payment_status || "pending"),
        escapeCsv(inv.paymentMethod || "cash"),
        escapeCsv(inv.source || (inv.referenceOrderNumber ? "order" : inv.referenceBookingId ? "booking" : "manual")),
        escapeCsv(inv.createdBy || "Admin Officer"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexlaptech-billing-report-${today}.csv"`,
        "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const { status, message } = authErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

