"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import BrandLogo from "@/components/BrandLogo";
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
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  ArrowDownLeft,
  Calendar,
  FileSpreadsheet,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import {
  calculateInvoiceTotals,
  sanitizeInvoiceItems,
  formatRupees,
  validateMobile,
  validateEmail,
  validatePincode,
  validateGSTIN,
  CalculationResult,
} from "@/lib/billingUtils";

interface FormItem {
  id: string;
  name: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discount: number | string;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BillingStats {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  totalRevenue: number;
  totalPaid: number;
  totalDue: number;
  totalGst: number;
}

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState<"create" | "history" | "orders" | "bookings">("history");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Customer suggestions & catalog
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<{ products: any[]; services: any[] }>({
    products: [],
    services: [],
  });

  // Customer Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"manual" | "order" | "booking">("manual");
  const [referenceOrderNumber, setReferenceOrderNumber] = useState<string | null>(null);
  const [referenceBookingId, setReferenceBookingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("560070");

  // Items State
  const [items, setItems] = useState<FormItem[]>([
    {
      id: "item-1",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    },
  ]);

  // Financials & Payment State
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

  // History State with Server-Side Pagination
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [stats, setStats] = useState<BillingStats>({
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalDue: 0,
    totalGst: 0,
  });

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gstFilter, setGstFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pending Sources (Orders & Bookings)
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [statusUpdateInvoice, setStatusUpdateInvoice] = useState<any | null>(null);
  const [newStatusInput, setNewStatusInput] = useState<"paid" | "pending" | "partially_paid" | "refunded" | "cancelled">("paid");
  const [statusAmountPaid, setStatusAmountPaid] = useState<number | string>(0);
  const [statusPaymentMethod, setStatusPaymentMethod] = useState("upi");
  const [statusPaymentRef, setStatusPaymentRef] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [refundAmountInput, setRefundAmountInput] = useState<number | string>(0);
  const [refundReasonInput, setRefundReasonInput] = useState("");
  const [latestCreatedInvoice, setLatestCreatedInvoice] = useState<any | null>(null);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Date Presets Handler
  const handleDatePresetChange = (preset: "all" | "today" | "week" | "month" | "custom") => {
    setDatePreset(preset);
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const dStr = toDateStr(today);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(toDateStr(weekAgo));
      setEndDate(toDateStr(today));
    } else if (preset === "month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toDateStr(monthStart));
      setEndDate(toDateStr(today));
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Fetch Invoices from Server
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (gstFilter !== "all") params.set("gst", gstFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    gstFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Fetch Pending Sources (Orders & Bookings)
  const fetchPendingSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch("/api/admin/billing/pending-sources");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPendingOrders(data.orders || []);
          setPendingBookings(data.bookings || []);
        }
      }
    } catch (err) {
      console.warn("Could not load pending sources:", err);
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchPendingSources();
  }, []);

  // Live Shared Calculations
  const calculatedTotals: CalculationResult = useMemo(() => {
    const parsedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
    }));

    return calculateInvoiceTotals({
      items: parsedItems,
      globalDiscount: Number(globalDiscount) || 0,
      gstEnabled,
      gstin,
      paymentStatus,
      amountPaid: Number(amountPaid) || 0,
    });
  }, [items, globalDiscount, gstEnabled, gstin, paymentStatus, amountPaid]);

  // Payment Status selection helper in Create Form
  const handlePaymentStatusChange = (newStatus: "paid" | "pending" | "partially_paid") => {
    setPaymentStatus(newStatus);
    if (newStatus === "paid") {
      setAmountPaid(calculatedTotals.grandTotal);
    } else if (newStatus === "pending") {
      setAmountPaid(0);
    }
  };

  // Convert Product Order into Invoice
  const handleBillOrder = (order: any) => {
    if (order.isBilled) {
      alert(`Order ${order.orderNumber} is already billed under invoice ${order.invoiceNumber}.`);
      return;
    }
    setSourceType("order");
    setReferenceOrderNumber(order.orderNumber);
    setReferenceBookingId(null);
    setCustomerName(order.customerName || "");
    setMobile(order.mobile || "");
    setEmail(order.email || "");
    setAddress(order.address || "");
    setCity(order.city || "Bengaluru");

    if (Array.isArray(order.items) && order.items.length > 0) {
      setItems(
        order.items.map((i: any, idx: number) => ({
          id: `item-ord-${idx + 1}-${Date.now()}`,
          name: i.name || "Product Item",
          description: `Order ${order.orderNumber}`,
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          discount: 0,
        }))
      );
    } else {
      setItems([
        {
          id: `item-ord-${Date.now()}`,
          name: `Order #${order.orderNumber}`,
          description: "Hardware Order Fulfillment",
          quantity: 1,
          unitPrice: order.totalAmount || 0,
          discount: 0,
        },
      ]);
    }

    setPaymentStatus(order.paymentStatus === "paid" ? "paid" : "pending");
    if (order.paymentStatus === "paid") {
      setAmountPaid(order.totalAmount || 0);
    }
    setActiveTab("create");
    setSuccessMsg(`Populated invoice form from Order #${order.orderNumber}.`);
  };

  // Convert Service Booking into Invoice
  const handleBillBooking = (booking: any) => {
    if (booking.isBilled) {
      alert(`Booking ${booking.id} is already billed under invoice ${booking.invoiceNumber}.`);
      return;
    }
    setSourceType("booking");
    setReferenceBookingId(booking.id);
    setReferenceOrderNumber(null);
    setCustomerName(booking.customerName || "");
    setMobile(booking.mobile || "");
    setEmail(booking.email || "");
    setAddress(booking.address || "");
    setCity(booking.city || "Bengaluru");

    setItems([
      {
        id: `item-book-${Date.now()}`,
        name: booking.serviceName || "Laptop Repair & Service",
        description: `Booking ID: ${booking.id} • Date: ${booking.bookingDate}`,
        quantity: 1,
        unitPrice: booking.servicePrice || 800,
        discount: 0,
      },
    ]);

    setPaymentStatus(booking.status === "completed" ? "paid" : "pending");
    if (booking.status === "completed") {
      setAmountPaid(booking.servicePrice || 800);
    }
    setActiveTab("create");
    setSuccessMsg(`Populated invoice form from Service Booking #${booking.id}.`);
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
        discount: 0,
      },
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
        name: item.name ? `${item.name} (Copy)` : "",
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof FormItem, value: any) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  // Submit & Save Invoice
  const handleSaveInvoice = async () => {
    setErrorMsg("");
    setSuccessMsg("");

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
        amountPaid: paymentStatus === "paid" ? calculatedTotals.grandTotal : Number(amountPaid) || 0,
        source: sourceType,
        referenceOrderNumber: referenceOrderNumber || undefined,
        referenceBookingId: referenceBookingId || undefined,
      };

      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save invoice.");
      }

      const allocatedNum = data.invoice.invoiceNumber || data.invoice.invoice_number;
      setSuccessMsg(`Invoice ${allocatedNum} created and saved successfully!`);
      setLatestCreatedInvoice(data.invoice);
      setViewingInvoice(data.invoice);

      fetchInvoices();
      fetchPendingSources();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the invoice.");
    } finally {
      setSaving(false);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setSelectedCustomerId(null);
    setSourceType("manual");
    setReferenceOrderNumber(null);
    setReferenceBookingId(null);
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
        discount: 0,
      },
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

  // Quick Payment Status Update Action
  const handleOpenStatusModal = (inv: any) => {
    setStatusUpdateInvoice(inv);
    setNewStatusInput(inv.paymentStatus || inv.payment_status || "paid");
    setStatusAmountPaid(inv.amountPaid || inv.amount_paid || inv.grandTotal || inv.grand_total || 0);
    setStatusPaymentMethod(inv.paymentMethod || inv.payment_method || "upi");
    setStatusPaymentRef(inv.paymentReference || inv.payment_reference || "");
    setStatusNotes("");
    setRefundAmountInput(0);
    setRefundReasonInput("");
  };

  const handleSaveStatusUpdate = async () => {
    if (!statusUpdateInvoice) return;
    try {
      const invId = statusUpdateInvoice.id;
      const payload: any = {
        paymentStatus: newStatusInput,
        paymentMethod: statusPaymentMethod,
        paymentReference: statusPaymentRef,
        notes: statusNotes || undefined,
      };

      if (newStatusInput === "paid") {
        payload.amountPaid = statusUpdateInvoice.grandTotal || statusUpdateInvoice.grand_total;
      } else if (newStatusInput === "partially_paid") {
        payload.amountPaid = Number(statusAmountPaid);
      } else if (newStatusInput === "refunded") {
        payload.refundAmount = Number(refundAmountInput) || Number(statusUpdateInvoice.grandTotal || statusUpdateInvoice.grand_total);
        payload.refundReason = refundReasonInput || "Customer Refund Request";
      }

      const res = await fetch(`/api/admin/invoices/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }

      setStatusUpdateInvoice(null);
      fetchInvoices();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  // Print, Download, Share
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
    const invNum =
      typeof invObjOrNum === "string" && !invObjOrNum.includes("PREVIEW") && !invObjOrNum.includes("DRAFT")
        ? invObjOrNum
        : target?.invoiceNumber || target?.invoice_number;

    if (!invNum) {
      alert("Please save invoice first to generate official invoice number.");
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
      alert("Please save invoice first to generate an official share link.");
      return;
    }

    const invNum = target.invoiceNumber || target.invoice_number;
    const token = target.shareToken || target.share_token || target.id;
    const shareUrl = `${window.location.origin}/invoice/view/${token}`;
    const shareText = `NexLapTech Invoice ${invNum} for ${target.customerName || target.customer_name}. Total: ${formatRupees(
      target.grandTotal || target.grand_total
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `NEXLAPTECH Invoice ${invNum}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Share link copied to clipboard:\n${shareUrl}`);
    } catch (e) {
      alert(`Invoice Share Link:\n${shareUrl}`);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (gstFilter !== "all") params.set("gst", gstFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/admin/invoices/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="admin-billing space-y-6">
      {/* ── PRINT-ONLY INVOICE ROOT ────────────────────────────────────────── */}
      <div id="invoice-print-area" className="hidden print:block text-slate-900 bg-white font-sans p-0 m-0 w-full">
        <PrintableInvoiceDocument
          invoice={
            viewingInvoice ||
            latestCreatedInvoice || {
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
              createdBy: "Admin Officer",
            }
          }
        />
      </div>

      {/* ── SCREEN-ONLY UI WRAPPER ─────────────────────────────────────────── */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#26364D] pb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                Admin Billing &amp; Invoices
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Real-time tax compliance, financial settlements &amp; multi-channel invoice generation.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#111B32] p-1.5 rounded-xl border border-slate-200 dark:border-[#26364D]">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Invoices ({stats.totalCount})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "create"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Create Invoice
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Orders Billing ({pendingOrders.filter((o) => !o.isBilled).length} pending)
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "bookings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" /> Bookings Billing ({pendingBookings.filter((b) => !b.isBilled).length} pending)
            </button>
          </div>
        </div>

        {/* Metrics Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider block">Total Invoices</span>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5 block">{stats.totalCount}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Paid: {stats.paidCount} • Due: {stats.pendingCount}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider block">Total Billed</span>
            <span className="font-display text-xl font-bold text-blue-600 dark:text-cyan-400 mt-0.5 block">{formatRupees(stats.totalRevenue)}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Gross Invoice Value</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Collections (Paid)</span>
            <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{formatRupees(stats.totalPaid)}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Realized Revenue</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Outstanding Due</span>
            <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{formatRupees(stats.totalDue)}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Pending Settlement</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Total GST (18%)</span>
            <span className="font-display text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{formatRupees(stats.totalGst)}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">9% CGST + 9% SGST</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Refunds</span>
            <span className="font-display text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">{stats.refundedCount}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Reversed Records</span>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} aria-label="Dismiss error" className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} aria-label="Dismiss success message" className="text-emerald-500 hover:text-emerald-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── TAB 1: INVOICE HISTORY ────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-3">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice #, customer name, phone, or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search invoices"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by payment status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* GST Filter */}
                  <select
                    value={gstFilter}
                    onChange={(e) => {
                      setGstFilter(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by GST status"
                  >
                    <option value="all">All Tax Types</option>
                    <option value="enabled">GST Compliant (18%)</option>
                    <option value="disabled">Non-GST</option>
                  </select>

                  {/* Date Presets */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#17243B] p-1 rounded-lg border border-slate-200 dark:border-[#26364D]">
                    {(["all", "today", "week", "month"] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleDatePresetChange(preset)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                          datePreset === preset
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        {preset === "all" ? "All Time" : preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    aria-label="Export invoices report as CSV"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={fetchInvoices}
                    disabled={loading}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    aria-label="Refresh invoices list"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Custom Date Range Picker */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-[#1E2D4A] text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Date Range:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset("custom");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className="px-2.5 py-1 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-800 dark:text-slate-200"
                    aria-label="Filter start date"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset("custom");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className="px-2.5 py-1 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-800 dark:text-slate-200"
                    aria-label="Filter end date"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => handleDatePresetChange("all")}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Invoices Table Card */}
            <div className="rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0E172A] border-b border-slate-200 dark:border-[#26364D] text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                      <th scope="col" className="py-3 px-3.5">Invoice #</th>
                      <th scope="col" className="py-3 px-3.5">Date</th>
                      <th scope="col" className="py-3 px-3.5">Customer &amp; Contact</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Taxable</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Grand Total</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Paid / Due</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Status</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D4A]">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                          <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                          <td className="py-3 px-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                          <td className="py-3 px-3.5 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div></td>
                          <td className="py-3 px-3.5 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                          <td className="py-3 px-3.5 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                          <td className="py-3 px-3.5 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto"></div></td>
                          <td className="py-3 px-3.5 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold text-sm">No invoices found</p>
                          <p className="text-xs mt-0.5">Try adjusting your search query, status, or date range.</p>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => {
                        const invNum = inv.invoiceNumber || inv.invoice_number;
                        const dateStr = inv.invoiceDate || inv.invoice_date || (inv.createdAt || "").slice(0, 10);
                        const pStatus = inv.paymentStatus || inv.payment_status || "pending";
                        const grandTotal = Number(inv.grandTotal ?? inv.grand_total) || 0;
                        const amountPaidVal = Number(inv.amountPaid ?? inv.amount_paid) || 0;
                        const balanceDueVal = Number(inv.balanceDue ?? inv.balance_due) || 0;
                        const taxableVal = Number(inv.taxableAmount ?? inv.taxable_amount) || 0;
                        const isGst = !!(inv.gstEnabled ?? inv.gst_enabled);

                        return (
                          <tr
                            key={inv.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-[#17243B]/60 transition-colors"
                          >
                            {/* Invoice # */}
                            <td className="py-3 px-3.5">
                              <span className="font-mono font-bold text-blue-600 dark:text-cyan-400 block">
                                {invNum}
                              </span>
                              {isGst && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                                  GST 18%
                                </span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {dateStr}
                            </td>

                            {/* Customer & Contact */}
                            <td className="py-3 px-3.5">
                              <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                                {inv.customerName || inv.customer_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                {inv.mobile} {inv.city ? `• ${inv.city}` : ""}
                              </div>
                            </td>

                            {/* Taxable */}
                            <td className="py-3 px-3.5 text-right font-medium text-slate-600 dark:text-slate-300">
                              {formatRupees(taxableVal)}
                            </td>

                            {/* Grand Total */}
                            <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-[#F8FAFC]">
                              {formatRupees(grandTotal)}
                            </td>

                            {/* Paid / Due */}
                            <td className="py-3 px-3.5 text-right text-[11px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
                                {formatRupees(amountPaidVal)}
                              </span>
                              {balanceDueVal > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold block">
                                  Due: {formatRupees(balanceDueVal)}
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  pStatus === "paid"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : pStatus === "partially_paid"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                    : pStatus === "refunded"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                    : pStatus === "cancelled"
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                }`}
                              >
                                {pStatus.replace("_", " ")}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setViewingInvoice(inv)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40 dark:hover:text-cyan-400 transition-colors"
                                  title="View Invoice Details"
                                  aria-label={`View invoice ${invNum}`}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenStatusModal(inv)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400 transition-colors"
                                  title="Update Payment / Refund Status"
                                  aria-label={`Update payment status for ${invNum}`}
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownloadPdf(inv)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40 dark:hover:text-cyan-400 transition-colors"
                                  title="Download PDF"
                                  aria-label={`Download PDF for ${invNum}`}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleShare(inv)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400 transition-colors"
                                  title="Share Verified Invoice Link"
                                  aria-label={`Share invoice link for ${invNum}`}
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination Controls */}
              <div className="p-3.5 border-t border-slate-200 dark:border-[#26364D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {invoices.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}{" "}
                    invoices
                  </span>
                  <select
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        limit: Number(e.target.value),
                        page: 1,
                      }))
                    }
                    className="ml-2 px-2 py-1 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs"
                    aria-label="Items per page"
                  >
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                  <span className="px-2 font-semibold">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold"
                    aria-label="Next page"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CREATE INVOICE ─────────────────────────────────────────── */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Reference Banner if created from Order or Booking */}
              {(referenceOrderNumber || referenceBookingId) && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-cyan-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                    <span>
                      Generating tax invoice from{" "}
                      <strong>{referenceOrderNumber ? `Product Order #${referenceOrderNumber}` : `Service Booking #${referenceBookingId}`}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReferenceOrderNumber(null);
                      setReferenceBookingId(null);
                      setSourceType("manual");
                    }}
                    className="text-[11px] underline hover:text-blue-900"
                  >
                    Switch to Manual Invoice
                  </button>
                </div>
              )}

              {/* Customer Details Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" /> Customer Information
                  </h2>
                  <span className="text-[11px] text-slate-400">* Required for tax compliance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number (10-digit Indian) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pincode (6-digit)
                    </label>
                    <input
                      type="text"
                      placeholder="560070"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Address / Service Location
                    </label>
                    <input
                      type="text"
                      placeholder="Door No, Street, Landmark, Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" /> Invoice Line Items
                  </h2>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const lineGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    const lineNet = Math.max(0, lineGross - (Number(item.discount) || 0));

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full bg-blue-600/10 text-blue-600 dark:text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                            Line Item #{index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDuplicateItem(item)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                              title="Duplicate Line Item"
                              aria-label={`Duplicate item ${index + 1}`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Remove Line Item"
                              aria-label={`Remove item ${index + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Item Name / Product / Service *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Dell Latitude 7490 Screen Replacement"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Description / Specification / Serial No.
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 14.0 FHD IPS Panel, 1 Year NexLap Warranty"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Unit Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-bold"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Line Discount (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => handleUpdateItem(item.id, "discount", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                            />
                          </div>

                          <div className="sm:col-span-3 flex flex-col justify-end">
                            <span className="text-[10px] text-slate-400 block mb-1">Line Total</span>
                            <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-400 font-bold text-xs text-right block border border-blue-200/50 dark:border-blue-800/50">
                              {formatRupees(lineNet)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax & Payment Settings Card */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" /> Tax &amp; Payment Configuration
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GST Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Enable 18% GST</span>
                      <span className="text-[11px] text-slate-500 block">Splits 9% CGST + 9% SGST</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gstEnabled}
                        onChange={(e) => setGstEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* GSTIN Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Customer GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                      disabled={!gstEnabled}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* Global Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Overall Bill Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-bold"
                    />
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Payment Status
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-[#17243B] p-1 rounded-lg border border-slate-200 dark:border-[#26364D]">
                      {(["pending", "partially_paid", "paid"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handlePaymentStatusChange(status)}
                          className={`py-1.5 text-[11px] font-bold rounded capitalize ${
                            paymentStatus === status
                              ? status === "paid"
                                ? "bg-emerald-600 text-white"
                                : status === "partially_paid"
                                ? "bg-amber-600 text-white"
                                : "bg-rose-600 text-white"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {status.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="cash">Cash on Delivery / Walk-in Cash</option>
                      <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="other">Other / Cheque</option>
                    </select>
                  </div>

                  {/* Amount Paid (if partially paid) */}
                  {paymentStatus === "partially_paid" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Amount Paid (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-right"
                      />
                    </div>
                  )}

                  {/* Transaction Ref */}
                  {["upi", "bank_transfer", "card"].includes(paymentMethod) && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        UTR / Transaction Reference / Auth Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref: 312345678901"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Financial Summary Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="sticky top-6 p-5 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">Live Invoice Summary</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-400 text-[10px] font-bold">
                    Official NexLap Calculation
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatRupees(calculatedTotals.subtotal)}</span>
                  </div>

                  {calculatedTotals.globalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Global Discount:</span>
                      <span>-{formatRupees(calculatedTotals.globalDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold border-t border-slate-100 dark:border-[#1E2D4A] pt-2">
                    <span>Taxable Value:</span>
                    <span>{formatRupees(calculatedTotals.taxableAmount)}</span>
                  </div>

                  {calculatedTotals.gstEnabled ? (
                    <>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>CGST (9%):</span>
                        <span>{formatRupees(calculatedTotals.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>SGST (9%):</span>
                        <span>{formatRupees(calculatedTotals.sgst)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600 dark:text-cyan-400 font-bold text-xs">
                        <span>GST Total (18%):</span>
                        <span>{formatRupees(calculatedTotals.gstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Tax (GST Disabled):</span>
                      <span>₹0.00</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-[#F8FAFC] border-t-2 border-slate-900 dark:border-white pt-2.5">
                    <span>Grand Total:</span>
                    <span className="text-blue-600 dark:text-cyan-400">{formatRupees(calculatedTotals.grandTotal)}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] space-y-1.5 text-[11px] mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupees(calculatedTotals.amountPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Balance Due:</span>
                      <span className={calculatedTotals.balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}>
                        {formatRupees(calculatedTotals.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSaveInvoice}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    {saving ? "Generating & Saving..." : "Save & Issue Invoice"}
                  </button>

                  <button
                    onClick={handleResetForm}
                    disabled={saving}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: PRODUCT ORDERS BILLING ─────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Product Orders Ready for Billing</h2>
                <p className="text-xs text-slate-500">
                  Convert ecommerce &amp; hardware orders into official GST invoices with one click.
                </p>
              </div>
              <button
                onClick={fetchPendingSources}
                disabled={loadingSources}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSources ? "animate-spin" : ""}`} /> Refresh Orders
              </button>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0E172A] border-b border-slate-200 dark:border-[#26364D] text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                      <th scope="col" className="py-3 px-3.5">Order Number</th>
                      <th scope="col" className="py-3 px-3.5">Date</th>
                      <th scope="col" className="py-3 px-3.5">Customer</th>
                      <th scope="col" className="py-3 px-3.5">Items</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Order Total</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Billing Status</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D4A]">
                    {pendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No product orders found</p>
                        </td>
                      </tr>
                    ) : (
                      pendingOrders.map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-[#17243B]/60 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                            {(ord.createdAt || "").slice(0, 10)}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white">{ord.customerName}</div>
                            <div className="text-[11px] text-slate-500">{ord.mobile}</div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                            {ord.items.length > 0
                              ? ord.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")
                              : "Product hardware"}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                            {formatRupees(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {ord.isBilled ? (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                Invoiced ({ord.invoiceNumber})
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                Pending Invoice
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {ord.isBilled ? (
                              <button
                                onClick={() => {
                                  const found = invoices.find((i: any) => i.invoiceNumber === ord.invoiceNumber || i.invoice_number === ord.invoiceNumber);
                                  if (found) setViewingInvoice(found);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                View Invoice
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBillOrder(ord)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 mx-auto"
                              >
                                <Receipt className="h-3.5 w-3.5" /> Bill Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SERVICE BOOKINGS BILLING ───────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Service Bookings Ready for Billing</h2>
                <p className="text-xs text-slate-500">
                  Generate official invoices for laptop repairs, onsite service, and IT diagnostics.
                </p>
              </div>
              <button
                onClick={fetchPendingSources}
                disabled={loadingSources}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSources ? "animate-spin" : ""}`} /> Refresh Bookings
              </button>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#111B32] border border-slate-200 dark:border-[#26364D] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0E172A] border-b border-slate-200 dark:border-[#26364D] text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] uppercase tracking-wider">
                      <th scope="col" className="py-3 px-3.5">Booking ID</th>
                      <th scope="col" className="py-3 px-3.5">Date</th>
                      <th scope="col" className="py-3 px-3.5">Customer &amp; Contact</th>
                      <th scope="col" className="py-3 px-3.5">Service Details</th>
                      <th scope="col" className="py-3 px-3.5 text-right">Service Fee</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Billing Status</th>
                      <th scope="col" className="py-3 px-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D4A]">
                    {pendingBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No service bookings found</p>
                        </td>
                      </tr>
                    ) : (
                      pendingBookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-[#17243B]/60 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {b.id}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                            {b.bookingDate}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white">{b.customerName}</div>
                            <div className="text-[11px] text-slate-500">{b.mobile}</div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-medium">
                            {b.serviceName}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                            {formatRupees(b.servicePrice)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {b.isBilled ? (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                Invoiced ({b.invoiceNumber})
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                Pending Invoice
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {b.isBilled ? (
                              <button
                                onClick={() => {
                                  const found = invoices.find((i: any) => i.invoiceNumber === b.invoiceNumber || i.invoice_number === b.invoiceNumber);
                                  if (found) setViewingInvoice(found);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                View Invoice
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBillBooking(b)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 mx-auto"
                              >
                                <Receipt className="h-3.5 w-3.5" /> Bill Booking
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 1: VIEW INVOICE MODAL ────────────────────────────────────── */}
        {viewingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#0E172A] rounded-2xl border border-slate-200 dark:border-[#26364D] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Invoice {viewingInvoice.invoiceNumber || viewingInvoice.invoice_number}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Issued on {viewingInvoice.invoiceDate || viewingInvoice.invoice_date} by {viewingInvoice.createdBy || "Admin"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Close invoice preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Printable embed */}
              <div className="border border-slate-200 dark:border-[#26364D] rounded-xl p-4 bg-white">
                <PrintableInvoiceDocument invoice={viewingInvoice} />
              </div>

              {/* Audit Trail History */}
              {Array.isArray(viewingInvoice.auditTrail || viewingInvoice.audit_trail) && (
                <div className="space-y-2 border-t border-slate-100 dark:border-[#1E2D4A] pt-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Financial Audit Trail
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(viewingInvoice.auditTrail || viewingInvoice.audit_trail).map((audit: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 rounded bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] flex justify-between items-center text-slate-600 dark:text-slate-300"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white">{audit.action}</strong>: {audit.notes}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(audit.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-[#1E2D4A] pt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(viewingInvoice)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(viewingInvoice)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </button>
                  <button
                    onClick={() => handleShare(viewingInvoice)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share Link
                  </button>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: UPDATE PAYMENT STATUS MODAL ──────────────────────────── */}
        {statusUpdateInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#0E172A] rounded-2xl border border-slate-200 dark:border-[#26364D] max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D4A] pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Update Payment: {statusUpdateInvoice.invoiceNumber || statusUpdateInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setStatusUpdateInvoice(null)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Close status dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select New Payment Status
                  </label>
                  <select
                    value={newStatusInput}
                    onChange={(e: any) => setNewStatusInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs font-bold"
                  >
                    <option value="paid">Paid (Full Settlement)</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded (Issue Refund)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {newStatusInput === "partially_paid" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Total Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={statusAmountPaid}
                      onChange={(e) => setStatusAmountPaid(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs font-bold"
                    />
                  </div>
                )}

                {newStatusInput === "refunded" && (
                  <div className="space-y-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                    <div>
                      <label className="block font-semibold text-rose-800 dark:text-rose-300 mb-1">
                        Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#111B32] border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-rose-800 dark:text-rose-300 mb-1">
                        Refund Reason
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Defective part returned / Order cancelled"
                        value={refundReasonInput}
                        onChange={(e) => setRefundReasonInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#111B32] border border-rose-300 dark:border-rose-800 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={statusPaymentMethod}
                    onChange={(e) => setStatusPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="card">Card (Debit/Credit)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference (UTR)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 312345678901"
                    value={statusPaymentRef}
                    onChange={(e) => setStatusPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Notes / Comments
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer paid via Google Pay in showroom"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#17243B] border border-slate-200 dark:border-[#26364D] text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2D4A]">
                <button
                  onClick={() => setStatusUpdateInvoice(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#17243B] text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatusUpdate}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Payment Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ── PRINTABLE INVOICE DOCUMENT COMPONENT ── */
function PrintableInvoiceDocument({ invoice }: { invoice: any }) {
  const rawNum = invoice?.invoiceNumber || invoice?.invoice_number;
  const isSaved =
    rawNum &&
    !rawNum.includes("PREVIEW") &&
    !rawNum.includes("DRAFT") &&
    rawNum !== "Will be assigned on save" &&
    rawNum !== "Draft (Will be assigned on save)";
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
                  {formatRupees(item.lineTotal || item.quantity * item.unitPrice - (item.discount || 0))}
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
              <span
                className={`font-bold uppercase ${
                  payStatus === "paid" ? "text-emerald-700" : payStatus === "partially_paid" ? "text-amber-600" : "text-rose-600"
                }`}
              >
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
