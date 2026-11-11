"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  Home,
  LogOut,
  Shield,
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Package,
  Wrench,
  GraduationCap,
  BookOpen,
  Users,
  Archive,
  FileText,
  Globe,
  Bell,
  BarChart3,
  Image,
  Settings,
  Mail,
  Laptop,
  AlertCircle,
  Award,
  QrCode,
  MapPin,
  UserCheck,
  Menu,
  X,
  Store,
  Sparkles,
  Receipt,
  Tag,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { realtimeSync } from "@/lib/realtimeSync";
import { useAutoLogout } from "@/lib/useAutoLogout";
import { useNotificationStore } from "@/lib/notificationStore";
import QuickNotificationsPopover from "@/components/QuickNotificationsPopover";
import BrandLogo from "@/components/BrandLogo";
import { useTheme } from "@/components/ThemeProvider";
import AdminCommandPalette from "@/components/AdminCommandPalette";

// ─── Primary Immediate Navigation Links ──────────────────────────────────────

const PRIMARY_NAV_ITEMS = [
  { label: "Overview Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Billing & Invoices", href: "/admin/billing", icon: Receipt },
  { label: "Offers Management", href: "/admin/offers", icon: Tag },
  { label: "Protection Plans", href: "/admin/protection-plans", icon: Shield },
  { label: "Bookings", href: "/admin/bookings", icon: Calendar },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "IT Services", href: "/admin/services", icon: Wrench },
  { label: "Reseller Management", href: "/admin/resellers", icon: Store },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Laptop Enquiries", href: "/admin/laptop-enquiries", icon: Laptop },
  { label: "Inventory Alerts", href: "/admin/inventory", icon: Archive },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, hasBadge: true },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Reports", href: "/admin/reports", icon: FileText },
];

// ─── Collapsible Secondary Groups ─────────────────────────────────────────────

