"use client";

import React, { useEffect, useState, useDeferredValue, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Laptop,
  Cpu,
  HardDrive,
  Zap,
  Sparkles,
  Wrench,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowUpDown,
  Layers,
  ShoppingBag,
  Send,
  Lock,
  Calendar,
  UserCheck,
  DollarSign,
  Check,
  Clock,
  Printer,
  Building,
  MapPin,
  Download,
} from "lucide-react";
import { ENQUIRY_CATEGORIES } from "@/lib/enquiryCategories";

interface EnquiryRecord {
  id: string;
  reference_id: string;
  customer_name: string;
  phone: string;
  email?: string;
  city?: string;
  category: string;
  product_name: string;
  laptop_type?: string;
  budget?: string;
  budgetNum?: number;
  brand_preference?: string;
  processor_preference?: string;
  ram_preference?: string;
  storage_preference?: string;
  gpu_preference?: string;
  quantity?: string;
  condition?: string;
  use_case?: string;
  specs?: string;
  message?: string;
  requirements?: string;
  status: string;
  priority: string;
  assigned_to: string;
  follow_up_date?: string;
  admin_notes?: string;
  customer_reply?: string;
  converted_order_id?: string;
  converted_at?: string;
  messages?: any[];
  quotation?: any;
  quotations?: any[];
  recommended_products?: any[];
  matchingInventoryCount?: number;
  created_at: string;
  updated_at?: string;
}

interface EnquiryStats {
  total: number;
  newCount: number;
  inDiscussionCount: number;
  convertedCount: number;
  closedCount: number;
  urgentCount: number;
  totalPipelineValue: number;
}

const STAFF_ROSTER = [
  "Niranjan M (Hardware & PC Lead)",
  "Ramesh Kumar (Support Specialist)",
  "Admin Officer (Sales & Dispatch)",
  "Technical Diagnostics Team",
];

