"use client";

import { useEffect, useState, use } from "react";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { Printer, Download, Share2, AlertCircle, CheckCircle, Receipt } from "lucide-react";
import { formatRupees, sanitizeInvoiceItems } from "@/lib/billingUtils";

export default function PublicInvoiceViewPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [invoice, setInvoice] = useState<any | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any>({
    business_name: "NexLapTech",
    tagline: "Connecting Customers with Trusted Tech Experts",
    phone1: "+91 8088979706",
    phone2: "+91 8904760125",
    email: "nexbytetechnologies@gmail.com",
    address: "Bengaluru, Karnataka, India",
    gstin: "",
    invoice_footer: "Thank you for choosing NexLapTech! • Computers • Laptop Service • Gaming PCs • Bulk IT Hardware"
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`/api/public/invoices/${token}`).then((res) => res.json()),
      fetch(`/api/system/settings?key=business_info`).then((res) => res.json()).catch(() => null),
    ])
      .then(([invoiceData, settingsData]) => {
        if (invoiceData?.error) {
          setErrorMsg(invoiceData.error);
        } else {
          setInvoice(invoiceData.invoice);
        }
        if (settingsData?.value) {
          setBusinessInfo((prev: any) => ({ ...prev, ...settingsData.value }));
        }
      })
      .catch(() => {
        setErrorMsg("Failed to load invoice details.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Loading Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-6">
        <div className="p-8 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-red-500/30 text-center max-w-md space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="font-display text-lg font-bold text-black dark:text-white">Invoice Not Found</h2>
          <p className="text-xs text-neutral-500">{errorMsg || "The invoice link is invalid or expired."}</p>
          <Link href="/" className="bg-black text-white dark:bg-white dark:text-black font-bold inline-block text-xs py-2 px-6 rounded-xl">
            Return to NexLapTech Home
          </Link>
        </div>
      </div>
    );
  }

  const numStr = invoice.invoiceNumber || invoice.invoice_number || "NEX-2026-0001";
  const dateStr = invoice.invoiceDate || invoice.invoice_date || "";
  const timeStr = invoice.invoiceTime || invoice.invoice_time || "";
  const custName = invoice.customerName || invoice.customer_name || "Customer";
  const mob = invoice.mobile || "";
  const email = invoice.email || "";
  const addr = invoice.address || "";
  const city = invoice.city || "";
  const state = invoice.state || "";
  const pin = invoice.pincode || "";
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal) || 0;
  const globalDisc = Number(invoice.globalDiscount || invoice.global_discount) || 0;
  const taxable = Number(invoice.taxableAmount || invoice.taxable_amount) || 0;
  const gstEnabled = !!(invoice.gstEnabled ?? invoice.gst_enabled);
  const gstin = invoice.gstin || "";
  const cgst = Number(invoice.cgst) || 0;
  const sgst = Number(invoice.sgst) || 0;
  const gstTotal = Number(invoice.gstTotal || invoice.gst_total) || 0;
  const grandTotal = Number(invoice.grandTotal || invoice.grand_total) || 0;
  const payStatus = invoice.paymentStatus || invoice.payment_status || "pending";
  const amountPaid = Number(invoice.amountPaid || invoice.amount_paid) || 0;
  const balanceDue = Number(invoice.balanceDue || invoice.balance_due) || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4 sm:p-8 flex justify-center items-start">
      <div className="max-w-2xl w-full space-y-4 my-4">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-black dark:text-white" />
            <span className="text-xs font-bold text-black dark:text-white">NEXLAPTECH Tax Invoice: {numStr}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-black text-white dark:bg-white dark:text-black font-bold py-1.5 px-4 text-xs flex items-center gap-1.5 rounded-xl shadow-sm hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
        </div>

        {/* Printable Canvas Document */}
        <div id="invoice-print-area" className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-xs font-sans space-y-5">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                margin: 12mm;
                size: A4 portrait;
              }
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden, header, nav, footer {
                display: none !important;
              }
              #invoice-print-area {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              table {
                width: 100% !important;
                page-break-inside: auto;
              }
              thead {
                display: table-header-group !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: auto;
              }
              .avoid-page-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}} />

          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9">
                  <BrandLogo width={72} height={72} className="h-full w-full" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  {businessInfo.business_name || "NexLapTech"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                {businessInfo.tagline || "Connecting Customers with Trusted Tech Experts"}
              </p>
              <div className="text-[9px] text-slate-500 space-y-0.5 pt-0.5">
                <p>Contact: {businessInfo.phone1} {businessInfo.phone2 ? `| ${businessInfo.phone2}` : ""}</p>
                <p>Email: {businessInfo.email || "nexbytetechnologies@gmail.com"}</p>
                {businessInfo.address && <p>{businessInfo.address}</p>}
                {businessInfo.gstin && <p className="font-semibold text-slate-700">Seller GSTIN: {businessInfo.gstin}</p>}
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                TAX INVOICE
              </span>
              <div className="text-xs font-bold text-slate-900">Invoice No: {numStr}</div>
              <div className="text-[10px] text-slate-500">Date: {dateStr}</div>
              {timeStr && <div className="text-[10px] text-slate-500">Time: {timeStr}</div>}
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] avoid-page-break">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                BILL TO:
              </span>
              <div className="font-bold text-slate-900">{custName}</div>
              {mob && <div className="text-slate-600">Mobile: {mob}</div>}
              {email && <div className="text-slate-600">Email: {email}</div>}
            </div>
            <div className="text-right">
              {addr && <div className="text-slate-600 break-words">{addr}</div>}
              <div className="text-slate-600">
                {[city, state, pin].filter(Boolean).join(", ")}
              </div>
              {gstEnabled && gstin && (
                <div className="mt-1 font-bold text-blue-700 text-[10px]">
                  Customer GSTIN: {gstin}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold text-[10px]">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Item Description</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Unit Price</th>
                <th className="py-2 px-2 text-right">Discount</th>
                <th className="py-2 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sanitizeInvoiceItems(items).map((item: any, idx: number) => (
                <tr key={item.id || idx} className="text-slate-700">
                  <td className="py-2 px-2 text-slate-400 align-top">{idx + 1}</td>
                  <td className="py-2 px-2 align-top">
                    <div className="font-semibold text-slate-900 break-words">{item.name}</div>
                    {item.description && (
                      <div className="text-[9px] text-slate-500 break-words max-w-sm whitespace-normal">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-medium align-top">{item.quantity}</td>
                  <td className="py-2 px-2 text-right align-top">{formatRupees(item.unitPrice)}</td>
                  <td className="py-2 px-2 text-right text-slate-500 align-top">
                    {item.discount > 0 ? formatRupees(item.discount) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 align-top">
                    {formatRupees(item.lineTotal || (item.quantity * item.unitPrice - (item.discount || 0)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="border-t border-slate-200 pt-3 flex justify-end avoid-page-break">
            <div className="w-full max-w-[260px] space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{formatRupees(subtotal)}</span>
              </div>

              {globalDisc > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Global Discount:</span>
                  <span>-{formatRupees(globalDisc)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 font-semibold border-t border-slate-100 pt-1">
                <span>Taxable Amount:</span>
                <span>{formatRupees(taxable)}</span>
              </div>

              {gstEnabled && (
                <>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>CGST (9%):</span>
                    <span>{formatRupees(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>SGST (9%):</span>
                    <span>{formatRupees(sgst)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-medium text-[10px]">
                    <span>GST Total (18%):</span>
                    <span>{formatRupees(gstTotal)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-1.5">
                <span>Grand Total:</span>
                <span className="text-blue-700">{formatRupees(grandTotal)}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold uppercase text-slate-900">{payStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-semibold text-emerald-700">{formatRupees(amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Balance Due:</span>
                  <span className={balanceDue > 0 ? "text-amber-600" : "text-slate-900"}>
                    {formatRupees(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-slate-200 pt-4 text-[9px] text-slate-400 text-center space-y-0.5 avoid-page-break">
            <p>{businessInfo.invoice_footer || "Thank you for choosing NexLapTech!"}</p>
            <p>Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems</p>
          </div>
        </div>

      </div>
    </div>
  );
}
