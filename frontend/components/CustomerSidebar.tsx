"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ShoppingBag,
  Tag,
  Heart,
  ShoppingCart,
  Package,
  Calendar,
  Wrench,
  Laptop,
  MessageSquare,
  Bell,
  GraduationCap,
  Briefcase,
  Award,
  ShieldCheck,
  Sparkles,
  Headphones,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cartStore";
import { useNotificationStore } from "@/lib/notificationStore";

interface CustomerSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenAiChat?: () => void;
}

const NAV_CATEGORIES = [
  {
    title: "",
    items: [
      { href: "/customer", label: "Home", icon: Home, exact: true },
    ],
  },
  {
    title: "SHOP",
    items: [
      { href: "/customer/shop", label: "Products", icon: ShoppingBag },
    ],
  },
  {
    title: "MY ACTIVITY",
    items: [
      { href: "/customer/orders", label: "Orders", icon: Package },
      { href: "/customer/bookings", label: "Bookings", icon: Calendar },
      { href: "/customer/services", label: "Services", icon: Wrench },
      { href: "/customer/laptop-enquiry", label: "Laptop Enquiries", icon: Laptop },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { href: "/customer/messages", label: "Messages", icon: MessageSquare },
      { href: "/customer/notifications", label: "Notifications", icon: Bell, isNotifications: true },
    ],
  },
  {
    title: "LEARNING",
    items: [
      { href: "/customer/training", label: "Training", icon: GraduationCap },
      { href: "/customer/internship", label: "Internship", icon: Briefcase },
      { href: "/customer/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      { href: "/customer/ewarranty", label: "E-Warranty", icon: ShieldCheck },
      { href: "/customer/ai", label: "AI Assistant", icon: Sparkles },
      { href: "/customer/support", label: "Contact Support", icon: Headphones },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/customer/profile", label: "My Profile", icon: User },
      { href: "/customer/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function CustomerSidebar({ mobileOpen, setMobileOpen }: CustomerSidebarProps) {
  const pathname = usePathname() || "/customer";
  const [collapsed, setCollapsed] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const cartOpen = useCartStore((s) => s.openCart);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const unreadNotifications = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexbyte_sidebar_collapsed");
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("nexbyte_sidebar_collapsed", String(next));
      window.dispatchEvent(new CustomEvent("nexbyte-sidebar-toggle", { detail: { collapsed: next } }));
    } catch {}
  };

  const isActive = (href: string, exact = false) => {
    if (exact || href === "/customer") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOutConfirm = async () => {
    setSigningOut(true);
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) await supabase.auth.signOut();
      await fetch("/api/customer/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      document.cookie = "nexbyte_customer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      setSigningOut(false);
      setShowSignOutModal(false);
      window.location.href = "/customer/signin";
    }
  };

  const renderNavItem = (
    item: { href: string; label: string; icon: any; exact?: boolean; isCart?: boolean; isNotifications?: boolean },
    isMobile = false
  ) => {
    const active = isActive(item.href, item.exact);
    const IconComp = item.icon;

    // Cart item — opens drawer instead of navigating
    if (item.isCart) {
      return (
        <button
          key="cart"
          onClick={() => {
            if (isMobile) setMobileOpen(false);
            cartOpen();
          }}
          className={cn(
            "group relative w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200",
            "text-[#667085] dark:text-[#A1A1AA] hover:bg-[#F0F4FF] dark:hover:bg-[#1E1638]/50 hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
          )}
        >
          <div className="relative">
            <IconComp className="h-4 w-4 shrink-0 text-[#98A2B3] dark:text-[#71717A] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[8px] font-bold text-white">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
          </div>
          {(!collapsed || isMobile) && <span className="truncate tracking-tight">Cart</span>}
          {(!collapsed || isMobile) && cartItemCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white px-1">
              {cartItemCount}
            </span>
          )}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => { if (isMobile) setMobileOpen(false); }}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200",
          active
            ? "bg-[#DBEAFE] dark:bg-[#1a2744] text-[#2563EB] dark:text-[#60A5FA] font-bold shadow-sm border-l-4 border-[#2563EB] dark:border-[#60A5FA]"
            : "text-[#475569] dark:text-[#A1A1AA] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1638]/50 hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
        )}
      >
        <div className="relative">
          <IconComp
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              active
                ? "text-[#2563EB] dark:text-[#60A5FA]"
                : "text-[#98A2B3] dark:text-[#71717A] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"
            )}
          />
          {item.isNotifications && unreadNotifications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </div>
        {(!collapsed || isMobile) && (
          <span className="truncate tracking-tight">{item.label}</span>
        )}
        {item.isNotifications && unreadNotifications > 0 && (!collapsed || isMobile) && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {collapsed && !isMobile && (
          <div className="absolute left-full ml-2.5 hidden rounded-lg bg-[#111827] dark:bg-[#1B1B20] px-2.5 py-1 text-[11px] font-medium text-white shadow-md group-hover:block z-50 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ─── DESKTOP FIXED LEFT SIDEBAR ────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-[#101B2B] border-r border-[#DCEAF2] dark:border-[#2A3B50] transition-all duration-300 ease-in-out shadow-sm",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Branding */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#DCEAF2] dark:border-[#2A3B50] shrink-0">
          <Link href="/customer" className="flex items-center gap-3 group overflow-hidden">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#020b1f] shadow-[0_0_16px_rgba(59,130,246,0.25)] ring-2 ring-cyan-400/70">
              <BrandLogo width={120} height={120} sizes="44px" priority className="h-full w-full" />
            </div>
          </Link>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#263247] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F4FF] dark:hover:bg-[#1a2744] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 no-scrollbar">
          {NAV_CATEGORIES.map((cat, idx) => (
            <div key={cat.title || idx} className="space-y-0.5">
              {!collapsed && cat.title && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B] block mb-1.5">
                  {cat.title}
                </span>
              )}
              {cat.items.map((item) => renderNavItem(item as any))}
              {idx < NAV_CATEGORIES.length - 1 && (
                <div className="h-px bg-[#E2E8F0] dark:bg-[#263247] my-2 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-[#E2E8F0] dark:border-[#263247] shrink-0 bg-white dark:bg-[#080B12]">
          <button
            onClick={() => setShowSignOutModal(true)}
            className={cn(
              "group relative w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            {!collapsed && <span>Sign Out</span>}
            {collapsed && (
              <div className="absolute left-full ml-2.5 hidden rounded-lg bg-[#111827] dark:bg-[#1B1B20] px-2.5 py-1 text-[11px] font-medium text-white shadow-md group-hover:block z-50 whitespace-nowrap">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE SLIDE-IN DRAWER ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-[#080B12] border-r border-[#E2E8F0] dark:border-[#263247] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] dark:border-[#263247]">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#020b1f] shadow-[0_0_16px_rgba(59,130,246,0.25)] ring-2 ring-cyan-400/70">
                    <BrandLogo width={120} height={120} sizes="44px" className="h-full w-full" />
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-[#64748B] hover:bg-[#F0F4FF] dark:hover:bg-[#1a2744]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {NAV_CATEGORIES.map((cat, idx) => (
                  <div key={cat.title || idx} className="space-y-0.5">
                    {cat.title && (
                      <span className="text-[10px] font-bold uppercase text-[#94A3B8] dark:text-[#64748B] block mb-1.5">
                        {cat.title}
                      </span>
                    )}
                    {cat.items.map((item) => renderNavItem(item as any, true))}
                    {idx < NAV_CATEGORIES.length - 1 && (
                      <div className="h-px bg-[#E2E8F0] dark:bg-[#263247] my-2" />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#E2E8F0] dark:border-[#263247]">
                <button
                  onClick={() => { setMobileOpen(false); setShowSignOutModal(true); }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── SIGN OUT CONFIRMATION MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0D0D0F] border border-[#E2E8F0] dark:border-[#263247] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-[#111827] dark:text-white text-base">
                  Sign Out?
                </h3>
              </div>

              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Sign out of your NexLapTech account? You will need to sign in again to access your orders, bookings, and profile.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F4FF] dark:hover:bg-[#1a2744] rounded-xl border border-[#E2E8F0] dark:border-[#263247] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOutConfirm}
                  disabled={signingOut}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
