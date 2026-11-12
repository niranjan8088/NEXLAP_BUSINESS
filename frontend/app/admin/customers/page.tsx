"use client";

import React, { useEffect, useState, useDeferredValue, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Download,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  ShoppingBag,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  FileText,
  ArrowUpDown,
  Laptop,
} from "lucide-react";

interface CustomerRecord {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  status: "active" | "inactive" | string;
  tag: "Standard" | "VIP" | "Business" | string;
  totalBookings: number;
  reviewsCount?: number;
  certificatesCount?: number;
  productsPurchased?: string;
  servicesTaken?: string;
  ordersCount: number;
  bookingsCount: number;
  enquiriesCount?: number;
  totalSpend: number;
  aov?: number;
  initials?: string;
  created_at: string;
  updated_at?: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeAccounts: number;
  vipAccounts: number;
  totalRevenue: number;
  totalBookingsAndOrders: number;
}

export default function AdminCustomersPage() {
  // Main Data States
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeAccounts: 0,
    vipAccounts: 0,
    totalRevenue: 0,
    totalBookingsAndOrders: 0,
  });

  // Search & Filter
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Server Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Drawer / 360 View State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"profile" | "orders" | "bookings" | "notes">("profile");
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Bengaluru",
    address: "",
    tag: "Standard",
    status: "active",
    notes: "",
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    tag: "Standard",
    status: "active",
    notes: "",
  });
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Customers with Pagination & Filters
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      if (deferredSearch.trim()) {
        params.set("q", deferredSearch.trim());
      }

      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load customer directory");
      }

      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      showNotification(err.message || "Failed to load customer profiles", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, sortBy, sortOrder, deferredSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Realtime Sync Listener
  useEffect(() => {
    const handleSync = () => fetchCustomers();
    window.addEventListener("nexbyte-realtime", handleSync);
    return () => window.removeEventListener("nexbyte-realtime", handleSync);
  }, [fetchCustomers]);

  // Fetch On-Demand Customer 360 Details
  const openCustomerDrawer = async (cust: CustomerRecord) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerTab("profile");
    setDrawerCustomer(cust);
    setAdminNoteInput(cust.notes || "");

    try {
      const res = await fetch(`/api/admin/customers/${cust.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customer) {
          setDrawerCustomer(data.customer);
          setAdminNoteInput(data.customer.notes || "");
        }
      }
    } catch (err) {
      console.warn("Could not fetch detailed on-demand history:", err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Save Admin Note
  const handleSaveNote = async () => {
    if (!drawerCustomer) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/customers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: drawerCustomer.id, notes: adminNoteInput }),
      });
      if (res.ok) {
        setDrawerCustomer((prev: any) => ({ ...prev, notes: adminNoteInput }));
        showNotification("Internal admin note saved securely.");
        fetchCustomers();
      } else {
        throw new Error("Failed to save note");
      }
    } catch (err: any) {
      showNotification(err.message || "Could not save admin note", "error");
    } finally {
      setSavingNote(false);
    }
  };

  // Create Customer Form Submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create customer.");
      }

      showNotification(`Customer "${data.customer?.name || createFormData.name}" registered successfully.`);
      setShowCreateModal(false);
      setCreateFormData({
        name: "",
        phone: "",
        email: "",
        city: "Bengaluru",
        address: "",
        tag: "Standard",
        status: "active",
        notes: "",
      });
      fetchCustomers();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      setCreateError(err.message || "Failed to register customer.");
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (cust: CustomerRecord) => {
    setEditFormData({
      id: cust.id,
      name: cust.name || "",
      phone: cust.phone || "",
      email: cust.email || "",
      city: cust.city || "Bengaluru",
      address: cust.address || "",
      tag: cust.tag || "Standard",
      status: cust.status || "active",
      notes: cust.notes || "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  // Edit Customer Submission
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditing(true);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update customer.");
      }

      showNotification(`Customer profile updated successfully.`);
      setShowEditModal(false);
      if (drawerCustomer && drawerCustomer.id === editFormData.id) {
        setDrawerCustomer((prev: any) => ({ ...prev, ...editFormData }));
      }
      fetchCustomers();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setEditing(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete customer");
      }

      showNotification(`Customer profile removed from directory.`);
      setDeleteTarget(null);
      if (drawerCustomer && drawerCustomer.id === deleteTarget.id) {
        setDrawerOpen(false);
      }
      fetchCustomers();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      showNotification(err.message || "Failed to delete customer.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Format Currency
  const formatINR = (amt?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  // Format Phone for WhatsApp Link
  const getWhatsAppLink = (phone?: string, name?: string) => {
    if (!phone) return "#";
    const clean = phone.replace(/\D/g, "");
    const fullNumber = clean.length === 10 ? `91${clean}` : clean;
    const text = encodeURIComponent(`Hello ${name || "Customer"}, this is NEXLAPTECH IT Support & Services.`);
    return `https://wa.me/${fullNumber}?text=${text}`;
  };

  return (
    <main role="main" aria-label="Customer Directory and CRM Console" className="space-y-6 pb-12">
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
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Customer Directory & CRM
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Consolidated client directory, order histories, service appointments, and direct communication.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/admin/customers/export"
            download
            className="futuristic-btn-secondary min-h-[44px] px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100"
            aria-label="Export customer directory to CSV"
          >
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setShowCreateModal(true)}
            className="futuristic-btn-primary min-h-[44px] px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            aria-label="Add new customer"
          >
            <Plus className="h-4 w-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Total Customers</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalCustomers}
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-1">Consolidated accounts</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Active Accounts</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.activeAccounts}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">Engaged & verified</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">VIP & Enterprise</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.vipAccounts}
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-1">High-LTV / AMC clients</span>
        </div>

        <div className="futuristic-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lifetime Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatINR(stats.totalRevenue)}
          </p>
          <span className="text-[11px] text-cyan-700 dark:text-cyan-400 block mt-1">
            {stats.totalBookingsAndOrders} orders & bookings
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
              placeholder="Search by name, ID, phone, email, city, hardware..."
              className="futuristic-input w-full pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-white min-h-[44px]"
              aria-label="Search customer directory"
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

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort customers by field"
                className="futuristic-input w-full py-2.5 pl-3 pr-8 text-xs min-h-[44px] text-slate-800 dark:text-slate-100"
              >
                <option value="created_at">Date Joined</option>
                <option value="name">Customer Name</option>
                <option value="totalSpend">Total Spend</option>
                <option value="totalBookings">Bookings Count</option>
              </select>
            </div>

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
              onClick={fetchCustomers}
              className="futuristic-btn-secondary min-h-[44px] min-w-[44px] flex items-center justify-center px-3"
              aria-label="Refresh customer list"
            >
              <RefreshCw className={`h-4 w-4 text-slate-700 dark:text-slate-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Segment Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-white/5">
          {[
            { id: "all", label: "All Customers" },
            { id: "active", label: "Active" },
            { id: "vip", label: "VIP Tier" },
            { id: "business", label: "Business & AMC" },
            { id: "inactive", label: "Inactive" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-indigo-500/20"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              }`}
              aria-label={`Filter by ${tab.label}`}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Showing {customers.length} of {totalCount} profiles
          </span>
        </div>
      </div>

      {/* Customer Listing Section */}
      {loading && customers.length === 0 ? (
        <div className="text-center py-20 futuristic-card rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 font-medium">
            Loading customer directory...
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 futuristic-card rounded-2xl">
          <Users className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No customer profiles match this search.</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Try adjusting your search keywords or clear active filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid (< 1024px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {customers.map((c) => (
              <div
                key={c.id}
                className="futuristic-card p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-sm"
              >
                <div>
                  {/* Top Bar: Initials Avatar + Name + Tag */}
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                        {c.initials || "CU"}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {c.name}
                        </h2>
                        <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 font-semibold">
                          {c.customerId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.tag === "VIP"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : c.tag === "Business"
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                          : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15"
                      }`}
                    >
                      {c.tag}
                    </span>
                  </div>

                  {/* Contact & Meta Details */}
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 mt-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="font-medium">{c.phone || "No phone registered"}</span>
                    </div>

                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>{c.city || "Bengaluru"}</span>
                    </div>
                  </div>

                  {/* Spending & Activity Metrics Pill */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">
                        Total Orders & Bookings
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {(c.ordersCount || 0) + (c.totalBookings || 0)} activities
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium">
                        Total Spend
                      </span>
                      <span className="text-xs font-black text-indigo-700 dark:text-cyan-400">
                        {formatINR(c.totalSpend)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {c.phone && (
                      <>
                        <a
                          href={getWhatsAppLink(c.phone, c.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                          aria-label={`Send WhatsApp message to ${c.name}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${c.phone}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                          aria-label={`Call ${c.name} at ${c.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label={`Send email to ${c.name} at ${c.email}`}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openCustomerDrawer(c)}
                      className="futuristic-btn-secondary min-h-[44px] px-3 text-xs flex items-center gap-1 text-slate-800 dark:text-slate-200"
                      aria-label={`View 360 profile for ${c.name}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="futuristic-btn-secondary min-h-[44px] px-3 text-xs flex items-center gap-1 text-slate-800 dark:text-slate-200"
                      aria-label={`Edit profile for ${c.name}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop High-Density Data Table (>= 1024px) */}
          <div className="hidden lg:block futuristic-card rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" aria-label="Customer Directory Table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Customer
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Contact & Location
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Tier / Segment
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-right">
                      Orders & Bookings
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-right">
                      Total LTV Spend
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-center">
                      Account Status
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Customer Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {c.initials || "CU"}
                          </div>
                          <div>
                            <button
                              onClick={() => openCustomerDrawer(c)}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-cyan-400 text-left transition-colors"
                              aria-label={`Open profile drawer for ${c.name}`}
                            >
                              {c.name}
                            </button>
                            <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 font-semibold block mt-0.5">
                              {c.customerId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>{c.phone || "N/A"}</span>
                          </div>
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <MapPin className="h-3 w-3 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>{c.city || "Bengaluru"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tier / Segment */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            c.tag === "VIP"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : c.tag === "Business"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                              : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15"
                          }`}
                        >
                          {c.tag}
                        </span>
                      </td>

                      {/* Orders & Bookings */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {(c.ordersCount || 0) + (c.totalBookings || 0)}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                          {c.ordersCount || 0} ord &bull; {c.totalBookings || 0} srv
                        </span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-slate-900 dark:text-cyan-400 text-xs">
                          {formatINR(c.totalSpend)}
                        </span>
                        {c.aov ? (
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                            AOV: {formatINR(c.aov)}
                          </span>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            c.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {c.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.phone && (
                            <a
                              href={getWhatsAppLink(c.phone, c.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                              aria-label={`Send WhatsApp message to ${c.name}`}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}

                          <button
                            onClick={() => openCustomerDrawer(c)}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                            aria-label={`View 360-degree customer details for ${c.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(c)}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                            aria-label={`Edit profile for ${c.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                            aria-label={`Delete customer profile for ${c.name}`}
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
                Page {page} of {totalPages} &bull; {totalCount} total customer records
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

      {/* ─── CUSTOMER 360-DEGREE PROFILE DRAWER / MODAL ─── */}
      {drawerOpen && drawerCustomer && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl h-full bg-white dark:bg-[#0B0F1E] border-l border-slate-200 dark:border-white/10 p-5 sm:p-6 overflow-y-auto z-10 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-lg">
                    {drawerCustomer.initials || "CU"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {drawerCustomer.name}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          drawerCustomer.tag === "VIP"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : drawerCustomer.tag === "Business"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                            : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15"
                        }`}
                      >
                        {drawerCustomer.tag || "Standard"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-indigo-600 dark:text-cyan-400 font-semibold block mt-0.5">
                      {drawerCustomer.customerId} &bull; Joined{" "}
                      {drawerCustomer.created_at ? new Date(drawerCustomer.created_at).toLocaleDateString("en-IN") : "Recent"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                  aria-label="Close customer drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Communication Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-200 dark:border-white/10">
                {drawerCustomer.phone && (
                  <>
                    <a
                      href={getWhatsAppLink(drawerCustomer.phone, drawerCustomer.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
                      aria-label="Chat on WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${drawerCustomer.phone}`}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                      aria-label="Direct Phone Call"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </>
                )}

                {drawerCustomer.email && (
                  <a
                    href={`mailto:${drawerCustomer.email}`}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    aria-label="Send direct email"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => openEditModal(drawerCustomer)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-500/20 transition-colors ml-auto"
                  aria-label="Edit this customer profile"
                >
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-2 pt-4 border-b border-slate-200 dark:border-white/10">
                {[
                  { id: "profile", label: "Profile & Contact" },
                  {
                    id: "orders",
                    label: `Orders (${drawerCustomer.orders?.length || drawerCustomer.ordersCount || 0})`,
                  },
                  {
                    id: "bookings",
                    label: `Services (${drawerCustomer.bookings?.length || drawerCustomer.totalBookings || 0})`,
                  },
                  { id: "notes", label: "Admin Notes" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDrawerTab(t.id as any)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                      drawerTab === t.id
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
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Loading detailed records...</p>
                  </div>
                ) : drawerTab === "profile" ? (
                  <div className="space-y-4 text-xs">
                    {/* Summary Metrics */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Total Spend
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-cyan-400 mt-0.5 block">
                          {formatINR(drawerCustomer.totalSpend)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Total Orders
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                          {drawerCustomer.orders?.length || drawerCustomer.ordersCount || 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          IT Bookings
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                          {drawerCustomer.bookings?.length || drawerCustomer.totalBookings || 0}
                        </span>
                      </div>
                    </div>

                    {/* Contact Details List */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2.5">
                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Phone Number
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {drawerCustomer.phone || "Not provided"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Email Address
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {drawerCustomer.email || "Not provided"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          City
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {drawerCustomer.city || "Bengaluru"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Delivery / Billing Address
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {drawerCustomer.address || "Padmanabhanagar, Bengaluru"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Services Rendered
                        </span>
                        <span className="text-slate-900 dark:text-white italic">
                          {drawerCustomer.servicesTaken || "None recorded"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">
                          Hardware Purchased / Enquired
                        </span>
                        <span className="text-slate-900 dark:text-white italic">
                          {drawerCustomer.productsPurchased || "None recorded"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : drawerTab === "orders" ? (
                  <div className="space-y-3">
                    {drawerCustomer.orders && drawerCustomer.orders.length > 0 ? (
                      drawerCustomer.orders.map((ord: any) => (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              {ord.order_number || ord.orderNumber || ord.id}
                            </span>
                            <span className="text-xs font-black text-indigo-700 dark:text-cyan-400">
                              {formatINR(ord.total || ord.amount)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300">
                            {Array.isArray(ord.items)
                              ? ord.items.map((i: any) => i.title || i.name).join(", ")
                              : ord.item_title || "Hardware order"}
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-600 dark:text-slate-400">
                            <span>
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN") : "Recent"}
                            </span>
                            <span className="font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              {ord.status || "Completed"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                        <ShoppingBag className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 dark:text-slate-300">No product orders recorded yet.</p>
                      </div>
                    )}
                  </div>
                ) : drawerTab === "bookings" ? (
                  <div className="space-y-3">
                    {drawerCustomer.bookings && drawerCustomer.bookings.length > 0 ? (
                      drawerCustomer.bookings.map((b: any) => (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {b.service_name || b.serviceTitle || "IT Service"}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-400 border border-indigo-500/20">
                              {b.status || "New"}
                            </span>
                          </div>
                          {b.technician && (
                            <p className="text-[11px] text-slate-700 dark:text-slate-300">
                              Technician: <strong>{b.technician}</strong>
                            </p>
                          )}
                          {b.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              &ldquo;{b.notes}&rdquo;
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-600 dark:text-slate-400">
                            <span>Date: {b.booking_date || "Scheduled"} {b.booking_time || ""}</span>
                            {b.amount ? (
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {formatINR(b.amount)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                        <Wrench className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-700 dark:text-slate-300">No service bookings logged.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Admin Notes Tab */
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Internal Admin Notes & Support Logs
                    </label>
                    <textarea
                      rows={5}
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Add customer preferences, company details, AMC service terms, or support notes here..."
                      className="futuristic-input w-full p-3 text-xs text-slate-900 dark:text-white"
                      aria-label="Customer admin notes"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={savingNote}
                        onClick={handleSaveNote}
                        className="futuristic-btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                        aria-label="Save admin note"
                      >
                        {savingNote ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        <span>Save Notes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="futuristic-btn-secondary min-h-[44px] px-4 text-xs font-medium text-slate-800 dark:text-slate-200"
                aria-label="Close drawer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE CUSTOMER MODAL ─── */}
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
                <Users className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                Add New Customer Profile
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                aria-label="Close create customer modal"
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

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                  aria-label="Customer full name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Phone Number * (10 Digits)
                  </label>
                  <input
                    type="tel"
                    required
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Customer phone number"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Customer email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    value={createFormData.city}
                    onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Customer city"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Customer Tier / Segment
                  </label>
                  <select
                    value={createFormData.tag}
                    onChange={(e) => setCreateFormData({ ...createFormData, tag: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Customer segment tag"
                  >
                    <option value="Standard">Standard Tier</option>
                    <option value="VIP">VIP Client</option>
                    <option value="Business">Business / AMC Contract</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Delivery / Office Address
                </label>
                <input
                  type="text"
                  value={createFormData.address}
                  onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                  placeholder="Street address, building, landmark..."
                  className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                  aria-label="Customer full address"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                  placeholder="Special instructions, hardware preferences..."
                  className="futuristic-input w-full p-2.5 text-xs text-slate-900 dark:text-white"
                  aria-label="Customer notes"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="futuristic-btn-secondary min-h-[44px] px-4 text-xs text-slate-800 dark:text-slate-200"
                  aria-label="Cancel customer registration"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="futuristic-btn-primary min-h-[44px] px-6 text-xs font-semibold flex items-center gap-1.5"
                  aria-label="Submit new customer form"
                >
                  {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Register Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT CUSTOMER MODAL ─── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg futuristic-card bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                Edit Customer Profile
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                aria-label="Close edit customer modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditCustomer} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                  aria-label="Edit customer name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Edit customer phone"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Edit customer email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Edit customer city"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Tier / Segment
                  </label>
                  <select
                    value={editFormData.tag}
                    onChange={(e) => setEditFormData({ ...editFormData, tag: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Edit customer segment tag"
                  >
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP Tier</option>
                    <option value="Business">Business / AMC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Account Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                    aria-label="Edit account status"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Address
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="futuristic-input w-full min-h-[44px] text-slate-900 dark:text-white"
                  aria-label="Edit customer address"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="futuristic-input w-full p-2.5 text-xs text-slate-900 dark:text-white"
                  aria-label="Edit customer notes"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="futuristic-btn-secondary min-h-[44px] px-4 text-xs text-slate-800 dark:text-slate-200"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="futuristic-btn-primary min-h-[44px] px-6 text-xs font-semibold flex items-center gap-1.5"
                  aria-label="Save changes to customer profile"
                >
                  {editing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
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
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Delete Customer Profile?</h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.customerId})?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/5">
              This action removes the customer record from the active directory. Past invoice documents and order records will remain safely preserved in the audit database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="futuristic-btn-secondary min-h-[44px] px-4 text-xs text-slate-800 dark:text-slate-200"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCustomer}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                aria-label="Confirm deletion of customer"
              >
                {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
