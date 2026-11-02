"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import CustomerSidebar from "@/components/CustomerSidebar";
import CustomerHeader from "@/components/CustomerHeader";
import NotificationProvider from "@/components/NotificationProvider";
import CartDrawer from "@/components/CartDrawer";
import { realtimeSync } from "@/lib/realtimeSync";
import { Home, ShoppingBag, Package, MessageSquare, User, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";

// ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────

function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname() || "";
  const [mounted, setMounted] = useState(false);
  const rawCartItemCount = useCartStore((s) => s.getItemCount());
  const cartItemCount = mounted ? rawCartItemCount : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { href: "/customer", label: "Home", icon: Home, exact: true },
    { href: "/customer/shop", label: "Shop", icon: ShoppingBag },
    { href: "/customer/orders", label: "Orders", icon: Package },
    { href: "/customer/messages", label: "Messages", icon: MessageSquare },
    { href: "/customer/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact || href === "/customer") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0718]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 flex items-center justify-around px-2 pb-safe shadow-lg">
      {tabs.map((tab) => {
        const active = isActive(tab.href, tab.exact);
        const IconComp = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative",
              active
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            <div className="relative">
              <IconComp className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              {tab.href === "/customer/shop" && cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[8px] font-bold text-black">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-semibold truncate", active && "font-bold")}>{tab.label}</span>
            {active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-cyan-500 rounded-full" />
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMoreClick}
        aria-label="More navigation options"
        className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors text-slate-500 dark:text-slate-400"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[10px] font-semibold">More</span>
      </button>
    </nav>
  );
}

// ─── Customer Layout Shell ────────────────────────────────────────────────────

export default function CustomerLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Init realtime sync once per customer session
  useEffect(() => {
    realtimeSync.init();
  }, []);

  // Sync sidebar collapsed state with CustomerSidebar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexbyte_sidebar_collapsed");
      if (saved === "true") setSidebarCollapsed(true);
    } catch {}

    const handleToggle = (e: any) => {
      if (e?.detail && typeof e.detail.collapsed === "boolean") {
        setSidebarCollapsed(e.detail.collapsed);
      }
    };

    window.addEventListener("nexbyte-sidebar-toggle", handleToggle);
    return () => window.removeEventListener("nexbyte-sidebar-toggle", handleToggle);
  }, []);

  // Auth routes — no sidebar/header
  const isAuthRoute =
    pathname.endsWith("/signin") ||
    pathname.endsWith("/signup") ||
    pathname.endsWith("/forgot-password") ||
    pathname === "/customer/login";

  if (isAuthRoute) {
    return (
      <NotificationProvider>
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col justify-center transition-colors duration-200">
          {children}
        </div>
      </NotificationProvider>
    );
  }

  // Check if current page is customer homepage (/customer)
  const isCustomerHome = pathname === "/customer";

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col transition-colors duration-200">
        {/* Desktop Sidebar — hidden on mobile, shown on lg+ */}
        <CustomerSidebar
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Column — offset by sidebar width on desktop */}
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
          )}
        >
          {/* Top Header:
              On /customer homepage, hidden on desktop so hero is right at the top matching Screenshot 3.
              On all other customer routes (/customer/requests, /services, etc.), shown prominently matching Screenshot 1.
          */}
          {isCustomerHome ? (
            <div className="lg:hidden">
              <CustomerHeader onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
            </div>
          ) : (
            <CustomerHeader onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
          )}

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24 lg:pb-8">
            {children}
          </main>
        </div>

        {/* Global Components */}
        <CartDrawer />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onMoreClick={() => setMobileSidebarOpen(true)} />
      </div>
    </NotificationProvider>
  );
}