const COLLAPSIBLE_GROUPS = [
  {
    id: "content",
    title: "Content & Website",
    items: [
      { label: "Website CMS", href: "/admin/website-cms", icon: Globe },
      { label: "Media Library", href: "/admin/media", icon: Image },
      { label: "Product Filters", href: "/admin/product-filters", icon: SlidersHorizontal },
    ],
  },
  {
    id: "academy",
    title: "Training & Internship",
    items: [
      { label: "Training Programs", href: "/admin/training", icon: BookOpen },
      { label: "Internships", href: "/admin/internships", icon: GraduationCap },
    ],
  },
  {
    id: "cert_qr",
    title: "Certificates & QR",
    items: [
      { label: "Certificates", href: "/admin/certificates", icon: Award },
      { label: "QR Generator", href: "/admin/qr-generator", icon: QrCode },
    ],
  },
  {
    id: "reviews_gallery",
    title: "Reviews & Gallery",
    items: [
      { label: "Customer Reviews", href: "/admin/reviews", icon: MessageSquare },
      { label: "Gallery", href: "/admin/gallery", icon: Image },
    ],
  },
  {
    id: "admin_settings",
    title: "Administration & Settings",
    items: [
      { label: "Admin Users", href: "/admin/users", icon: UserCheck },
      { label: "Branches", href: "/admin/branches", icon: MapPin },
      { label: "AI Center", href: "/admin/ai", icon: Sparkles },
      { label: "Contact Messages", href: "/admin/contacts", icon: Mail },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const { showWarning, countdown, dismissWarning, logout: autoLogout } = useAutoLogout();

  useEffect(() => {
    fetchNotifications();
    realtimeSync.init();
    let throttleTimeout: any = null;
    const handleRealtime = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        fetchNotifications();
        throttleTimeout = null;
      }, 2000);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("nexbyte-realtime", handleRealtime);
      try {
        const savedCollapsed = localStorage.getItem("nexbyte_admin_sidebar_collapsed");
        if (savedCollapsed === "true") setIsDesktopCollapsed(true);

        const savedGroups = localStorage.getItem("nexbyte_admin_expanded_groups");
        if (savedGroups) setExpandedGroups(JSON.parse(savedGroups));
      } catch {}
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("nexbyte-realtime", handleRealtime);
      }
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [fetchNotifications]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try { localStorage.setItem("nexbyte_admin_expanded_groups", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleDesktopCollapse = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("nexbyte_admin_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) router.replace("/admin/login");
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const isLoginPage = pathname === "/admin/login";
  if (isLoginPage) return <>{children}</>;

  const renderNavItem = (item: { label: string; href: string; icon: any; hasBadge?: boolean }) => {
    const active = isActive(item.href);
    const badge = item.hasBadge ? unreadCount : 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        onClick={() => setIsMobileOpen(false)}
        title={isDesktopCollapsed ? item.label : undefined}
        className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-bold tracking-wide transition-all ${
          active
            ? "bg-indigo-600 text-white shadow-sm border border-indigo-500"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
        } ${isDesktopCollapsed ? "justify-center px-2" : ""}`}
      >
        <item.icon
          className={`h-4 w-4 shrink-0 transition-colors ${
            active ? "text-white" : "text-indigo-600 dark:text-cyan-400"
          }`}
        />
        {!isDesktopCollapsed && <span className="truncate">{item.label}</span>}
        {badge > 0 && (
          <span
            className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold px-1 ${
              isDesktopCollapsed ? "absolute -top-1 -right-1" : "ml-auto"
            }`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="admin-portal relative flex h-screen h-[100dvh] overflow-hidden bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Auto-logout warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="relative max-w-sm rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-[#0B0F1E] p-8 text-center shadow-2xl">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-pulse" />
            <h3 className="mb-2 font-display text-lg font-bold text-slate-900 dark:text-white">Session Expiring</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              You will be automatically logged out in <span className="text-amber-500 font-bold text-base">{countdown}s</span> due to inactivity.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={dismissWarning} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                Stay Logged In
              </button>
              <button onClick={autoLogout} className="rounded-xl border border-rose-200 dark:border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 transform flex-col justify-between border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] transition-all duration-300 ease-in-out md:static md:translate-x-0 print:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDesktopCollapsed ? "w-20" : "w-64"}`}
      >
        <div className="p-4 flex-1 flex flex-col min-h-0">
          {/* Logo Brand & Collapse Toggle */}
          <div className="mb-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 dark:border-white/10 bg-white shadow-sm ${
                  isDesktopCollapsed ? "h-9 w-9" : "h-14 w-14"
                }`}
              >
                <BrandLogo
                  width={isDesktopCollapsed ? 52 : 120}
                  height={isDesktopCollapsed ? 52 : 120}
                  sizes={isDesktopCollapsed ? "52px" : "120px"}
                  className="h-full w-full"
                />
              </div>
              {!isDesktopCollapsed && (
                <div className="truncate">
                  <h2 className="truncate font-display text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                    NEXLAPTECH
                  </h2>
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                    QUANTUM COMMAND
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDesktopCollapse}
                title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                className="hidden rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white md:flex"
              >
                {isDesktopCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                )}
              </button>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white md:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {/* 1. Primary Immediate Links */}
            <div className="space-y-1">
              {!isDesktopCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-cyan-400">
                  COMMAND NAVIGATION
                </p>
              )}
              {PRIMARY_NAV_ITEMS.map(renderNavItem)}
            </div>

            <div className="mx-1 my-3 h-px bg-slate-200 dark:bg-white/10" />

            {/* 2. Collapsible Secondary Groups */}
            <div className="space-y-2">
              {!isDesktopCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  ENTERPRISE MODULES
                </p>
              )}
              {COLLAPSIBLE_GROUPS.map((group) => {
                const isExpanded = !!expandedGroups[group.id];
                return (
                  <div key={group.id} className="space-y-1">
                    {!isDesktopCollapsed ? (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      >
                        <span className="truncate">{group.title}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-cyan-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />
                    )}

                    {(isExpanded || isDesktopCollapsed) && (
                      <div className={isDesktopCollapsed ? "space-y-1" : "ml-2 space-y-1 border-l border-slate-200 dark:border-white/10 pl-2"}>
                        {group.items.map(renderNavItem)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="mx-2 mb-2 space-y-1 border-t border-slate-200 dark:border-white/10 p-3">
          <Link
            href="/"
            title="Back to Website"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white ${
              isDesktopCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <Home className="h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-400" />
            {!isDesktopCollapsed && <span className="truncate">Back to Website</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log Out"
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left ${
              isDesktopCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isDesktopCollapsed && <span className="truncate">{loggingOut ? "Logging out..." : "Log Out"}</span>}
          </button>
        </div>
      </aside>

      {/* Main dashboard content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible">
        {/* Header Navigation */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0F1E]/95 px-4 backdrop-blur-xl print:hidden md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="-ml-2 rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="hidden font-display text-sm font-bold tracking-wide text-slate-900 dark:text-white md:block">
              {[...PRIMARY_NAV_ITEMS, ...COLLAPSIBLE_GROUPS.flatMap((g) => g.items)].find(
                (item) => isActive(item.href)
              )?.label || "Admin Command Console"}
            </h1>

            {/* Quantum Command Palette Trigger */}
            <button
              id="admin-command-palette-btn"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-left text-xs text-slate-600 dark:text-slate-300 transition-all hover:border-indigo-400/50 hover:bg-indigo-50 dark:hover:bg-white/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Quantum Command...</span>
              <kbd className="ml-2 hidden rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300 sm:inline-block">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "night" ? "Switch to light theme" : "Switch to dark theme"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer shadow-sm"
            >
              {theme === "night" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Notification Popover */}
            <QuickNotificationsPopover role="admin" />

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 hidden text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white md:flex"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain bg-[#F8FAFC] dark:bg-[#070B1A] p-4 text-[#0F172A] dark:text-[#F8FAFC] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 print:overflow-visible print:bg-white print:p-0 md:p-8">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading admin console...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>

      {/* Admin Command Palette */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
