"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Trash2,
  Copy,
  Printer,
  Download,
  Share2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  RefreshCw,
  Eye,
  X
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import {
  calculateInvoiceTotals,
  sanitizeInvoiceItems,
  formatRupees,
  validateMobile,
  validateEmail,
  validatePincode,
  validateGSTIN,
  CalculationResult
} from "@/lib/billingUtils";

interface FormItem {
  id: string;
  name: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
}

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Customer suggestions list
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [existingCatalog, setExistingCatalog] = useState<{ products: any[]; services: any[] }>({
    products: [],
    services: []
  });

  // Customer Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("560070");

  // Items State (starts with exactly 1 editable item row)
  const [items, setItems] = useState<FormItem[]>([
    {
      id: "item-1",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0
    }
  ]);

  // Global Financials & Payment State (Clean defaults: GST OFF, No GSTIN, Payment Pending)
  const [globalDiscount, setGlobalDiscount] = useState<number | string>(0);
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [gstin, setGstin] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "bank_transfer" | "card" | "other">("upi");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending" | "partially_paid">("pending");
  const [amountPaid, setAmountPaid] = useState<number | string>(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [bankTransferType, setBankTransferType] = useState<"neft" | "rtgs">("neft");
  const [cardType, setCardType] = useState<"debit" | "credit">("debit");

  // History State
  const [invoicesHistory, setInvoicesHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gstFilter, setGstFilter] = useState("all");

  // View Saved Invoice Modal State
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [latestCreatedInvoice, setLatestCreatedInvoice] = useState<any | null>(null);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [uList, pList, sList, invList] = await Promise.all([
        dbHelper.users.list(),
        dbHelper.products.list(),
        dbHelper.services.list(),
        dbHelper.invoices.list()
      ]);

      const custs = uList.filter((u: any) => u.role === "customer" || u.role === "user");
      setExistingCustomers(custs);
      setExistingCatalog({ products: pList, services: sList });
      setInvoicesHistory(invList);
    } catch (e) {
      console.error("Failed to load initial billing data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Live Shared Calculations
  const calculatedTotals: CalculationResult = useMemo(() => {
    const parsedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0
    }));

    return calculateInvoiceTotals({
      items: parsedItems,
      globalDiscount: Number(globalDiscount) || 0,
      gstEnabled,
      gstin,
      paymentStatus,
      amountPaid: Number(amountPaid) || 0
    });
  }, [items, globalDiscount, gstEnabled, gstin, paymentStatus, amountPaid]);

  // Handle selecting an existing customer
  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.full_name || cust.name || "");
    setMobile(cust.phone || "");
    setEmail(cust.email || "");
    setAddress(cust.address || "");
    setCity(cust.city || "Bengaluru");
    setState(cust.state || "Karnataka");
    setPincode(cust.pincode || "560070");
  };

  // Payment Status selection helper
  const handlePaymentStatusChange = (newStatus: "paid" | "pending" | "partially_paid") => {
    setPaymentStatus(newStatus);
    if (newStatus === "paid") {
      setAmountPaid(calculatedTotals.grandTotal);
    } else if (newStatus === "pending") {
      setAmountPaid(0);
    }
  };

  // Item Table Actions
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setErrorMsg("Invoice must contain at least one item.");
      return;
    }
    setErrorMsg("");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDuplicateItem = (item: FormItem) => {
    setItems((prev) => [
      ...prev,
      {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: item.name ? `${item.name} (Copy)` : ""
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof FormItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // Quick select product/service into line item
  const handlePickCatalogItem = (itemId: string, catalogItem: any, type: "product" | "service") => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            name: catalogItem.name || catalogItem.title,
            description: catalogItem.shortDescription || catalogItem.category || type,
            unitPrice: catalogItem.price || 0,
            discount: catalogItem.discount || 0
          };
        }
        return i;
      })
    );
  };

  // Submit & Save Invoice
  const handleSaveInvoice = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    // 1. Validations
    if (!customerName.trim()) {
      setErrorMsg("Customer Name is required.");
      return;
    }

    if (!mobile.trim() || !validateMobile(mobile)) {
      setErrorMsg("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }

    if (email && !validateEmail(email)) {
      setErrorMsg("Invalid Email address format.");
      return;
    }

    if (pincode && !validatePincode(pincode)) {
      setErrorMsg("Invalid 6-digit Indian Pincode.");
      return;
    }

    if (gstEnabled && gstin && !validateGSTIN(gstin)) {
      setErrorMsg("Invalid 15-character Indian GSTIN format.");
      return;
    }

    const sanitizedItems = sanitizeInvoiceItems(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        discount: Number(i.discount) || 0,
      }))
    );

    if (sanitizedItems.length === 0) {
      setErrorMsg("Invoice must contain at least one valid line item with an Item Name.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        customerName,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        items: sanitizedItems,
        globalDiscount: Number(globalDiscount) || 0,
        gstEnabled,
        gstin,
        paymentMethod,
        paymentStatus,
        paymentReference,
        paymentBank,
        bankTransferType: paymentMethod === "bank_transfer" ? bankTransferType : "",
        cardType: paymentMethod === "card" ? cardType : "",
        amountPaid: paymentStatus === "paid" ? calculatedTotals.grandTotal : Number(amountPaid) || 0
      };

      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save invoice.");
      }

      const allocatedNum = data.invoice.invoiceNumber || data.invoice.invoice_number;
      setSuccessMsg(`Invoice ${allocatedNum} created and saved successfully!`);
      setLatestCreatedInvoice(data.invoice);
      setViewingInvoice(data.invoice);
      
      // Refresh history list
      loadInitialData();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setSelectedCustomerId(null);
    setCustomerName("");
    setMobile("");
    setEmail("");
    setAddress("");
    setCity("Bengaluru");
    setState("Karnataka");
    setPincode("560070");
    setItems([
      {
        id: `item-${Date.now()}`,
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0
      }
    ]);
    setGlobalDiscount(0);
    setGstEnabled(false);
    setGstin("");
    setPaymentMethod("upi");
    setPaymentStatus("pending");
    setAmountPaid(0);
    setPaymentReference("");
    setPaymentBank("");
    setBankTransferType("neft");
    setCardType("debit");
    setErrorMsg("");
    setSuccessMsg("");
    setLatestCreatedInvoice(null);
  };

  // Actions: Print, Download PDF, Share
  const handlePrint = (invoiceObj?: any) => {
    const target = invoiceObj || viewingInvoice || latestCreatedInvoice;
    if (!target && !customerName.trim()) {
      alert("Please fill customer details before printing.");
      return;
    }
    window.print();
  };

  const handleDownloadPdf = (invObjOrNum?: any) => {
    const target = typeof invObjOrNum === "object" ? invObjOrNum : viewingInvoice || latestCreatedInvoice;
    const invNum = typeof invObjOrNum === "string" && !invObjOrNum.includes("PREVIEW") && !invObjOrNum.includes("DRAFT")
      ? invObjOrNum
      : target?.invoiceNumber || target?.invoice_number;

    if (!invNum) {
      alert("Please click Save Invoice first to generate the official invoice number before downloading PDF.");
      return;
    }

    const origTitle = document.title;
    document.title = `${invNum}.pdf`;
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 1000);
  };

  const handleShare = async (invoiceObj?: any) => {
    const target = invoiceObj || viewingInvoice || latestCreatedInvoice;
    if (!target || (!target.shareToken && !target.share_token)) {
      alert("Please click Save Invoice first to generate an official share link.");
      return;
    }

    const invNum = target.invoiceNumber || target.invoice_number;
    const token = target.shareToken || target.share_token || target.id;
    const shareUrl = `${window.location.origin}/invoice/view/${token}`;
    const shareText = `NexLapTech Invoice ${invNum} for ${target.customerName || target.customer_name}. Total: ${formatRupees(target.grandTotal || target.grand_total)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `NEXLAPTECH Invoice ${invNum}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (e) {}
    }

    // Fallback: Copy share link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Share Link copied to clipboard:\n${shareUrl}`);
    } catch (e) {
      alert(`Invoice Share Link:\n${shareUrl}`);
    }
  };

  // History Filtered Records
  const filteredHistory = useMemo(() => {
    return invoicesHistory.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const numStr = (inv.invoiceNumber || inv.invoice_number || "").toLowerCase();
      const nameStr = (inv.customerName || inv.customer_name || "").toLowerCase();
      const mobileStr = (inv.mobile || "").toLowerCase();

      const matchesSearch = !q || numStr.includes(q) || nameStr.includes(q) || mobileStr.includes(q);

      const payStatus = inv.paymentStatus || inv.payment_status || "pending";
      const matchesStatus = statusFilter === "all" || payStatus === statusFilter;

      const isGst = !!(inv.gstEnabled ?? inv.gst_enabled);
      const matchesGst =
        gstFilter === "all" ||
        (gstFilter === "enabled" && isGst) ||
        (gstFilter === "disabled" && !isGst);

      return matchesSearch && matchesStatus && matchesGst;
    });
  }, [invoicesHistory, searchQuery, statusFilter, gstFilter]);

  // Aggregate Metrics
  const historyStats = useMemo(() => {
    const totalCount = invoicesHistory.length;
    const paidCount = invoicesHistory.filter((i) => (i.paymentStatus || i.payment_status) === "paid").length;
    const pendingCount = invoicesHistory.filter((i) => (i.paymentStatus || i.payment_status) === "pending" || (i.paymentStatus || i.payment_status) === "partially_paid").length;
    const totalRevenue = invoicesHistory.reduce((sum, i) => sum + (Number(i.grandTotal || i.grand_total) || 0), 0);
    return { totalCount, paidCount, pendingCount, totalRevenue };
  }, [invoicesHistory]);

  return (
    <div className="admin-billing space-y-6">
      
      {/* ── PRINT-ONLY DEDICATED INVOICE ROOT ─────────────────────────────────── */}
      <div id="invoice-print-area" className="hidden print:block text-slate-900 bg-white font-sans p-0 m-0 w-full">
        <PrintableInvoiceDocument
          invoice={viewingInvoice || latestCreatedInvoice || {
            invoiceNumber: "Draft (Will be assigned on save)",
            invoiceDate: new Date().toISOString().split("T")[0],
            invoiceTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
            customerName,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            items: calculatedTotals.items,
            subtotal: calculatedTotals.subtotal,
            globalDiscount: calculatedTotals.globalDiscount,
            taxableAmount: calculatedTotals.taxableAmount,
            gstEnabled: calculatedTotals.gstEnabled,
            gstin: calculatedTotals.gstin,
            cgst: calculatedTotals.cgst,
            sgst: calculatedTotals.sgst,
            gstTotal: calculatedTotals.gstTotal,
            grandTotal: calculatedTotals.grandTotal,
            paymentMethod,
            paymentStatus: calculatedTotals.paymentStatus,
            amountPaid: calculatedTotals.amountPaid,
            balanceDue: calculatedTotals.balanceDue,
            createdBy: "Admin Officer"
          }}
        />
      </div>

      {/* ── SCREEN-ONLY UI WRAPPER ───────────────────────────────────────────── */}
      <div className="space-y-6 print:hidden">

        {/* ── SCREEN UI HEADER ─────────────────────────────────────────────────── */}
        <div className="billing-reveal billing-reveal--1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#26364D] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center shadow-md shadow-[#2563EB]/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  Admin Billing &amp; Invoices
                </h1>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Create, calculate, issue &amp; manage tax-compliant NexLapTech invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#111B32] p-1.5 rounded-xl border border-slate-200 dark:border-[#26364D]">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "create"
                  ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30 border border-blue-400/40"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-white hover:bg-slate-50 dark:bg-[#17243B]"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Create New Invoice
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30 border border-blue-400/40"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-white hover:bg-slate-50 dark:bg-[#17243B]"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" /> Invoice History ({historyStats.totalCount})
            </button>
          </div>
        </div>

        {/* ── METRICS BAR ──────────────────────────────────────────────────────── */}
        <div className="billing-metrics billing-reveal billing-reveal--2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D]">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider block">Total Invoices</span>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">{historyStats.totalCount}</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D]">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider block">Total Billed Revenue</span>
            <span className="font-display text-xl font-bold text-[#2563EB] mt-1 block">
              {formatRupees(historyStats.totalRevenue)}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D]">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Paid Invoices</span>
            <span className="font-display text-xl font-bold text-emerald-400 mt-1 block">{historyStats.paidCount}</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D]">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pending / Partial</span>
            <span className="font-display text-xl font-bold text-amber-400 mt-1 block">{historyStats.pendingCount}</span>
          </div>
        </div>

        {/* ── MESSAGES DISPLAY ─────────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="billing-message p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="billing-message p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setActiveTab("history")}
              className="text-xs underline hover:text-white font-bold"
            >
              View in History &rarr;
            </button>
          </div>
        )}

        {/* ── CREATE INVOICE WORKSPACE ────────────────────────────────────────── */}
        {activeTab === "create" && (
          <div className="billing-reveal billing-reveal--3 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: INVOICE FORM (7 cols) */}
            <div className="lg:col-span-7 space-y-6 min-w-0">
              
              {/* 1. Customer Details Section */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26364D] pb-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#2563EB]" /> 1. Customer Details
                  </h3>
                  {existingCustomers.length > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                      <span>Quick Select:</span>
                      <select
                        onChange={(e) => {
                          const found = existingCustomers.find((c) => c.id === e.target.value);
                          if (found) handleSelectCustomer(found);
                        }}
                        className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC] text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#26364D] focus:border-[#2563EB] focus:outline-none"
                      >
                        <option value="" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Select Existing Client...</option>
                        {existingCustomers.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">
                            {c.full_name || c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">
                      Customer Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">
                      Mobile Number (10 digits) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Shop No., Street, Area"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Pincode (6 digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="560070"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Product / Service Items Section */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26364D] pb-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#2563EB]" /> 2. Items &amp; Services ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-[#2563EB]/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const lineTotalCalculated =
                      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) -
                      (Number(item.discount) || 0);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#17243B]/60 border border-slate-200 dark:border-[#26364D] space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                            Item #{index + 1}
                          </span>

                          {/* Catalog quick loader dropdown */}
                          <div className="flex items-center gap-2">
                            <select
                              onChange={(e) => {
                                const [type, id] = e.target.value.split(":");
                                if (type === "prod") {
                                  const p = existingCatalog.products.find((x) => x.id === id);
                                  if (p) handlePickCatalogItem(item.id, p, "product");
                                } else if (type === "serv") {
                                  const s = existingCatalog.services.find((x) => x.id === id);
                                  if (s) handlePickCatalogItem(item.id, s, "service");
                                }
                              }}
                              className="bg-[#080D1B] text-slate-900 dark:text-[#F8FAFC] text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#26364D] focus:border-[#2563EB] focus:outline-none"
                            >
                              <option value="" className="bg-[#080D1B] text-slate-900 dark:text-[#F8FAFC]">+ Insert Catalog Item...</option>
                              <optgroup label="Products" className="bg-[#080D1B] text-slate-600 dark:text-[#CBD5E1]">
                                {existingCatalog.products.map((p) => (
                                  <option key={p.id} value={`prod:${p.id}`} className="bg-[#080D1B] text-slate-900 dark:text-[#F8FAFC]">
                                    {p.name} (₹{p.price})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Services" className="bg-[#080D1B] text-slate-600 dark:text-[#CBD5E1]">
                                {existingCatalog.services.map((s) => (
                                  <option key={s.id} value={`serv:${s.id}`} className="bg-[#080D1B] text-slate-900 dark:text-[#F8FAFC]">
                                    {s.title} (₹{s.price})
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(item)}
                              title="Duplicate Item"
                              className="p-1.5 rounded-lg bg-[#080D1B] hover:bg-slate-200 dark:hover:bg-[#26364D] text-slate-600 dark:text-[#CBD5E1] hover:text-white transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              title="Remove Item"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                          <div className="sm:col-span-7">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">
                              Item Name / Title <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                              placeholder="e.g. Kingston 16GB DDR4 RAM"
                              className="w-full rounded-lg bg-[#080D1B] border border-slate-200 dark:border-[#26364D] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">Description (Optional)</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                              placeholder="e.g. 3200MHz SODIMM Laptop Memory"
                              className="w-full rounded-lg bg-[#080D1B] border border-slate-200 dark:border-[#26364D] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">
                              Qty <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                              className="w-full rounded-lg bg-[#080D1B] border border-slate-200 dark:border-[#26364D] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">
                              Unit Price (₹) <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                              className="w-full rounded-lg bg-[#080D1B] border border-slate-200 dark:border-[#26364D] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">Discount (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={item.discount}
                              onChange={(e) => handleUpdateItem(item.id, "discount", e.target.value)}
                              className="w-full rounded-lg bg-[#080D1B] border border-slate-200 dark:border-[#26364D] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-3 text-right">
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1">Line Total</label>
                            <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs block py-2">
                              {formatRupees(Math.max(0, lineTotalCalculated))}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Global Discount & GST Configuration */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F8FAFC] border-b border-slate-200 dark:border-[#26364D] pb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#8B5CF6]" /> 3. Global Discount &amp; GST Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">
                      Global Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">GST Application</label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setGstEnabled(false)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !gstEnabled ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-slate-500 dark:text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        GST OFF
                      </button>
                      <button
                        type="button"
                        onClick={() => setGstEnabled(true)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          gstEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-500 dark:text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        GST ON (18%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">
                      GSTIN (Optional 15-chars)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="29ABCDE1234F1Z5"
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs uppercase placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Payment Method & Status */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F8FAFC] border-b border-slate-200 dark:border-[#26364D] pb-3 flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#2563EB]" /> 4. Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                    >
                      <option value="cash" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Cash</option>
                      <option value="upi" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">UPI / QR Code</option>
                      <option value="bank_transfer" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Bank Transfer (NEFT / RTGS)</option>
                      <option value="card" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Credit / Debit Card</option>
                      <option value="other" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e: any) => handlePaymentStatusChange(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                    >
                      <option value="pending" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Pending (Unpaid)</option>
                      <option value="paid" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Paid (Full)</option>
                      <option value="partially_paid" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Partially Paid</option>
                    </select>
                  </div>

                  {paymentStatus === "partially_paid" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">UPI Transaction ID</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Enter UPI transaction / reference ID"
                        className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Transfer Type</label>
                        <select
                          value={bankTransferType}
                          onChange={(e) => setBankTransferType(e.target.value as "neft" | "rtgs")}
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                        >
                          <option value="neft">NEFT</option>
                          <option value="rtgs">RTGS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Bank Name</label>
                        <input
                          type="text"
                          maxLength={120}
                          value={paymentBank}
                          onChange={(e) => setPaymentBank(e.target.value)}
                          placeholder="Enter bank name"
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">{bankTransferType.toUpperCase()} UTR / Transaction ID</label>
                        <input
                          type="text"
                          maxLength={120}
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder={`Enter ${bankTransferType.toUpperCase()} UTR`}
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === "card" && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Card Type</label>
                        <select
                          value={cardType}
                          onChange={(e) => setCardType(e.target.value as "debit" | "credit")}
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs focus:border-[#2563EB] focus:outline-none transition-colors"
                        >
                          <option value="debit">Debit Card</option>
                          <option value="credit">Credit Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Bank / Card Issuer</label>
                        <input
                          type="text"
                          maxLength={120}
                          value={paymentBank}
                          onChange={(e) => setPaymentBank(e.target.value)}
                          placeholder="Enter bank / card issuer"
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] mb-1.5">Card Transaction ID</label>
                        <input
                          type="text"
                          maxLength={120}
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Enter card transaction ID"
                          className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] border border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-[#CBD5E1] hover:text-white text-xs font-semibold transition-all"
                >
                  Reset Form
                </button>

                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/30 transition-all"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving Invoice...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Save &amp; Generate Invoice
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: LIVE INVOICE PREVIEW (5 cols) Sticky Desktop Panel */}
            <div className="billing-preview lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-[#111B32] p-4 rounded-2xl border border-slate-200 dark:border-[#26364D]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">Live Invoice Preview</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePrint()}
                    title="Print Invoice"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] border border-slate-200 dark:border-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(latestCreatedInvoice || viewingInvoice)}
                    title="Download PDF"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] border border-slate-200 dark:border-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(latestCreatedInvoice || viewingInvoice)}
                    title="Share Invoice"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] border border-slate-200 dark:border-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
              </div>

              {/* Preview Canvas Component */}
              <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 text-xs font-sans space-y-5">
                
                {/* Invoice Canvas Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8">
                        <BrandLogo width={64} height={64} className="h-full w-full" />
                      </div>
                      <span className="font-bold text-base tracking-tight text-slate-900">
                        NexLapTech
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Connecting Customers with Trusted Tech Experts
                    </p>
                    <div className="text-[9px] text-slate-500 space-y-0.5 pt-0.5">
                      <p>Contact: +91 8088979706 | +91 8904760125</p>
                      <p>Email: nexbytetechnologies@gmail.com</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      TAX INVOICE
                    </span>
                    <div className="text-[11px] font-bold text-slate-800">
                      Invoice No:{" "}
                      {latestCreatedInvoice ? (
                        <span className="text-blue-700">{latestCreatedInvoice.invoiceNumber || latestCreatedInvoice.invoice_number}</span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Draft (Assigned on save)</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500">Date: {new Date().toLocaleDateString("en-IN")}</div>
                    <div className="text-[9px] text-slate-500">
                      Time: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      BILL TO:
                    </span>
                    <div className="font-bold text-slate-900">{customerName || "Customer Name"}</div>
                    <div className="text-slate-600">{mobile ? `Mob: ${mobile}` : "Mobile: ----------"}</div>
                    {email && <div className="text-slate-600">Email: {email}</div>}
                  </div>
                  <div className="text-right">
                    {address && <div className="text-slate-600">{address}</div>}
                    <div className="text-slate-600">
                      {[city, state, pincode].filter(Boolean).join(", ")}
                    </div>
                    {gstEnabled && gstin && (
                      <div className="mt-1 font-bold text-blue-700 text-[10px]">
                        GSTIN: {gstin}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold text-[10px]">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Item Description</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Price</th>
                        <th className="py-2 px-2 text-right">Disc</th>
                        <th className="py-2 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calculatedTotals.items.length > 0 ? (
                        calculatedTotals.items.map((item, idx) => (
                          <tr key={item.id} className="text-slate-700">
                            <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <div className="font-semibold text-slate-900">{item.name || "Untitled Item"}</div>
                              {item.description && (
                                <div className="text-[9px] text-slate-500">{item.description}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center font-medium">{item.quantity}</td>
                            <td className="py-2 px-2 text-right">{formatRupees(item.unitPrice)}</td>
                            <td className="py-2 px-2 text-right text-slate-500">
                              {item.discount > 0 ? formatRupees(item.discount) : "-"}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-slate-900">
                              {formatRupees(item.lineTotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-slate-400 italic">
                          <td colSpan={6} className="py-3 text-center text-[10px]">
                            Enter item details to calculate invoice totals.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals Breakdown */}
                <div className="border-t border-slate-200 pt-3 flex justify-end">
                  <div className="w-full max-w-[240px] space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-medium text-slate-900">{formatRupees(calculatedTotals.subtotal)}</span>
                    </div>

                    {calculatedTotals.globalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Global Discount:</span>
                        <span>-{formatRupees(calculatedTotals.globalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 font-semibold border-t border-slate-100 pt-1">
                      <span>Taxable Amount:</span>
                      <span>{formatRupees(calculatedTotals.taxableAmount)}</span>
                    </div>

                    {calculatedTotals.gstEnabled && (
                      <>
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>CGST (9%):</span>
                          <span>{formatRupees(calculatedTotals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>SGST (9%):</span>
                          <span>{formatRupees(calculatedTotals.sgst)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700 font-medium text-[10px]">
                          <span>GST Total (18%):</span>
                          <span>{formatRupees(calculatedTotals.gstTotal)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-1.5">
                      <span>Grand Total:</span>
                      <span className="text-blue-700">{formatRupees(calculatedTotals.grandTotal)}</span>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Status:</span>
                        <span className={`font-bold uppercase ${
                          calculatedTotals.paymentStatus === "paid"
                            ? "text-emerald-700"
                            : calculatedTotals.paymentStatus === "partially_paid"
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}>
                          {calculatedTotals.paymentStatus.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Paid:</span>
                        <span className="font-semibold text-emerald-700">{formatRupees(calculatedTotals.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-700">Balance Due:</span>
                        <span className={calculatedTotals.balanceDue > 0 ? "text-amber-600" : "text-slate-900"}>
                          {formatRupees(calculatedTotals.balanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Terms */}
                <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 text-center space-y-0.5">
                  <p>Thank you for choosing NexLapTech!</p>
                  <p>Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems</p>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── INVOICE HISTORY TABLE WORKSPACE ──────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="billing-reveal billing-reveal--3 space-y-4">
            
            {/* Filters & Search Header */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Invoice #, Name, Mobile..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] pl-10 pr-4 py-2 text-slate-900 dark:text-[#F8FAFC] text-xs placeholder:text-slate-500 dark:text-[#94A3B8]/60 focus:border-[#2563EB] focus:outline-none transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full sm:w-auto text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-[#94A3B8]" />
                  <span className="text-slate-600 dark:text-[#CBD5E1] text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC] text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#26364D] focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="all" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">All Statuses</option>
                    <option value="paid" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Paid</option>
                    <option value="pending" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Pending</option>
                    <option value="partially_paid" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">Partially Paid</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 dark:text-[#CBD5E1] text-[11px]">GST:</span>
                  <select
                    value={gstFilter}
                    onChange={(e) => setGstFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC] text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#26364D] focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="all" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">All Invoices</option>
                    <option value="enabled" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">GST ON Only</option>
                    <option value="disabled" className="bg-slate-50 dark:bg-[#17243B] text-slate-900 dark:text-[#F8FAFC]">GST OFF Only</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Table Container */}
            <div className="rounded-2xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Receipt className="h-10 w-10 text-slate-500 dark:text-[#94A3B8] mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">No billing invoices match the specified criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-[#17243B] border-b border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-[#CBD5E1] uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Invoice #</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Date &amp; Time</th>
                        <th className="py-3.5 px-4 text-right">Taxable</th>
                        <th className="py-3.5 px-4 text-right">GST Total</th>
                        <th className="py-3.5 px-4 text-right">Grand Total</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#26364D]">
                      {filteredHistory.map((inv) => {
                        const numStr = inv.invoiceNumber || inv.invoice_number;
                        const dateStr = inv.invoiceDate || inv.invoice_date;
                        const timeStr = inv.invoiceTime || inv.invoice_time;
                        const custName = inv.customerName || inv.customer_name;
                        const mob = inv.mobile;
                        const grand = Number(inv.grandTotal || inv.grand_total) || 0;
                        const taxable = Number(inv.taxableAmount || inv.taxable_amount) || 0;
                        const gstTotal = Number(inv.gstTotal || inv.gst_total) || 0;
                        const payStatus = inv.paymentStatus || inv.payment_status || "pending";

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:bg-[#17243B]/40 transition-all">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                              <span>{numStr}</span>
                              {inv.status === "cancelled" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-normal">
                                  Cancelled
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{custName}</div>
                              <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">{mob}</div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 dark:text-[#CBD5E1] text-[11px]">
                              <div>{dateStr}</div>
                              <div className="text-[9px] text-slate-500 dark:text-[#94A3B8]">{timeStr}</div>
                            </td>

                            <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-[#F8FAFC]">
                              {formatRupees(taxable)}
                            </td>

                            <td className="py-3.5 px-4 text-right text-slate-600 dark:text-[#CBD5E1]">
                              {gstTotal > 0 ? formatRupees(gstTotal) : "-"}
                            </td>

                            <td className="py-3.5 px-4 text-right font-bold text-[#2563EB]">
                              {formatRupees(grand)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  payStatus === "paid"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : payStatus === "partially_paid"
                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                {payStatus.replace("_", " ")}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingInvoice(inv)}
                                  title="View Saved Invoice"
                                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingInvoice(inv);
                                    setTimeout(() => handlePrint(inv), 100);
                                  }}
                                  title="Print Invoice"
                                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs transition-colors"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShare(inv)}
                                  title="Share Invoice Link"
                                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs transition-colors"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── SAVED INVOICE VIEW MODAL ────────────────────────────────────────── */}
        {viewingInvoice && (
          <div className="billing-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setViewingInvoice(null)}
            />

            <div className="billing-modal-card relative bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26364D] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#2563EB]" />
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Invoice Details — {viewingInvoice.invoiceNumber || viewingInvoice.invoice_number}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1 rounded-lg bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] text-slate-500 dark:text-[#94A3B8] hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Document Body */}
              <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md border border-slate-200 text-xs font-sans space-y-4 max-h-[70vh] overflow-y-auto">
                <PrintableInvoiceDocument invoice={viewingInvoice} />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                  Created by: <strong className="text-slate-900 dark:text-[#F8FAFC]">{viewingInvoice.createdBy || "Admin"}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(viewingInvoice)}
                    className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#17243B] hover:bg-slate-200 dark:hover:bg-[#26364D] border border-slate-200 dark:border-[#26364D] text-slate-900 dark:text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={() => handleShare(viewingInvoice)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#2563EB]/20 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div> {/* End screen-only UI wrapper */}
    </div>
  );
}

/** ── PRINTABLE INVOICE DOCUMENT COMPONENT ───────────────────────────────── */
function PrintableInvoiceDocument({ invoice }: { invoice: any }) {
  const rawNum = invoice?.invoiceNumber || invoice?.invoice_number;
  const isSaved = rawNum && !rawNum.includes("PREVIEW") && !rawNum.includes("DRAFT") && rawNum !== "Will be assigned on save" && rawNum !== "Draft (Will be assigned on save)";
  const numStr = isSaved ? rawNum : "DRAFT / PREVIEW";
  const dateStr = invoice.invoiceDate || invoice.invoice_date || new Date().toISOString().split("T")[0];
  const timeStr = invoice.invoiceTime || invoice.invoice_time || "";
  const custName = invoice.customerName || invoice.customer_name || "Customer Name";
  const mob = invoice.mobile || "";
  const email = invoice.email || "";
  const addr = invoice.address || "";
  const city = invoice.city || "";
  const state = invoice.state || "";
  const pin = invoice.pincode || "";
  const validItems = sanitizeInvoiceItems(invoice.items);
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
  const paymentMethod = invoice.paymentMethod || invoice.payment_method || "";
  const paymentReference = invoice.paymentReference || invoice.payment_reference || "";
  const paymentBank = invoice.paymentBank || invoice.payment_bank || "";
  const bankTransferType = invoice.bankTransferType || invoice.bank_transfer_type || "";
  const cardType = invoice.cardType || invoice.card_type || "";

  return (
    <div id="invoice-print-area" className="w-full text-slate-900 bg-white font-sans text-xs space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
                      <BrandLogo width={64} height={64} className="h-full w-full" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              NexLapTech
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold">
            Connecting Customers with Trusted Tech Experts
          </p>
          <div className="text-[9px] text-slate-500 space-y-0.5 pt-0.5">
            <p>Contact: +91 8088979706 | +91 8904760125</p>
            <p>Email: nexbytetechnologies@gmail.com</p>
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
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            BILL TO:
          </span>
          <div className="font-bold text-slate-900">{custName}</div>
          {mob && <div className="text-slate-600">Mobile: {mob}</div>}
          {email && <div className="text-slate-600">Email: {email}</div>}
        </div>
        <div className="text-right">
          {addr && <div className="text-slate-600">{addr}</div>}
          <div className="text-slate-600">
            {[city, state, pin].filter(Boolean).join(", ")}
          </div>
          {gstEnabled && gstin && (
            <div className="mt-1 font-bold text-blue-700 text-[10px]">
              GSTIN: {gstin}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
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
          {validItems.length > 0 ? (
            validItems.map((item: any, idx: number) => (
              <tr key={item.id || idx} className="text-slate-700">
                <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                <td className="py-2 px-2">
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  {item.description && <div className="text-[9px] text-slate-500">{item.description}</div>}
                </td>
                <td className="py-2 px-2 text-center font-medium">{item.quantity}</td>
                <td className="py-2 px-2 text-right">{formatRupees(item.unitPrice)}</td>
                <td className="py-2 px-2 text-right text-slate-500">
                  {item.discount > 0 ? formatRupees(item.discount) : "-"}
                </td>
                <td className="py-2 px-2 text-right font-bold text-slate-900">
                  {formatRupees(item.lineTotal || (item.quantity * item.unitPrice - (item.discount || 0)))}
                </td>
              </tr>
            ))
          ) : (
            <tr className="text-slate-400 italic">
              <td colSpan={6} className="py-3 text-center text-[10px]">
                No items included.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-slate-200 pt-3 flex justify-end">
        <div className="w-full max-w-[240px] space-y-1.5 text-[11px]">
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
            {paymentMethod && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-700 text-right">
                  {paymentMethod === "bank_transfer"
                    ? `${String(bankTransferType || "Bank Transfer").toUpperCase()} Transfer`
                    : paymentMethod === "card"
                    ? `${String(cardType || "Card").toUpperCase()} Card`
                    : paymentMethod === "upi"
                    ? "UPI"
                    : paymentMethod.replace("_", " ").toUpperCase()}
                </span>
              </div>
            )}
            {paymentBank && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Bank / Issuer:</span>
                <span className="font-semibold text-slate-700 text-right">{paymentBank}</span>
              </div>
            )}
            {paymentReference && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Transaction / UTR ID:</span>
                <span className="font-semibold text-slate-700 text-right break-all">{paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`font-bold uppercase ${
                payStatus === "paid" ? "text-emerald-700" : payStatus === "partially_paid" ? "text-amber-600" : "text-rose-600"
              }`}>
                {payStatus.replace("_", " ")}
              </span>
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

      {/* Footer */}
      <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 text-center space-y-0.5">
        <p>Thank you for choosing NexLapTech!</p>
        <p>Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems</p>
      </div>
    </div>
  );
}
