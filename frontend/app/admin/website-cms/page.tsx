"use client";

import { useEffect, useState } from "react";
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

const TABS: { key: CMSSectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "business_info", label: "Business & GSTIN", icon: <Building2 className="h-4 w-4" /> },
  { key: "hero", label: "Hero Banner", icon: <LayoutTemplate className="h-4 w-4" /> },
  { key: "seo", label: "SEO & Metas", icon: <Tag className="h-4 w-4" /> },
  { key: "banners", label: "Promo Banners", icon: <ImageIcon className="h-4 w-4" /> },
  { key: "products_section", label: "Products Copy", icon: <Sliders className="h-4 w-4" /> },
  { key: "services_section", label: "Services Copy", icon: <Sliders className="h-4 w-4" /> },
  { key: "training_section", label: "Training Copy", icon: <Sliders className="h-4 w-4" /> },
  { key: "internship_section", label: "Internships Copy", icon: <Sliders className="h-4 w-4" /> },
  { key: "faq", label: "Homepage FAQ", icon: <HelpCircle className="h-4 w-4" /> },
  { key: "contact_info", label: "Contact Numbers", icon: <Phone className="h-4 w-4" /> },
  { key: "social", label: "Social & Sharing", icon: <Share2 className="h-4 w-4" /> },
];

