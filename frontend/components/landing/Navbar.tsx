"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import {
  Menu,
  X,
  Sun,
  Moon,
  ShoppingBag,
  LogOut,
  User,
  ChevronDown,
  Package,
  GraduationCap,
  Briefcase,
  Star,
  ShieldCheck,
  Search,
  HelpCircle,
  Tag,
  Heart,
  Home,
  Wrench,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";
import { useTheme } from "@/components/ThemeProvider";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import AnnouncementBar from "@/components/AnnouncementBar";

// Clean Primary Navigation
const PRIMARY_NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/customer/requests", label: "My Requests", icon: Package },
  { href: "/offers", label: "Offers", icon: Tag },
];

// Secondary Navigation ("More" Menu)
const SECONDARY_NAV_LINKS = [
  { href: "/training", label: "Training", icon: GraduationCap },
  { href: "/internship", label: "Internships", icon: Briefcase },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/verify", label: "Verify Certificate", icon: ShieldCheck },
  { href: "/contact", label: "Contact & Support", icon: HelpCircle },
  { href: "/customer/favorites", label: "Favorites", icon: Heart },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split(";").reduce((acc: Record<string, string>, c) => {
      const [k, v] = c.trim().split("=");
      if (k) acc[k] = v || "";
      return acc;
    }, {});
    setIsAuthenticated(!!cookies["nexbyte_customer_session"]);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/customer";
    }
    return pathname?.startsWith(href);
  };

  const cartOpen = useCartStore((s) => s.openCart);
  const rawCartItemCount = useCartStore((s) => s.getItemCount());
  const cartItemCount = mounted ? rawCartItemCount : 0;

  return (
    <>
      {/* Sticky Compact Header */}
      <header
        className={cn(
          "fixed top-0 z-40 w-full transition-all duration-300 ease-out",
          scrolled
            ? "bg-white/95 dark:bg-[#070B1A]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-white/10 shadow-sm"
            : "bg-white/80 dark:bg-[#070B1A]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5"
        )}
      >
        <AnnouncementBar />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
          {/* Logo */}
          <Link
            href={isAuthenticated ? "/customer" : "/"}
            aria-label="NEXLAPTECH home"
            className="flex h-10 w-40 shrink-0 items-center sm:h-11 sm:w-[180px]"
          >
            <BrandLogo
              variant="horizontal"
              width={1200}
              height={300}
              sizes="(max-width: 640px) 160px, 180px"
              priority
              className="h-full w-full"
            />
          </Link>

          {/* Primary Navigation Links (Desktop) */}
          <ul className="hidden lg:flex items-center gap-1.5">
            {PRIMARY_NAV_LINKS.map((link) => {
              const targetHref = link.href === "/" && isAuthenticated ? "/customer" : link.href;
              const linkActive = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={targetHref}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-bold transition-all rounded-full block",
                      linkActive
                        ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}

            {/* Secondary "More" Dropdown Menu */}
            <li className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <span>More</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0718]/95 backdrop-blur-xl p-2 shadow-xl z-50"
                  >
                    {SECONDARY_NAV_LINKS.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <IconComponent className="h-4 w-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          </ul>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Smart Search"
              className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
              <span className="hidden sm:inline">Search products &amp; services...</span>
            </button>

            {/* Cart Icon */}
            <button
              onClick={cartOpen}
              aria-label="Shopping Cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-[9px] font-bold shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Notifications Icon (If authenticated) */}
            {isAuthenticated && (
              <Link
                href="/customer/notifications"
                aria-label="Notifications"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <Bell className="h-4 w-4" />
              </Link>
            )}

            {/* Interactive Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              type="button"
              aria-label={theme === "night" ? "Switch to Daylight Theme" : "Switch to Obsidian Dark Theme"}
              title={theme === "night" ? "Switch to Daylight Theme" : "Switch to Obsidian Dark Theme"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {theme === "night" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            {/* Get Help CTA button */}
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs px-4 py-2 shadow-sm transition-all"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Get Help
            </Link>

            {/* Profile / Account Dropdown */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-xs font-bold text-black dark:text-white transition-all"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Profile</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", accountMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-2 shadow-xl z-50"
                    >
                      <Link
                        href="/customer/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-black dark:text-white" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/customer/requests"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <Package className="h-3.5 w-3.5 text-black dark:text-white" />
                        <span>My Requests &amp; Orders</span>
                      </Link>
                      <button
                        onClick={async () => {
                          setAccountMenuOpen(false);
                          await fetch("/api/customer/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors mt-1 border-t border-neutral-100 dark:border-neutral-900"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/customer/signin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-black text-white dark:bg-white dark:text-black px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Full Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden overflow-hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0718]/95 backdrop-blur-xl px-4 py-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PRIMARY_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl p-3 font-semibold transition-colors",
                      isActive(link.href)
                        ? "bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold"
                        : "bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10"
                    )}
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2">More Options</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {SECONDARY_NAV_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070B1A]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 items-center text-center">
          <Link
            href={isAuthenticated ? "/customer" : "/"}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors",
              isActive("/") ? "text-indigo-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            href="/products"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors",
              isActive("/products") ? "text-indigo-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Shop</span>
          </Link>

          <Link
            href="/services"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors",
              isActive("/services") ? "text-indigo-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <Wrench className="h-5 w-5" />
            <span>Services</span>
          </Link>

          <Link
            href="/customer/requests"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors",
              isActive("/customer/requests") ? "text-indigo-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <Package className="h-5 w-5" />
            <span>Requests</span>
          </Link>

          <Link
            href={isAuthenticated ? "/customer/profile" : "/customer/signin"}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-colors",
              isActive("/customer/profile") || isActive("/customer/signin") ? "text-indigo-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <User className="h-5 w-5" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Global Intent-Aware Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
