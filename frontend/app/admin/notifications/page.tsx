"use client";

import { useEffect, useState, useMemo, useDeferredValue, useCallback } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  MessageSquare,
  Laptop,
  Calendar,
  Star,
  Building2,
  Trash2,
  Archive,
  Eye,
  ExternalLink,
  Send,
  Settings,
  FileText,
  Sliders,
  ShieldAlert,
  Clock,
  Check,
  Flame,
  Volume2,
  VolumeX,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type NotificationPriority = "urgent" | "high" | "normal" | "low";
export type NotificationStatus = "unread" | "read" | "archived";

export interface ChannelDelivery {
  status: "delivered" | "sent" | "failed" | "not_configured" | "pending";
  error?: string;
  sent_at?: string;
  delivered_at?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  reference_id?: string | null;
  reference_type?: string | null;
  recipient_role?: string | null;
  recipient_user_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  channels?: {
    in_app?: ChannelDelivery;
    whatsapp?: ChannelDelivery;
    email?: ChannelDelivery;
  };
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  highPriority: number;
  recent24h: number;
  failedDeliveries: number;
  deliveryStats: {
    inAppDelivered: number;
    whatsAppSent: number;
    whatsAppFailed: number;
    emailSent: number;
    emailFailed: number;
  };
  categoryCounts: Record<string, number>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  channels: string[];
  title: string;
  message: string;
  variables: string[];
  is_active: boolean;
}

