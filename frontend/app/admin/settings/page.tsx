"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Settings as SettingsIcon,
  Palette,
  LayoutTemplate,
  ShoppingBag,
  Truck,
  Bell,
  Shield,
  Building2,
  Activity,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Info,
  HelpCircle,
  X,
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Upload,
  Film,
  Image as ImageIcon,
  Zap,
  Lock,
  Undo2,
  History,
  ArrowRight,
  Share2,
  Globe,
  FileText,
  Send,
  Phone,
  MessageSquare,
  Laptop,
  Wrench,
  Calendar,
  Award,
  GraduationCap,
  Briefcase,
  Package,
  ShieldCheck,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import CustomerVisitsAnalyticsSection from "@/components/admin/CustomerVisitsAnalyticsSection";
import {
  StoreSettings,
  AppearanceSettings,
  StorefrontSettings,
  ProductDisplaySettings,
  DeliveryWarrantySettings,
  OrdersNotificationsSettings,
  SecurityAccessSettings,
  GeneralStoreSettings,
  CategoryWarrantyOverride,
  PromoBannerItem,
  SettingsAuditLogEntry,
  CustomerDashboardLayoutConfig,
  BackgroundEffectsSettings,
  FlyersPromotionsSettings,
  AnimationsSettings,
  NavigationHeaderFooterSettings,
  PromotionalFlyerItem,
  HeadingFont,
  BodyFont,
} from "@/lib/types/settings";
import { DEFAULT_STORE_SETTINGS } from "@/lib/data/defaultSettings";

type CategoryId =
  | "appearance"
  | "storefront"
  | "customerDashboard"
  | "customerVisitsAnalytics"
  | "productDisplay"
  | "backgroundEffects"
  | "flyersPromotions"
  | "animations"
  | "navigationHeaderFooter"
  | "generalStore"
  | "deliveryWarranty"
  | "customerPortalFeatures"
  | "seoSocial"
  | "publishVersionHistory"
  | "auditTelemetry";

interface CategoryNavItem {
  id: CategoryId;
  label: string;
  description: string;
  icon: any;
  badge?: string;
}

const CATEGORIES: CategoryNavItem[] = [
  { id: "appearance", label: "Appearance & Themes", description: "Brand colors, Batman Forever / Space Grotesk fonts & radius", icon: Palette },
  { id: "storefront", label: "Homepage & Main Sections", description: "Section order, announcement bars, hero copy & featured count", icon: LayoutTemplate },
  { id: "customerDashboard", label: "Customer Dashboard Layout", description: "Summary KPI cards, quick actions & activity feed configuration", icon: Layers, badge: "NEW" },
  { id: "customerVisitsAnalytics", label: "Customer Traffic & Visits", description: "Daily & monthly customer visit counts, unique visitors & charts", icon: BarChart3, badge: "ANALYTICS" },
  { id: "productDisplay", label: "Products & Categories", description: "Card badges, SKU, stock status, ratings, warranty & pincode checker", icon: ShoppingBag },
  { id: "backgroundEffects", label: "Website Backgrounds & Effects", description: "Holographic grid, mesh gradients, particles, video & blur", icon: Sparkles, badge: "NEW" },
  { id: "flyersPromotions", label: "Flyers, Banners & Promotions", description: "Festive tech flyers, seasonal hero banners & dashboard alerts", icon: ImageIcon, badge: "NEW" },
  { id: "animations", label: "Animations & Motion", description: "Hover physics, scroll reveal, carousel speed & reduced motion", icon: Zap, badge: "NEW" },
  { id: "navigationHeaderFooter", label: "Header, Footer & Navigation", description: "Header style, nav links manager, footer columns & trust badges", icon: Globe, badge: "NEW" },
  { id: "generalStore", label: "About NEXLAPTECH & Contact", description: "GSTIN, legal name, Tumkur office address, phone & maintenance", icon: Building2 },
  { id: "deliveryWarranty", label: "Delivery & Warranty Policies", description: "Pickup pincode (572102), estimates, 7-day return & warranty", icon: Truck },
  { id: "customerPortalFeatures", label: "Customer Portal Features", description: "Customer theme policy, default density & notification channels", icon: ShieldCheck },
  { id: "seoSocial", label: "SEO & Social Channels", description: "Meta title, OpenGraph image, Instagram, LinkedIn & WhatsApp", icon: Share2 },
  { id: "publishVersionHistory", label: "Publish & Version History", description: "Draft vs Live mode, multi-device preview & 1-click rollback", icon: History, badge: "LIVE" },
  { id: "auditTelemetry", label: "Audit Log & Health", description: "Real database connectivity, telemetry & admin change history", icon: Activity },
];

const PRESET_COLORS = [
  { label: "NexLapTech Electric Blue", hex: "#1E5BFF" },
  { label: "Sapphire Royal", hex: "#2563EB" },
  { label: "Cyber Cyan", hex: "#19C3F0" },
  { label: "Emerald Matrix", hex: "#059669" },
  { label: "Royal Amethyst", hex: "#7C3AED" },
  { label: "Amber Flame", hex: "#D97706" },
  { label: "Crimson Forge", hex: "#DC2626" },
  { label: "Titanium Slate", hex: "#475569" },
];

