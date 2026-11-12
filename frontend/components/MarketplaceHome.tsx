"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Cpu,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Monitor,
  Mouse,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Product } from "@/lib/data";
import { getSafeImageSrc } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";

interface MarketplaceHomeProps {
  hasAdminSession?: boolean;
  hasResellerSession?: boolean;
  hasUserSession?: boolean;
  initialProducts?: Product[];
  initialSettings?: any;
}

const categories = [
  { id: "cat-laptops", label: "Laptops", query: "business_laptops", Icon: Laptop, tone: "blue" },
  { id: "cat-desktops", label: "Desktops", query: "desktop_systems", Icon: Monitor, tone: "violet" },
  { id: "cat-processors", label: "Processors", query: "desktop_components", Icon: Cpu, tone: "cyan" },
  { id: "cat-ram", label: "RAM", query: "ram", Icon: MemoryStick, tone: "amber" },
  { id: "cat-ssds", label: "SSDs", query: "storage", Icon: HardDrive, tone: "emerald" },
  { id: "cat-keyboards", label: "Keyboards", query: "peripherals", Icon: Keyboard, tone: "rose" },
  { id: "cat-mouse", label: "Mouse", query: "peripherals", Icon: Mouse, tone: "blue" },
  { id: "cat-headsets", label: "Headsets", query: "audio", Icon: Headphones, tone: "cyan" },
];