const WORKFLOW_STEPS = [
  { key: "new", label: "New Lead", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { key: "reviewed", label: "Reviewing", badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  { key: "assigned", label: "Staff Assigned", badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  { key: "matching", label: "Product Matching", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { key: "quotation_sent", label: "Quotation Sent", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { key: "awaiting_customer", label: "Customer Response", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { key: "converted", label: "Order Converted", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { key: "closed", label: "Closed / Archived", badge: "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/20" },
  { key: "cancelled", label: "Cancelled", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
];

function LaptopEnquiriesDashboard() {
  const searchParams = useSearchParams();
  const directId = searchParams?.get("id");

  // Data states
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnquiryStats>({
    total: 0,
    newCount: 0,
    inDiscussionCount: 0,
    convertedCount: 0,
    closedCount: 0,
    urgentCount: 0,
    totalPipelineValue: 0,
  });

  // Search & Filter states
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "matching" | "quotation" | "messages">("overview");

  // Drawer Form States
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  // Quotation Builder State
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteShipping, setQuoteShipping] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState("Includes 1-Year Comprehensive Warranty & Windows 11 Pro Setup");

  // Convert to Order State
  const [convertingOrder, setConvertingOrder] = useState(false);
  const [orderConvertSuccess, setOrderConvertSuccess] = useState<string | null>(null);

  // Create Enquiry Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEnquiryForm, setNewEnquiryForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    city: "Bengaluru",
    category: "laptop_purchase",
    product_name: "",
    budget: "",
    brand_preference: "Any Brand",
    processor_preference: "No Preference",
    ram_preference: "No Preference",
    storage_preference: "No Preference",
    use_case: "Office & Daily Use",
    priority: "Medium",
    assigned_to: "Unassigned",
    message: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<EnquiryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Enquiries
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        category: categoryFilter,
        status: statusFilter,
        priority: priorityFilter,
        assigned_to: assignedFilter,
        sortBy,
        sortOrder,
      });
      if (deferredSearch.trim()) {
        params.set("q", deferredSearch.trim());
      }

      const res = await fetch(`/api/admin/laptop-enquiries?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load enquiries directory.");
      }

      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: any) {
      console.error("Error fetching enquiries:", err);
      showNotification(err.message || "Failed to load enquiries", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, categoryFilter, statusFilter, priorityFilter, assignedFilter, sortBy, sortOrder, deferredSearch]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Realtime Sync Listener
  useEffect(() => {
    const handleSync = () => fetchEnquiries();
    window.addEventListener("nexbyte-realtime", handleSync);
    return () => window.removeEventListener("nexbyte-realtime", handleSync);
  }, [fetchEnquiries]);

  // Handle direct ID parameter
  useEffect(() => {
    if (directId && enquiries.length > 0) {
      const match = enquiries.find(
        (e) => e.id === directId || e.reference_id?.toLowerCase() === directId.toLowerCase()
      );
      if (match) {
        openEnquiryDetail(match);
      }
    }
  }, [directId, enquiries]);

  // Open Enquiry 360-Degree Drawer
  const openEnquiryDetail = async (enquiry: EnquiryRecord) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setActiveTab("overview");
    setSelectedEnquiry(enquiry);
    setReplyMessage("");
    setInternalNote("");
    setOrderConvertSuccess(null);

    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${enquiry.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.enquiry) {
          setSelectedEnquiry(data.enquiry);
        }
      }
    } catch (err) {
      console.warn("Could not fetch full enquiry details:", err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Status Update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedEnquiry) return;
    setSavingAction(true);
    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setSelectedEnquiry((prev: any) => ({ ...prev, status: newStatus }));
      showNotification(`Enquiry status updated to ${newStatus}.`);
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to update status", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Staff Assignment Update
  const handleAssignStaff = async (staffName: string) => {
    if (!selectedEnquiry) return;
    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: staffName }),
      });
      if (res.ok) {
        setSelectedEnquiry((prev: any) => ({ ...prev, assigned_to: staffName }));
        showNotification(`Assigned to ${staffName}.`);
        fetchEnquiries();
      }
    } catch {
      showNotification("Could not assign staff member", "error");
    }
  };

  // Priority Update
  const handleUpdatePriority = async (priority: string) => {
    if (!selectedEnquiry) return;
    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        setSelectedEnquiry((prev: any) => ({ ...prev, priority }));
        showNotification(`Priority set to ${priority}.`);
        fetchEnquiries();
      }
    } catch {
      showNotification("Could not update priority", "error");
    }
  };

  // Follow-up Date Update
  const handleUpdateFollowUp = async (dateStr: string) => {
    if (!selectedEnquiry) return;
    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_up_date: dateStr }),
      });
      if (res.ok) {
        setSelectedEnquiry((prev: any) => ({ ...prev, follow_up_date: dateStr }));
        showNotification(`Follow-up reminder set for ${dateStr}.`);
        fetchEnquiries();
      }
    } catch {
      showNotification("Could not set reminder", "error");
    }
  };

  // Send Customer-Visible Message
  const handleSendCustomerReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) return;
    setSavingAction(true);
    try {
      const res = await fetch(`/api/laptop-enquiries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          message: replyMessage.trim(),
          is_internal: false,
          status: selectedEnquiry.status === "new" ? "replied" : selectedEnquiry.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to deliver reply");
      const data = await res.json();
      setReplyMessage("");
      if (data.enquiry) setSelectedEnquiry(data.enquiry);
      showNotification("Reply posted to customer portal.");
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to post message", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Save Internal Staff Note
  const handleSaveInternalNote = async () => {
    if (!selectedEnquiry || !internalNote.trim()) return;
    setSavingAction(true);
    try {
      const res = await fetch(`/api/laptop-enquiries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEnquiry.id,
          message: internalNote.trim(),
          is_internal: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const data = await res.json();
      setInternalNote("");
      if (data.enquiry) setSelectedEnquiry(data.enquiry);
      showNotification("Private internal note logged securely.");
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to save note", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Attach Recommended Product to Proposal
  const handleAttachProduct = async (product: any) => {
    if (!selectedEnquiry) return;
    const currentList = selectedEnquiry.recommended_products || [];
    const exists = currentList.some((p: any) => p.id === product.id);
    const updatedList = exists
      ? currentList.filter((p: any) => p.id !== product.id)
      : [...currentList, product];

    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommended_products: updatedList,
          status: selectedEnquiry.status === "new" ? "matching" : selectedEnquiry.status,
        }),
      });
      if (res.ok) {
        setSelectedEnquiry((prev: any) => ({
          ...prev,
          recommended_products: updatedList,
          status: prev.status === "new" ? "matching" : prev.status,
        }));
        showNotification(exists ? "Product removed from proposal." : "Product attached to enquiry proposal.");
        fetchEnquiries();
      }
    } catch {
      showNotification("Could not update product recommendations", "error");
    }
  };

  // Save Quotation
  const handleSaveQuotation = async () => {
    if (!selectedEnquiry) return;
    setSavingAction(true);

    const prods = selectedEnquiry.recommended_products || [];
    const subtotal = prods.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);
    const discount = Number(quoteDiscount || 0);
    const gst = Math.round((subtotal - discount) * 0.18);
    const shipping = Number(quoteShipping || 0);
    const finalAmount = Math.max(0, subtotal - discount + gst + shipping);

    const quoteObj = {
      quote_number: `QT-2026-${selectedEnquiry.reference_id?.slice(-4) || "0001"}`,
      items: prods,
      subtotal,
      discount,
      gst,
      shipping,
      finalAmount,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      notes: quoteNotes,
      status: "sent",
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotation: quoteObj,
          status: "quotation_sent",
        }),
      });
      if (!res.ok) throw new Error("Failed to save quotation");
      setSelectedEnquiry((prev: any) => ({
        ...prev,
        quotation: quoteObj,
        status: "quotation_sent",
      }));
      showNotification("Quotation generated and saved.");
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to save quotation", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Convert Enquiry to Official Order
  const handleConvertToOrder = async () => {
    if (!selectedEnquiry) return;
    setConvertingOrder(true);
    setOrderConvertSuccess(null);

    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${selectedEnquiry.id}/convert-to-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Converted from Admin Lead Console",
          payment_method: "Invoice / Direct Settlement",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert enquiry to order.");
      }

      setOrderConvertSuccess(data.order?.order_id || data.order?.id);
      setSelectedEnquiry((prev: any) => ({
        ...prev,
        status: "converted",
        converted_order_id: data.order?.order_id || data.order?.id,
      }));
      showNotification(`Enquiry successfully converted into Order #${data.order?.order_id || data.order?.id}!`);
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to convert order", "error");
    } finally {
      setConvertingOrder(false);
    }
  };

  // Create Enquiry Lead Submission
  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/laptop-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnquiryForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register lead.");
      }

      showNotification(`Enquiry #${data.enquiry?.reference_id} created successfully.`);
      setShowCreateModal(false);
      setNewEnquiryForm({
        customer_name: "",
        phone: "",
        email: "",
        city: "Bengaluru",
        category: "laptop_purchase",
        product_name: "",
        budget: "",
        brand_preference: "Any Brand",
        processor_preference: "No Preference",
        ram_preference: "No Preference",
        storage_preference: "No Preference",
        use_case: "Office & Daily Use",
        priority: "Medium",
        assigned_to: "Unassigned",
        message: "",
      });
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      setCreateError(err.message || "Failed to create lead.");
    } finally {
      setCreating(false);
    }
  };

  // Delete Enquiry
  const handleDeleteEnquiry = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/laptop-enquiries/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete enquiry");
      showNotification(`Enquiry #${deleteTarget.reference_id || deleteTarget.id} deleted.`);
      setDeleteTarget(null);
      if (selectedEnquiry && selectedEnquiry.id === deleteTarget.id) {
        setDrawerOpen(false);
      }
      fetchEnquiries();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to delete enquiry", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Helpers
  const formatINR = (amt?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const getWhatsAppLink = (phone?: string, name?: string, refId?: string, prod?: string) => {
    if (!phone) return "#";
    const clean = phone.replace(/\D/g, "");
    const fullNumber = clean.length === 10 ? `91${clean}` : clean;
    const text = encodeURIComponent(
      `Hello ${name || "Customer"}, this is NEXLAPTECH IT Support. Regarding your enquiry ${refId || ""} for ${prod || "Hardware"}...`
    );
    return `https://wa.me/${fullNumber}?text=${text}`;
  };

  const getStatusBadge = (statusKey: string) => {
    const step = WORKFLOW_STEPS.find((s) => s.key === statusKey) || {
      label: statusKey,
      badge: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-300 dark:border-white/20",
    };
    return (
      <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${step.badge}`}>
        {step.label}
      </span>
    );
  };

  return (
    <main role="main" aria-label="Laptop and Tech Enquiries Console" className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border border-rose-500/40"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-cyan-500/10 border border-indigo-500/20 dark:border-cyan-500/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Laptop &amp; Tech Enquiries Console
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                End-to-end lead workflow: AI-assisted inventory matching, quotations, staff assignment, and order conversion.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/admin/laptop-enquiries/export"
            download
            className="futuristic-btn-secondary min-h-[44px] px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100"
            aria-label="Export enquiries to CSV"
          >
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setShowCreateModal(true)}
            className="futuristic-btn-primary min-h-[44px] px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            aria-label="Create new customer enquiry lead"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Total Enquiries</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-1">Across 18 tech categories</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">New Leads</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.newCount}
          </p>
          <span className="text-[11px] text-blue-700 dark:text-blue-400 block mt-1">Needs review &amp; assignment</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">In Discussion / Quotes</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.inDiscussionCount}
          </p>
          <span className="text-[11px] text-purple-700 dark:text-purple-400 block mt-1">Active proposals &amp; negotiations</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Orders Converted</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.convertedCount}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">
            Pipeline: {formatINR(stats.totalPipelineValue)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="futuristic-card p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input with useDeferredValue */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Ref ID, customer name, phone, specs, or hardware..."
              className="futuristic-input w-full pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-white min-h-[44px]"
              aria-label="Search laptop enquiries"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-white min-h-[44px] min-w-[28px] flex items-center justify-center"
                aria-label="Clear search input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className="futuristic-input w-full py-2.5 pl-3 pr-8 text-xs min-h-[44px] text-slate-800 dark:text-slate-100"
            >
              <option value="all">All Categories</option>
              {ENQUIRY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.shortLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="w-full sm:w-40">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
              className="futuristic-input w-full py-2.5 pl-3 pr-8 text-xs min-h-[44px] text-slate-800 dark:text-slate-100"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="futuristic-btn-secondary min-h-[44px] min-w-[44px] flex items-center justify-center px-3"
              aria-label={`Toggle sort order, currently ${sortOrder === "asc" ? "ascending" : "descending"}`}
            >
              <ArrowUpDown className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </button>

            <button
              type="button"
              onClick={fetchEnquiries}
              className="futuristic-btn-secondary min-h-[44px] min-w-[44px] flex items-center justify-center px-3"
              aria-label="Refresh enquiry list"
            >
              <RefreshCw className={`h-4 w-4 text-slate-700 dark:text-slate-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Workflow Progression Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
            }`}
            aria-label="Filter all statuses"
          >
            All ({stats.total})
          </button>
          {WORKFLOW_STEPS.map((st) => (
            <button
              key={st.key}
              onClick={() => {
                setStatusFilter(st.key);
                setPage(1);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st.key
                  ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-indigo-500/20"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              }`}
              aria-label={`Filter by ${st.label}`}
            >
              {st.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Showing {enquiries.length} of {totalCount} records
          </span>
        </div>
      </div>

      {/* Main Enquiries Content */}
      {loading && enquiries.length === 0 ? (
        <div className="text-center py-20 futuristic-card rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 font-medium">
            Loading tech enquiries...
          </p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-16 futuristic-card rounded-2xl">
          <Laptop className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No customer enquiries found matching current filters.</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Try adjusting your search query, or clear active category and status filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid (< 1024px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {enquiries.map((e) => (
              <div
                key={e.id}
                className="futuristic-card p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                <div>
                  {/* Card Header: Ref ID + Status + Priority */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-white/5">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                        {e.reference_id || e.id}
                      </span>
                      <h2 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 line-clamp-1">
                        {e.product_name || e.laptop_type || "Technical Enquiry"}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(e.status)}
                      {e.priority === "Urgent" || e.priority === "High" ? (
                        <span className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                          {e.priority} Priority
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Customer & Requirement Meta */}
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 mt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{e.customer_name}</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        {e.budget || "Budget Flexible"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>{e.phone}</span>
                      {e.city && <span className="text-slate-500">&bull; {e.city}</span>}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2 pt-1">
                      &ldquo;{e.specs || e.message || e.requirements || "Details submitted by customer"}&rdquo;
                    </div>

                    {e.assigned_to && e.assigned_to !== "Unassigned" && (
                      <div className="text-[10px] text-indigo-600 dark:text-cyan-400 font-semibold pt-1 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        <span>Staff: {e.assigned_to}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {e.phone && (
                      <a
                        href={getWhatsAppLink(e.phone, e.customer_name, e.reference_id, e.product_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                        aria-label={`Send WhatsApp to ${e.customer_name}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    )}
                    {e.phone && (
                      <a
                        href={`tel:${e.phone}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label={`Call ${e.customer_name}`}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEnquiryDetail(e)}
                      className="futuristic-btn-primary min-h-[44px] px-3.5 text-xs flex items-center gap-1.5 font-bold"
                      aria-label={`Open details for ${e.reference_id}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Pipeline View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop High-Density Table (>= 1024px) */}
          <div className="hidden lg:block futuristic-card rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" aria-label="Laptop Enquiries Data Table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Ref ID
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Customer &amp; Contact
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Requirement &amp; Preferred Specs
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Budget &amp; Target
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-center">
                      Workflow Status
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Assigned Staff
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {enquiries.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Ref ID & Priority */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 block">
                          {e.reference_id || e.id}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                          {e.created_at ? new Date(e.created_at).toLocaleDateString("en-IN") : "Recent"}
                        </span>
                        {e.priority === "Urgent" || e.priority === "High" ? (
                          <span className="inline-block text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider mt-0.5">
                            {e.priority}
                          </span>
                        ) : null}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {e.customer_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                          <Phone className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span>{e.phone}</span>
                        </div>
                        {e.city && (
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{e.city}</span>
                          </div>
                        )}
                      </td>

                      {/* Requirement & Specs */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {e.product_name || e.laptop_type || "Hardware Requirement"}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                          {e.specs || e.message || "Custom requirements specified"}
                        </div>
                        {e.brand_preference && e.brand_preference !== "Any Brand" && (
                          <span className="inline-block text-[10px] font-medium text-indigo-600 dark:text-cyan-400 mt-0.5">
                            Brand: {e.brand_preference}
                          </span>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs block">
                          {e.budget || "Flexible"}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                          Qty: {e.quantity || "1 Unit"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(e.status)}
                        {e.converted_order_id && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mt-1 font-bold">
                            #{e.converted_order_id}
                          </span>
                        )}
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {e.assigned_to || "Unassigned"}
                        </span>
                        {e.follow_up_date && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5 flex items-center gap-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>Due: {e.follow_up_date}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {e.phone && (
                            <a
                              href={getWhatsAppLink(e.phone, e.customer_name, e.reference_id, e.product_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                              aria-label={`Send WhatsApp to ${e.customer_name}`}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}

                          <button
                            onClick={() => openEnquiryDetail(e)}
                            className="min-h-[44px] px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                            aria-label={`Manage pipeline for enquiry ${e.reference_id}`}
                          >
                            <Eye className="h-3.5 w-3.5" /> Workflow
                          </button>

                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                            aria-label={`Delete enquiry ${e.reference_id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Page {page} of {totalPages} &bull; {totalCount} total enquiries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="futuristic-btn-secondary min-h-[44px] px-3.5 py-2 text-xs flex items-center gap-1 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-slate-500">&hellip;</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all ${
                            page === p
                              ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-indigo-500/20"
                              : "bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
                          }`}
                          aria-label={`Go to page ${p}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="futuristic-btn-secondary min-h-[44px] px-3.5 py-2 text-xs flex items-center gap-1 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── ENQUIRY 360-DEGREE WORKFLOW DRAWER ─── */}
      {drawerOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-3xl h-full bg-white dark:bg-[#0B0F1E] border-l border-slate-200 dark:border-white/10 p-5 sm:p-6 overflow-y-auto z-10 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-cyan-500/30">
                      {selectedEnquiry.reference_id || selectedEnquiry.id}
                    </span>
                    {getStatusBadge(selectedEnquiry.status)}
                    {selectedEnquiry.priority && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {selectedEnquiry.priority} Priority
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {selectedEnquiry.product_name || selectedEnquiry.laptop_type || "Lead Details"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Workflow Status Progress Stepper */}
              <div className="py-3 border-b border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                  Workflow Progression:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {WORKFLOW_STEPS.map((step) => (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => handleUpdateStatus(step.key)}
                      disabled={savingAction}
                      className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        selectedEnquiry.status === step.key
                          ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md"
                          : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                      aria-label={`Change status to ${step.label}`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Communication Bar */}
              <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-200 dark:border-white/10">
                {selectedEnquiry.phone && (
                  <>
                    <a
                      href={getWhatsAppLink(selectedEnquiry.phone, selectedEnquiry.customer_name, selectedEnquiry.reference_id, selectedEnquiry.product_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
                      aria-label="Chat on WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                      aria-label="Direct Phone Call"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </>
                )}

                {selectedEnquiry.email && (
                  <a
                    href={`mailto:${selectedEnquiry.email}?subject=NEXLAPTECH%20Quotation%20${selectedEnquiry.reference_id}`}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    aria-label="Send direct email"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}

                {/* Convert to Order One-Click Action */}
                {selectedEnquiry.status !== "converted" ? (
                  <button
                    type="button"
                    disabled={convertingOrder}
                    onClick={handleConvertToOrder}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 ml-auto"
                    aria-label="Convert this enquiry into an official order"
                  >
                    {convertingOrder ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                    <span>Convert to Order</span>
                  </button>
                ) : (
                  <span className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Order #{selectedEnquiry.converted_order_id} Converted</span>
                  </span>
                )}
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-2 pt-4 border-b border-slate-200 dark:border-white/10">
                {[
                  { id: "overview", label: "Specs & Details" },
                  { id: "matching", label: `Inventory Matching (${selectedEnquiry.inventoryMatches?.length || 0})` },
                  { id: "quotation", label: "Quotation Builder" },
                  { id: "messages", label: `Thread (${selectedEnquiry.messages?.length || 0})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                      activeTab === t.id
                        ? "border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-400"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    aria-label={`Switch to ${t.label} tab`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="pt-4">
                {drawerLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 dark:text-cyan-400 mx-auto" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Loading complete details...</p>
                  </div>
                ) : activeTab === "overview" ? (
                  <div className="space-y-4 text-xs">
                    {/* Customer & Assignment Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Customer Contact Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Customer Information
                        </span>
                        <div>
                          <strong className="text-slate-900 dark:text-white text-sm">{selectedEnquiry.customer_name}</strong>
                          <div className="text-slate-700 dark:text-slate-300 mt-1">Phone: {selectedEnquiry.phone}</div>
                          <div className="text-slate-700 dark:text-slate-300">Email: {selectedEnquiry.email || "N/A"}</div>
                          <div className="text-slate-700 dark:text-slate-300">City: {selectedEnquiry.city || "Bengaluru"}</div>
                        </div>
                      </div>

                      {/* Staff & Follow-up Assignment Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Assignment &amp; Scheduling
                        </span>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            Assigned Staff Member:
                          </label>
                          <select
                            value={selectedEnquiry.assigned_to || "Unassigned"}
                            onChange={(e) => handleAssignStaff(e.target.value)}
                            aria-label="Assign staff member"
                            className="futuristic-input w-full p-2 text-xs text-slate-800 dark:text-slate-100"
                          >
                            <option value="Unassigned">Unassigned</option>
                            {STAFF_ROSTER.map((staff) => (
                              <option key={staff} value={staff}>
                                {staff}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Priority:
                            </label>
                            <select
                              value={selectedEnquiry.priority || "Medium"}
                              onChange={(e) => handleUpdatePriority(e.target.value)}
                              aria-label="Set enquiry priority"
                              className="futuristic-input w-full p-2 text-xs text-slate-800 dark:text-slate-100"
                            >
                              <option value="Normal">Normal</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                              Follow-Up Due:
                            </label>
                            <input
                              type="date"
                              value={selectedEnquiry.follow_up_date || ""}
                              onChange={(e) => handleUpdateFollowUp(e.target.value)}
                              aria-label="Set follow-up reminder date"
                              className="futuristic-input w-full p-2 text-xs text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Specifications Box */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                        Customer Technical Requirements
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Budget Target</span>
                          <strong className="text-amber-600 dark:text-amber-400 text-xs">{selectedEnquiry.budget || "Flexible"}</strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Brand Preference</span>
                          <strong className="text-slate-900 dark:text-white text-xs">{selectedEnquiry.brand_preference || "Any Brand"}</strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">Processor</span>
                          <strong className="text-slate-900 dark:text-white text-xs">{selectedEnquiry.processor_preference || "No Preference"}</strong>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">RAM / Memory</span>
                          <strong className="text-slate-900 dark:text-white text-xs">{selectedEnquiry.ram_preference || "No Preference"}</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">Submitted Message / Scope:</span>
                        <p className="text-slate-800 dark:text-slate-200 italic bg-white dark:bg-black/30 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                          &ldquo;{selectedEnquiry.message || selectedEnquiry.requirements || "No additional text provided"}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "matching" ? (
                  /* AI-Assisted Inventory Matching */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-cyan-500/10 border border-indigo-200 dark:border-cyan-500/30 flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong className="text-indigo-950 dark:text-cyan-300 font-bold block">
                          AI-Assisted Inventory Match Engine
                        </strong>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          Products matched against actual store stock based on customer budget (₹{selectedEnquiry.budget || "any"}), preferred CPU, RAM, and brand requirements.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedEnquiry.inventoryMatches && selectedEnquiry.inventoryMatches.length > 0 ? (
                        selectedEnquiry.inventoryMatches.map((item: any) => {
                          const isAttached = (selectedEnquiry.recommended_products || []).some(
                            (p: any) => p.id === item.id
                          );

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isAttached
                                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {item.title}
                                    </span>
                                    <span
                                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                        item.matchScore >= 80
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                          : item.matchScore >= 60
                                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                          : "bg-slate-200 text-slate-700 border-slate-300"
                                      }`}
                                    >
                                      {item.matchScore}% Match
                                    </span>
                                    {item.stock > 0 ? (
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                        In Stock ({item.stock})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-rose-500 font-semibold">Backorder</span>
                                    )}
                                  </div>

                                  <div className="text-xs font-extrabold text-indigo-700 dark:text-cyan-400 mt-1">
                                    {formatINR(item.price)}
                                  </div>

                                  {/* Rationale Reasons */}
                                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 space-y-0.5">
                                    {item.matchReasons.map((r: string, rIdx: number) => (
                                      <li key={rIdx} className="flex items-center gap-1.5">
                                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAttachProduct(item)}
                                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
                                    isAttached
                                      ? "bg-emerald-600 text-white"
                                      : "futuristic-btn-primary"
                                  }`}
                                  aria-label={isAttached ? "Remove from proposal" : "Attach product to quotation"}
                                >
                                  {isAttached ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" /> Attached to Proposal
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4" /> Attach to Quotation
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          No inventory matches found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeTab === "quotation" ? (
                  /* Quotation Builder */
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
                        <div>
                          <strong className="text-slate-900 dark:text-white text-sm">
                            Quotation #{selectedEnquiry.quotation?.quote_number || `QT-2026-${selectedEnquiry.reference_id?.slice(-4) || "0001"}`}
                          </strong>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                            Customer: {selectedEnquiry.customer_name} ({selectedEnquiry.phone})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-500/20">
                          {selectedEnquiry.quotation ? "Quotation Active" : "Draft Quotation"}
                        </span>
                      </div>

                      {/* Items Selected */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Quotation Hardware Items ({selectedEnquiry.recommended_products?.length || 0})
                        </span>
                        {selectedEnquiry.recommended_products && selectedEnquiry.recommended_products.length > 0 ? (
                          selectedEnquiry.recommended_products.map((p: any, idx: number) => (
                            <div
                              key={p.id || idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5"
                            >
                              <div className="font-bold text-slate-900 dark:text-white">{p.title}</div>
                              <div className="font-extrabold text-indigo-700 dark:text-cyan-400">
                                {formatINR(p.price)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-white dark:bg-white/[0.02] rounded-lg border border-dashed border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400">
                            No items attached yet. Go to <strong>Inventory Matching</strong> tab to attach products.
                          </div>
                        )}
                      </div>

                      {/* Pricing Calculator */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Special Discount (₹):
                          </label>
                          <input
                            type="number"
                            value={quoteDiscount}
                            onChange={(e) => setQuoteDiscount(Number(e.target.value) || 0)}
                            className="futuristic-input w-full p-2 text-xs"
                            aria-label="Quotation discount in rupees"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Shipping &amp; Delivery Fee (₹):
                          </label>
                          <input
                            type="number"
                            value={quoteShipping}
                            onChange={(e) => setQuoteShipping(Number(e.target.value) || 0)}
                            className="futuristic-input w-full p-2 text-xs"
                            aria-label="Quotation shipping in rupees"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Warranty Terms &amp; Scope:
                        </label>
                        <input
                          type="text"
                          value={quoteNotes}
                          onChange={(e) => setQuoteNotes(e.target.value)}
                          className="futuristic-input w-full p-2 text-xs"
                          aria-label="Quotation warranty notes"
                        />
                      </div>

                      {/* Totals Summary */}
                      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-cyan-500/5 border border-indigo-200 dark:border-cyan-500/20 space-y-1">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>Hardware Subtotal:</span>
                          <span>
                            {formatINR(
                              (selectedEnquiry.recommended_products || []).reduce(
                                (s: number, p: any) => s + Number(p.price || 0),
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>GST (18% Applicable):</span>
                          <span>
                            {formatINR(
                              Math.round(
                                ((selectedEnquiry.recommended_products || []).reduce(
                                  (s: number, p: any) => s + Number(p.price || 0),
                                  0
                                ) - quoteDiscount) * 0.18
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-white/10">
                          <span>Final Payable Amount:</span>
                          <span className="text-indigo-700 dark:text-cyan-400">
                            {formatINR(
                              Math.max(
                                0,
                                Math.round(
                                  ((selectedEnquiry.recommended_products || []).reduce(
                                    (s: number, p: any) => s + Number(p.price || 0),
                                    0
                                  ) - quoteDiscount) * 1.18 + quoteShipping
                                )
                              )
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          disabled={savingAction}
                          onClick={handleSaveQuotation}
                          className="futuristic-btn-primary min-h-[44px] px-6 text-xs font-bold flex items-center gap-1.5"
                          aria-label="Save formal quotation"
                        >
                          {savingAction ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                          <span>Generate &amp; Save Quotation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Messages & Audit Thread */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 max-h-60 overflow-y-auto space-y-2.5">
                      {selectedEnquiry.messages && selectedEnquiry.messages.length > 0 ? (
                        selectedEnquiry.messages.map((m: any, idx: number) => (
                          <div
                            key={m.id || idx}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              m.is_internal
                                ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200"
                                : m.sender === "admin"
                                ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-950 dark:text-indigo-200 ml-4"
                                : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mr-4"
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold opacity-80">
                              <span className="flex items-center gap-1">
                                {m.is_internal && <Lock className="h-3 w-3 text-amber-500" />}
                                {m.is_internal ? "Private Staff Note" : m.sender === "admin" ? "Staff Reply" : selectedEnquiry.customer_name}
                              </span>
                              <span>{new Date(m.timestamp || Date.now()).toLocaleString("en-IN")}</span>
                            </div>
                            <p>{m.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-500 text-xs">
                          No conversation messages logged yet.
                        </div>
                      )}
                    </div>

                    {/* Dual Action Forms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Customer Reply */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                        <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Public Reply to Customer</span>
                          <span className="text-[10px] text-slate-500">Visible on portal</span>
                        </label>
                        <textarea
                          rows={2}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type customer reply..."
                          className="futuristic-input w-full p-2.5 text-xs resize-none"
                          aria-label="Public reply to customer"
                        />
                        <button
                          type="button"
                          disabled={savingAction || !replyMessage.trim()}
                          onClick={handleSendCustomerReply}
                          className="futuristic-btn-primary min-h-[44px] px-4 text-xs font-bold flex items-center gap-1.5 ml-auto"
                          aria-label="Send public reply"
                        >
                          <Send className="h-3 w-3" /> Send Reply
                        </button>
                      </div>

                      {/* Staff Internal Note */}
                      <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-500/20 space-y-2">
                        <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private Staff Note</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">Admins only</span>
                        </label>
                        <textarea
                          rows={2}
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          placeholder="Log supplier price, phone call..."
                          className="futuristic-input w-full p-2.5 text-xs resize-none"
                          aria-label="Private internal note"
                        />
                        <button
                          type="button"
                          disabled={savingAction || !internalNote.trim()}
                          onClick={handleSaveInternalNote}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 ml-auto"
                          aria-label="Save private internal note"
                        >
                          <Lock className="h-3 w-3" /> Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="futuristic-btn-secondary min-h-[44px] px-5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                aria-label="Close details drawer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE NEW LEAD MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg futuristic-card bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                Register New Lead / Enquiry
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                aria-label="Close create lead modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEnquiry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEnquiryForm.customer_name}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, customer_name: e.target.value })}
                    placeholder="Customer Name"
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Customer Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newEnquiryForm.phone}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, phone: e.target.value })}
                    placeholder="10-digit phone"
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Customer Phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Category
                  </label>
                  <select
                    value={newEnquiryForm.category}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, category: e.target.value })}
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Enquiry Category"
                  >
                    {ENQUIRY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Product / Requirement Name
                  </label>
                  <input
                    type="text"
                    value={newEnquiryForm.product_name}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, product_name: e.target.value })}
                    placeholder="e.g. Dell Latitude i7 or Gaming PC"
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Product or requirement name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Budget Target
                  </label>
                  <input
                    type="text"
                    value={newEnquiryForm.budget}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, budget: e.target.value })}
                    placeholder="e.g. ₹40,000 – ₹50,000"
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Budget target"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Priority
                  </label>
                  <select
                    value={newEnquiryForm.priority}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, priority: e.target.value })}
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Lead Priority"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Assigned Staff
                  </label>
                  <select
                    value={newEnquiryForm.assigned_to}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, assigned_to: e.target.value })}
                    className="futuristic-input w-full min-h-[44px]"
                    aria-label="Assign staff"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {STAFF_ROSTER.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Requirement Details / Scope
                </label>
                <textarea
                  rows={2}
                  value={newEnquiryForm.message}
                  onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, message: e.target.value })}
                  placeholder="Customer requirements, preferred processor, RAM..."
                  className="futuristic-input w-full p-2.5 text-xs"
                  aria-label="Requirement message"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="futuristic-btn-secondary min-h-[44px] px-4 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  aria-label="Cancel lead creation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="futuristic-btn-primary min-h-[44px] px-6 text-xs font-semibold flex items-center gap-1.5"
                  aria-label="Register lead"
                >
                  {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Register Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md futuristic-card bg-white dark:bg-[#0B0F1E] border border-rose-500/30 p-6 rounded-2xl shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Delete Tech Enquiry?</h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  Are you sure you want to remove enquiry <strong>#{deleteTarget.reference_id || deleteTarget.id}</strong> for {deleteTarget.customer_name}?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="futuristic-btn-secondary min-h-[44px] px-4 text-xs font-semibold text-slate-800 dark:text-slate-200"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteEnquiry}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                aria-label="Confirm deletion"
              >
                {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete Enquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminLaptopEnquiriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Enquiries Console...</div>}>
      <LaptopEnquiriesDashboard />
    </Suspense>
  );
}
