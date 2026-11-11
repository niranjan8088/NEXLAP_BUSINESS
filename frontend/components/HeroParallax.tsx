"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ShoppingBag,
  Calendar,
  Sparkles,
  Shield,
  Cpu,
  Zap,
  Star,
  Search,
  MessageSquare,
  Tag,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { formatRupees } from "@/lib/billingUtils";

interface HeroParallaxProps {
  firstName: string;
  getGreeting: () => string;
  onSearchOpen?: () => void;
  featuredProduct?: any;
  activeOffer?: any;
}

export default function HeroParallax({
  firstName,
  getGreeting,
  onSearchOpen,
  featuredProduct,
  activeOffer,
}: HeroParallaxProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mouse position values for parallax depth
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid motion
  const springX = useSpring(mouseX, { stiffness: 90, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 22 });

  // Parallax transform layers
  const bgShiftX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const bgShiftY = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  const floatCard1X = useTransform(springX, [-0.5, 0.5], [-14, 14]);
  const floatCard1Y = useTransform(springY, [-0.5, 0.5], [-12, 12]);

  const floatCard2X = useTransform(springX, [-0.5, 0.5], [14, -14]);
  const floatCard2Y = useTransform(springY, [-0.5, 0.5], [10, -10]);

  const floatCard3X = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const floatCard3Y = useTransform(springY, [-0.5, 0.5], [14, -14]);

  const floatCard4X = useTransform(springX, [-0.5, 0.5], [12, -12]);
  const floatCard4Y = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customer/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/customer/shop");
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/customer/shop?search=${encodeURIComponent(tag)}`);
  };

  // Fallback featured item data if none loaded yet
  const displayProd = featuredProduct || {
    id: "featured-1",
    name: "NexLapTech UltraBook Pro 15",
    price: 64999,
    originalPrice: 74999,
    category: "Laptops",
    rating: 4.9,
    image: "/images/product-custom-pc-assembly.png",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F0FDFF] via-white to-[#F8FAFC] dark:from-[#0B1526] dark:via-[#101B2B] dark:to-[#080E1A] p-6 sm:p-8 md:p-10 lg:p-12 text-[#0F172A] dark:text-[#F8FAFC] shadow-md border border-[#DCEAF2] dark:border-[#203047] transition-colors"
    >
      {/* Fine Background Grid & Soft Radial Cyan Glow */}
      <motion.div
        style={{ x: isTouchDevice ? 0 : bgShiftX, y: isTouchDevice ? 0 : bgShiftY }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b20f_1px,transparent_1px),linear-gradient(to_bottom,#0891b20f_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#38bdf80f_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80f_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#0891B2]/15 dark:bg-[#0891B2]/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full bg-[#2563EB]/15 dark:bg-[#2563EB]/25 blur-3xl" />
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Eyebrow, Hero Headline, Search & CTAs */}
        <div className="lg:col-span-7 space-y-5 max-w-2xl">
          
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-[#162438]/90 backdrop-blur-md border border-[#0891B2]/30 px-4 py-1.5 text-xs font-extrabold text-[#0891B2] dark:text-[#CFFAFE] shadow-sm tracking-wide"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0891B2] animate-spin-slow" />
            <span>NEXLAPTECH · SMARTER TECH SHOPPING</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-[#0F172A] dark:text-white"
          >
            Your Next Tech Upgrade <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#2563EB] via-[#0891B2] to-[#1D4ED8] bg-clip-text text-transparent">
              Starts Here.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="text-sm sm:text-base text-[#475569] dark:text-[#CBD5E1] font-medium leading-relaxed"
          >
            Discover laptops, PC components, custom builds and trusted IT services—all in one place.
          </motion.p>

          {/* Search Bar Input */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="relative flex items-center rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-[#DCEAF2] dark:border-[#263247] p-1.5 shadow-lg shadow-[#0891B2]/5"
          >
            <Search className="h-5 w-5 text-[#0891B2] ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search laptops, SSDs, RAM, gaming PCs..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-[#2563EB]/20"
            >
              <span>Search</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>

          {/* Quick Tag Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
            className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]"
          >
            <span className="font-semibold text-[#0F172A] dark:text-[#CBD5E1]">Popular:</span>
            {["Laptops", "16GB RAM", "NVMe SSD", "Gaming PC", "CCTV", "Repair"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="rounded-lg bg-white/80 hover:bg-[#ECFEFF] dark:bg-[#162438] dark:hover:bg-[#1f3048] border border-[#DCEAF2] dark:border-[#263247] px-2.5 py-1 text-[11px] font-semibold text-[#475569] dark:text-[#CBD5E1] transition-all hover:scale-105"
              >
                {tag}
              </button>
            ))}
          </motion.div>

          {/* Primary & Secondary CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.34 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Link
              href="/customer/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3.5 text-xs font-bold shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              Explore Products
            </Link>

            <Link
              href="/customer/bookings"
              className="inline-flex items-center gap-2 rounded-xl bg-white/95 dark:bg-[#162438] border border-[#DCEAF2] dark:border-[#263247] text-[#0F172A] dark:text-white px-6 py-3.5 text-xs font-bold hover:bg-[#ECFEFF] dark:hover:bg-[#1f3048] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <Calendar className="h-4 w-4 text-[#0891B2]" />
              Book a Service
            </Link>

            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium block w-full sm:w-auto mt-1 sm:mt-0">
              Products, upgrades and technical support made simpler.
            </span>
          </motion.div>

          {/* Trust Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-wrap items-center gap-5 pt-2 text-[11px] text-[#475569] dark:text-[#94A3B8] font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#0891B2]" /> Authentic Verified Hardware
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#0891B2]" /> Doorstep &amp; On-Site Support
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#0891B2]" /> Tax GST Invoice Ready
            </span>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Layered Floating Spec & Product Card Composition */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[360px] sm:min-h-[400px]">
          
          {/* Central Layered Image Canvas */}
          <div className="relative w-full max-w-xs sm:max-w-sm aspect-square flex items-center justify-center">
            
            {/* Glow backdrop ring */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#0891B2]/20 to-[#2563EB]/20 blur-2xl animate-pulse" />
            
            {/* Hero Main Product Visual */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 transition-transform duration-500 hover:scale-105">
              <Image
                src={displayProd.image || "/images/product-custom-pc-assembly.png"}
                alt={displayProd.name || "NexLapTech Hardware"}
                fill
                className="object-contain drop-shadow-[0_20px_35px_rgba(8,145,178,0.25)]"
                priority
                onError={(e: any) => { e.target.src = "/images/poster-products.png"; }}
              />
            </div>
          </div>

          {/* ── FLOATING PANEL A: FEATURED PRODUCT CARD (Top Right) ── */}
          <motion.div
            style={{ x: isTouchDevice ? 0 : floatCard1X, y: isTouchDevice ? 0 : floatCard1Y }}
            animate={isTouchDevice ? {} : { y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 rounded-2xl bg-white/95 dark:bg-[#162438]/95 backdrop-blur-md border border-[#DCEAF2] dark:border-[#263247] p-2.5 sm:p-3 shadow-xl shadow-[#0891B2]/10 max-w-[180px] sm:max-w-[200px] z-20"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#ECFEFF] dark:bg-[#0891B2]/30 flex items-center justify-center shrink-0 border border-[#0891B2]/20">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-[#0891B2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0891B2] block">Featured</span>
                <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">{displayProd.name}</p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-xs font-black text-[#2563EB]">{formatRupees(displayProd.price)}</span>
                  <Link
                    href={`/products/${displayProd.id}`}
                    className="text-[9px] font-bold text-[#0891B2] hover:underline flex items-center"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── FLOATING PANEL B: SPECIFICATION CARD (Bottom Left) ── */}
          <motion.div
            style={{ x: isTouchDevice ? 0 : floatCard2X, y: isTouchDevice ? 0 : floatCard2Y }}
            animate={isTouchDevice ? {} : { y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 rounded-2xl bg-white/95 dark:bg-[#162438]/95 backdrop-blur-md border border-[#DCEAF2] dark:border-[#263247] p-2.5 sm:p-3 shadow-xl shadow-[#0891B2]/10 max-w-[190px] sm:max-w-[210px] z-20"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#EEF6FF] dark:bg-[#2563EB]/30 flex items-center justify-center shrink-0 border border-[#2563EB]/20">
                <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB]" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">Specs</span>
                <p className="text-xs font-bold text-[#0F172A] dark:text-white">Core i7 · 16GB RAM</p>
                <p className="text-[10px] text-[#475569] dark:text-[#CBD5E1]">512GB NVMe · Win 11</p>
              </div>
            </div>
          </motion.div>

          {/* ── FLOATING PANEL C: SUPPORT ASSISTANT CARD (Top Left - Desktop only) ── */}
          <motion.div
            style={{ x: isTouchDevice ? 0 : floatCard3X, y: isTouchDevice ? 0 : floatCard3Y }}
            animate={isTouchDevice ? {} : { y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1 }}
            className="hidden md:block absolute top-12 left-1 sm:left-2 rounded-2xl bg-white/95 dark:bg-[#162438]/95 backdrop-blur-md border border-[#DCEAF2] dark:border-[#263247] p-2.5 sm:p-3 shadow-xl shadow-[#0891B2]/10 max-w-[185px] z-20"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-300">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white">Need help choosing?</p>
                <Link
                  href="/customer/messages"
                  className="text-[10px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5 mt-0.5"
                >
                  Ask Assistant <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── FLOATING PANEL D: ACTIVE OFFER CARD (Bottom Right - Desktop only) ── */}
          {activeOffer && (
            <motion.div
              style={{ x: isTouchDevice ? 0 : floatCard4X, y: isTouchDevice ? 0 : floatCard4Y }}
              animate={isTouchDevice ? {} : { y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut", delay: 0.5 }}
              className="hidden md:block absolute bottom-12 right-1 sm:right-2 rounded-2xl bg-white/95 dark:bg-[#162438]/95 backdrop-blur-md border border-amber-300/50 dark:border-amber-500/30 p-2.5 sm:p-3 shadow-xl shadow-amber-500/10 max-w-[190px] z-20"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center shrink-0 text-amber-500">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block truncate">
                    Code: {activeOffer.offerCode || "SPECIAL"}
                  </span>
                  <p className="text-[10px] font-bold text-[#0F172A] dark:text-white truncate">
                    {activeOffer.discountType === "percentage"
                      ? `${activeOffer.discountValue}% OFF`
                      : `₹${activeOffer.discountValue} OFF`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
