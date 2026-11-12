"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomerHeader from "@/components/CustomerHeader";
import CustomerSidebar from "@/components/CustomerSidebar";
import { Product } from "@/lib/data";
import { getSafeImageSrc, cn } from "@/lib/utils";
import {
  Search,
  Heart,
  Eye,
  X,
  GitCompare,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Filter,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  Star,
  Tag,
  RotateCcw,
  SlidersHorizontal,
  Home,
  Sliders
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { useCartStore } from "@/lib/cartStore";
import { extractStructuredSpecs } from "@/lib/normalization";
import { buildDynamicCatalogFilters, evaluateProductFilters } from "@/lib/filterEngine";
import { FilterDefinition, DynamicFilterGroup, FilterQueryState } from "@/lib/types/ecommerce";

const CATEGORY_NAMES: Record<string, { label: string; breadcrumb: string[]; icon?: string }> = {
  all: { label: "All Products", breadcrumb: ["Home", "Shop", "All Products"] },
  business_laptops: { label: "Business & Premium Laptops", breadcrumb: ["Home", "Computers", "Laptops"] },
  premium_used_laptops: { label: "Certified Pre-Owned Laptops", breadcrumb: ["Home", "Computers", "Refurbished Laptops"] },
  second_hand_laptops: { label: "Refurbished Budget Laptops", breadcrumb: ["Home", "Computers", "Second Hand Laptops"] },
  storage: { label: "High Speed Storage & SSDs", breadcrumb: ["Home", "Components", "Storage & SSD"] },
  ram: { label: "RAM & Memory Modules", breadcrumb: ["Home", "Components", "RAM & Memory"] },
  cctv: { label: "CCTV & Security Systems", breadcrumb: ["Home", "Security", "CCTV Cameras"] },
  cctv_security: { label: "CCTV & Security Accessories", breadcrumb: ["Home", "Security", "CCTV Accessories"] },
  peripherals: { label: "Keyboards, Mice & Peripherals", breadcrumb: ["Home", "Peripherals", "Keyboard & Mouse"] },
  gaming_pcs: { label: "Gaming PCs & Workstations", breadcrumb: ["Home", "Computers", "Gaming PCs"] },
  desktop_systems: { label: "Desktop Workstation Systems", breadcrumb: ["Home", "Computers", "Desktops"] },
  servers: { label: "Enterprise Servers & Rack Systems", breadcrumb: ["Home", "Enterprise", "Servers"] },
  monitors: { label: "Monitors & Displays", breadcrumb: ["Home", "Peripherals", "Monitors"] },
};

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isCustomerPortal = pathname ? pathname.startsWith("/customer") : false;

  const addCartItem = useCartStore((s) => s.addItem);

  // Raw Products & Filter Definitions from Source of Truth
  const [products, setProducts] = useState<Product[]>([]);
  const [filterDefinitions, setFilterDefinitions] = useState<FilterDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [productDisplayConfig, setProductDisplayConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.productDisplay) setProductDisplayConfig(data.productDisplay);
      })
      .catch(() => {});
  }, []);

  // Favorites & Compare State
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCustomerAuthenticated, setIsCustomerAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [actionError, setActionError] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // UI Modals
  const [productDetailModal, setProductDetailModal] = useState<Product | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Accordion Open/Closed States (filterId -> boolean)
  const [collapsedFilters, setCollapsedFilters] = useState<Record<string, boolean>>({});

  // 1. URL Parameter Parsing (URL is SINGLE SOURCE OF TRUTH)
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "recommended";
  const pageParam = Number(searchParams.get("page") || 1);

  const getMultiParam = (key: string): string[] => {
    const val = searchParams.get(key);
    if (!val || val === "all") return [];
    return val.split(",").filter(Boolean);
  };

  const selectedBrands = getMultiParam("brand");
  const selectedProcBrands = getMultiParam("processorBrand");
  const selectedProcessors = getMultiParam("processor");
  const selectedProcGens = getMultiParam("processorGen");
  const selectedRamCaps = getMultiParam("ram");
  const selectedRamTypes = getMultiParam("ramType");
  const selectedSsdCaps = getMultiParam("ssd");
  const selectedStorageTypes = getMultiParam("storageType");
  const selectedScreenSizes = getMultiParam("screen");
  const selectedGpus = getMultiParam("gpu");
  const selectedOses = getMultiParam("os");

  const touchScreenParam = searchParams.get("touchScreen") === "true";
  const gstInvoiceParam = searchParams.get("gstInvoice") === "true";
  const newArrivalParam = searchParams.get("newArrival") === "true";
  const offersOnlyParam = searchParams.get("offersOnly") === "true";
  const inStockParam = searchParams.get("inStock") === "true";
  const ratingParam = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;
  const priceMinParam = searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined;
  const priceMaxParam = searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined;

  // Local Search State for Input Debouncing
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Load Data from Database / dbHelper
  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const [prodList, defs] = await Promise.all([
        dbHelper.products.list(),
        dbHelper.filterDefinitions.list(categoryParam),
      ]);
      setProducts(prodList || []);
      setFilterDefinitions(defs || []);
    } catch (err) {
      console.error("Failed to load catalog data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
    window.addEventListener("nexbyte-realtime", loadCatalogData);
    return () => window.removeEventListener("nexbyte-realtime", loadCatalogData);
  }, [categoryParam]);

  const redirectToSignIn = () => {
    const next = `${pathname || "/products"}${window.location.search}`;
    router.push(`/customer/signin?next=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerFavorites() {
      try {
        const res = await fetch("/api/customer/favorites");
        if (cancelled) return;
        setIsCustomerAuthenticated(res.ok);
        if (res.ok) {
          const data = await res.json();
          setWishlist(
            Array.isArray(data.favorites)
              ? data.favorites.map((favorite: Product) => favorite.id)
              : []
          );
        } else if (res.status !== 401) {
          console.error("Failed to load customer wishlist.", await res.text());
        }
      } catch (err) {
        console.error("Failed to check customer sign-in status.", err);
        if (!cancelled) setIsCustomerAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    loadCustomerFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleWishlist = async (id: string) => {
    if (!authChecked) return;
    if (!isCustomerAuthenticated) {
      redirectToSignIn();
      return;
    }

    setActionError("");
    try {
      const res = await fetch("/api/customer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.status === 401) {
        redirectToSignIn();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update wishlist.");
      }

      setWishlist((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update wishlist.");
    }
  };

  const addToCart = (product: Product) => {
    addCartItem(product);
    return true;
  };

  // Helper function to update URL Search Params cleanly
  const updateUrl = (newParams: Record<string, string | number | null | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        current.delete(k);
      } else {
        current.set(k, String(v));
      }
    });

    // Reset to page 1 whenever filters change (unless page itself is updated)
    if (!newParams.hasOwnProperty("page")) {
      current.set("page", "1");
    }

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };

  // Toggle multi-select parameter
  const handleToggleMultiParam = (paramKey: string, val: string) => {
    const current = getMultiParam(paramKey);
    const updated = current.includes(val)
      ? current.filter((item) => item !== val)
      : [...current, val];
    
    updateUrl({ [paramKey]: updated.length > 0 ? updated.join(",") : null });
  };

  // Toggle Boolean Filter Parameter
  const handleToggleBooleanParam = (paramKey: string, currentValue: boolean) => {
    updateUrl({ [paramKey]: currentValue ? null : "true" });
  };

  // Clear All Filters (Preserves Category)
  const handleClearAllFilters = () => {
    router.push(`${pathname}?category=${categoryParam}`, { scroll: false });
  };

  // Construct current FilterQueryState for filter evaluator
  const currentFilterQuery: FilterQueryState = useMemo(() => ({
    category: categoryParam,
    brand: selectedBrands.length > 0 ? selectedBrands : undefined,
    processorBrand: selectedProcBrands.length > 0 ? selectedProcBrands : undefined,
    processor: selectedProcessors.length > 0 ? selectedProcessors : undefined,
    processorGen: selectedProcGens.length > 0 ? selectedProcGens : undefined,
    ramCapacity: selectedRamCaps.length > 0 ? selectedRamCaps : undefined,
    ramType: selectedRamTypes.length > 0 ? selectedRamTypes : undefined,
    ssdCapacity: selectedSsdCaps.length > 0 ? selectedSsdCaps : undefined,
    storageType: selectedStorageTypes.length > 0 ? selectedStorageTypes : undefined,
    screenSize: selectedScreenSizes.length > 0 ? selectedScreenSizes : undefined,
    graphics: selectedGpus.length > 0 ? selectedGpus : undefined,
    operatingSystem: selectedOses.length > 0 ? selectedOses : undefined,
    touchScreen: touchScreenParam ? true : undefined,
    gstInvoiceOnly: gstInvoiceParam ? true : undefined,
    newArrivalsOnly: newArrivalParam ? true : undefined,
    offersOnly: offersOnlyParam ? true : undefined,
    inStockOnly: inStockParam ? true : undefined,
    priceMin: priceMinParam,
    priceMax: priceMaxParam,
    ratingMin: ratingParam,
    search: searchParam || undefined,
  }), [
    categoryParam,
    selectedBrands,
    selectedProcBrands,
    selectedProcessors,
    selectedProcGens,
    selectedRamCaps,
    selectedRamTypes,
    selectedSsdCaps,
    selectedStorageTypes,
    selectedScreenSizes,
    selectedGpus,
    selectedOses,
    touchScreenParam,
    gstInvoiceParam,
    newArrivalParam,
    offersOnlyParam,
    inStockParam,
    priceMinParam,
    priceMaxParam,
    ratingParam,
    searchParam,
  ]);

  // Evaluate matching product list
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => evaluateProductFilters(p, currentFilterQuery));

    // Sort matching products
    if (sortParam === "price_low") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortParam === "price_high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortParam === "discount") {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sortParam === "newest") {
      list.sort((a, b) => new Date(b.createdAt || (b as any).created_at || 0).getTime() - new Date(a.createdAt || (a as any).created_at || 0).getTime());
    } else if (sortParam === "rating") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [products, currentFilterQuery, sortParam]);

  // Build dynamic catalog filter groups with option counts
  const dynamicFilterGroups: DynamicFilterGroup[] = useMemo(() => {
    return buildDynamicCatalogFilters(products, categoryParam, filterDefinitions);
  }, [products, categoryParam, filterDefinitions]);

  // Pagination Math (24 products per page)
  const pageSize = 24;
  const totalResults = filteredProducts.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIdx, startIdx + pageSize);
  }, [filteredProducts, currentPage]);

  // Active filter chip count calculation
  const activeChipsCount = useMemo(() => {
    let count = 0;
    count += selectedBrands.length;
    count += selectedProcBrands.length;
    count += selectedProcessors.length;
    count += selectedProcGens.length;
    count += selectedRamCaps.length;
    count += selectedRamTypes.length;
    count += selectedSsdCaps.length;
    count += selectedStorageTypes.length;
    count += selectedScreenSizes.length;
    count += selectedGpus.length;
    count += selectedOses.length;
    if (touchScreenParam) count++;
    if (gstInvoiceParam) count++;
    if (newArrivalParam) count++;
    if (offersOnlyParam) count++;
    if (inStockParam) count++;
    if (priceMinParam || priceMaxParam) count++;
    if (ratingParam) count++;
    return count;
  }, [
    selectedBrands,
    selectedProcBrands,
    selectedProcessors,
    selectedProcGens,
    selectedRamCaps,
    selectedRamTypes,
    selectedSsdCaps,
    selectedStorageTypes,
    selectedScreenSizes,
    selectedGpus,
    selectedOses,
    touchScreenParam,
    gstInvoiceParam,
    newArrivalParam,
    offersOnlyParam,
    inStockParam,
    priceMinParam,
    priceMaxParam,
    ratingParam,
  ]);

  const activeCategoryInfo = CATEGORY_NAMES[categoryParam] || {
    label: categoryParam.replace("_", " ").toUpperCase(),
    breadcrumb: ["Home", "Shop", categoryParam],
  };

  return (
    <div className={cn("text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200", !isCustomerPortal && "min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A]")}>
      {/* Header rendering */}
      {!isCustomerPortal && <Navbar />}

      <main className={cn("flex-1 py-4 max-w-7xl mx-auto w-full", !isCustomerPortal ? "pt-24 px-4 sm:px-6 lg:px-8" : "pt-2")}>
        
        {/* Breadcrumbs Banner */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
          {activeCategoryInfo.breadcrumb.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              <span className={idx === activeCategoryInfo.breadcrumb.length - 1 ? "text-indigo-600 dark:text-cyan-400 font-bold" : ""}>
                {crumb}
              </span>
            </div>
          ))}
        </div>

        {/* Page Heading & Subheadline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="heading-h2">
              {activeCategoryInfo.label}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-slate-100">{totalResults > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalResults)}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalResults}</span> verified products
            </p>
          </div>

          {/* Top Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(CATEGORY_NAMES).slice(0, 7).map(([catKey, catVal]) => (
              <button
                key={catKey}
                onClick={() => updateUrl({ category: catKey })}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
                  categoryParam === catKey
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm font-bold"
                    : "bg-white dark:bg-[#0F1B2D] text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#26364D] hover:bg-[#F1F5F9] dark:hover:bg-[#14243A]"
                )}
              >
                {catVal.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar (Search, Active Chips, Sort Dropdown & Mobile Filter Button) */}
        <div className="w-full min-w-0 rounded-2xl border border-[#DCEAF2] dark:border-[#2A3B50] bg-white dark:bg-[#101B2B] p-3 sm:p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex w-full min-w-0 items-center md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2]" />
            <input
              type="text"
              placeholder="Search specs e.g. Core i5, 16GB RAM, Dell..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateUrl({ search: searchInput.trim() });
                }
              }}
              className="w-full min-w-0 rounded-xl bg-[#F7FBFF] dark:bg-[#162438] border border-[#DCEAF2] dark:border-[#2A3B50] pl-10 pr-24 py-2 text-xs font-medium text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB]"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  updateUrl({ search: null });
                }}
                className="absolute right-[5.5rem] top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMobileFilterDrawer(true)}
              aria-label={`Open catalog filters${activeChipsCount ? `, ${activeChipsCount} active` : ""}`}
              className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-lg border border-[#DCEAF2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334155] shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700" />
              <span>Filter</span>
              {activeChipsCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 text-[9px] font-bold text-white">
                  {activeChipsCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex min-w-0 items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">
              <span className="hidden sm:inline text-[#64748B]">Sort:</span>
              <select
                value={sortParam}
                onChange={(e) => updateUrl({ sort: e.target.value })}
                className="rounded-xl bg-[#F7FBFF] dark:bg-[#162438] border border-[#DCEAF2] dark:border-[#2A3B50] px-3 py-2 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="discount">Discount</option>
                <option value="newest">Newest First</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS BAR */}
        {activeChipsCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6 p-3 rounded-2xl bg-white dark:bg-[#101B2B] border border-[#DCEAF2] dark:border-[#2A3B50] shadow-sm">
            <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mr-1 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-[#2563EB]" /> Active Filters:
            </span>

            {selectedBrands.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[#EEF6FF] dark:bg-[#1a2744] border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                <span>{b}</span>
                <button onClick={() => handleToggleMultiParam("brand", b)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {selectedProcBrands.map((pb) => (
              <span key={pb} className="inline-flex items-center gap-1 rounded-full bg-[#EEF6FF] dark:bg-[#1a2744] border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                <span>{pb}</span>
                <button onClick={() => handleToggleMultiParam("processorBrand", pb)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {selectedProcessors.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <span>{p}</span>
                <button onClick={() => handleToggleMultiParam("processor", p)} className="hover:text-purple-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {selectedRamCaps.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>RAM: {r}</span>
                <button onClick={() => handleToggleMultiParam("ram", r)} className="hover:text-emerald-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {selectedSsdCaps.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>SSD: {s}</span>
                <button onClick={() => handleToggleMultiParam("ssd", s)} className="hover:text-emerald-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {selectedScreenSizes.map((sc) => (
              <span key={sc} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>Display: {sc}</span>
                <button onClick={() => handleToggleMultiParam("screen", sc)} className="hover:text-indigo-900"><X className="h-3 w-3" /></button>
              </span>
            ))}

            {touchScreenParam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <span>Touchscreen</span>
                <button onClick={() => handleToggleBooleanParam("touchScreen", true)}><X className="h-3 w-3" /></button>
              </span>
            )}

            {gstInvoiceParam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>GST Invoice</span>
                <button onClick={() => handleToggleBooleanParam("gstInvoice", true)}><X className="h-3 w-3" /></button>
              </span>
            )}

            {(priceMinParam || priceMaxParam) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-[#14243A] border border-slate-300 dark:border-[#26364D] px-2.5 py-0.5 text-xs font-bold text-[#111827] dark:text-white">
                <span>Price: ₹{priceMinParam || 0} – ₹{priceMaxParam || "Max"}</span>
                <button onClick={() => updateUrl({ priceMin: null, priceMax: null })}><X className="h-3 w-3" /></button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline ml-2 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* MAIN LAYOUT: DESKTOP STICKY FILTER SIDEBAR + PRODUCT RESULTS */}
        <div className="grid grid-cols-1 gap-6 items-start">
          
          {/* SHARED RIGHT-SIDE FILTER DRAWER */}
          {showMobileFilterDrawer && (
            <>
              <button
                type="button"
                aria-label="Close catalog filters"
                onClick={() => setShowMobileFilterDrawer(false)}
                className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[2px]"
              />
              <aside className="fixed inset-y-0 right-0 z-[71] w-full max-w-sm overflow-y-auto bg-white p-4 shadow-2xl sm:p-5">
                <div className="flex min-h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#26364D]">
                <h3 className="font-display text-sm font-extrabold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-[#2563EB]" /> Filter Catalog
                </h3>
                <div className="flex items-center gap-3">
                  {activeChipsCount > 0 && (
                    <button
                      onClick={handleClearAllFilters}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Close catalog filters"
                    onClick={() => setShowMobileFilterDrawer(false)}
                    className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* DYNAMIC FILTER GROUPS GENERATED FROM ADMIN FILTER DEFINITIONS */}
              <div className="flex-1 space-y-1 overflow-y-auto py-3">
              {dynamicFilterGroups.map((group) => {
                const def = group.definition;
                const isCollapsed = collapsedFilters[def.id] || false;

                let paramKey = def.key;
                if (def.key === "ramCapacity") paramKey = "ram";
                if (def.key === "ssdCapacity") paramKey = "ssd";
                if (def.key === "screenSize") paramKey = "screen";
                if (def.key === "graphics") paramKey = "gpu";
                if (def.key === "operatingSystem") paramKey = "os";

                const currentSelected = getMultiParam(paramKey);

                return (
                  <div key={def.id} className="border-b border-slate-100 dark:border-[#26364D] pb-3">
                    {/* Filter Accordion Header */}
                    <button
                      onClick={() => setCollapsedFilters((prev) => ({ ...prev, [def.id]: !isCollapsed }))}
                      className="flex items-center justify-between w-full py-1 text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white hover:text-[#2563EB] text-left"
                    >
                      <span>{def.name} {def.unit && `(${def.unit})`}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-[#94A3B8] transition-transform", isCollapsed && "-rotate-90")} />
                    </button>

                    {/* Accordion Body */}
                    {!isCollapsed && (
                      <div className="mt-2 space-y-1.5">
                        {def.type === "boolean" ? (
                          <label className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8] cursor-pointer hover:text-[#111827] dark:hover:text-white">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={
                                  def.key === "touchScreen"
                                    ? touchScreenParam
                                    : def.key === "gstInvoiceAvailable"
                                    ? gstInvoiceParam
                                    : def.key === "newArrival"
                                    ? newArrivalParam
                                    : false
                                }
                                onChange={() => handleToggleBooleanParam(def.key, Boolean(searchParams.get(def.key)))}
                                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                              />
                              <span>Yes / Available</span>
                            </span>
                          </label>
                        ) : def.type === "price-range" ? (
                          <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <input
                                type="number"
                                placeholder="Min ₹"
                                value={priceMinParam || ""}
                                onChange={(e) => updateUrl({ priceMin: e.target.value ? Number(e.target.value) : null })}
                                className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#14243A] border border-[#E2E8F0] dark:border-[#26364D] px-2.5 py-1 text-xs text-[#111827] dark:text-white"
                              />
                              <input
                                type="number"
                                placeholder="Max ₹"
                                value={priceMaxParam || ""}
                                onChange={(e) => updateUrl({ priceMax: e.target.value ? Number(e.target.value) : null })}
                                className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#14243A] border border-[#E2E8F0] dark:border-[#26364D] px-2.5 py-1 text-xs text-[#111827] dark:text-white"
                              />
                            </div>
                          </div>
                        ) : group.availableOptions.length > 0 ? (
                          group.availableOptions.map((opt) => {
                            const isChecked = currentSelected.includes(opt.value);
                            return (
                              <label
                                key={opt.value}
                                className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8] cursor-pointer hover:text-[#111827] dark:hover:text-white"
                              >
                                <span className="flex items-center gap-2 truncate pr-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleMultiParam(paramKey, opt.value)}
                                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </span>
                                <span className="text-[10px] font-mono text-[#94A3B8] bg-slate-100 dark:bg-[#14243A] px-1.5 py-0.5 rounded font-bold shrink-0">
                                  {opt.count}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <div className="text-[10px] text-[#94A3B8] italic">No matching options</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
              <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white pt-3">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterDrawer(false)}
                  className="flex-1 rounded-lg bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Show {totalResults} products
                </button>
              </div>
                </div>
              </aside>
            </>
          )}

          {/* RIGHT PRODUCT RESULTS GRID */}
          <section className="min-w-0 space-y-6">
            {actionError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {actionError}
              </div>
            )}

            {loading ? (
              /* SKELETON LOADING GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl border border-[#E2E8F0] dark:border-[#26364D] bg-white dark:bg-[#0F1B2D] p-4 shadow-sm animate-pulse space-y-3">
                    <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-[#14243A]" />
                    <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-[#14243A]" />
                    <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-[#14243A]" />
                    <div className="h-6 w-1/3 rounded bg-slate-100 dark:bg-[#14243A]" />
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              /* EMPTY STATE */
              <div className="rounded-3xl border border-[#E2E8F0] dark:border-[#26364D] bg-white dark:bg-[#0F1B2D] p-12 text-center space-y-4 shadow-sm">
                <Laptop className="h-14 w-14 text-[#94A3B8] mx-auto" />
                <h3 className="font-display text-xl font-bold text-[#111827] dark:text-white">
                  No products match your active filters
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto">
                  Try removing some filters, adjusting your price range, or searching for a different keyword.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] text-white px-6 py-2.5 text-xs font-bold shadow-md hover:bg-blue-600 transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Reset All Filters
                </button>
              </div>
            ) : (
              /* PRODUCT CARDS GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((prod) => {
                  const isFav = wishlist.includes(prod.id);
                  const specs = extractStructuredSpecs(prod);

                  const effectivePrice = prod.price || 0;
                  const effectiveComparePrice = prod.compareAtPrice;
                  const hasCompareAt = effectiveComparePrice && effectiveComparePrice > effectivePrice;
                  const savePercent = hasCompareAt
                    ? Math.round(((effectiveComparePrice! - effectivePrice) / effectiveComparePrice!) * 100)
                    : prod.discount || 0;

                  const isOutOfStock = (prod.stock || 0) <= 0;

                  return (
                    <div
                      key={prod.id}
                      className="futuristic-card p-4 transition-all duration-300 flex flex-col justify-between group relative hover:-translate-y-1 hover:border-cyan-500/40 dark:hover:border-cyan-400/40"
                    >
                      <div>
                        {/* Product Image & Badges */}
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.03] p-4 flex items-center justify-center mb-3 border border-slate-100 dark:border-white/5">
                          <Link href={`/products/${prod.id}`} className="w-full h-full flex items-center justify-center">
                            <img
                              src={getSafeImageSrc(prod.image)}
                              alt={prod.title || "Product"}
                              loading="lazy"
                              decoding="async"
                              className="object-contain max-h-full max-w-full transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          </Link>

                          {/* Discount Badge */}
                          {savePercent > 0 && (
                            <span className="absolute top-2.5 left-2.5 rounded-full bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 px-2.5 py-0.5 text-[10px] font-bold shadow-sm pointer-events-none">
                              {savePercent}% OFF
                            </span>
                          )}

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(prod.id);
                            }}
                            aria-label={isFav ? `Remove ${prod.title} from wishlist` : `Add ${prod.title} to wishlist`}
                            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/90 dark:bg-[#070B1A]/90 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm hover:scale-110 transition-all cursor-pointer"
                          >
                            <Heart className={cn("h-4 w-4", isFav && "fill-rose-500 text-rose-500")} />
                          </button>
                        </div>

                        {/* Brand & SKU */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                          {prod.brand && <span className="uppercase tracking-wider text-indigo-600 dark:text-cyan-400 font-bold">{prod.brand}</span>}
                          {productDisplayConfig?.showSku !== false && prod.sku && (
                            <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded font-mono">
                              SKU: {prod.sku}
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <Link href={`/products/${prod.id}`} className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors block">
                          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                            {prod.title}
                          </h3>
                        </Link>

                        {/* Rating & Reviews */}
                        {productDisplayConfig?.showRatings !== false && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              <span>{specs.rating || 4.5}</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">({specs.reviewsCount || 12} reviews)</span>
                          </div>
                        )}

                        {/* Optional Warranty Badge on Card */}
                        {productDisplayConfig?.showWarrantyBadge && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{prod.warranty || "Warranty Backed"}</span>
                          </div>
                        )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Selling Price</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-base font-extrabold text-slate-900 dark:text-slate-50">
                              ₹{effectivePrice.toLocaleString("en-IN")}
                            </span>
                            {hasCompareAt && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                ₹{effectiveComparePrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/products/${prod.id}`}
                            className="futuristic-btn-secondary px-3 py-1.5 text-xs"
                          >
                            Details
                          </Link>

                          {productDisplayConfig?.showQuickAddToCart !== false && (
                            <button
                              disabled={isOutOfStock}
                              onClick={() => addToCart(prod)}
                              className={cn(
                                "futuristic-btn-primary px-3 py-1.5 text-xs flex items-center gap-1",
                                isOutOfStock && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <ShoppingBag className="h-3.5 w-3.5" /> +Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => updateUrl({ page: currentPage - 1 })}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => updateUrl({ page: pNum })}
                      className={cn(
                        "h-8 w-8 rounded-xl text-xs font-bold transition-all border",
                        currentPage === pNum
                          ? "bg-nex-blue text-white border-nex-blue shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => updateUrl({ page: currentPage + 1 })}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </section>
        </div>
      </main>

      {/* PRODUCT DETAILS MODAL */}
      {productDetailModal && (() => {
        const prod = productDetailModal;
        const specs = extractStructuredSpecs(prod);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductDetailModal(null)} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl z-10 text-slate-900">
              <button onClick={() => setProductDetailModal(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-square w-full rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-center">
                  <img src={getSafeImageSrc(prod.image)} alt={prod.title} className="object-contain max-h-full max-w-full" />
                </div>

                <div className="space-y-3">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-nex-blue uppercase">
                    {prod.category.replace("_", " ")}
                  </span>
                  <h2 className="font-display text-lg font-bold">{prod.title}</h2>
                  <p className="text-xs text-slate-500">{prod.description}</p>
                  
                  <div className="font-display text-xl font-extrabold text-nex-blue">
                    ₹{(prod.price || 0).toLocaleString("en-IN")}
                  </div>

                  {prod.specs && Object.keys(prod.specs).length > 0 && (
                    <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Specifications</h4>
                      {Object.entries(prod.specs).slice(0, 8).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-200/50 pb-0.5">
                          <span className="text-slate-500">{k}:</span>
                          <span className="font-semibold text-slate-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (addToCart(prod)) setProductDetailModal(null);
                    }}
                    className="w-full rounded-xl bg-nex-blue text-white font-bold text-xs py-3 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="h-4 w-4" /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {!isCustomerPortal && <Footer />}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400 font-semibold">Loading Catalog Store...</div>}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