export default function AdminSettingsDashboard() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"storefront" | "customer">("storefront");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishSummary, setPublishSummary] = useState("Updated website and customer portal customization");
  const [showAddFlyerModal, setShowAddFlyerModal] = useState(false);
  const [newFlyer, setNewFlyer] = useState<Partial<PromotionalFlyerItem>>({
    title: "",
    subtitle: "",
    badge: "SPECIAL",
    imageUrl: "/images/poster-products.webp",
    destinationUrl: "/products",
    placement: "homepage_hero",
    device: "all",
    active: true,
  });

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [auditLog, setAuditLog] = useState<SettingsAuditLogEntry[]>([]);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // Telemetry Health State
  const [healthData, setHealthData] = useState<any>(null);

  // Unsaved Changes Tracking
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  // Load Settings and Health on Mount
  useEffect(() => {
    loadSettings();
    loadHealth();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setInitialSettings(data.settings);
        }
        if (data.auditLog) {
          setAuditLog(data.auditLog);
        }
        if (data.versions) {
          setVersionHistory(data.versions);
        }
      } else {
        const err = await res.json();
        setFeedback({ type: "error", message: err.error || "Failed to load store settings." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error loading store settings." });
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {}
  };

  // Save Settings as Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setInitialSettings(data.settings);
        setFeedback({ type: "success", message: "Draft settings saved successfully. You can preview or publish live." });
        loadHealth();
        loadSettings();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save draft settings." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error during draft persistence." });
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Publish to Live Website
  const handlePublish = async () => {
    try {
      setPublishing(true);
      setFeedback(null);
      setShowPublishModal(false);

      // First ensure current draft is saved
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      // Call publish API
      const res = await fetch("/api/admin/settings/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: publishSummary }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setInitialSettings(data.settings);
        setFeedback({
          type: "success",
          message: `Configuration v${data.version} successfully published to live website and customer portal!`,
        });
        loadSettings();
        loadHealth();
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: data.error || "Publish operation failed." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error publishing configuration." });
    } finally {
      setPublishing(false);
    }
  };

  // 1-Click Rollback to Previous Version
  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`Are you sure you want to rollback the entire website configuration to version ${versionNumber}?`)) {
      return;
    }
    try {
      setRollingBack(true);
      setFeedback(null);

      const res = await fetch("/api/admin/settings/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: versionNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setInitialSettings(data.settings);
        setFeedback({
          type: "success",
          message: `Successfully rolled back to version ${versionNumber}. Active live version is now v${data.version}.`,
        });
        loadSettings();
        loadHealth();
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: data.error || "Rollback operation failed." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error during rollback." });
    } finally {
      setRollingBack(false);
    }
  };

  // Discard Changes
  const handleDiscard = () => {
    setSettings(JSON.parse(JSON.stringify(initialSettings)));
    setFeedback({ type: "success", message: "Unsaved modifications discarded." });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Factory Reset
  const handleResetToDefaults = async () => {
    try {
      setResetting(true);
      setShowResetModal(false);
      const res = await fetch("/api/admin/settings/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setInitialSettings(data.settings);
        setFeedback({ type: "success", message: "Settings restored to verified factory defaults." });
        loadHealth();
        loadSettings();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: "error", message: data.error || "Reset failed." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error resetting store settings." });
    } finally {
      setResetting(false);
    }
  };

  // Sub-settings immutability updaters
  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, appearance: { ...prev.appearance, ...updates } }));
  };
  const updateStorefront = (updates: Partial<StorefrontSettings>) => {
    setSettings((prev) => ({ ...prev, storefront: { ...prev.storefront, ...updates } }));
  };
  const updateCustomerDashboard = (updates: Partial<CustomerDashboardLayoutConfig>) => {
    setSettings((prev) => ({ ...prev, customerDashboard: { ...prev.customerDashboard, ...updates } }));
  };
  const updateProductDisplay = (updates: Partial<ProductDisplaySettings>) => {
    setSettings((prev) => ({ ...prev, productDisplay: { ...prev.productDisplay, ...updates } }));
  };
  const updateBackgroundEffects = (updates: Partial<BackgroundEffectsSettings>) => {
    setSettings((prev) => ({ ...prev, backgroundEffects: { ...prev.backgroundEffects, ...updates } }));
  };
  const updateFlyersPromotions = (updates: Partial<FlyersPromotionsSettings>) => {
    setSettings((prev) => ({ ...prev, flyersPromotions: { ...prev.flyersPromotions, ...updates } }));
  };
  const updateAnimations = (updates: Partial<AnimationsSettings>) => {
    setSettings((prev) => ({ ...prev, animations: { ...prev.animations, ...updates } }));
  };
  const updateNavigationHeaderFooter = (updates: Partial<NavigationHeaderFooterSettings>) => {
    setSettings((prev) => ({ ...prev, navigationHeaderFooter: { ...prev.navigationHeaderFooter, ...updates } }));
  };
  const updateDeliveryWarranty = (updates: Partial<DeliveryWarrantySettings>) => {
    setSettings((prev) => ({ ...prev, deliveryWarranty: { ...prev.deliveryWarranty, ...updates } }));
  };
  const updateOrdersNotifications = (updates: Partial<OrdersNotificationsSettings>) => {
    setSettings((prev) => ({ ...prev, ordersNotifications: { ...prev.ordersNotifications, ...updates } }));
  };
  const updateSecurityAccess = (updates: Partial<SecurityAccessSettings>) => {
    setSettings((prev) => ({ ...prev, securityAccess: { ...prev.securityAccess, ...updates } }));
  };
  const updateGeneralStore = (updates: Partial<GeneralStoreSettings>) => {
    setSettings((prev) => ({ ...prev, generalStore: { ...prev.generalStore, ...updates } }));
  };

  // Add new flyer
  const handleAddFlyer = () => {
    if (!newFlyer.title || !newFlyer.imageUrl) {
      alert("Please enter a flyer title and image URL.");
      return;
    }
    const flyerItem: PromotionalFlyerItem = {
      id: `flyer-${Date.now()}`,
      title: newFlyer.title || "Special Tech Promotion",
      subtitle: newFlyer.subtitle || "",
      badge: newFlyer.badge || "DEAL",
      imageUrl: newFlyer.imageUrl || "/images/poster-products.webp",
      destinationUrl: newFlyer.destinationUrl || "/products",
      placement: newFlyer.placement || "homepage_hero",
      device: newFlyer.device || "all",
      active: true,
    };
    updateFlyersPromotions({
      flyers: [...(settings.flyersPromotions?.flyers || []), flyerItem],
    });
    setShowAddFlyerModal(false);
    setNewFlyer({
      title: "",
      subtitle: "",
      badge: "HOT DEAL",
      imageUrl: "/images/poster-products.webp",
      destinationUrl: "/products",
      placement: "homepage_hero",
      device: "all",
      active: true,
    });
  };

  const handleDeleteFlyer = (id: string) => {
    updateFlyersPromotions({
      flyers: (settings.flyersPromotions?.flyers || []).filter((f) => f.id !== id),
    });
  };

  // Section reordering helper
  const handleMoveSection = (secId: string, direction: "up" | "down") => {
    const sections = { ...(settings.storefront.sections || {}) };
    const list = Object.values(sections).sort((a, b) => a.order - b.order);
    const index = list.findIndex((s) => s.id === secId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const tempOrder = list[index].order;
    list[index].order = list[swapIndex].order;
    list[swapIndex].order = tempOrder;

    const updatedMap: Record<string, any> = {};
    list.forEach((s) => {
      updatedMap[s.id] = s;
    });
    updateStorefront({ sections: updatedMap });
  };

  // Category search filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Enterprise Customization Console...</p>
      </div>
    );
  }

  const isDraft = settings.publishWorkflow?.status === "draft";

  return (
    <div className="space-y-6 pb-20">
      {/* ── TOP HEADER & STATUS BAR ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                <SettingsIcon className="h-3.5 w-3.5" /> NexLapTech Visual Console
              </span>

              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Unsaved Draft Changes
                </span>
              ) : isDraft ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Clock className="h-3 w-3" /> Draft Mode (Ready to Publish)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Published &amp; Live (v{settings.version})
                </span>
              )}

              {healthData?.database && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Database className="h-3 w-3 text-blue-600" />
                  {healthData.database.type}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Website &amp; Customer Portal Customization
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Customize live appearance, customer dashboard layout, backgrounds, flyers, animations, and store governance with draft preview and rollback.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Reset all settings to initial factory defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Defaults
            </button>

            {isDirty && (
              <button
                onClick={handleDiscard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Discard
              </button>
            )}

            <button
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-blue-600" /> Preview
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-600/30 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-4 py-2.5 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving Draft..." : "Save Draft"}
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              {publishing ? "Publishing..." : "Publish Live"}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 border ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* ── MAIN WORKSPACE (SIDEBAR + CONTENT PANELS) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customization categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Navigation Category List */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-sm space-y-1 max-h-[750px] overflow-y-auto">
            {filteredCategories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {cat.label}
                      </p>
                      {cat.badge && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isActive
                              ? "bg-white/30 text-white"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Editor Panel */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* ════ CATEGORY 1: APPEARANCE & THEMES ════ */}
          {activeCategory === "appearance" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" /> Website Appearance &amp; Themes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure brand colors, heading typography, UI density, corner radius, and button styling across the entire website.
                </p>
              </div>

              {/* Brand Colors */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Brand Color (Current: {settings.appearance.primaryColor})
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => updateAppearance({ primaryColor: color.hex })}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                        settings.appearance.primaryColor.toLowerCase() === color.hex.toLowerCase()
                          ? "ring-2 ring-offset-2 ring-blue-600 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    >
                      {settings.appearance.primaryColor.toLowerCase() === color.hex.toLowerCase() && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                    className="h-9 w-9 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                    title="Pick custom hex color"
                  />
                  <input
                    type="text"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                    className="w-28 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Accent Color (Cyber / Cyan / Amber Highlights)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.appearance.accentColor}
                    onChange={(e) => updateAppearance({ accentColor: e.target.value })}
                    className="h-9 w-9 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.appearance.accentColor}
                    onChange={(e) => updateAppearance({ accentColor: e.target.value })}
                    className="w-28 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              {/* Typography Settings (Batman Forever / Space Grotesk / Plus Jakarta Sans) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Main Headings Display Font
                  </label>
                  <select
                    value={settings.appearance.headingFont || "batman"}
                    onChange={(e) => updateAppearance({ headingFont: e.target.value as HeadingFont })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="batman">Batman Forever Alternate (Custom Iconic)</option>
                    <option value="space_grotesk">Space Grotesk (Futuristic High-Tech)</option>
                    <option value="plus_jakarta">Plus Jakarta Sans (Modern Geometric)</option>
                    <option value="outfit">Outfit (Clean Luxury Sans)</option>
                    <option value="system">System Default Sans</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Controls H1, H2, banners, and hero title letterforms.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Body &amp; Paragraph Typography
                  </label>
                  <select
                    value={settings.appearance.bodyFont || "plus_jakarta"}
                    onChange={(e) => updateAppearance({ bodyFont: e.target.value as BodyFont })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="plus_jakarta">Plus Jakarta Sans (WCAG AA Recommended)</option>
                    <option value="inter">Inter (Clean Enterprise)</option>
                    <option value="outfit">Outfit (Geometric Minimal)</option>
                    <option value="system">System Default Sans</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Ensures crystal-clear contrast and readability on all screens.</p>
                </div>
              </div>

              {/* Interface Density & Radius */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Interface Density</label>
                  <select
                    value={settings.appearance.interfaceDensity}
                    onChange={(e) => updateAppearance({ interfaceDensity: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold"
                  >
                    <option value="compact">Compact (Dense Data)</option>
                    <option value="comfortable">Comfortable (Standard)</option>
                    <option value="spacious">Spacious (Editorial)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Corner Radius</label>
                  <select
                    value={settings.appearance.cardRadius}
                    onChange={(e) => updateAppearance({ cardRadius: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold"
                  >
                    <option value="none">Sharp Corners (0px)</option>
                    <option value="md">Subtle Radius (8px)</option>
                    <option value="xl">Modern Rounded (12px)</option>
                    <option value="2xl">Futuristic Smooth (16px)</option>
                    <option value="3xl">Ultra Pill Curved (24px)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Button Style</label>
                  <select
                    value={settings.appearance.buttonStyle}
                    onChange={(e) => updateAppearance({ buttonStyle: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold"
                  >
                    <option value="rounded">Rounded Box (Standard)</option>
                    <option value="pill">Pill Shaped (Curved)</option>
                    <option value="sharp">Sharp Rectangular</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 2: HOMEPAGE & MAIN SECTIONS ════ */}
          {activeCategory === "storefront" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-blue-600" /> Homepage &amp; Main Sections
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Reorder sections, toggle homepage components, and edit hero copy without touching code.
                </p>
              </div>

              {/* Section Ordering & Toggles */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Homepage Section Ordering &amp; Visibility
                </p>
                <div className="space-y-2">
                  {Object.values(settings.storefront.sections || {})
                    .sort((a, b) => a.order - b.order)
                    .map((sec, idx) => (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sec.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(sec.id, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
                            title="Move section up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(sec.id, "down")}
                            disabled={idx === Object.keys(settings.storefront.sections).length - 1}
                            className="p-1 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30"
                            title="Move section down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <label className="relative inline-flex items-center cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={sec.enabled}
                              onChange={(e) => {
                                updateStorefront({
                                  sections: {
                                    ...settings.storefront.sections,
                                    [sec.id]: { ...sec, enabled: e.target.checked },
                                  },
                                });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hero Copy Editor */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hero Showcase Headline &amp; Call To Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Hero Headline</label>
                    <input
                      type="text"
                      value={settings.storefront.heroContent?.headline || "Smart Technology. Trusted Service."}
                      onChange={(e) =>
                        updateStorefront({
                          heroContent: {
                            ...(settings.storefront.heroContent || ({} as any)),
                            headline: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Badge Label</label>
                    <input
                      type="text"
                      value={settings.storefront.heroContent?.badgeText || "Certified IT Infrastructure & Diagnostics Partner"}
                      onChange={(e) =>
                        updateStorefront({
                          heroContent: {
                            ...(settings.storefront.heroContent || ({} as any)),
                            badgeText: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    value={settings.storefront.heroContent?.subheadline || "Enterprise laptops, gaming workstations, certified repairs & IT academy programs in Tumkur and Bengaluru."}
                    onChange={(e) =>
                      updateStorefront({
                        heroContent: {
                          ...(settings.storefront.heroContent || ({} as any)),
                          subheadline: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Primary CTA (Label &amp; Link)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.storefront.heroContent?.primaryCtaText || "Explore Products"}
                        onChange={(e) =>
                          updateStorefront({
                            heroContent: {
                              ...(settings.storefront.heroContent || ({} as any)),
                              primaryCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={settings.storefront.heroContent?.primaryCtaLink || "/products"}
                        onChange={(e) =>
                          updateStorefront({
                            heroContent: {
                              ...(settings.storefront.heroContent || ({} as any)),
                              primaryCtaLink: e.target.value,
                            },
                          })
                        }
                        className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Secondary CTA (Label &amp; Link)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.storefront.heroContent?.secondaryCtaText || "Book a Repair"}
                        onChange={(e) =>
                          updateStorefront({
                            heroContent: {
                              ...(settings.storefront.heroContent || ({} as any)),
                              secondaryCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={settings.storefront.heroContent?.secondaryCtaLink || "/book-service"}
                        onChange={(e) =>
                          updateStorefront({
                            heroContent: {
                              ...(settings.storefront.heroContent || ({} as any)),
                              secondaryCtaLink: e.target.value,
                            },
                          })
                        }
                        className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 3: CUSTOMER DASHBOARD LAYOUT ════ */}
          {activeCategory === "customerDashboard" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" /> Customer Dashboard Layout &amp; Features
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Control which KPI cards, quick actions, and modules appear on the customer portal (`/customer`).
                </p>
              </div>

              {/* Welcome Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Welcome Banner Title</label>
                  <input
                    type="text"
                    value={settings.customerDashboard?.headline || "Welcome back to NexLapTech"}
                    onChange={(e) => updateCustomerDashboard({ headline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Welcome Banner Subtitle</label>
                  <input
                    type="text"
                    value={settings.customerDashboard?.subheadline || "Manage your active hardware orders, service repairs, warranty tickets, and training progress."}
                    onChange={(e) => updateCustomerDashboard({ subheadline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Summary KPI Cards Visibility &amp; Order
                  </p>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.customerDashboard?.showKpiCards ?? true}
                      onChange={(e) => updateCustomerDashboard({ showKpiCards: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Show KPI Row</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(settings.customerDashboard?.kpiCards || {}).map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                    >
                      <span className="text-xs font-bold">{card.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.enabled}
                          onChange={(e) => {
                            updateCustomerDashboard({
                              kpiCards: {
                                ...settings.customerDashboard.kpiCards,
                                [card.id]: { ...card, enabled: e.target.checked },
                              },
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Manager */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quick Action Cards (Interactive customer shortcut buttons)
                </p>
                <div className="space-y-2">
                  {Object.values(settings.customerDashboard?.quickActions || {}).map((qa) => (
                    <div
                      key={qa.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600">{qa.title}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={qa.enabled}
                            onChange={(e) => {
                              updateCustomerDashboard({
                                quickActions: {
                                  ...settings.customerDashboard.quickActions,
                                  [qa.id]: { ...qa, enabled: e.target.checked },
                                },
                              });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={qa.title}
                          onChange={(e) => {
                            updateCustomerDashboard({
                              quickActions: {
                                ...settings.customerDashboard.quickActions,
                                [qa.id]: { ...qa, title: e.target.value },
                              },
                            });
                          }}
                          placeholder="Card title"
                          className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={qa.subtitle}
                          onChange={(e) => {
                            updateCustomerDashboard({
                              quickActions: {
                                ...settings.customerDashboard.quickActions,
                                [qa.id]: { ...qa, subtitle: e.target.value },
                              },
                            });
                          }}
                          placeholder="Subtitle description"
                          className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed & Module Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.customerDashboard?.showRecentActivity ?? true}
                    onChange={(e) => updateCustomerDashboard({ showRecentActivity: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold">Recent Activity Feed</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.customerDashboard?.showFeaturedHardware ?? true}
                    onChange={(e) => updateCustomerDashboard({ showFeaturedHardware: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold">Featured Hardware Shelf</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.customerDashboard?.showSupportCard ?? true}
                    onChange={(e) => updateCustomerDashboard({ showSupportCard: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold">Direct Support Card</span>
                </label>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 5: WEBSITE BACKGROUNDS & EFFECTS ════ */}
          {activeCategory === "backgroundEffects" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" /> Website Backgrounds &amp; Visual Effects
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add holographic grids, subtle mesh gradients, particle layers, or custom media with fine-tuned opacity and blur controls.
                </p>
              </div>

              {/* Background Preset Cards */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Visual Background Architecture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "holographic_grid", label: "Holographic Cyber Grid", desc: "Cyan perspective wireframe" },
                    { id: "subtle_gradient", label: "Subtle Mesh Gradient", desc: "Enterprise indigo glow" },
                    { id: "tech_dots", label: "Tech Network Matrix", desc: "Subtle micro dot matrix" },
                    { id: "floating_particles", label: "Floating Tech Particles", desc: "Soft ambient motion" },
                    { id: "cyber_lines", label: "Cyber Circuit Lines", desc: "Refined linear geometry" },
                    { id: "ambient_glow", label: "Ambient Orb Glow", desc: "Deep radial lighting" },
                    { id: "solid", label: "Clean Solid Minimal", desc: "Zero noise slate" },
                    { id: "custom_media", label: "Custom Media Layer", desc: "Upload / Link image or video" },
                  ].map((preset) => {
                    const isSelected = (settings.backgroundEffects?.preset || "holographic_grid") === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updateBackgroundEffects({ preset: preset.id as any })}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm"
                            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        }`}
                      >
                        <p className={`text-xs font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                          {preset.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders: Opacity, Blur, Animation Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Effect Opacity</span>
                    <span className="text-blue-600">{Math.round((settings.backgroundEffects?.opacity ?? 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={settings.backgroundEffects?.opacity ?? 0.85}
                    onChange={(e) => updateBackgroundEffects({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Backdrop Blur Filter</span>
                    <span className="text-blue-600">{settings.backgroundEffects?.blur ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={settings.backgroundEffects?.blur ?? 0}
                    onChange={(e) => updateBackgroundEffects({ blur: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Animation Motion Speed</label>
                  <select
                    value={settings.backgroundEffects?.animationSpeed || "normal"}
                    onChange={(e) => updateBackgroundEffects({ animationSpeed: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="slow">Slow &amp; Ambient</option>
                    <option value="normal">Normal Cadence</option>
                    <option value="fast">Dynamic / Rapid</option>
                    <option value="static">Static (No Motion)</option>
                  </select>
                </div>
              </div>

              {/* Custom Media input if custom_media selected */}
              {settings.backgroundEffects?.preset === "custom_media" && (
                <div className="space-y-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Custom Background Media URL (Image, Video or GIF)
                  </label>
                  <input
                    type="text"
                    value={settings.backgroundEffects?.mediaUrl || ""}
                    onChange={(e) => updateBackgroundEffects({ mediaUrl: e.target.value })}
                    placeholder="/images/poster-products.webp or https://..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono"
                  />
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Quick media pick:</span>
                    <button
                      type="button"
                      onClick={() => updateBackgroundEffects({ mediaUrl: "/images/poster-products.webp", mediaType: "image" })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-white/10 border text-[10px] font-bold"
                    >
                      Poster Products
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBackgroundEffects({ mediaUrl: "/assets/hero-bg.jpg", mediaType: "image" })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-white/10 border text-[10px] font-bold"
                    >
                      Hero Background
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ CATEGORY 6: FLYERS, BANNERS & PROMOTIONS ════ */}
          {activeCategory === "flyersPromotions" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-600" /> Flyers, Banners &amp; Promotions
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage promotional flyers, campaign banners, and festival discount announcements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFlyerModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shrink-0 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Flyer
                </button>
              </div>

              {/* Flyers Table */}
              <div className="space-y-3">
                {(settings.flyersPromotions?.flyers || []).length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-400">
                    No promotional flyers added yet. Click &quot;Add New Flyer&quot; to create a seasonal or product campaign.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(settings.flyersPromotions?.flyers || []).map((flyer) => (
                      <div
                        key={flyer.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={flyer.imageUrl || "/images/poster-products.webp"}
                            alt={flyer.title}
                            className="h-12 w-16 object-cover rounded-xl border border-slate-200 dark:border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                                {flyer.badge}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {flyer.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{flyer.subtitle}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Link: {flyer.destinationUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-[11px] font-semibold text-slate-500 capitalize">
                            {flyer.placement.replace("_", " ")}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={flyer.active}
                              onChange={(e) => {
                                updateFlyersPromotions({
                                  flyers: (settings.flyersPromotions?.flyers || []).map((f) =>
                                    f.id === flyer.id ? { ...f, active: e.target.checked } : f
                                  ),
                                });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteFlyer(flyer.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete flyer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ CATEGORY 7: ANIMATIONS & MOTION ════ */}
          {activeCategory === "animations" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" /> Animation Controls &amp; Motion Physics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adjust section reveals, card hover physics, and counter dynamics with automatic reduced-motion accessibility support.
                </p>
              </div>

              {/* Motion Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "subtle", label: "Subtle (Restrained)", desc: "Gentle fades and micro shifts" },
                  { id: "standard", label: "Standard (Enterprise)", desc: "Smooth spring & hover tilt" },
                  { id: "enhanced", label: "Enhanced (Dynamic)", desc: "Vibrant particle & float effects" },
                  { id: "none", label: "Static Minimal", desc: "No animations (High performance)" },
                ].map((preset) => {
                  const isSelected = (settings.animations?.preset || "standard") === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => updateAnimations({ preset: preset.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                        {preset.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{preset.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Individual Motion Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold">Section Reveal on Scroll</p>
                    <p className="text-[11px] text-slate-400">Smooth opacity fade when scrolling into view</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations?.sectionReveal ?? true}
                    onChange={(e) => updateAnimations({ sectionReveal: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold">Card Hover Physics</p>
                    <p className="text-[11px] text-slate-400">3D scale and subtle shadow lifts on hover</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations?.cardHoverPhysics ?? true}
                    onChange={(e) => updateAnimations({ cardHoverPhysics: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold">Button Interactions</p>
                    <p className="text-[11px] text-slate-400">Tactile active press &amp; glow feedback</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations?.buttonInteractions ?? true}
                    onChange={(e) => updateAnimations({ buttonInteractions: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold">Reduced Motion Compliance</p>
                    <p className="text-[11px] text-slate-400">Honor OS `prefers-reduced-motion` settings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations?.respectReducedMotion ?? true}
                    onChange={(e) => updateAnimations({ respectReducedMotion: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 8: HEADER, FOOTER & NAVIGATION ════ */}
          {activeCategory === "navigationHeaderFooter" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" /> Header, Footer &amp; Navigation Structure
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage primary navigation links, header layout styles, and footer information columns.
                </p>
              </div>

              {/* Header Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "standard", label: "Standard Enterprise Header", desc: "Solid white/dark glass with full borders" },
                  { id: "floating_glass", label: "Floating Glass Pill", desc: "Modern centered rounded floating nav" },
                  { id: "minimal_split", label: "Minimal Split Nav", desc: "Ultra clean left/right separation" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => updateNavigationHeaderFooter({ headerStyle: st.id as any })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      (settings.navigationHeaderFooter?.headerStyle || "standard") === st.id
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{st.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{st.desc}</p>
                  </button>
                ))}
              </div>

              {/* Header Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.navigationHeaderFooter?.stickyHeader ?? true}
                    onChange={(e) => updateNavigationHeaderFooter({ stickyHeader: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Sticky Header on Scroll</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.navigationHeaderFooter?.showTopAnnouncement ?? true}
                    onChange={(e) => updateNavigationHeaderFooter({ showTopAnnouncement: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Show Announcement Bar</span>
                </label>
              </div>

              {/* Navigation Links Table */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Header Navigation Links
                </p>
                <div className="space-y-2">
                  {(settings.navigationHeaderFooter?.navLinks || []).map((link, idx) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="h-6 w-6 rounded bg-slate-200 dark:bg-white/10 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...(settings.navigationHeaderFooter?.navLinks || [])];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            updateNavigationHeaderFooter({ navLinks: updated });
                          }}
                          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold w-1/3"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => {
                            const updated = [...(settings.navigationHeaderFooter?.navLinks || [])];
                            updated[idx] = { ...updated[idx], href: e.target.value };
                            updateNavigationHeaderFooter({ navLinks: updated });
                          }}
                          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-mono w-1/2"
                        />
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={link.enabled}
                          onChange={(e) => {
                            const updated = [...(settings.navigationHeaderFooter?.navLinks || [])];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            updateNavigationHeaderFooter({ navLinks: updated });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 13: PUBLISH, PREVIEW & VERSION HISTORY ════ */}
          {activeCategory === "publishVersionHistory" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" /> Publish Workflow &amp; Version History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Draft mode protects the live store until approved. Review previous versions and execute 1-click atomic rollbacks.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Live Active Version: v{settings.version}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Last modified by <strong>{settings.updatedBy?.name || "Admin"}</strong> ({settings.updatedBy?.email}) on {new Date(settings.updatedAt).toLocaleString("en-IN")}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-blue-600"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-extrabold shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5" /> Publish to Live Site
                  </button>
                </div>
              </div>

              {/* Version History Table */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Historical Version Snapshots (Rollback Available)
                </h3>
                {versionHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 border rounded-2xl">
                    Version 1 initialized. Future live publishing operations will automatically record rollback snapshots here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {versionHistory.map((ver) => (
                      <div
                        key={ver.version}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black">
                              v{ver.version}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {ver.summary || "Configuration Snapshot"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Published by {ver.publishedBy?.name} on {new Date(ver.publishedAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleRollback(ver.version)}
                            disabled={rollingBack || ver.version === settings.version}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"
                          >
                            <Undo2 className="h-3.5 w-3.5 text-amber-500" />
                            {ver.version === settings.version ? "Active Version" : "Restore Version"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ CATEGORY 4: PRODUCT DISPLAY ════ */}
          {activeCategory === "productDisplay" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" /> Product Display &amp; Card Presentation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure card badges, stock indicators, pincode availability checks, and gallery zoom presentation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "showStockStatus", label: "Show Real-Time Stock Status", desc: "Display 'In Stock' or low stock warning" },
                  { key: "showSku", label: "Show Product SKU Code", desc: "Render e.g. SKU: NEX-SKU-3769 on catalog cards" },
                  { key: "showRatings", label: "Show Verified Customer Ratings", desc: "Display star rating and reviews count" },
                  { key: "showWarrantyBadge", label: "Show Warranty Badge", desc: "Render warranty duration pill (e.g. 90-Day / 1-Yr)" },
                  { key: "showReplacementBadge", label: "Show Replacement Policy Badge", desc: "Display 7-Day Replacement Guarantee badge" },
                  { key: "showQuickAddToCart", label: "Show Quick Add To Cart", desc: "Render direct cart addition button on cards" },
                  { key: "pincodeCheckerEnabled", label: "Enable Doorstep Pincode Checker", desc: "Allows customer to check delivery ETA by pincode" },
                  { key: "zoomLightboxEnabled", label: "Enable Gallery Lightbox Zoom", desc: "Enables click-to-expand high-resolution product inspection" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-pointer"
                  >
                    <div className="pr-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(settings.productDisplay as any)[item.key]}
                      onChange={(e) => updateProductDisplay({ [item.key]: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ════ CATEGORY 9: ABOUT & GENERAL STORE ════ */}
          {activeCategory === "generalStore" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" /> About NEXLAPTECH &amp; Business Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Store identity, Tumkur office address, contact numbers, GSTIN registration, and maintenance mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Store Brand Name</label>
                  <input
                    type="text"
                    value={settings.generalStore.storeName}
                    onChange={(e) => updateGeneralStore({ storeName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Business Legal Entity</label>
                  <input
                    type="text"
                    value={settings.generalStore.businessLegalName}
                    onChange={(e) => updateGeneralStore({ businessLegalName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">GSTIN Number</label>
                  <input
                    type="text"
                    value={settings.generalStore.gstin}
                    onChange={(e) => updateGeneralStore({ gstin: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Support Phone</label>
                  <input
                    type="text"
                    value={settings.generalStore.supportPhone}
                    onChange={(e) => updateGeneralStore({ supportPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Support Email</label>
                  <input
                    type="email"
                    value={settings.generalStore.supportEmail}
                    onChange={(e) => updateGeneralStore({ supportEmail: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold">Registered Office Address</label>
                <input
                  type="text"
                  value={settings.generalStore.registeredAddress}
                  onChange={(e) => updateGeneralStore({ registeredAddress: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Maintenance Mode</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    When active, public storefront displays a scheduled maintenance banner while admins retain full access.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.generalStore.maintenanceMode}
                  onChange={(e) => updateGeneralStore({ maintenanceMode: e.target.checked })}
                  className="rounded text-amber-600 h-5 w-5"
                />
              </div>
            </div>
          )}

          {/* ════ CATEGORY 10: DELIVERY & WARRANTY POLICIES ════ */}
          {activeCategory === "deliveryWarranty" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" /> Delivery, Warranty &amp; Return Policies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enforces Tumkur pickup pincode 572102, 3-10 day delivery ranges, 7-day replacement, and 90-day base warranty.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Default Pickup Pincode</label>
                  <input
                    type="text"
                    value={settings.deliveryWarranty.defaultPickupPincode}
                    onChange={(e) => updateDeliveryWarranty({ defaultPickupPincode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Default: 572102 (Tumkur Central Hub)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Standard Delivery Range (Days)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.deliveryWarranty.deliveryEstimateMinDays}
                      onChange={(e) => updateDeliveryWarranty({ deliveryEstimateMinDays: parseInt(e.target.value) || 1 })}
                      className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold text-center"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.deliveryWarranty.deliveryEstimateMaxDays}
                      onChange={(e) => updateDeliveryWarranty({ deliveryEstimateMaxDays: parseInt(e.target.value) || 10 })}
                      className="w-1/2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold text-center"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Default specification: 3 to 10 days</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Replacement Window (Days)</label>
                  <input
                    type="number"
                    value={settings.deliveryWarranty.replacementPolicyDays}
                    onChange={(e) => updateDeliveryWarranty({ replacementPolicyDays: parseInt(e.target.value) || 7 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Default: 7-Day Replacement Guarantee</p>
                </div>
              </div>

              {/* Warranty Description */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Default Base Hardware Warranty (Days)</label>
                  <input
                    type="number"
                    value={settings.deliveryWarranty.defaultWarrantyDays}
                    onChange={(e) => updateDeliveryWarranty({ defaultWarrantyDays: parseInt(e.target.value) || 90 })}
                    className="w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Default: 90 days diagnostics warranty</p>
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 11: CUSTOMER PORTAL FEATURES ════ */}
          {activeCategory === "customerPortalFeatures" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" /> Customer Portal Policies &amp; Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enforce global theme policy or allow customer personal theme preference.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Customer Theme Control Policy
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateAppearance({ customerThemePolicy: "personal" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        settings.appearance.customerThemePolicy === "personal"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Personal Customer Choice (Recommended)</p>
                      <p className="text-[11px] text-slate-400 mt-1">Customers can toggle between Day and Night mode freely.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppearance({ customerThemePolicy: "forced" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        settings.appearance.customerThemePolicy === "forced"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Forced Store Theme (Admin Override)</p>
                      <p className="text-[11px] text-slate-400 mt-1">All customers see only the admin-enforced global theme.</p>
                    </button>
                  </div>
                </div>

                {settings.appearance.customerThemePolicy === "forced" && (
                  <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Enforced Global Theme
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateAppearance({ forcedTheme: "day" })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${
                          settings.appearance.forcedTheme === "day"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-white/10 border"
                        }`}
                      >
                        Light Mode (Day)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAppearance({ forcedTheme: "night" })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${
                          settings.appearance.forcedTheme === "night"
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-white/10 border"
                        }`}
                      >
                        Dark Mode (Night)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ CATEGORY 12: SEO & SOCIAL CHANNELS ════ */}
          {activeCategory === "seoSocial" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-600" /> SEO &amp; Social Channels
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Metadata titles, OpenGraph sharing image, and social media connectivity.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">SEO Meta Title</label>
                  <input
                    type="text"
                    value={settings.generalStore.seoTitle}
                    onChange={(e) => updateGeneralStore({ seoTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={settings.generalStore.seoDescription}
                    onChange={(e) => updateGeneralStore({ seoDescription: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">Instagram URL</label>
                    <input
                      type="text"
                      value={settings.generalStore.socialLinks?.instagram || ""}
                      onChange={(e) =>
                        updateGeneralStore({
                          socialLinks: { ...settings.generalStore.socialLinks, instagram: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">WhatsApp Channel URL</label>
                    <input
                      type="text"
                      value={settings.generalStore.socialLinks?.whatsapp || ""}
                      onChange={(e) =>
                        updateGeneralStore({
                          socialLinks: { ...settings.generalStore.socialLinks, whatsapp: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 14: AUDIT LOG & HEALTH ════ */}
          {activeCategory === "auditTelemetry" && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" /> Audit Log &amp; System Telemetry
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Immutable administrative audit trail of changes, timestamps, and database telemetry.
                </p>
              </div>

              {/* Telemetry Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">System Database</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {healthData?.database?.type || "Supabase Postgres"}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Node Environment</span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {healthData?.environment || "production"}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Settings Version</span>
                  <p className="text-sm font-extrabold text-blue-600 mt-1">v{settings.version}</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Audit Entries</span>
                  <p className="text-sm font-extrabold text-emerald-600 mt-1">{auditLog.length}</p>
                </div>
              </div>

              {/* Audit Log Stream */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Recent Administrative Actions
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.category}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 shrink-0">
                        <p>{log.adminEmail}</p>
                        <p>{new Date(log.timestamp).toLocaleTimeString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ CATEGORY 15: CUSTOMER TRAFFIC & VISITOR ANALYTICS ════ */}
          {activeCategory === "customerVisitsAnalytics" && (
            <CustomerVisitsAnalyticsSection />
          )}
        </div>
      </div>

      {/* ── MULTI-DEVICE LIVE PREVIEW MODAL ─────────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Multi-Device Live Customization Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Previewing active draft configuration before public publishing
                  </p>
                </div>
              </div>

              {/* Viewport & Tab Switchers */}
              <div className="flex items-center gap-3">
                {/* Storefront vs Customer Tab */}
                <div className="flex rounded-xl bg-slate-200 dark:bg-white/10 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("storefront")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "storefront" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Homepage
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("customer")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      previewTab === "customer" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Customer Portal
                  </button>
                </div>

                {/* Device Switcher */}
                <div className="hidden sm:flex rounded-xl bg-slate-200 dark:bg-white/10 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-lg ${previewDevice === "desktop" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500"}`}
                    title="Desktop (Full)"
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className={`p-1.5 rounded-lg ${previewDevice === "tablet" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500"}`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-lg ${previewDevice === "mobile" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500"}`}
                    title="Mobile (375px)"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview Frame Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-black/40 flex justify-center items-start">
              <div
                className={`transition-all duration-300 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg overflow-hidden ${
                  previewDevice === "mobile"
                    ? "w-[375px]"
                    : previewDevice === "tablet"
                    ? "w-[768px]"
                    : "w-full max-w-5xl"
                }`}
              >
                {/* Top Announcement Bar Preview */}
                {settings.storefront.announcementBar?.enabled && (
                  <div
                    style={{
                      backgroundColor: settings.storefront.announcementBar.bgColor || settings.appearance.primaryColor,
                      color: settings.storefront.announcementBar.textColor || "#FFFFFF",
                    }}
                    className="p-2.5 text-center text-xs font-bold"
                  >
                    {settings.storefront.announcementBar.text}
                  </div>
                )}

                {/* Header Preview */}
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: settings.appearance.primaryColor }}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-xs"
                    >
                      N
                    </div>
                    <span className="font-display font-extrabold text-sm">{settings.generalStore.storeName}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Products</span>
                    <span>Repairs</span>
                    <span>Academy</span>
                    <span>Contact</span>
                  </div>
                </div>

                {/* Content rendering based on preview tab */}
                {previewTab === "storefront" ? (
                  <div className="p-6 sm:p-10 space-y-8">
                    {/* Hero Preview */}
                    <div className="space-y-4 text-center max-w-2xl mx-auto">
                      <span
                        style={{ color: settings.appearance.primaryColor }}
                        className="text-xs font-bold uppercase tracking-wider"
                      >
                        {settings.storefront.heroContent?.badgeText || "Certified Diagnostics Partner"}
                      </span>
                      <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
                        {settings.storefront.heroContent?.headline || "Smart Technology. Trusted Service."}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {settings.storefront.heroContent?.subheadline}
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          style={{ backgroundColor: settings.appearance.primaryColor }}
                          className="text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
                        >
                          {settings.storefront.heroContent?.primaryCtaText || "Explore Products"}
                        </button>
                        <button className="border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold">
                          {settings.storefront.heroContent?.secondaryCtaText || "Book a Repair"}
                        </button>
                      </div>
                    </div>

                    {/* Section Stack */}
                    <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Flow</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.values(settings.storefront.sections || {})
                          .sort((a, b) => a.order - b.order)
                          .map((sec) => (
                            <div
                              key={sec.id}
                              className={`p-2.5 rounded-xl text-xs font-bold border text-center ${
                                sec.enabled
                                  ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                  : "opacity-40 border-dashed"
                              }`}
                            >
                              {sec.name}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Customer Portal Preview */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white space-y-1">
                      <h2 className="font-display text-lg font-bold">
                        {settings.customerDashboard?.headline || "Welcome back to NexLapTech"}
                      </h2>
                      <p className="text-xs text-blue-100">{settings.customerDashboard?.subheadline}</p>
                    </div>

                    {/* KPI Cards Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.values(settings.customerDashboard?.kpiCards || {})
                        .filter((c) => c.enabled)
                        .map((card) => (
                          <div key={card.id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{card.label}</span>
                            <p className="text-xl font-black mt-1">3</p>
                          </div>
                        ))}
                    </div>

                    {/* Quick Actions Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.values(settings.customerDashboard?.quickActions || {})
                        .filter((qa) => qa.enabled)
                        .map((qa) => (
                          <div key={qa.id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                            <span className="text-[9px] font-black uppercase text-blue-600">{qa.badge}</span>
                            <h4 className="text-xs font-bold">{qa.title}</h4>
                            <p className="text-[10px] text-slate-400">{qa.subtitle}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 1-CLICK PUBLISH CONFIRMATION MODAL ──────────────────────────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Publish Configuration to Live Website
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will promote the current draft to the live website and customer portal, create an immutable version snapshot, and notify all active sessions.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Change Summary Note (for Version History)
              </label>
              <input
                type="text"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                placeholder="e.g. Updated holiday promotional banners and customer KPI layout"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Yes, Publish Live"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PROMOTIONAL FLYER MODAL ────────────────────────────────────── */}
      {showAddFlyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" /> Add Promotional Flyer / Campaign Banner
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFlyerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">Campaign Title</label>
                <input
                  type="text"
                  value={newFlyer.title}
                  onChange={(e) => setNewFlyer({ ...newFlyer, title: e.target.value })}
                  placeholder="e.g. Diwal Mega Tech Fest"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Subtitle / Offer Details</label>
                <input
                  type="text"
                  value={newFlyer.subtitle}
                  onChange={(e) => setNewFlyer({ ...newFlyer, subtitle: e.target.value })}
                  placeholder="e.g. Flat 15% off on Certified Business Laptops & Free Antivirus"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Badge Text</label>
                  <input
                    type="text"
                    value={newFlyer.badge}
                    onChange={(e) => setNewFlyer({ ...newFlyer, badge: e.target.value })}
                    placeholder="HOT DEAL"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Placement</label>
                  <select
                    value={newFlyer.placement}
                    onChange={(e) => setNewFlyer({ ...newFlyer, placement: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs"
                  >
                    <option value="homepage_hero">Homepage Hero</option>
                    <option value="product_grid">Product Catalog Grid</option>
                    <option value="customer_dashboard">Customer Dashboard Alert</option>
                    <option value="seasonal_modal">Seasonal Popup Modal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Flyer Image URL</label>
                <input
                  type="text"
                  value={newFlyer.imageUrl}
                  onChange={(e) => setNewFlyer({ ...newFlyer, imageUrl: e.target.value })}
                  placeholder="/images/poster-products.webp or URL"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Destination Link URL</label>
                <input
                  type="text"
                  value={newFlyer.destinationUrl}
                  onChange={(e) => setNewFlyer({ ...newFlyer, destinationUrl: e.target.value })}
                  placeholder="/products?category=business_laptops"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddFlyerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFlyer}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Add Flyer to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET CONFIRMATION MODAL ────────────────────────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Restore Factory Settings?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will reset all store customizations, section orderings, background effects, and warranty policies to certified factory defaults.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={resetting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20"
              >
                {resetting ? "Restoring..." : "Yes, Restore Defaults"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