export interface NotificationSettingsState {
  enabledCategories: Record<string, boolean>;
  channels: {
    in_app: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  priorityAlertsOnly: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  retentionDays: number;
  adminAlertEmail: string;
  adminAlertPhone: string;
  lowStockThreshold: number;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; routePrefix?: string }
> = {
  order: {
    label: "Product Orders",
    icon: <Layers className="h-4 w-4" aria-hidden="true" />,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    routePrefix: "/admin/orders",
  },
  booking: {
    label: "Service Bookings",
    icon: <Calendar className="h-4 w-4" aria-hidden="true" />,
    color: "text-sky-600 dark:text-cyan-400 bg-sky-50 dark:bg-cyan-500/10 border-sky-200 dark:border-cyan-500/30",
    routePrefix: "/admin/services",
  },
  laptop_enquiry: {
    label: "Laptop Enquiries",
    icon: <Laptop className="h-4 w-4" aria-hidden="true" />,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
    routePrefix: "/admin/laptop-enquiries",
  },
  low_stock: {
    label: "Low Stock Alert",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    routePrefix: "/admin/inventory",
  },
  out_of_stock: {
    label: "Out of Stock Alert",
    icon: <XCircle className="h-4 w-4" aria-hidden="true" />,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    routePrefix: "/admin/inventory",
  },
  payment_success: {
    label: "Payment Success",
    icon: <CheckCircle className="h-4 w-4" aria-hidden="true" />,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    routePrefix: "/admin/billing",
  },
  payment_failure: {
    label: "Payment Failed",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    routePrefix: "/admin/billing",
  },
  customer_registration: {
    label: "Customer Account",
    icon: <CheckCircle className="h-4 w-4" aria-hidden="true" />,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
    routePrefix: "/admin/customers",
  },
  repair_status: {
    label: "Repair Status",
    icon: <Clock className="h-4 w-4" aria-hidden="true" />,
    color: "text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-500/10 border-indigo-200 dark:border-cyan-500/30",
    routePrefix: "/admin/services",
  },
  shipment_delivery: {
    label: "Shipment / Delivery",
    icon: <Layers className="h-4 w-4" aria-hidden="true" />,
    color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30",
    routePrefix: "/admin/orders",
  },
  customer_message: {
    label: "Customer Message",
    icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
    color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30",
    routePrefix: "/admin/contacts",
  },
  review: {
    label: "Customer Review",
    icon: <Star className="h-4 w-4" aria-hidden="true" />,
    color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
    routePrefix: "/admin/reviews",
  },
  warranty_request: {
    label: "Warranty Claim",
    icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30",
    routePrefix: "/admin/orders",
  },
  security_alert: {
    label: "Security Alert",
    icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    routePrefix: "/admin/settings",
  },
  system_alert: {
    label: "System Alert",
    icon: <Bell className="h-4 w-4" aria-hidden="true" />,
    color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    routePrefix: "/admin/notifications",
  },
};

const PRIORITY_BADGES: Record<NotificationPriority, { label: string; badge: string; icon: React.ReactNode }> = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 font-extrabold",
    icon: <Flame className="h-3 w-3 text-rose-500 animate-pulse" aria-hidden="true" />,
  },
  high: {
    label: "High Priority",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 font-bold",
    icon: <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden="true" />,
  },
  normal: {
    label: "Normal",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 font-semibold",
    icon: <Check className="h-3 w-3 text-indigo-500" aria-hidden="true" />,
  },
  low: {
    label: "Low",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium",
    icon: <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />,
  },
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  // Navigation tab: 'stream' | 'templates' | 'settings'
  const [activeTab, setActiveTab] = useState<"stream" | "templates" | "settings">("stream");

  // Main notification list state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    highPriority: 0,
    recent24h: 0,
    failedDeliveries: 0,
    deliveryStats: { inAppDelivered: 0, whatsAppSent: 0, whatsAppFailed: 0, emailSent: 0, emailFailed: 0 },
    categoryCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer details modal
  const [detailItem, setDetailItem] = useState<AdminNotification | null>(null);

  // Dispatch / New Notification modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    title: "",
    message: "",
    type: "system_alert",
    priority: "normal" as NotificationPriority,
    recipient_role: "customer",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    reference_id: "",
    reference_type: "",
    channels: ["in_app"],
  });
  const [dispatching, setDispatching] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<NotificationSettingsState | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: deferredSearch,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        channel: channelFilter,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.items || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, deferredSearch, statusFilter, categoryFilter, priorityFilter, channelFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset pagination when search/filters change
  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, categoryFilter, priorityFilter, channelFilter, sortBy, sortOrder]);

  // Realtime synchronization
  useEffect(() => {
    const handleRealtime = () => fetchNotifications();
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, [fetchNotifications]);

  // Load templates when switching to templates tab
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await fetch("/api/admin/notifications/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load settings when switching to settings tab
  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch("/api/admin/notifications/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "templates") loadTemplates();
    if (activeTab === "settings") loadSettings();
  }, [activeTab]);

  // Bulk actions handler
  const handleBulkAction = async (action: "markRead" | "markUnread" | "archive" | "delete") => {
    if (selectedIds.length === 0) return;
    try {
      if (action === "delete") {
        if (!confirm(`Permanently delete ${selectedIds.length} notification(s)?`)) return;
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" })
          )
        );
      } else {
        await fetch("/api/admin/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ids: selectedIds }),
        });
      }
      setSelectedIds([]);
      fetchNotifications();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      fetchNotifications();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle single read/unread
  const handleToggleRead = async (item: AdminNotification) => {
    try {
      const nextStatus = item.status === "unread" ? "read" : "unread";
      await fetch(`/api/admin/notifications/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchNotifications();
      if (detailItem && detailItem.id === item.id) {
        setDetailItem({ ...detailItem, status: nextStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Archive single notification
  const handleArchiveSingle = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (detailItem && detailItem.id === id) {
        setDetailItem({ ...detailItem, status: "archived" });
      }
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Deep-link to related entity
  const navigateToEntity = (item: AdminNotification) => {
    const refId = item.reference_id;
    const refType = item.reference_type || item.type;
    const cfg = CATEGORY_MAP[item.type];

    if (refType === "order") {
      router.push(refId ? `/admin/orders?id=${refId}` : "/admin/orders");
    } else if (refType === "booking") {
      router.push("/admin/services");
    } else if (refType === "laptop_enquiry") {
      router.push(refId ? `/admin/laptop-enquiries?id=${refId}` : "/admin/laptop-enquiries");
    } else if (refType === "customer") {
      router.push(refId ? `/admin/customers?id=${refId}` : "/admin/customers");
    } else if (refType === "product") {
      router.push(refId ? `/admin/inventory?q=${refId}` : "/admin/inventory");
    } else if (refType === "contact") {
      router.push(refId ? `/admin/contacts?id=${refId}` : "/admin/contacts");
    } else if (refType === "review") {
      router.push(refId ? `/admin/reviews?id=${refId}` : "/admin/reviews");
    } else if (cfg?.routePrefix) {
      router.push(cfg.routePrefix);
    }
  };

  // Handle Dispatch submit
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchFeedback(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispatchData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch notification");

      setDispatchFeedback("Notification created and delivered successfully.");
      setTimeout(() => {
        setIsDispatchModalOpen(false);
        setDispatchFeedback(null);
        setDispatchData({
          title: "",
          message: "",
          type: "system_alert",
          priority: "normal",
          recipient_role: "customer",
          recipient_name: "",
          recipient_email: "",
          recipient_phone: "",
          reference_id: "",
          reference_type: "",
          channels: ["in_app"],
        });
        fetchNotifications();
      }, 1200);
    } catch (err: any) {
      setDispatchFeedback(`Error: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  // Save Settings submit
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch("/api/admin/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <main
      role="main"
      aria-label="Admin Notification & Alerts Console"
      className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-500/20 shadow-sm relative">
            <Bell className="h-6 w-6" aria-hidden="true" />
            {stats.unread > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Notifications &amp; Alerts Command Center
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Real-time omni-channel event stream, template manager, delivery analytics, and dispatch console.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => fetchNotifications()}
            disabled={refreshing}
            aria-label="Refresh notification feed"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600 dark:text-cyan-400" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Mark All Read */}
          {stats.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              aria-label="Mark all notifications as read"
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Mark All Read</span>
            </button>
          )}

          {/* Create / Dispatch Button */}
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            aria-label="Create new notification"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Dispatch Notification</span>
          </button>

          {/* Export CSV */}
          <a
            href="/api/admin/notifications/export"
            download
            aria-label="Export notifications audit trail as CSV"
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Export CSV</span>
          </a>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav aria-label="Notifications Console Sub-navigation" className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("stream")}
          aria-label="Switch to Notification Stream view"
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === "stream"
            ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span>Notification Stream</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "stream" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          aria-label="Switch to Notification Templates Manager view"
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === "templates"
            ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>Templates Manager</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          aria-label="Switch to Notification Settings & Rules view"
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${activeTab === "settings"
            ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span>Settings &amp; Rules</span>
        </button>
      </nav>

      {/* TAB 1: STREAM VIEW */}
      {activeTab === "stream" && (
        <>
          {/* KPI Dashboard Cards */}
          <section aria-label="Notification Performance Indicators" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Notifications */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Alerts</span>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.total.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">All logged records</span>
            </div>

            {/* Unread Alerts */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm">
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Unread</span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-2xl font-display font-extrabold text-rose-700 dark:text-rose-400 mt-1">
                {stats.unread.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/70 mt-1 font-medium">Awaiting review</span>
            </div>

            {/* High Priority Alerts */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">High / Urgent</span>
                <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-amber-700 dark:text-amber-400 mt-1">
                {stats.highPriority.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-1 font-medium">Urgent stock &amp; payments</span>
            </div>

            {/* Recent 24h */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-indigo-200 dark:border-cyan-500/20 bg-indigo-50/40 dark:bg-cyan-950/20 shadow-sm">
              <div className="flex items-center justify-between text-indigo-700 dark:text-cyan-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Past 24 Hours</span>
                <Clock className="h-4 w-4 text-indigo-600 dark:text-cyan-400" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-indigo-700 dark:text-cyan-300 mt-1">
                {stats.recent24h.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-indigo-600/80 dark:text-cyan-400/70 mt-1 font-medium">Active traffic</span>
            </div>

            {/* In-App Delivered */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-[11px] font-bold uppercase tracking-wider">In-App Live</span>
                <Bell className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {stats.deliveryStats.inAppDelivered.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">100% real-time deliverability</span>
            </div>

            {/* External Channel Delivery */}
            <div className="futuristic-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ext Channels</span>
                <MessageSquare className="h-4 w-4 text-sky-500" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  WA: {stats.deliveryStats.whatsAppSent}
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
                  EM: {stats.deliveryStats.emailSent}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {stats.failedDeliveries > 0 ? `${stats.failedDeliveries} failed` : "Zero delivery failures"}
              </span>
            </div>
          </section>

          {/* Filters & Search Section */}
          <section aria-label="Notification Filters" className="futuristic-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
            {/* Quick Status / Priority Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              {[
                { id: "all", label: "All Feed", count: stats.total },
                { id: "unread", label: "Unread", count: stats.unread },
                { id: "read", label: "Read", count: stats.read },
                { id: "archived", label: "Archived", count: stats.archived },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setStatusFilter(pill.id);
                    setPage(1);
                  }}
                  aria-label={`Filter by status ${pill.label}`}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusFilter === pill.id
                    ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                >
                  <span>{pill.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === pill.id ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                    {pill.count}
                  </span>
                </button>
              ))}

              <div className="h-5 w-px bg-slate-300 dark:bg-white/10 mx-1 hidden sm:block" />

              {/* Priority Filters */}
              {["urgent", "high"].map((prio) => (
                <button
                  key={prio}
                  onClick={() => {
                    setPriorityFilter(priorityFilter === prio ? "all" : prio);
                    setPage(1);
                  }}
                  aria-label={`Filter by priority ${prio}`}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${priorityFilter === prio
                    ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950"
                    : "border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                    }`}
                >
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="capitalize">{prio}</span>
                </button>
              ))}
            </div>

            {/* Inputs: Search, Category, Priority, Channel, Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search title, message, ref ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search notifications"
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by notification category"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Notification Types</option>
                  {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} {stats.categoryCounts[key] ? `(${stats.categoryCounts[key]})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by alert priority"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Alert Priorities</option>
                  <option value="urgent">Urgent Priority</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Channel */}
              <div>
                <select
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by delivery channel"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Delivery Channels</option>
                  <option value="in_app">In-App Live Stream</option>
                  <option value="whatsapp">WhatsApp Dispatches</option>
                  <option value="email">Email Dispatches</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split("-");
                    setSortBy(f);
                    setSortOrder(o as any);
                    setPage(1);
                  }}
                  aria-label="Sort notifications"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="priority-asc">Highest Priority First</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Bulk Selection Actions Toolbar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-xs">
                <span className="font-bold text-indigo-900 dark:text-cyan-300">
                  {selectedIds.length} item(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("markRead")}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-50 transition-colors"
                  >
                    Mark Read
                  </button>
                  <button
                    onClick={() => handleBulkAction("markUnread")}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-50 transition-colors"
                  >
                    Mark Unread
                  </button>
                  <button
                    onClick={() => handleBulkAction("archive")}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-50 transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Notification List Stream */}
          <section aria-label="Notification Feed Stream">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-white/5"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 futuristic-card rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 space-y-3 shadow-sm">
                <Bell className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications match active filters</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  There are no alerts matching your criteria. Try adjusting the search query, category, or status tab.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setPriorityFilter("all");
                    setChannelFilter("all");
                  }}
                  aria-label="Reset all search and filter conditions"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-cyan-400 text-xs font-bold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => {
                  const cfg = CATEGORY_MAP[item.type] || CATEGORY_MAP.system_alert;
                  const prio = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.normal;
                  const isSelected = selectedIds.includes(item.id);
                  const isUnread = item.status === "unread";

                  return (
                    <article
                      key={item.id}
                      aria-label={`Notification: ${item.title}`}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${isUnread
                        ? "bg-white dark:bg-slate-900/90 border-indigo-200 dark:border-cyan-500/30 shadow-md ring-1 ring-indigo-500/10"
                        : "bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/15"
                        }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Checkbox for bulk actions */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, item.id]);
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== item.id));
                              }
                            }}
                            aria-label={`Select notification ${item.id}`}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Category Icon */}
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${cfg.color}`}
                        >
                          {cfg.icon}
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3
                                className={`text-sm tracking-tight truncate ${isUnread
                                  ? "font-extrabold text-slate-900 dark:text-white"
                                  : "font-semibold text-slate-800 dark:text-slate-200"
                                  }`}
                              >
                                {item.title}
                              </h3>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-cyan-400 shrink-0" />
                              )}
                            </div>

                            {/* Priority badge */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${prio.badge}`}
                              >
                                {prio.icon}
                                <span>{prio.label}</span>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.message}
                          </p>

                          {/* Metadata row: Reference, Channels, Timestamp */}
                          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
                            {/* Type tag */}
                            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-300">
                              {cfg.label}
                            </span>

                            {/* Reference Link if available */}
                            {item.reference_id && (
                              <button
                                onClick={() => navigateToEntity(item)}
                                aria-label={`Open related entity ${item.reference_id}`}
                                className="font-mono font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <span>#{item.reference_id}</span>
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </button>
                            )}

                            {/* Delivery channel icons */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              {item.channels?.in_app && (
                                <span
                                  title="In-App notification delivered"
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                                >
                                  <Bell className="h-3 w-3" aria-hidden="true" />
                                </span>
                              )}
                              {item.channels?.whatsapp && (
                                <span
                                  title={`WhatsApp: ${item.channels.whatsapp.status}`}
                                  className={`p-1 rounded ${item.channels.whatsapp.status === "failed"
                                    ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                                    : item.channels.whatsapp.status === "sent"
                                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    }`}
                                >
                                  <MessageSquare className="h-3 w-3" aria-hidden="true" />
                                </span>
                              )}
                              {item.channels?.email && (
                                <span
                                  title={`Email: ${item.channels.email.status}`}
                                  className={`p-1 rounded ${item.channels.email.status === "failed"
                                    ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                                    : item.channels.email.status === "sent"
                                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    }`}
                                >
                                  <Mail className="h-3 w-3" aria-hidden="true" />
                                </span>
                              )}
                            </div>

                            {/* Timestamp */}
                            <span className="text-[10px]">
                              {new Date(item.created_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Touch targets >= 44px) */}
                        <div className="flex sm:flex-col items-center gap-1 shrink-0 pt-0.5">
                          <button
                            onClick={() => handleToggleRead(item)}
                            title={isUnread ? "Mark as Read" : "Mark as Unread"}
                            aria-label={isUnread ? "Mark notification as read" : "Mark notification as unread"}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <Check className={`h-4 w-4 ${isUnread ? "text-slate-400" : "text-emerald-500"}`} aria-hidden="true" />
                          </button>

                          <button
                            onClick={() => setDetailItem(item)}
                            title="View Details"
                            aria-label={`View full details of notification ${item.id}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <button
                            onClick={() => handleArchiveSingle(item.id)}
                            title="Archive Notification"
                            aria-label={`Archive notification ${item.id}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Server-Side Pagination Footer */}
          {totalPages > 1 && (
            <nav aria-label="Notification Feed Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Showing <strong className="text-slate-900 dark:text-white">{(page - 1) * limit + 1}</strong> to{" "}
                <strong className="text-slate-900 dark:text-white">{Math.min(page * limit, totalCount)}</strong> of{" "}
                <strong className="text-slate-900 dark:text-white">{totalCount}</strong> notifications
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page of notifications"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-bold px-3 text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page of notifications"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* TAB 2: TEMPLATES MANAGER VIEW */}
      {activeTab === "templates" && (
        <section aria-label="Notification Templates Manager" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reusable Notification Templates</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-configured multi-channel message formats with customer, order, and enquiry variables.
              </p>
            </div>
          </div>

          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-bold uppercase">
                        {tpl.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{tpl.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-1 text-xs">
                    <div className="font-bold text-slate-800 dark:text-white/90">{tpl.title}</div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{tpl.message}</p>
                  </div>

                  {/* Variables */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Variables:</span>
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-300 text-[10px] font-mono font-bold"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span>Channels:</span>
                      <strong className="text-slate-800 dark:text-white capitalize">
                        {tpl.channels.join(", ")}
                      </strong>
                    </div>
                    <button
                      onClick={() => {
                        setDispatchData({
                          ...dispatchData,
                          title: tpl.title,
                          message: tpl.message,
                          type: tpl.category,
                          channels: tpl.channels,
                        });
                        setIsDispatchModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-cyan-500/10 text-indigo-600 dark:text-cyan-400 font-bold hover:bg-indigo-100 text-xs inline-flex items-center gap-1"
                    >
                      <span>Use in Dispatch</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: SETTINGS & RULES VIEW */}
      {activeTab === "settings" && (
        <section aria-label="Notification Preferences and System Rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences &amp; Rules</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure delivery channels, retention limits, threshold alerts, and quiet hours.
              </p>
            </div>
          </div>

          {settingsLoading || !settings ? (
            <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Channel Toggles */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                  <span>Global Dispatch Channels</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: "in_app", label: "In-App Live Stream", desc: "Always real-time across customer & admin dashboards" },
                    { id: "whatsapp", label: "WhatsApp Gateway", desc: "Direct customer mobile alerts via verified channel" },
                    { id: "email", label: "Email Notifications", desc: "Automated receipts, invoices & executive alerts" },
                  ].map((ch) => (
                    <label
                      key={ch.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(settings.channels as any)[ch.id]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            channels: { ...settings.channels, [ch.id]: e.target.checked },
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{ch.label}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ch.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Thresholds & Retention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Retention Policy &amp; Auto-Purge</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Non-priority notifications older than the retention period can be cleaned up automatically to maintain peak database performance.
                  </p>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Retention Horizon:</label>
                    <select
                      value={settings.retentionDays}
                      onChange={(e) => setSettings({ ...settings, retentionDays: Number(e.target.value) })}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={30}>Keep notifications for 30 days</option>
                      <option value={60}>Keep notifications for 60 days</option>
                      <option value={90}>Keep notifications for 90 days (Recommended)</option>
                      <option value={180}>Keep notifications for 180 days</option>
                      <option value={365}>Keep notifications for 1 year</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alert Dispatch Contacts</h3>
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Admin Alert Email:</label>
                      <input
                        type="email"
                        value={settings.adminAlertEmail}
                        onChange={(e) => setSettings({ ...settings, adminAlertEmail: e.target.value })}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Emergency Alert WhatsApp Phone:</label>
                      <input
                        type="text"
                        value={settings.adminAlertPhone}
                        onChange={(e) => setSettings({ ...settings, adminAlertPhone: e.target.value })}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {settingsSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Notification preferences successfully saved to database!</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 dark:hover:bg-cyan-400 transition-colors shadow-sm ml-auto flex items-center gap-2"
                >
                  {settingsSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{settingsSaving ? "Saving Settings..." : "Save Preferences"}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Slide-Out Notification Details Drawer */}
      {detailItem && (
        <div role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 flex flex-col space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase">
                  {detailItem.type.replace(/_/g, " ")}
                </span>
                <h3 id="drawer-title" className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {detailItem.title}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                aria-label="Close notification drawer"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Priority & Status Badges */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${PRIORITY_BADGES[detailItem.priority]?.badge}`}>
                {PRIORITY_BADGES[detailItem.priority]?.icon}
                <span>{PRIORITY_BADGES[detailItem.priority]?.label}</span>
              </span>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${detailItem.status === "unread" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                Status: {detailItem.status}
              </span>
            </div>

            {/* Message Body */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Message Content:</span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-sm">
                {detailItem.message}
              </p>
            </div>

            {/* Channel Deliveries */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Channel Deliveries:</span>
              <div className="grid grid-cols-1 gap-2">
                {/* In App */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-indigo-500" />
                    <span className="font-bold text-slate-900 dark:text-white">In-App Live Stream</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                    {detailItem.channels?.in_app?.status || "Delivered"}
                  </span>
                </div>

                {/* WhatsApp */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">WhatsApp</span>
                      {detailItem.recipient_phone && (
                        <span className="text-[10px] text-slate-400 block">{detailItem.recipient_phone}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {detailItem.channels?.whatsapp?.status || "Not Configured"}
                  </span>
                </div>

                {/* Email */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-sky-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Email Notification</span>
                      {detailItem.recipient_email && (
                        <span className="text-[10px] text-slate-400 block">{detailItem.recipient_email}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {detailItem.channels?.email?.status || "Not Configured"}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Business Entity */}
            {detailItem.reference_id && (
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-cyan-950/20 border border-indigo-200 dark:border-cyan-500/20 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-cyan-300">
                  Linked Business Entity
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {detailItem.reference_type?.toUpperCase() || "RECORD"}: #{detailItem.reference_id}
                  </span>
                  <button
                    onClick={() => {
                      setDetailItem(null);
                      navigateToEntity(detailItem);
                    }}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
                  >
                    <span>Open Record</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div>Created: {new Date(detailItem.created_at).toLocaleString("en-IN")}</div>
              {detailItem.read_at && <div>Read: {new Date(detailItem.read_at).toLocaleString("en-IN")}</div>}
              {detailItem.archived_at && <div>Archived: {new Date(detailItem.archived_at).toLocaleString("en-IN")}</div>}
            </div>

            {/* Actions */}
            <div className="pt-4 mt-auto flex items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => handleToggleRead(detailItem)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50"
              >
                {detailItem.status === "unread" ? "Mark as Read" : "Mark as Unread"}
              </button>

              <button
                onClick={() => {
                  handleArchiveSingle(detailItem.id);
                  setDetailItem(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Archive Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Notification Modal */}
      {isDispatchModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="dispatch-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !dispatching && setIsDispatchModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase">
                  Omni-Channel Dispatch
                </span>
                <h3 id="dispatch-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Create &amp; Dispatch Notification
                </h3>
              </div>
              <button
                onClick={() => !dispatching && setIsDispatchModalOpen(false)}
                aria-label="Close dispatch modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {dispatchFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${dispatchFeedback.startsWith("Error")
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
              >
                {dispatchFeedback}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notification Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Booking Scheduled #SRV-2026-302"
                  value={dispatchData.title}
                  onChange={(e) => setDispatchData({ ...dispatchData, title: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category / Type:</label>
                  <select
                    value={dispatchData.type}
                    onChange={(e) => setDispatchData({ ...dispatchData, type: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Alert Priority:</label>
                  <select
                    value={dispatchData.priority}
                    onChange={(e) => setDispatchData({ ...dispatchData, priority: e.target.value as any })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Message Content:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter message details or customer update instructions..."
                  value={dispatchData.message}
                  onChange={(e) => setDispatchData({ ...dispatchData, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Recipient Name / Role:</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={dispatchData.recipient_name}
                    onChange={(e) => setDispatchData({ ...dispatchData, recipient_name: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Linked Reference ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. NB-ORD-2026-1048"
                    value={dispatchData.reference_id}
                    onChange={(e) => setDispatchData({ ...dispatchData, reference_id: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Channels Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Delivery Channels:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchData.channels.includes("in_app")}
                      disabled
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>In-App Stream</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchData.channels.includes("whatsapp")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...dispatchData.channels, "whatsapp"]
                          : dispatchData.channels.filter((c) => c !== "whatsapp");
                        setDispatchData({ ...dispatchData, channels: next });
                      }}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchData.channels.includes("email")}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...dispatchData.channels, "email"]
                          : dispatchData.channels.filter((c) => c !== "email");
                        setDispatchData({ ...dispatchData, channels: next });
                      }}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  disabled={dispatching}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  {dispatching && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{dispatching ? "Dispatching..." : "Dispatch Alert"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
