"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Globe,
  Save,
  Check,
  Image as ImageIcon,
  FileText,
  Tag,
  LayoutTemplate,
  RefreshCw,
  Sliders,
  HelpCircle,
  Phone,
  Share2,
  Trash2,
  PlusCircle,
  Building2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

type CMSSectionKey =
  | "business_info"
  | "hero"
  | "seo"
  | "banners"
  | "products_section"
  | "services_section"
  | "training_section"
  | "internship_section"
  | "faq"
  | "contact_info"
  | "social";

interface TabConfig {
  key: CMSSectionKey;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { key: "business_info", label: "Business & GSTIN", shortLabel: "Business", icon: <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "hero", label: "Hero Banner", shortLabel: "Hero", icon: <LayoutTemplate className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "seo", label: "SEO & Metas", shortLabel: "SEO", icon: <Tag className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "banners", label: "Promo Banners", shortLabel: "Banners", icon: <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "products_section", label: "Products Copy", shortLabel: "Products", icon: <Sliders className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "services_section", label: "Services Copy", shortLabel: "Services", icon: <Sliders className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "training_section", label: "Training Copy", shortLabel: "Training", icon: <Sliders className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "internship_section", label: "Internships Copy", shortLabel: "Internships", icon: <Sliders className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "faq", label: "Homepage FAQ", shortLabel: "FAQ", icon: <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "contact_info", label: "Contact Numbers", shortLabel: "Contact", icon: <Phone className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { key: "social", label: "Social & Sharing", shortLabel: "Social", icon: <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" /> },
];

export default function AdminWebsiteCMS() {
  const [activeTab, setActiveTab] = useState<CMSSectionKey>("business_info");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();

  // Business Information & GSTIN fields
  const [businessName, setBusinessName] = useState("NexLapTech — NexByte Technologies");
  const [gstin, setGstin] = useState("29ABCDE1234F1Z5");
  const [gstinError, setGstinError] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");
  const [logoUrl, setLogoUrl] = useState("/assets/nexlaptech-logo.webp");
  const [invoiceFooter, setInvoiceFooter] = useState("Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems");

  // Hero fields
  const [heroHeadline, setHeroHeadline] = useState("Premium IT Solutions — NexLapTech");
  const [heroSubheadline, setHeroSubheadline] = useState("Laptops, Gaming PCs, Servers, Accessories, Repairs & Academy Training.");
  const [heroCTA, setHeroCTA] = useState("Explore Products");
  const [heroSecondaryCTA, setHeroSecondaryCTA] = useState("Book a Service");

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("NexLapTech — Hardware, Repairs & IT Training");
  const [metaDescription, setMetaDescription] = useState("NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply, CCTV installation, software support, and IT academy training in Tamil Nadu & Karnataka.");
  const [metaKeywords, setMetaKeywords] = useState("laptop repair, gaming PC, computer service, bulk supply, IT training, CCTV installation, NexLapTech");
  const [ogImage, setOgImage] = useState("/images/poster-products.webp");

  // Banners
  const [banners, setBanners] = useState<any[]>([]);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerCta, setNewBannerCta] = useState("Explore Deals");
  const [showAddBanner, setShowAddBanner] = useState(false);

  // Section configs
  const [prodTitle, setProdTitle] = useState("Explore Products");
  const [prodSub, setProdSub] = useState("Premium hardware selection for students, professionals, and gamers.");
  const [srvTitle, setSrvTitle] = useState("Our IT Services");
  const [srvSub, setSrvSub] = useState("Motherboard repairs, software setups, network wiring, and CCTV integrations.");
  const [trainTitle, setTrainTitle] = useState("NexLapTech Academy Training");
  const [trainSub, setTrainSub] = useState("Learn practical desktop and laptop repairing skills from certified engineers.");
  const [internTitle, setInternTitle] = useState("IEEE Project Internships");
  const [internSub, setInternSub] = useState("Submit candidate applications for engineering academic project slots.");

  // FAQs
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Contact Info
  const [phone1, setPhone1] = useState("+91 8088979706");
  const [phone2, setPhone2] = useState("+91 8904760125");
  const [email, setEmail] = useState("nexbytetechnologies@gmail.com");
  const [address, setAddress] = useState("No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");

  // Social
  const [whatsapp, setWhatsapp] = useState("https://wa.me/918088979706");
  const [instagram, setInstagram] = useState("https://instagram.com/nexbyte_technologies");
  const [facebook, setFacebook] = useState("https://facebook.com/nexbytetech");
  const [youtube, setYoutube] = useState("https://youtube.com/@nexbytetech");
  const [googleForm, setGoogleForm] = useState("https://forms.gle/nexbyte-feedback");

  const loadCMSData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // Try dedicated server API first
      let data: any = null;
      try {
        const res = await fetch("/api/admin/website-cms");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.content) {
            data = json.content;
          }
        }
      } catch {
        // Fallback to client dbHelper
      }

      if (!data) {
        data = await dbHelper.cmsContent.get();
      }

      if (data) {
        if (data.business_info) {
          setBusinessName(data.business_info.businessName || "NexLapTech — NexByte Technologies");
          setGstin(data.business_info.gstin || "29ABCDE1234F1Z5");
          setRegisteredAddress(data.business_info.registeredAddress || "No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");
          setLogoUrl(data.business_info.logoUrl || "/assets/nexlaptech-logo.webp");
          setInvoiceFooter(data.business_info.invoiceFooter || "Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems");
        }
        if (data.hero) {
          setHeroHeadline(data.hero.headline || "Premium IT Solutions — NexLapTech");
          setHeroSubheadline(data.hero.subheadline || "Laptops, Gaming PCs, Servers, Accessories, Repairs & Academy Training.");
          setHeroCTA(data.hero.cta || "Explore Products");
          setHeroSecondaryCTA(data.hero.secondary_cta || "Book a Service");
        }
        if (data.seo) {
          setMetaTitle(data.seo.title || "NexLapTech — Hardware, Repairs & IT Training");
          setMetaDescription(data.seo.description || "NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply, CCTV installation, software support, and IT academy training in Tamil Nadu & Karnataka.");
          setMetaKeywords(data.seo.keywords || "laptop repair, gaming PC, computer service, bulk supply, IT training, CCTV installation, NexLapTech");
          setOgImage(data.seo.og_image || "/images/poster-products.webp");
        }
        if (data.banners) {
          setBanners(data.banners || []);
        }
        if (data.products_section) {
          setProdTitle(data.products_section.title || "Explore Products");
          setProdSub(data.products_section.subtitle || "Premium hardware selection for students, professionals, and gamers.");
        }
        if (data.services_section) {
          setSrvTitle(data.services_section.title || "Our IT Services");
          setSrvSub(data.services_section.subtitle || "Motherboard repairs, software setups, network wiring, and CCTV integrations.");
        }
        if (data.training_section) {
          setTrainTitle(data.training_section.title || "NexLapTech Academy Training");
          setTrainSub(data.training_section.subtitle || "Learn practical desktop and laptop repairing skills from certified engineers.");
        }
        if (data.internship_section) {
          setInternTitle(data.internship_section.title || "IEEE Project Internships");
          setInternSub(data.internship_section.subtitle || "Submit candidate applications for engineering academic project slots.");
        }
        if (data.faq) {
          setFaqs(data.faq || []);
        }
        if (data.contact_info) {
          setPhone1(data.contact_info.phone1 || "+91 8088979706");
          setPhone2(data.contact_info.phone2 || "+91 8904760125");
          setEmail(data.contact_info.email || "nexbytetechnologies@gmail.com");
          setAddress(data.contact_info.address || "No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");
        }
        if (data.social) {
          setWhatsapp(data.social.whatsapp || "https://wa.me/918088979706");
          setInstagram(data.social.instagram || "https://instagram.com/nexbyte_technologies");
          setFacebook(data.social.facebook || "https://facebook.com/nexbytetech");
          setYoutube(data.social.youtube || "https://youtube.com/@nexbytetech");
          setGoogleForm(data.social.googleForm || "https://forms.gle/nexbyte-feedback");
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to load website CMS content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCMSData();
    const handleRealtime = () => loadCMSData();
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, []);

  const validateGSTIN = (val: string) => {
    if (!val || !val.trim()) return true;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim().toUpperCase());
  };

  const handleSave = async () => {
    if (gstin && !validateGSTIN(gstin)) {
      setGstinError("Please enter a valid 15-character GSTIN format (e.g. 29ABCDE1234F1Z5).");
      setActiveTab("business_info");
      return;
    }
    setGstinError("");
    setSaving(true);
    setErrorMsg("");

    const payload = {
      sections: {
        business_info: {
          businessName: businessName.trim(),
          gstin: gstin.trim().toUpperCase(),
          registeredAddress: registeredAddress.trim(),
          phone1: phone1.trim(),
          phone2: phone2.trim(),
          email: email.trim(),
          logoUrl: logoUrl.trim(),
          invoiceFooter: invoiceFooter.trim(),
        },
        hero: {
          headline: heroHeadline.trim(),
          subheadline: heroSubheadline.trim(),
          cta: heroCTA.trim(),
          secondary_cta: heroSecondaryCTA.trim(),
        },
        seo: {
          title: metaTitle.trim(),
          description: metaDescription.trim(),
          keywords: metaKeywords.trim(),
          og_image: ogImage.trim(),
        },
        banners,
        products_section: { title: prodTitle.trim(), subtitle: prodSub.trim() },
        services_section: { title: srvTitle.trim(), subtitle: srvSub.trim() },
        training_section: { title: trainTitle.trim(), subtitle: trainSub.trim() },
        internship_section: { title: internTitle.trim(), subtitle: internSub.trim() },
        faq: faqs,
        contact_info: { phone1: phone1.trim(), phone2: phone2.trim(), email: email.trim(), address: address.trim() },
        social: { whatsapp: whatsapp.trim(), instagram: instagram.trim(), facebook: facebook.trim(), youtube: youtube.trim(), googleForm: googleForm.trim() },
      },
    };

    try {
      // 1. Try server API route
      let apiSuccess = false;
      try {
        const res = await fetch("/api/admin/website-cms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          apiSuccess = true;
        }
      } catch { }

      // 2. Client-side persistence fallback to ensure synchronization
      await Promise.all([
        dbHelper.cmsContent.update("business_info", payload.sections.business_info),
        dbHelper.cmsContent.update("hero", payload.sections.hero),
        dbHelper.cmsContent.update("seo", payload.sections.seo),
        dbHelper.cmsContent.update("banners", payload.sections.banners),
        dbHelper.cmsContent.update("products_section", payload.sections.products_section),
        dbHelper.cmsContent.update("services_section", payload.sections.services_section),
        dbHelper.cmsContent.update("training_section", payload.sections.training_section),
        dbHelper.cmsContent.update("internship_section", payload.sections.internship_section),
        dbHelper.cmsContent.update("faq", payload.sections.faq),
        dbHelper.cmsContent.update("contact_info", payload.sections.contact_info),
        dbHelper.cmsContent.update("social", payload.sections.social),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save CMS changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBanner = (id: number) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };

  const handleDeleteBanner = (id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBanner = () => {
    if (!newBannerTitle.trim()) return;
    const newId = Date.now();
    setBanners((prev) => [
      ...prev,
      {
        id: newId,
        title: newBannerTitle.trim(),
        subtitle: newBannerSubtitle.trim(),
        cta: newBannerCta.trim() || "Explore",
        enabled: true,
      },
    ]);
    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setShowAddBanner(false);
  };

  const handleAddFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setFaqs((prev) => [...prev, { q: newQ.trim(), a: newA.trim() }]);
    setNewQ("");
    setNewA("");
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <main role="main" className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            Website Experience &amp; Brand Studio
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
            Website Content &amp; CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure live homepage copy, verified GSTIN identity, SEO tags, promotional campaigns, and customer touchpoints.
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadCMSData}
            disabled={loading}
            aria-label="Reload latest CMS content"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-label="Save all website CMS changes"
            className={`min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${saved
              ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400"
              : saving
                ? "bg-cyan-700 text-white cursor-wait opacity-80"
                : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20"
              }`}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" /> Saved Successfully!
              </>
            ) : saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" /> Save All Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <strong className="font-bold">Error:</strong> {errorMsg}
          </div>
        </div>
      )}

      {/* ─── Responsive Tab Navigation Bar ─── */}
      <nav aria-label="CMS Sections Navigation" className="space-y-2">
        {/* Mobile Dropdown Selector (Visible on < 640px) */}
        <div className="block sm:hidden">
          <label htmlFor="cms-mobile-tab-select" className="sr-only">
            Select CMS Section
          </label>
          <div className="relative">
            <select
              id="cms-mobile-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as CMSSectionKey)}
              className="w-full min-h-[48px] appearance-none rounded-xl border border-white/10 bg-[#0B0F1E] px-4 py-3 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-md"
            >
              {TABS.map((tab) => (
                <option key={tab.key} value={tab.key} className="bg-[#0B0F1E] text-white">
                  {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" aria-hidden="true" />
          </div>
        </div>

        {/* Horizontal Touch-Scrollable Pill Tabs (Smooth on touch devices) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/10 sm:flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-label={`Switch to ${tab.label} section`}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-[44px] flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${isActive
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/40"
                  : "bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5"
                  }`}
              >
                {tab.icon}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── Loading Skeleton Placeholder (Zero CLS) ─── */}
      {loading ? (
        <div className="space-y-4 animate-pulse rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl">
          <div className="h-6 w-48 rounded-lg bg-white/10" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-white/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="h-16 rounded-xl bg-white/5" />
            <div className="h-16 rounded-xl bg-white/5" />
          </div>
          <div className="h-28 rounded-xl bg-white/5" />
          <div className="h-12 w-32 rounded-xl bg-white/10" />
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════════════════
              TAB 1: BUSINESS INFORMATION & GSTIN
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "business_info" && (
            <section aria-labelledby="section-business-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5">
                  <div>
                    <h2 id="section-business-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                      Authorized Business Information &amp; GSTIN CMS
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Configurable corporate identity, GSTIN registration, tax invoice footer, and contact channels displayed on customer invoices and About portals.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Verified Business Profile
                  </span>
                </div>

                {gstinError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                    <span>{gstinError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="biz-name" className="block text-xs font-bold text-slate-200">
                      Business Legal / Display Name *
                    </label>
                    <input
                      id="biz-name"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. NexLapTech — NexByte Technologies"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="biz-gstin" className="block text-xs font-bold text-slate-200">
                        Official GSTIN Registration No. *
                      </label>
                      <span className="text-[10px] text-cyan-400 font-mono">15-char Alpha-numeric</span>
                    </div>
                    <input
                      id="biz-gstin"
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        if (gstinError) setGstinError("");
                      }}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white font-mono tracking-wider focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 uppercase transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="biz-address" className="block text-xs font-bold text-slate-200">
                    Registered Office &amp; Service Center Address
                  </label>
                  <textarea
                    id="biz-address"
                    rows={2}
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    placeholder="e.g. No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none leading-relaxed transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="biz-phone1" className="block text-xs font-bold text-slate-200">
                      Support Phone 1
                    </label>
                    <input
                      id="biz-phone1"
                      type="tel"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="biz-phone2" className="block text-xs font-bold text-slate-200">
                      Support Phone 2
                    </label>
                    <input
                      id="biz-phone2"
                      type="tel"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="biz-email" className="block text-xs font-bold text-slate-200">
                      Official Business Email
                    </label>
                    <input
                      id="biz-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="biz-logo" className="block text-xs font-bold text-slate-200">
                    Brand Logo Asset URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      id="biz-logo"
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="/assets/nexlaptech-logo.webp"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    {logoUrl && (
                      <div className="shrink-0 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                        <img src={logoUrl} alt="Logo preview" className="h-8 w-auto object-contain rounded" onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                        <span className="text-[11px] text-slate-400">Preview</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="biz-footer" className="block text-xs font-bold text-slate-200">
                    Tax Invoice Footer Terms &amp; Disclaimer
                  </label>
                  <textarea
                    id="biz-footer"
                    rows={2}
                    value={invoiceFooter}
                    onChange={(e) => setInvoiceFooter(e.target.value)}
                    placeholder="e.g. Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 2: HOMEPAGE HERO SECTION
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "hero" && (
            <section aria-labelledby="section-hero-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-hero-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Homepage Hero Section Copy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Directly control the primary above-the-fold value proposition and call-to-action buttons.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hero-headline" className="block text-xs font-bold text-slate-200">
                    Main Headline
                  </label>
                  <input
                    id="hero-headline"
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="e.g. Premium IT Solutions — NexLapTech"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hero-subheadline" className="block text-xs font-bold text-slate-200">
                    Sub-headline / Tagline
                  </label>
                  <textarea
                    id="hero-subheadline"
                    rows={2}
                    value={heroSubheadline}
                    onChange={(e) => setHeroSubheadline(e.target.value)}
                    placeholder="Secondary descriptive copy..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hero-cta" className="block text-xs font-bold text-slate-200">
                      Primary CTA Button Label
                    </label>
                    <input
                      id="hero-cta"
                      type="text"
                      value={heroCTA}
                      onChange={(e) => setHeroCTA(e.target.value)}
                      placeholder="e.g. Explore Products"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="hero-secondary-cta" className="block text-xs font-bold text-slate-200">
                      Secondary CTA Button Label
                    </label>
                    <input
                      id="hero-secondary-cta"
                      type="text"
                      value={heroSecondaryCTA}
                      onChange={(e) => setHeroSecondaryCTA(e.target.value)}
                      placeholder="e.g. Book a Service"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Hero Live Preview Card */}
                <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#070B1A] to-indigo-950/50 p-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Live Storefront Hero Preview
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-white">{heroHeadline}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl">{heroSubheadline}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md">
                      {heroCTA}
                    </button>
                    <button type="button" className="min-h-[44px] px-5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white font-bold text-xs sm:text-sm">
                      {heroSecondaryCTA}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 3: SEO & METAS
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "seo" && (
            <section aria-labelledby="section-seo-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-seo-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Tag className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Search Engine Optimization (SEO) &amp; OpenGraph Metas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Optimize organic Google rankings, social sharing banners, and search result previews.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="meta-title" className="block text-xs font-bold text-slate-200">
                      Page Title Tag
                    </label>
                    <span className={`text-[11px] font-mono ${metaTitle.length > 60 ? "text-amber-400" : "text-slate-400"}`}>
                      {metaTitle.length}/60 chars (Recommended: 50–60)
                    </span>
                  </div>
                  <input
                    id="meta-title"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="NexLapTech — Hardware, Repairs & IT Training"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="meta-description" className="block text-xs font-bold text-slate-200">
                      Meta Description
                    </label>
                    <span className={`text-[11px] font-mono ${metaDescription.length > 160 ? "text-amber-400" : "text-slate-400"}`}>
                      {metaDescription.length}/160 chars (Recommended: 140–160)
                    </span>
                  </div>
                  <textarea
                    id="meta-description"
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Concise overview of your products, services, and location..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="meta-keywords" className="block text-xs font-bold text-slate-200">
                    Target Keywords (comma-separated)
                  </label>
                  <input
                    id="meta-keywords"
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="laptop repair, gaming pc, bulk hardware supply, cctv, it training"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="og-image" className="block text-xs font-bold text-slate-200">
                    Open Graph (Social Share) Image URL
                  </label>
                  <input
                    id="og-image"
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="/images/poster-products.webp"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Google Mobile Search Snippet Preview */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" /> Google Search SERP Snippet Preview
                  </p>
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-white">nexlaptech.in</span>
                      <span>›</span>
                      <span>homepage</span>
                    </div>
                    <h4 className="text-base font-medium text-cyan-400 hover:underline cursor-pointer">
                      {metaTitle || "NexLapTech — Hardware, Repairs & IT Training"}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {metaDescription || "NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply..."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 4: PROMO BANNERS
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "banners" && (
            <section aria-labelledby="section-banners-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 id="section-banners-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                      Homepage Promotional Banners
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Manage rotating campaign slides, limited-time discount announcements, and service spotlights.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBanner(!showAddBanner)}
                    aria-label="Add new promotional banner"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" /> Add Banner
                  </button>
                </div>

                {/* Add Banner Form */}
                {showAddBanner && (
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-4">
                    <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Create New Promotional Banner</h3>
                    <input
                      type="text"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="Banner headline (e.g. Monsoon Tech Upgrade)"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newBannerSubtitle}
                      onChange={(e) => setNewBannerSubtitle(e.target.value)}
                      placeholder="Banner subtext / discount details"
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newBannerCta}
                        onChange={(e) => setNewBannerCta(e.target.value)}
                        placeholder="CTA Button Label"
                        className="w-48 min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddBanner}
                        aria-label="Confirm save new banner"
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Add to List
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddBanner(false)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner Cards */}
                {banners.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <ImageIcon className="mx-auto h-10 w-10 text-slate-500 mb-2" aria-hidden="true" />
                    <p className="text-xs text-slate-400">No active promotional banners found. Add your first campaign banner above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className={`rounded-2xl border p-5 transition-all ${banner.enabled ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01] opacity-60"
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                          <div className="flex-1 space-y-2">
                            {editingBanner?.id === banner.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingBanner.title}
                                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:outline-none"
                                  placeholder="Banner headline"
                                />
                                <input
                                  type="text"
                                  value={editingBanner.subtitle}
                                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:outline-none"
                                  placeholder="Banner subtext"
                                />
                                <input
                                  type="text"
                                  value={editingBanner.cta}
                                  onChange={(e) => setEditingBanner({ ...editingBanner, cta: e.target.value })}
                                  className="w-48 min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base sm:text-xs text-white focus:outline-none"
                                  placeholder="CTA button text"
                                />
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBanners((prev) => prev.map((b) => (b.id === banner.id ? editingBanner : b)));
                                      setEditingBanner(null);
                                    }}
                                    className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
                                  >
                                    Apply Edits
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBanner(null)}
                                    className="min-h-[44px] px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-bold text-white text-base">{banner.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-300">{banner.subtitle}</p>
                                <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-300 font-bold">
                                  CTA: {banner.cta}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                            {/* Accessible Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleBanner(banner.id)}
                              aria-label={`Toggle banner ${banner.title} ${banner.enabled ? "offline" : "online"}`}
                              className="min-h-[44px] min-w-[44px] flex items-center gap-2 cursor-pointer focus:outline-none"
                            >
                              <span className={`text-xs font-bold ${banner.enabled ? "text-emerald-400" : "text-slate-400"}`}>
                                {banner.enabled ? "Live on Store" : "Hidden"}
                              </span>
                              <div
                                className={`relative h-6 w-11 rounded-full transition-colors ${banner.enabled ? "bg-emerald-500" : "bg-white/15"
                                  }`}
                              >
                                <div
                                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${banner.enabled ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                              </div>
                            </button>

                            <div className="flex items-center gap-3">
                              {editingBanner?.id !== banner.id && (
                                <button
                                  type="button"
                                  onClick={() => setEditingBanner({ ...banner })}
                                  aria-label={`Edit banner ${banner.title}`}
                                  className="min-h-[44px] inline-flex items-center px-2 text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBanner(banner.id)}
                                aria-label={`Delete banner ${banner.title}`}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 5: PRODUCTS SECTION COPY
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "products_section" && (
            <section aria-labelledby="section-prod-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-prod-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Homepage Products Section Copy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Configure the introduction heading and subtitle introducing your catalog.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prod-title" className="block text-xs font-bold text-slate-200">
                    Section Heading
                  </label>
                  <input
                    id="prod-title"
                    type="text"
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prod-sub" className="block text-xs font-bold text-slate-200">
                    Section Subtitle
                  </label>
                  <textarea
                    id="prod-sub"
                    rows={2}
                    value={prodSub}
                    onChange={(e) => setProdSub(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 6: SERVICES SECTION COPY
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "services_section" && (
            <section aria-labelledby="section-srv-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-srv-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Homepage IT Services Section Copy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Control how motherboard repairs, diagnostics, and AMC support are presented.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="srv-title" className="block text-xs font-bold text-slate-200">
                    Section Heading
                  </label>
                  <input
                    id="srv-title"
                    type="text"
                    value={srvTitle}
                    onChange={(e) => setSrvTitle(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="srv-sub" className="block text-xs font-bold text-slate-200">
                    Section Subtitle
                  </label>
                  <textarea
                    id="srv-sub"
                    rows={2}
                    value={srvSub}
                    onChange={(e) => setSrvSub(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 7: TRAINING SECTION COPY
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "training_section" && (
            <section aria-labelledby="section-train-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-train-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Academy Training Section Copy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Edit promotional text for chip-level repair and hardware engineering programs.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="train-title" className="block text-xs font-bold text-slate-200">
                    Section Heading
                  </label>
                  <input
                    id="train-title"
                    type="text"
                    value={trainTitle}
                    onChange={(e) => setTrainTitle(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="train-sub" className="block text-xs font-bold text-slate-200">
                    Section Subtitle
                  </label>
                  <textarea
                    id="train-sub"
                    rows={2}
                    value={trainSub}
                    onChange={(e) => setTrainSub(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 8: INTERNSHIP SECTION COPY
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "internship_section" && (
            <section aria-labelledby="section-intern-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-intern-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Engineering Internships Section Copy
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Manage copy for university project sponsorships and engineering student enrollments.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="intern-title" className="block text-xs font-bold text-slate-200">
                    Section Heading
                  </label>
                  <input
                    id="intern-title"
                    type="text"
                    value={internTitle}
                    onChange={(e) => setInternTitle(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="intern-sub" className="block text-xs font-bold text-slate-200">
                    Section Subtitle
                  </label>
                  <textarea
                    id="intern-sub"
                    rows={2}
                    value={internSub}
                    onChange={(e) => setInternSub(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 9: HOMEPAGE FAQ ACCORDIONS
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "faq" && (
            <section aria-labelledby="section-faq-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-faq-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Frequently Asked Questions (FAQ) Accordions
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Manage common questions displayed on the storefront to increase customer conversion.
                  </p>
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                  {faqs.map((f, idx) => {
                    const isExpanded = expandedFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                            aria-expanded={isExpanded}
                            className="min-h-[44px] flex-1 text-left flex items-start gap-3 focus:outline-none"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-white">{f.q}</p>
                              {isExpanded ? (
                                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{f.a}</p>
                              ) : (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{f.a}</p>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                              aria-label={isExpanded ? `Collapse FAQ ${idx + 1}` : `Expand FAQ ${idx + 1}`}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              aria-label={`Delete FAQ item ${idx + 1}: ${f.q}`}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add FAQ form */}
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Add New FAQ Accordion</h3>
                  <input
                    type="text"
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    placeholder="Enter question headline..."
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    placeholder="Enter detailed answer copy..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    aria-label="Add new FAQ accordion"
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" /> Add FAQ Accordion
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 10: CONTACT NUMBERS & ADDRESS
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "contact_info" && (
            <section aria-labelledby="section-contact-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-contact-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Phone className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Storefront Contact Information &amp; Address
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Information displayed across customer support, footer widgets, and booking confirmations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone1" className="block text-xs font-bold text-slate-200">
                      Primary Support Phone
                    </label>
                    <input
                      id="contact-phone1"
                      type="tel"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone2" className="block text-xs font-bold text-slate-200">
                      Secondary Support Phone
                    </label>
                    <input
                      id="contact-phone2"
                      type="tel"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-bold text-slate-200">
                    Primary Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-address" className="block text-xs font-bold text-slate-200">
                    Head Office &amp; Service Center Address
                  </label>
                  <textarea
                    id="contact-address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              TAB 11: SOCIAL & SHARING LINKS
             ════════════════════════════════════════════════════════════════════════ */}
          {activeTab === "social" && (
            <section aria-labelledby="section-social-heading" className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/95 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 id="section-social-heading" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                    Social Media Channels &amp; Customer Feedback Forms
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Manage direct external social links, WhatsApp support, and survey redirects.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "soc-wa", label: "WhatsApp Direct URL", value: whatsapp, set: setWhatsapp, placeholder: "https://wa.me/918088979706" },
                    { id: "soc-ig", label: "Instagram Handle Link", value: instagram, set: setInstagram, placeholder: "https://instagram.com/nexbyte_technologies" },
                    { id: "soc-fb", label: "Facebook Page Link", value: facebook, set: setFacebook, placeholder: "https://facebook.com/nexbytetech" },
                    { id: "soc-yt", label: "YouTube Channel Link", value: youtube, set: setYoutube, placeholder: "https://youtube.com/@nexbytetech" },
                    { id: "soc-gf", label: "Google Feedback Form URL", value: googleForm, set: setGoogleForm, placeholder: "https://forms.gle/nexbyte-feedback" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label htmlFor={field.id} className="block text-xs font-bold text-slate-200">
                        {field.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={field.id}
                          type="url"
                          value={field.value}
                          onChange={(e) => field.set(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        {field.value && (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open test link for ${field.label}`}
                            className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
