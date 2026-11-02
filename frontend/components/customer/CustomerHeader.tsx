"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Bell,
  Menu,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  Calendar,
  Sun,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getCustomerInitials } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import QuickNotificationsPopover from "@/components/QuickNotificationsPopover";

interface CustomerHeaderProps {
  onOpenMobileMenu?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/customer": "Home",
  "/customer/shop": "Products",
  "/customer/offers": "Offers & Deals",
  "/customer/favorites": "Wishlist",
  "/customer/orders": "My Orders",
  "/customer/bookings": "My Bookings",
  "/customer/services": "IT Services",
  "/customer/laptop-enquiry": "Laptop Enquiry",
  "/customer/messages": "Messages",
  "/customer/notifications": "Notifications",
  "/customer/training": "Training",
  "/customer/internship": "Internship",
  "/customer/certificates": "Certificates",
  "/customer/ewarranty": "E-Warranty",
  "/customer/ai": "AI Assistant",
  "/customer/support": "Contact Support",
  "/customer/profile": "My Profile",
  "/customer/settings": "Settings",
  "/customer/billing": "Billing & Invoices",
};

export default function CustomerHeader({ onOpenMobileMenu }: CustomerHeaderProps) {
  const pathname = usePathname() || "/customer";
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const cartOpen = useCartStore((s) => s.openCart);
  const rawCartItemCount = useCartStore((s) => s.getItemCount());
  const cartItemCount = mounted ? rawCartItemCount : 0;

  useEffect(() => {
    setMounted(true);
    fetchProfile();

    const handleProfileUpdate = (e: any) => {
      if (e?.detail?.profile) {
        setUserProfile(e.detail.profile);
        setIsAuthenticated(true);
      } else {
        fetchProfile();
      }
    };

    window.addEventListener("nexbyte-profile-update", handleProfileUpdate);
    return () => {
      window.removeEventListener("nexbyte-profile-update", handleProfileUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customer/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUserProfile(data.profile);
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const getPageTitle = () => {
    // Exact match first
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Prefix match
    for (const [key, val] of Object.entries(PAGE_TITLES)) {
      if (key !== "/customer" && pathname.startsWith(key)) return val;
    }
    return "Customer Portal";
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#101B2B]/85 backdrop-blur-md border-b border-[#DCEAF2] dark:border-[#2A3B50] px-4 sm:px-6 py-3 transition-all shadow-sm">
        <div className="flex items-center justify-between gap-4">

          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              aria-label="Open sidebar menu"
              id="customer-menu-btn"
              className="lg:hidden p-2 rounded-xl border border-[#DCEAF2] dark:border-[#2A3B50] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#ECFEFF] dark:hover:bg-[#162438] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title — desktop only */}
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-[#0891B2] dark:text-[#0891B2] tracking-wider uppercase">
                NEXLAPTECH
              </span>
              <h1 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {getPageTitle()}
              </h1>
            </div>

            {/* Search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              id="customer-search-btn"
              className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#475569] hover:bg-[#F1F5F9] hover:border-[#2563EB]/40 transition-colors text-left w-48 sm:w-64"
            >
              <Search className="h-4 w-4 shrink-0 text-[#0891B2]" />
              <span className="truncate">Search products, services, orders...</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Offers shortcut */}
            <Link
              href="/customer/offers"
              aria-label="Offers"
              className="hidden sm:flex p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] text-[#F59E0B] hover:bg-[#FFFBEB] dark:hover:bg-[#422006]/50 transition-colors"
              title="Offers & Deals"
            >
              <Tag className="h-4.5 w-4.5" />
            </Link>

            {/* Cart */}
            <button
              onClick={cartOpen}
              aria-label="Shopping Cart"
              id="customer-cart-btn"
              className="relative p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EEF6FF] dark:hover:bg-[#1a2744] hover:border-[#2563EB]/40 transition-colors"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#2563EB] dark:bg-[#60A5FA] text-[10px] font-bold text-white dark:text-[#080B12] shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <QuickNotificationsPopover role="customer" />

            {/* Theme is fixed to light mode. */}
            <div
              role="status"
              aria-label="Light theme active"
              id="customer-theme-btn"
              className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EEF6FF] dark:hover:bg-[#1a2744] transition-colors"
              title="Light theme active"
            >
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            </div>

            {/* Profile Dropdown */}
            {isAuthenticated && userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  id="customer-profile-btn"
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] p-1.5 pr-2.5 text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EEF6FF] dark:hover:bg-[#1a2744] hover:border-[#2563EB]/40 transition-colors"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden relative shrink-0">
                    {userProfile.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || "Customer"}
                        fill
                        className="object-cover"
                      />
                    ) : getCustomerInitials(userProfile.full_name) ? (
                      <span>{getCustomerInitials(userProfile.full_name)}</span>
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="hidden md:inline font-bold truncate">
                    Customer
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-[#94A3B8]", userDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] p-2 shadow-xl z-50 space-y-1"
                    >
                      {/* User info */}
                      <div className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#263247] mb-1">
                        <p className="font-bold text-xs text-[#111827] dark:text-[#F8FAFC] truncate">
                          {userProfile.full_name || "NEXLAPTECH Customer"}
                        </p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">{userProfile.email}</p>
                      </div>

                      {[
                        { href: "/customer/profile", label: "My Profile", icon: User },
                        { href: "/customer/orders", label: "Orders", icon: Package },
                        { href: "/customer/bookings", label: "Bookings", icon: Calendar },
                        { href: "/customer/settings", label: "Settings", icon: Settings },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#111827] dark:text-[#F8FAFC] hover:bg-[#EEF6FF] dark:hover:bg-[#1a2744] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                          {item.label}
                        </Link>
                      ))}

                      <div className="border-t border-[#E2E8F0] dark:border-[#263247] pt-1">
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await fetch("/api/customer/logout", { method: "POST" });
                            window.location.href = "/customer/signin";
                          }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Click-away overlay */}
                {userDropdownOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                )}
              </div>
            ) : (
              <Link href="/customer/signin" id="customer-signin-btn" className="btn-primary !px-4 !py-2 text-xs">
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