export default function AdminWebsiteCMS() {
  const [activeTab, setActiveTab] = useState<CMSSectionKey>("business_info");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Business Information & GSTIN fields
  const [businessName, setBusinessName] = useState("NexLapTech — NexByte Technologies");
  const [gstin, setGstin] = useState("29ABCDE1234F1Z5");
  const [gstinError, setGstinError] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");
  const [logoUrl, setLogoUrl] = useState("/assets/nexlaptech-logo.png");
  const [invoiceFooter, setInvoiceFooter] = useState("Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems");

  // Hero fields
  const [heroHeadline, setHeroHeadline] = useState("Premium IT Solutions — NexLapTech");
  const [heroSubheadline, setHeroSubheadline] = useState("Laptops, Gaming PCs, Servers, Accessories, Repairs & Academy Training.");
  const [heroCTA, setHeroCTA] = useState("Explore Products");
  const [heroSecondaryCTA, setHeroSecondaryCTA] = useState("Book a Service");

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("NexLapTech — Hardware, Repairs & IT Training");
  const [metaDescription, setMetaDescription] = useState("NexLapTech offers premium laptops, gaming PCs, servers, bulk hardware supply, CCTV installation, software support, and IT academy training in Tamil Nadu.");
  const [metaKeywords, setMetaKeywords] = useState("laptop repair, gaming PC, computer service, bulk supply, IT training, CCTV installation, NexLapTech");
  const [ogImage, setOgImage] = useState("/images/poster-products.png");

  // Banners
  const [banners, setBanners] = useState<any[]>([]);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

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

  // Contact Info
  const [phone1, setPhone1] = useState("+91 8088979706");
  const [phone2, setPhone2] = useState("+91 8904760125");
  const [email, setEmail] = useState("nexbytetechnologies@gmail.com");
  const [address, setAddress] = useState("");

  // Social
  const [whatsapp, setWhatsapp] = useState("https://wa.me/919876543210");
  const [instagram, setInstagram] = useState("https://instagram.com/nexbyte_technologies");
  const [facebook, setFacebook] = useState("https://facebook.com/nexbytetech");
  const [youtube, setYoutube] = useState("https://youtube.com/@nexbytetech");
  const [googleForm, setGoogleForm] = useState("https://forms.gle/nexbyte-feedback");

  const loadCMSData = async () => {
    setLoading(true);
    try {
      const data = await dbHelper.cmsContent.get();
      if (data) {
        if (data.business_info) {
          setBusinessName(data.business_info.businessName || "NexLapTech — NexByte Technologies");
          setGstin(data.business_info.gstin || "29ABCDE1234F1Z5");
          setRegisteredAddress(data.business_info.registeredAddress || "No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101");
          setLogoUrl(data.business_info.logoUrl || "/assets/nexlaptech-logo.png");
          setInvoiceFooter(data.business_info.invoiceFooter || "Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware • CCTV Systems");
        }
        if (data.hero) {
          setHeroHeadline(data.hero.headline || "");
          setHeroSubheadline(data.hero.subheadline || "");
          setHeroCTA(data.hero.cta || "");
          setHeroSecondaryCTA(data.hero.secondary_cta || "");
        }
        if (data.seo) {
          setMetaTitle(data.seo.title || "");
          setMetaDescription(data.seo.description || "");
          setMetaKeywords(data.seo.keywords || "");
          setOgImage(data.seo.og_image || "");
        }
        if (data.banners) {
          setBanners(data.banners || []);
        }
        if (data.products_section) {
          setProdTitle(data.products_section.title || "");
          setProdSub(data.products_section.subtitle || "");
        }
        if (data.services_section) {
          setSrvTitle(data.services_section.title || "");
          setSrvSub(data.services_section.subtitle || "");
        }
        if (data.training_section) {
          setTrainTitle(data.training_section.title || "");
          setTrainSub(data.training_section.subtitle || "");
        }
        if (data.internship_section) {
          setInternTitle(data.internship_section.title || "");
          setInternSub(data.internship_section.subtitle || "");
        }
        if (data.faq) {
          setFaqs(data.faq || []);
        }
        if (data.contact_info) {
          setPhone1(data.contact_info.phone1 || "");
          setPhone2(data.contact_info.phone2 || "");
          setEmail(data.contact_info.email || "");
          setAddress(data.contact_info.address || "");
        }
        if (data.social) {
          setWhatsapp(data.social.whatsapp || "");
          setInstagram(data.social.instagram || "");
          setFacebook(data.social.facebook || "");
          setYoutube(data.social.youtube || "");
          setGoogleForm(data.social.googleForm || "");
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCMSData();
    window.addEventListener("nexbyte-realtime", loadCMSData);
    return () => window.removeEventListener("nexbyte-realtime", loadCMSData);
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

    try {
      await Promise.all([
        dbHelper.cmsContent.update("business_info", {
          businessName: businessName.trim(),
          gstin: gstin.trim().toUpperCase(),
          registeredAddress: registeredAddress.trim(),
          phone1: phone1.trim(),
          phone2: phone2.trim(),
          email: email.trim(),
          logoUrl: logoUrl.trim(),
          invoiceFooter: invoiceFooter.trim(),
        }),
        dbHelper.cmsContent.update("hero", { headline: heroHeadline, subheadline: heroSubheadline, cta: heroCTA, secondary_cta: heroSecondaryCTA }),
        dbHelper.cmsContent.update("seo", { title: metaTitle, description: metaDescription, keywords: metaKeywords, og_image: ogImage }),
        dbHelper.cmsContent.update("banners", banners),
        dbHelper.cmsContent.update("products_section", { title: prodTitle, subtitle: prodSub }),
        dbHelper.cmsContent.update("services_section", { title: srvTitle, subtitle: srvSub }),
        dbHelper.cmsContent.update("training_section", { title: trainTitle, subtitle: trainSub }),
        dbHelper.cmsContent.update("internship_section", { title: internTitle, subtitle: internSub }),
        dbHelper.cmsContent.update("faq", faqs),
        dbHelper.cmsContent.update("contact_info", { phone1, phone2, email, address }),
        dbHelper.cmsContent.update("social", { whatsapp, instagram, facebook, youtube, googleForm }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save changes.");
    }
  };

  const toggleBanner = (id: number) => {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const handleAddFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setFaqs((prev) => [...prev, { q: newQ, a: newA }]);
    setNewQ("");
    setNewA("");
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-nex-blueLight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Website CMS</h1>
          <p className="text-xs text-nex-mist mt-0.5">Control homepage copy, SEO metadata, promotional banners, and contact information.</p>
        </div>
        <button
          onClick={handleSave}
          className={`btn-primary !py-2.5 !px-5 text-xs flex items-center gap-1.5 transition-all ${saved ? "bg-green-500" : ""}`}
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved!" : "Save All Changes"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap border-b border-white/[0.06] pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-nex-blue/20 border border-nex-blue/30 text-nex-blueLight"
                : "text-nex-mist hover:text-white"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Business Information & GSTIN ─── */}
      {activeTab === "business_info" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-cyan-400" /> Authorized Business Information &amp; GSTIN CMS
              </h2>
              <p className="text-xs text-nex-mist mt-0.5">
                Configurable corporate identity, GSTIN registration, tax invoice footer, and contact channels displayed on customer invoices and About portals.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Business Profile
            </span>
          </div>

          {gstinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{gstinError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs text-white/80 font-semibold">Business Legal / Display Name *</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. NexLapTech — NexByte Technologies"
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/80 font-semibold flex items-center justify-between">
                <span>Official GSTIN Registration No. *</span>
                <span className="text-[10px] text-cyan-400 font-mono">15-char Alpha-numeric</span>
              </label>
              <input
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (gstinError) setGstinError("");
                }}
                maxLength={15}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-cyan-400/50 uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-semibold">Registered Office &amp; Service Center Address</label>
            <textarea
              value={registeredAddress}
              onChange={(e) => setRegisteredAddress(e.target.value)}
              rows={2}
              placeholder="e.g. No. 14, 1st Floor, Near Bus Stand, Tumkur, Karnataka 572101"
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400/50 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-white/80 font-semibold">Support Phone 1</label>
              <input
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/80 font-semibold">Support Phone 2</label>
              <input
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/80 font-semibold">Official Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-semibold">Brand Logo Asset URL</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/assets/nexlaptech-logo.png"
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/80 font-semibold">Tax Invoice Footer Terms &amp; Disclaimer</label>
            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              rows={2}
              placeholder="e.g. Thank you for choosing NexLapTech! Computers • Laptop Service • Gaming PCs • Bulk IT Hardware"
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400/50 resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ─── Hero / Homepage ─── */}
      {activeTab === "hero" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Homepage Hero Section</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Main Headline</label>
            <input
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Sub-headline / Tagline</label>
            <textarea
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 font-semibold">Primary CTA Button</label>
              <input
                value={heroCTA}
                onChange={(e) => setHeroCTA(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 font-semibold">Secondary CTA Button</label>
              <input
                value={heroSecondaryCTA}
                onChange={(e) => setHeroSecondaryCTA(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── SEO ─── */}
      {activeTab === "seo" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">SEO & Meta Tags</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Page Title Tag</label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Keywords (comma-separated)</label>
            <input
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Open Graph Image URL</label>
            <input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ─── Banners ─── */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <p className="text-xs text-nex-mist">Manage the rotating promotional banners displayed on the homepage.</p>
          {banners.length === 0 ? (
            <div className="text-center py-6 glass-panel rounded-2xl">
              <p className="text-xs text-nex-mist">No active banners. Set banners in mock or Supabase table.</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className={`glass-panel bg-nex-ink border rounded-2xl p-5 transition-all ${
                  banner.enabled ? "border-white/5" : "border-white/[0.02] opacity-50"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {editingBanner?.id === banner.id ? (
                      <>
                        <input
                          value={editingBanner.title}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none"
                          placeholder="Banner headline"
                        />
                        <input
                          value={editingBanner.subtitle}
                          onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none"
                          placeholder="Banner subtext"
                        />
                        <input
                          value={editingBanner.cta}
                          onChange={(e) => setEditingBanner({ ...editingBanner, cta: e.target.value })}
                          className="w-48 rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none"
                          placeholder="CTA button text"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setBanners((prev) => prev.map((b) => b.id === banner.id ? editingBanner : b));
                              setEditingBanner(null);
                            }}
                            className="btn-primary !py-1.5 !px-4 text-[10px]"
                          >
                            Save Banner
                          </button>
                          <button onClick={() => setEditingBanner(null)} className="btn-secondary !py-1.5 !px-4 text-[10px]">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-white text-sm">{banner.title}</h3>
                        <p className="text-[11px] text-nex-mist">{banner.subtitle}</p>
                        <span className="inline-block rounded-full border border-nex-blue/30 bg-nex-blue/10 px-3 py-0.5 text-[10px] text-nex-blueLight font-semibold">
                          CTA: {banner.cta}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-nex-mist">{banner.enabled ? "Live" : "Hidden"}</span>
                      <div
                        onClick={() => toggleBanner(banner.id)}
                        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                          banner.enabled ? "bg-nex-blue" : "bg-white/10"
                        }`}
                      >
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          banner.enabled ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </div>
                    </label>
                    {editingBanner?.id !== banner.id && (
                      <button
                        onClick={() => setEditingBanner({ ...banner })}
                        className="text-[10px] text-nex-mist hover:text-white underline"
                      >
                        Edit text
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Products Config ─── */}
      {activeTab === "products_section" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Homepage Products Section Copy</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Title</label>
            <input
              value={prodTitle}
              onChange={(e) => setProdTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Subtitle</label>
            <textarea
              value={prodSub}
              onChange={(e) => setProdSub(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── Services Config ─── */}
      {activeTab === "services_section" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Homepage Services Section Copy</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Title</label>
            <input
              value={srvTitle}
              onChange={(e) => setSrvTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Subtitle</label>
            <textarea
              value={srvSub}
              onChange={(e) => setSrvSub(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── Training Config ─── */}
      {activeTab === "training_section" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Academy Training Section Copy</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Title</label>
            <input
              value={trainTitle}
              onChange={(e) => setTrainTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Subtitle</label>
            <textarea
              value={trainSub}
              onChange={(e) => setTrainSub(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── Internship Config ─── */}
      {activeTab === "internship_section" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Internships Section Copy</h2>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Title</label>
            <input
              value={internTitle}
              onChange={(e) => setInternTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Section Subtitle</label>
            <textarea
              value={internSub}
              onChange={(e) => setInternSub(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── FAQs ─── */}
      {activeTab === "faq" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Homepage FAQ Accordions</h2>
          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white">Q: {f.q}</p>
                  <p className="text-[11px] text-nex-mist mt-1">A: {f.a}</p>
                </div>
                <button onClick={() => handleRemoveFaq(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-white">Add FAQ Accordion</h3>
            <input
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              placeholder="Question headline..."
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
            <textarea
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              placeholder="Answer detail copy..."
              rows={2}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
            <button
              onClick={handleAddFaq}
              className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Add FAQ
            </button>
          </div>
        </div>
      )}

      {/* ─── Contact Info ─── */}
      {activeTab === "contact_info" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Contact Info & Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/80 font-semibold">Primary Phone</label>
              <input
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/80 font-semibold">Secondary Phone</label>
              <input
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Primary Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/80 font-semibold">Head Office Address Text</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── Social / Sharing ─── */}
      {activeTab === "social" && (
        <div className="glass-panel bg-nex-ink border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white">Social Media Links</h2>
          {[
            { label: "WhatsApp Direct URL", value: whatsapp, set: setWhatsapp },
            { label: "Instagram Handle Link", value: instagram, set: setInstagram },
            { label: "Facebook Page Link", value: facebook, set: setFacebook },
            { label: "YouTube Channel Link", value: youtube, set: setYoutube },
            { label: "Google Feedback Form URL", value: googleForm, set: setGoogleForm },
          ].map((field) => (
            <div key={field.label} className="space-y-1">
              <label className="text-xs text-white/80 font-semibold">{field.label}</label>
              <input
                type="url"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
