"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Laptop,
  Wrench,
  Calendar,
  MessageSquare,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Package,
  Star,
  Award,
  Zap,
  ChevronRight,
  Sparkles,
  Tag,
  Shield,
  TrendingUp,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";
import { useCartStore } from "@/lib/cartStore";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import HeroParallax from "@/components/HeroParallax";
import { motion } from "framer-motion";
import { CustomerDashboardLayoutConfig } from "@/lib/types/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  orders: { total: number; active: number };
  bookings: { total: number; upcoming: number };
  messages: { unread: number };
  services: { active: number };
  certificates: { count: number };
}

interface Activity {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string;
  type: string;
  link: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image?: string;
  rating?: number;
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    id: "shop",
    title: "Shop Products",
    description: "Browse laptops, desktops, accessories & parts.",
    icon: ShoppingBag,
    link: "/customer/shop",
    gradient: "from-[#2563EB]/10 to-[#3B82F6]/5",
    iconBg: "bg-[#EEF6FF] dark:bg-[#1a2744]",
    iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
    badge: "Store",
  },
  {
    id: "laptop",
    title: "Laptop Enquiry",
    description: "Tell us your budget — we'll find the perfect match.",
    icon: Laptop,
    link: "/customer/laptop-enquiry",
    gradient: "from-[#7C3AED]/10 to-[#8B5CF6]/5",
    iconBg: "bg-[#F5F3FF] dark:bg-[#1e1638]",
    iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
    badge: "Custom",
  },
  {
    id: "repair",
    title: "Repair My Device",
    description: "Laptop, desktop & hardware repair services.",
    icon: Wrench,
    link: "/customer/services",
    gradient: "from-[#059669]/10 to-[#10B981]/5",
    iconBg: "bg-[#ECFDF5] dark:bg-[#052e16]/50",
    iconColor: "text-[#059669] dark:text-[#34D399]",
    badge: "Repair",
  },
  {
    id: "booking",
    title: "Book a Service",
    description: "Schedule a repair, installation or upgrade.",
    icon: Calendar,
    link: "/customer/bookings",
    gradient: "from-[#D97706]/10 to-[#F59E0B]/5",
    iconBg: "bg-[#FFFBEB] dark:bg-[#422006]/50",
    iconColor: "text-[#D97706] dark:text-[#FBBF24]",
    badge: "Schedule",
  },
  {
    id: "message",
    title: "Contact Expert",
    description: "Ask our support team anything — instant response.",
    icon: MessageSquare,
    link: "/customer/messages",
    gradient: "from-[#0891B2]/10 to-[#06B6D4]/5",
    iconBg: "bg-[#ECFEFF] dark:bg-[#083344]/50",
    iconColor: "text-[#0891B2] dark:text-[#22D3EE]",
    badge: "Support",
  },
  {
    id: "it-services",
    title: "IT Services",
    description: "Software, networking, CCTV & server solutions.",
    icon: Shield,
    link: "/customer/services",
    gradient: "from-[#DC2626]/10 to-[#EF4444]/5",
    iconBg: "bg-[#FEF2F2] dark:bg-[#450a0a]/50",
    iconColor: "text-[#DC2626] dark:text-[#F87171]",
    badge: "IT",
  },
  {
    id: "training",
    title: "Training Courses",
    description: "Learn hardware, software & IT skills with us.",
    icon: GraduationCap,
    link: "/customer/training",
    gradient: "from-[#0D9488]/10 to-[#14B8A6]/5",
    iconBg: "bg-[#F0FDFA] dark:bg-[#042f2e]/50",
    iconColor: "text-[#0D9488] dark:text-[#2DD4BF]",
    badge: "Learn",
  },
  {
    id: "internship",
    title: "Internship",
    description: "Apply for hands-on NexLapTech internship programs.",
    icon: Briefcase,
    link: "/customer/internship",
    gradient: "from-[#9333EA]/10 to-[#A855F7]/5",
    iconBg: "bg-[#FAF5FF] dark:bg-[#2e1065]/50",
    iconColor: "text-[#9333EA] dark:text-[#C084FC]",
    badge: "Apply",
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const colors: Record<string, string> = {
    completed: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    delivered: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    confirmed: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    processing: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    pending: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    new: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    cancelled: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    sent: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  };
  const cls = colors[s] || "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, active: 0 },
    bookings: { total: 0, upcoming: 0 },
    messages: { unread: 0 },
    services: { active: 0 },
    certificates: { count: 0 },
  });
  const [dashboardConfig, setDashboardConfig] = useState<CustomerDashboardLayoutConfig | null>(null);

  const cartAddItem = useCartStore((s) => s.addItem);
  const cartOpenFn = useCartStore((s) => s.openCart);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Run all fetches in parallel
      const [profRes, ordRes, bookRes, msgRes, prodRes, offerRes, certRes, settingsRes] = await Promise.all([
        safeJsonFetch("/api/customer/profile"),
        safeJsonFetch("/api/customer/orders"),
        safeJsonFetch("/api/customer/bookings"),
        safeJsonFetch("/api/customer/messages"),
        safeJsonFetch("/api/public/products"),
        safeJsonFetch("/api/offers"),
        safeJsonFetch("/api/certificates"),
        safeJsonFetch("/api/public/settings"),
      ]);

      if (settingsRes.ok && settingsRes.data?.customerDashboard) {
        setDashboardConfig(settingsRes.data.customerDashboard);
      }

      // Profile
      if (profRes.ok && profRes.data?.profile) {
        setProfile(profRes.data.profile);
      }

      // Stats
      const orders = ordRes.ok ? (ordRes.data?.orders || []) : [];
      const bookings = bookRes.ok ? (bookRes.data?.bookings || []) : [];
      const messages = msgRes.ok ? (msgRes.data?.messages || []) : [];
      const certs = certRes.ok ? (certRes.data?.certificates || []) : [];

      setStats({
        orders: {
          total: orders.length,
          active: orders.filter((o: any) => !["delivered", "cancelled", "completed"].includes((o.status || "").toLowerCase())).length,
        },
        bookings: {
          total: bookings.length,
          upcoming: bookings.filter((b: any) => !["completed", "cancelled"].includes((b.status || "").toLowerCase())).length,
        },
        messages: {
          unread: messages.filter((m: any) => m.status === "unread" || m.unread).length,
        },
        services: {
          active: bookings.filter((b: any) => ["in_progress", "accepted", "processing"].includes((b.status || "").toLowerCase())).length,
        },
        certificates: { count: certs.length },
      });

      // Recent activity from orders + bookings + messages
      const activities: Activity[] = [];
      orders.slice(0, 3).forEach((o: any) => {
        activities.push({
          id: o.id,
          title: `Order #${o.order_number || o.id?.slice(0, 8) || ""}`,
          subtitle: `₹${(o.total_amount || o.grandTotal || 0).toLocaleString("en-IN")}`,
          status: o.status || "Confirmed",
          date: o.created_at || o.createdAt || new Date().toISOString(),
          type: "order",
          link: "/customer/orders",
        });
      });
      bookings.slice(0, 3).forEach((b: any) => {
        activities.push({
          id: b.id,
          title: b.productName || b.service_name || "Device Booking",
          subtitle: `ID: ${b.bookingId || b.booking_id || b.id?.slice(0, 8)}`,
          status: b.status || "New",
          date: b.createdAt || b.created_at || new Date().toISOString(),
          type: "booking",
          link: "/customer/bookings",
        });
      });
      messages.slice(0, 2).forEach((m: any) => {
        activities.push({
          id: m.id,
          title: m.subject || "Support Inquiry",
          subtitle: m.message ? m.message.slice(0, 50) + "..." : "Message sent",
          status: m.status || "Sent",
          date: m.created_at || new Date().toISOString(),
          type: "message",
          link: "/customer/messages",
        });
      });
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));

      // Featured products (from real catalog)
      if (prodRes.ok) {
        const prods = prodRes.data?.products || prodRes.data || [];
        setFeaturedProducts(
          prods
            .filter((p: any) => p.status !== "hidden")
            .slice(0, 4)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              originalPrice: p.originalPrice || (p.price ? Math.round(p.price * 1.1) : undefined),
              badge: p.featured ? "Featured" : p.latest ? "New" : p.discount ? `-${p.discount}%` : undefined,
              image: p.image || p.images?.[0] || "/images/product-custom-pc-assembly.png",
              rating: p.rating || 4.5,
            }))
        );
      }

      // Active offers
      if (offerRes.ok) {
        const offers = offerRes.data?.offers || [];
        setActiveOffers(
          offers.filter((o: any) => o.status === "ACTIVE").slice(0, 3)
        );
      }
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const handler = () => fetchDashboard();
    window.addEventListener("nexbyte-realtime", handler);
    return () => window.removeEventListener("nexbyte-realtime", handler);
  }, [fetchDashboard]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "there";

  // Dynamic Admin-Configurable KPI Cards
  const ALL_KPI_MAP: Record<string, { id: string; label: string; value: number; sub: string; subColor: string; icon: any; iconBg: string; iconColor: string; link: string; defaultOrder: number }> = {
    orders: {
      id: "orders",
      label: "My Orders",
      value: stats.orders.total,
      sub: stats.orders.active > 0 ? `${stats.orders.active} active` : "All delivered",
      subColor: stats.orders.active > 0 ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#16A34A] dark:text-[#34D399]",
      icon: Package,
      iconBg: "bg-[#EEF6FF] dark:bg-[#1a2744]",
      iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
      link: "/customer/orders",
      defaultOrder: 1,
    },
    bookings: {
      id: "bookings",
      label: "Bookings",
      value: stats.bookings.total,
      sub: stats.bookings.upcoming > 0 ? `${stats.bookings.upcoming} upcoming` : "No upcoming",
      subColor: "text-[#7C3AED] dark:text-[#A78BFA]",
      icon: Calendar,
      iconBg: "bg-[#F5F3FF] dark:bg-[#1e1638]",
      iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
      link: "/customer/bookings",
      defaultOrder: 2,
    },
    messages: {
      id: "messages",
      label: "Messages",
      value: stats.messages.unread,
      sub: stats.messages.unread > 0 ? "Unread messages" : "All read",
      subColor: stats.messages.unread > 0 ? "text-[#D97706] dark:text-[#FBBF24]" : "text-[#64748B]",
      icon: MessageSquare,
      iconBg: "bg-[#FFFBEB] dark:bg-[#422006]/50",
      iconColor: "text-[#D97706] dark:text-[#FBBF24]",
      link: "/customer/messages",
      defaultOrder: 3,
    },
    certificates: {
      id: "certificates",
      label: "Certificates",
      value: stats.certificates.count,
      sub: "Verified & earned",
      subColor: "text-[#16A34A] dark:text-[#34D399]",
      icon: Award,
      iconBg: "bg-[#F0FDF4] dark:bg-[#052e16]/50",
      iconColor: "text-[#16A34A] dark:text-[#34D399]",
      link: "/customer/certificates",
      defaultOrder: 4,
    },
  };

  const kpiCards = useMemo(() => {
    if (!dashboardConfig?.kpiCards) {
      return Object.values(ALL_KPI_MAP);
    }
    const cardsList = Array.isArray(dashboardConfig.kpiCards)
      ? dashboardConfig.kpiCards
      : Object.values(dashboardConfig.kpiCards);

    if (cardsList.length === 0) {
      return Object.values(ALL_KPI_MAP);
    }
    return cardsList
      .filter((c: any) => c.enabled !== false && ALL_KPI_MAP[c.id])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((c: any) => {
        const base = ALL_KPI_MAP[c.id];
        return {
          ...base,
          label: c.label || base.label,
        };
      });
  }, [dashboardConfig, stats]);

  return (
    <div className="space-y-8 pb-8">
      {/* ── 1. HERO PARALLAX BANNER (ARCTIC GLASS REDESIGN) ───────────────── */}
      <HeroParallax
        firstName={firstName}
        getGreeting={getGreeting}
        onSearchOpen={() => setSearchOpen(true)}
        featuredProduct={featuredProducts[0]}
        activeOffer={activeOffers[0]}
      />

      {/* ── 2. KPI STATS (REAL BUSINESS INSIGHTS) ─────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const IconComp = card.icon;
          return (
            <motion.div
              key={card.id || card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link href={card.link} className="block">
                <div className="horizon-card flex items-center justify-between cursor-pointer hover:border-[#0891B2]/40 dark:hover:border-[#60A5FA]/30 hover:shadow-md transition-all duration-200 bg-white/95 dark:bg-[#111827]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                      {card.label}
                    </span>
                    <div className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
                      {loading ? (
                        <div className="h-7 w-10 skeleton rounded-lg" />
                      ) : (
                        card.value
                      )}
                    </div>
                    <p className={`text-[11px] font-semibold ${card.subColor}`}>{card.sub}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}>
                    <IconComp className="h-6 w-6" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {/* ── 3. FEATURE CARDS (COMPACT 5-CARD SECTION) ────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              {dashboardConfig?.headline || "Everything You Need For Your Tech"}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5">
              {dashboardConfig?.subheadline || "Browse products, request custom builds, or book repair services in seconds."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Shop Technology */}
          <Link href="/customer/shop">
            <div className="group relative overflow-hidden rounded-2xl border border-[#DCEAF2] dark:border-[#263247] bg-white dark:bg-[#111827] p-4 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF6FF] dark:bg-[#1a2744] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-snug">Shop Technology</h3>
                <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Browse available laptops, desktops, components &amp; accessories.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#263247] flex items-center justify-between text-[11px] font-bold text-[#2563EB]">
                <span>Browse Shop</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Custom PC Builds (Restrained Blue Gradient Card) */}
          <Link href="/customer/laptop-enquiry">
            <div className="group relative overflow-hidden rounded-2xl border border-[#2563EB]/30 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-4 text-white hover:shadow-xl hover:shadow-[#2563EB]/20 transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Laptop className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xs text-white leading-snug">Custom PC Builds</h3>
                <p className="text-[10px] text-blue-100 mt-1 leading-relaxed">
                  Tell us your budget — we&apos;ll tailor custom PCs &amp; laptops for you.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] font-bold text-white">
                <span>Start Enquiry</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Repair & Upgrades */}
          <Link href="/customer/services">
            <div className="group relative overflow-hidden rounded-2xl border border-[#DCEAF2] dark:border-[#263247] bg-white dark:bg-[#111827] p-4 hover:border-[#0891B2]/50 dark:hover:border-[#0891B2]/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] dark:bg-[#083344]/50 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Wrench className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-snug">Repair &amp; Upgrades</h3>
                <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Laptop, desktop repair, RAM &amp; high-speed SSD upgrades.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#263247] flex items-center justify-between text-[11px] font-bold text-[#0891B2]">
                <span>View Services</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 4: Expert Assistance */}
          <Link href="/customer/messages">
            <div className="group relative overflow-hidden rounded-2xl border border-[#DCEAF2] dark:border-[#263247] bg-white dark:bg-[#111827] p-4 hover:border-purple-500/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-snug">Expert Assistance</h3>
                <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Ask our support team anything — instant expert guidance.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#263247] flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400">
                <span>Talk to Expert</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 5: Offers & Deals */}
          <Link href="/customer/offers">
            <div className="group relative overflow-hidden rounded-2xl border border-[#DCEAF2] dark:border-[#263247] bg-white dark:bg-[#111827] p-4 hover:border-amber-500/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Tag className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-snug">Offers &amp; Deals</h3>
                <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Display active promotional coupon codes &amp; instant savings.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#263247] flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <span>See Active Offers</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 4. ACTIVE OFFERS STRIP ──────────────────────────────────────── */}
      {activeOffers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-[#2563EB] dark:text-[#60A5FA]" />
              Active Coupons &amp; Offers
            </h2>
            <Link href="/customer/offers" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1">
              See All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeOffers.map((offer) => (
              <Link key={offer.id} href="/customer/offers">
                <div className="group relative overflow-hidden rounded-2xl border border-[#DCEAF2] dark:border-[#263247] bg-gradient-to-br from-[#ECFEFF] via-white to-[#EEF6FF] dark:from-[#1a2744] dark:to-[#080B12] p-4 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC]">{offer.offerName}</p>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{offer.description}</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#2563EB] dark:bg-[#60A5FA] px-2.5 py-1 text-[11px] font-bold text-white dark:text-[#080B12]">
                      {offer.offerCode}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <span className="text-[11px] font-bold text-[#F59E0B]">
                      {offer.discountType === "percentage"
                        ? `${offer.discountValue}% OFF`
                        : `₹${offer.discountValue} OFF`}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">· Min ₹{offer.minimumPurchase?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. RECENT ACTIVITY ──────────────────────────────────────────── */}
      {dashboardConfig?.showRecentActivity !== false && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-[#2563EB] dark:text-[#60A5FA]" />
              Recent Activity
            </h2>
            <Link href="/customer/orders" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="horizon-card p-4 flex items-center gap-4">
                  <div className="h-10 w-10 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-40 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                  <div className="h-5 w-16 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="horizon-card p-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-[#EEF6FF] dark:bg-[#1a2744] flex items-center justify-center mx-auto">
                <Package className="h-7 w-7 text-[#2563EB] dark:text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#111827] dark:text-[#F8FAFC]">No activity yet</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto mt-1">
                  Place your first order or book a service to get started.
                </p>
              </div>
              <Link href="/customer/shop" className="btn-primary inline-flex !px-5 !py-2.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Explore Store
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#263247] bg-white dark:bg-[#111827] divide-y divide-[#E2E8F0] dark:divide-[#263247] overflow-hidden shadow-sm">
              {recentActivities.map((act) => (
                <Link key={act.id} href={act.link}>
                  <div className="p-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] dark:hover:bg-[#1a2744]/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#EEF6FF] dark:bg-[#1a2744] text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                        {act.type === "order" ? (
                          <Package className="h-4.5 w-4.5" />
                        ) : act.type === "booking" ? (
                          <Calendar className="h-4.5 w-4.5" />
                        ) : (
                          <MessageSquare className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-display text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">{act.title}</h4>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5">{act.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <StatusBadge status={act.status} />
                        <p className="text-[10px] text-[#94A3B8] mt-1">
                          {new Date(act.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 6. FEATURED PRODUCTS ────────────────────────────────────────── */}
      {dashboardConfig?.showFeaturedHardware !== false && featuredProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Star className="h-4.5 w-4.5 text-[#F59E0B] fill-[#F59E0B]" />
              Featured Products
            </h2>
            <Link href="/customer/shop" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod, i) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="horizon-card space-y-3 flex flex-col justify-between hover:border-[#2563EB]/30 dark:hover:border-[#60A5FA]/30"
              >
                <div>
                  <div className="relative h-36 w-full rounded-xl bg-[#F8FAFC] dark:bg-[#1a2744]/30 border border-[#E2E8F0] dark:border-[#263247] overflow-hidden flex items-center justify-center p-3 mb-3">
                    {prod.badge && (
                      <span className="absolute top-2 left-2 rounded-md bg-[#2563EB] dark:bg-[#60A5FA] text-white dark:text-[#080B12] px-2 py-0.5 text-[9px] font-bold">
                        {prod.badge}
                      </span>
                    )}
                    <Image
                      src={prod.image || "/images/product-custom-pc-assembly.png"}
                      alt={prod.name || "Featured product"}
                      fill
                      className="object-contain p-2"
                      onError={(e: any) => { e.target.src = "/images/product-custom-pc-assembly.png"; }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#94A3B8] dark:text-[#64748B] block mb-0.5">
                    {prod.category}
                  </span>
                  <h3 className="font-display text-xs font-bold text-[#111827] dark:text-[#F8FAFC] line-clamp-2">
                    {prod.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#263247]">
                  <div>
                    <span className="text-sm font-extrabold text-[#111827] dark:text-white block">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </span>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span className="text-[10px] text-[#94A3B8] line-through">
                        ₹{prod.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      cartAddItem({
                        id: prod.id,
                        title: prod.name,
                        price: prod.price,
                        image: prod.image || "",
                        category: prod.category,
                      });
                      cartOpenFn();
                    }}
                    className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] text-white dark:text-[#080B12] p-2 shadow-sm transition-all hover:-translate-y-0.5"
                    aria-label="Add to cart"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. LEARNING BANNER ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/customer/training">
          <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#263247] bg-gradient-to-br from-[#0D9488]/8 to-[#14B8A6]/4 dark:from-[#042f2e]/50 dark:to-[#080B12] p-5 hover:border-[#0D9488]/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#F0FDFA] dark:bg-[#042f2e] flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6 text-[#0D9488] dark:text-[#2DD4BF]" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-sm text-[#111827] dark:text-[#F8FAFC]">Training Courses</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Hardware, software & IT skills. Earn a NexLapTech certificate.</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF] group-hover:gap-2 transition-all">
                  Browse Courses <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/customer/internship">
          <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#263247] bg-gradient-to-br from-[#9333EA]/8 to-[#A855F7]/4 dark:from-[#2e1065]/50 dark:to-[#080B12] p-5 hover:border-[#9333EA]/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#FAF5FF] dark:bg-[#2e1065] flex items-center justify-center shrink-0">
                <Briefcase className="h-6 w-6 text-[#9333EA] dark:text-[#C084FC]" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-sm text-[#111827] dark:text-[#F8FAFC]">Internship Program</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Real-world experience. Apply and track your internship status.</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9333EA] dark:text-[#C084FC] group-hover:gap-2 transition-all">
                  Apply Now <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