export default function MarketplaceHome({
  hasAdminSession = false,
  hasResellerSession = false,
  hasUserSession = false,
  initialProducts = [],
  initialSettings = null,
}: MarketplaceHomeProps) {
  const router = useRouter();
  const addToCart = useCartStore((store) => store.addItem);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;
    let active = true;
    fetch("/api/public/products?sortBy=newest")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load products");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const available = (data.products || []).filter(
          (product: Product) => product.status !== "hide" && product.status !== "deleted" && product.status !== "pending"
        );
        setProducts(available.sort((left: Product, right: Product) => Number(right.featured) - Number(left.featured)));
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  const activePortals = [
    hasUserSession && { label: "Customer account", href: "/customer" },
    hasResellerSession && { label: "Reseller portal", href: "/reseller" },
    hasAdminSession && { label: "Admin console", href: "/admin" },
  ].filter(Boolean) as { label: string; href: string }[];

  const [storeSettings, setStoreSettings] = useState<any>(initialSettings);

  useEffect(() => {
    if (initialSettings) return;
    fetch("/api/public/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStoreSettings(data);
      })
      .catch(() => {});
  }, []);

  const isHeroEnabled = storeSettings?.storefront?.sections?.hero?.enabled !== false;
  const isCategoriesEnabled = storeSettings?.storefront?.sections?.categories?.enabled !== false;
  const isFeaturedEnabled = storeSettings?.storefront?.sections?.featured?.enabled !== false;
  const isTrustBadgesEnabled = storeSettings?.storefront?.sections?.trustBadges?.enabled !== false;
  const isPromoBannersEnabled = storeSettings?.storefront?.sections?.promoBanners?.enabled !== false;
  const promoBanners = storeSettings?.storefront?.promoBanners || [];

  const featuredMaxCount = storeSettings?.storefront?.featuredProducts?.maxCount || 8;
  const featuredTitle = storeSettings?.storefront?.featuredProducts?.title || "Featured products";
  const featuredSubtitle = storeSettings?.storefront?.featuredProducts?.subtitle || "Picked for your setup";
  const featuredProducts = products.slice(0, featuredMaxCount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 space-y-12">
        {isHeroEnabled && (
        <section className="futuristic-card p-0 overflow-hidden relative border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid items-center gap-8 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-14">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50 dark:border-cyan-500/20 dark:bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" /> Next-Gen Enterprise Technology
              </div>
              <h1 className="heading-h1 max-w-2xl">
                Smart Technology. Trusted Service.
              </h1>
              <p className="mt-4 max-w-xl text-readable-body">
                Shop certified business laptops, gaming workstations, and enterprise hardware with local warranty and express delivery from NexLapTech Tumkur Hub (572102).
              </p>
              <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl gap-2 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#070B1A]/80 p-2 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/20 transition-all">
                <Search className="ml-2 mt-2.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-cyan-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search laptops, SSDs, RAM, workstation components..."
                  aria-label="Search products"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button type="submit" className="futuristic-btn-accent">
                  Search <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              {activePortals.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activePortals.map((portal) => (
                    <Link key={portal.href} href={portal.href} className="futuristic-badge-success hover:bg-emerald-500/20 transition-colors">
                      Open {portal.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative min-h-60 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/80 via-cyan-50/40 to-slate-100 dark:from-indigo-950/40 dark:via-cyan-950/20 dark:to-slate-900/60 border border-slate-200/80 dark:border-white/10 p-6 sm:min-h-72 sm:p-8">
              <div className="relative z-10 max-w-[62%]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">Enterprise Grade</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-50 sm:text-3xl">Your next setup starts here.</h2>
                <Link href="/products" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-cyan-400 hover:underline">
                  Browse all products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {products[0]?.image ? (
                <img
                  src={getSafeImageSrc(products[0].image)}
                  alt={products[0].title}
                  width={400}
                  height={300}
                  // @ts-ignore
                  fetchPriority="high"
                  decoding="async"
                  className="absolute -bottom-2 -right-3 h-[85%] w-[55%] object-contain drop-shadow-2xl"
                />
              ) : (
                <Laptop aria-hidden="true" className="absolute -bottom-7 -right-5 h-48 w-48 text-indigo-400/20 dark:text-cyan-400/20 sm:h-64 sm:w-64" strokeWidth={0.8} />
              )}
            </div>
          </div>
        </section>
        )}

        {isCategoriesEnabled && (
        <section aria-labelledby="shop-categories-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">Browse by department</p>
              <h2 id="shop-categories-title" className="heading-h2 mt-1">Shop categories</h2>
            </div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-bold text-indigo-600 dark:text-cyan-400 hover:underline sm:inline-flex">
              All categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {categories.map(({ id, label, query, Icon, tone }) => {
              const toneStyles: Record<string, string> = {
                blue: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60",
                violet: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/60",
                cyan: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/60",
                amber: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60",
                emerald: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60",
                rose: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60",
              };
              return (
                <Link key={id} href={`/products?category=${encodeURIComponent(query)}`} className="group futuristic-card p-4 flex min-h-28 flex-col items-center justify-center gap-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 hover:shadow-md">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${toneStyles[tone]}`}><Icon className="h-5 w-5" /></span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                </Link>
              );
            })}
          </div>
        </section>
        )}

        {/* Promo Banners Section */}
        {isPromoBannersEnabled && promoBanners.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2">
            {promoBanners.map((banner: any) => (
              <Link
                key={banner.id}
                href={banner.linkUrl || "/products"}
                className="group futuristic-card p-6 relative overflow-hidden bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-cyan-950/20 border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-all"
              >
                <div className="relative z-10 max-w-[70%] space-y-2">
                  <span className="inline-block rounded-full bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5">
                    {banner.badge || "SPECIAL"}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-readable-secondary line-clamp-2">{banner.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-cyan-400 pt-1">
                    Explore Now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                {banner.imageUrl && (
                  <img
                    src={getSafeImageSrc(banner.imageUrl)}
                    alt={banner.title}
                    loading="lazy"
                    decoding="async"
                    width={128}
                    height={128}
                    className="absolute -bottom-4 -right-4 h-32 w-32 object-contain opacity-90 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </Link>
            ))}
          </section>
        )}

        {isFeaturedEnabled && (
        <section aria-labelledby="featured-products-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">{featuredSubtitle}</p>
              <h2 id="featured-products-title" className="heading-h2 mt-1">{featuredTitle}</h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-cyan-400 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 skeleton rounded-2xl" />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="futuristic-card p-10 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Products are being prepared.</p>
              <Link href="/products" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-cyan-400">Explore the catalog <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const comparePrice = Number(product.compareAtPrice || 0);
                const price = Number(product.price || 0);
                const discount = comparePrice > price && comparePrice > 0 ? Math.round((1 - price / comparePrice) * 100) : Number(product.discount || 0);
                return (
                  <article key={product.id} className="futuristic-card p-0 group flex min-w-0 flex-col overflow-hidden hover:-translate-y-0.5 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 hover:shadow-lg transition-all duration-200">
                    <Link href={`/products/${product.id}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50 dark:bg-white/[0.02] p-4 border-b border-slate-100 dark:border-white/5">
                      {discount > 0 && <span className="absolute left-3 top-3 z-10 rounded-full bg-indigo-600 dark:bg-cyan-500 px-2.5 py-0.5 text-[10px] font-bold text-white dark:text-slate-950">{discount}% OFF</span>}
                      <img
                        src={getSafeImageSrc(product.image)}
                        alt={product.title}
                        loading="lazy"
                        decoding="async"
                        width={300}
                        height={225}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">{product.brand || product.category.replaceAll("_", " ")}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"><ShieldCheck className="h-3 w-3" /> Verified</span>
                      </div>
                      <Link href={`/products/${product.id}`} className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-cyan-400">{product.title}</Link>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-display text-lg font-extrabold text-slate-950 dark:text-slate-50">₹{price.toLocaleString("en-IN")}</span>
                        {comparePrice > price && <span className="text-xs text-slate-500 dark:text-slate-400 line-through">₹{comparePrice.toLocaleString("en-IN")}</span>}
                      </div>
                      <button onClick={() => addToCart({ id: product.id, title: product.title, price, image: product.image, category: product.category })} className="futuristic-btn-primary mt-3 w-full">
                        <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        )}

        {isTrustBadgesEnabled && (
        <section className="futuristic-card p-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 px-1"><Truck className="h-5 w-5 text-indigo-600 dark:text-cyan-400" /><span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Tumkur Hub (572102) express delivery</span></div>
          <div className="flex items-center gap-3 px-1"><ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">90-Day standard warranty &amp; 7-day replacement</span></div>
          <div className="flex items-center gap-3 px-1"><Wrench className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Local technician diagnostics &amp; support</span></div>
        </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
