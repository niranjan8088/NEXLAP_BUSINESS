"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Laptop,
  Send,
  CheckCircle2,
  RefreshCw,
  Cpu,
  HardDrive,
  ShieldCheck,
  Clock,
  MessageSquare,
  ArrowRight,
  Wrench,
  Battery,
  Plug,
  Zap,
  Building,
  Package,
  Layers,
  ChevronDown
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES } from "@/lib/enquiryCategories";

export default function CustomerLaptopEnquiryPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("laptop_purchase");

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [budget, setBudget] = useState("₹30,000 – ₹40,000");
  const [quantity, setQuantity] = useState("1 Unit");
  const [message, setMessage] = useState("");

  // Category specific fields
  const [productName, setProductName] = useState("");
  const [brandPref, setBrandPref] = useState("Lenovo");
  const [laptopType, setLaptopType] = useState("Business Laptop");
  const [processor, setProcessor] = useState("Intel Core i5 / AMD Ryzen 5");
  const [ram, setRam] = useState("16GB DDR4");
  const [storage, setStorage] = useState("512GB NVMe SSD");
  const [gpu, setGpu] = useState("Integrated / Shared");
  const [deviceModel, setDeviceModel] = useState("");
  const [orgName, setOrgName] = useState("");

  // Conversation follow-up state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const currentCategoryConfig = ENQUIRY_CATEGORIES.find((c) => c.id === selectedCategory) || ENQUIRY_CATEGORIES[0];

  useEffect(() => {
    fetchProfileAndEnquiries();
  }, []);

  useEffect(() => {
    if (currentCategoryConfig.defaultBudgetOptions?.length > 0) {
      setBudget(currentCategoryConfig.defaultBudgetOptions[0]);
    }
  }, [selectedCategory]);

  const fetchProfileAndData = async () => {
    try {
      const profRes = await safeJsonFetch("/api/customer/profile");
      if (profRes.ok && profRes.data?.profile) {
        const p = profRes.data.profile;
        setCustomerName(p.full_name || p.name || "");
        setPhone(p.phone || "");
        setEmail(p.email || "");
        if (p.city) setCity(p.city);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await safeJsonFetch("/api/laptop-enquiries");
      if (res.ok && res.data?.enquiries) {
        setEnquiries(res.data.enquiries);
      } else {
        setEnquiries([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAndEnquiries = async () => {
    await fetchProfileAndData();
    await fetchEnquiries();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const computedProductName = productName.trim() || currentCategoryConfig.label;
      const specsSummary = [
        deviceModel ? `Model: ${deviceModel}` : null,
        brandPref ? `Brand: ${brandPref}` : null,
        processor ? `CPU: ${processor}` : null,
        ram ? `RAM: ${ram}` : null,
        storage ? `Storage: ${storage}` : null,
        gpu && gpu !== "None" ? `GPU: ${gpu}` : null,
        orgName ? `Org: ${orgName}` : null,
      ].filter(Boolean).join(" | ");

      const payload = {
        name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        category: selectedCategory,
        product_name: computedProductName,
        laptop_type: computedProductName,
        budget,
        quantity,
        brand_preference: brandPref,
        processor_preference: processor,
        ram_preference: ram,
        storage_preference: storage,
        gpu_preference: gpu,
        specs: specsSummary,
        message: message.trim() || `Requirement for ${computedProductName} within ${budget} (${specsSummary || "Standard"})`,
      };

      const res = await safeJsonFetch("/api/laptop-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/customer/signin?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!res.ok || !res.data?.success) {
        throw new Error(res.data?.message || res.error || "Failed to submit enquiry.");
      }

      setSuccessMsg(`Enquiry submitted successfully! Reference ID: ${res.data.referenceId || "Generated"}. Our technical specialists will review and reply shortly.`);
      setMessage("");
      setProductName("");
      setDeviceModel("");
      await fetchEnquiries();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUp = async (enquiryId: string) => {
    const text = replyTextMap[enquiryId]?.trim();
    if (!text) return;

    setReplyingId(enquiryId);
    try {
      const res = await safeJsonFetch("/api/laptop-enquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: enquiryId,
          message: text,
        }),
      });

      if (res.ok && res.data?.success) {
        setReplyTextMap((prev) => ({ ...prev, [enquiryId]: "" }));
        await fetchEnquiries();
      } else {
        alert(res.data?.message || "Failed to send message.");
      }
    } catch (err) {
      alert("Error sending message.");
    } finally {
      setReplyingId(null);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const s = ENQUIRY_STATUSES.find((st) => st.value === statusValue) || {
      label: statusValue,
      color: "text-blue-700 bg-blue-50 border-blue-200"
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] p-6 sm:p-8 text-[#111827] dark:text-white shadow-xs">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] dark:bg-[#1E1638] border border-[#4F46E5]/20 dark:border-[#7C5CFF]/30 px-3 py-1 text-xs font-bold text-[#4F46E5] dark:text-[#7C5CFF]">
            <Layers className="h-4 w-4" /> Comprehensive Tech Requirements Hub
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hardware, Component &amp; Service Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#A1A1AA] max-w-3xl font-medium leading-relaxed">
            Submit your requirements for laptops, custom gaming PCs, SSD/RAM upgrades, replacement parts, repairs, CCTV, or corporate IT procurement. NexLapTech hardware engineers match certified inventory with doorstep quotes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requirement Form */}
        <div className="lg:col-span-2 rounded-3xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0D0D0F] p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="font-display text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-[#4F46E5] dark:text-[#7C5CFF]" />
            <span>Submit Your Technical Requirement</span>
          </h2>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-800 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                Enquiry Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white font-medium focus:outline-none"
                >
                  {ENQUIRY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#A1A1AA]">
                {currentCategoryConfig.description}
              </p>
            </div>

            {/* 2. Customer Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                  Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anand@example.com"
                  className="w-full rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                  City / Service Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Tumkur, Mysuru"
                  className="w-full rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Conditional Category Fields */}
            <div className="p-4 rounded-2xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4F46E5] dark:text-[#7C5CFF] block">
                Specification &amp; Workload Details
              </span>

              {/* Group A: Laptop */}
              {currentCategoryConfig.fieldGroup === "laptop" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Laptop Use Type</label>
                    <select
                      value={laptopType}
                      onChange={(e) => setLaptopType(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    >
                      <option value="Business Laptop">Business / Office Laptop</option>
                      <option value="High Performance Gaming">Gaming Laptop (RTX Graphics)</option>
                      <option value="Student / Everyday">Student / Coding Laptop</option>
                      <option value="Slim Ultrabook">Thin &amp; Light Ultrabook</option>
                      <option value="Workstation Laptop">Mobile Workstation (AutoCAD / 3D)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Preferred Brand</label>
                    <select
                      value={brandPref}
                      onChange={(e) => setBrandPref(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    >
                      <option value="Lenovo">Lenovo (ThinkPad / Yoga)</option>
                      <option value="Dell">Dell (Latitude / XPS / Alienware)</option>
                      <option value="HP">HP (EliteBook / Omen)</option>
                      <option value="Apple">Apple MacBook (M1 / M2 / M3)</option>
                      <option value="Asus">Asus (ROG / ZenBook)</option>
                      <option value="Any Reliable Brand">Any Top Brand / Best Value</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">RAM Memory</label>
                    <select
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    >
                      <option value="8GB">8GB RAM</option>
                      <option value="16GB">16GB RAM (Recommended)</option>
                      <option value="32GB">32GB RAM</option>
                      <option value="64GB">64GB RAM</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Storage Capacity</label>
                    <select
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    >
                      <option value="256GB SSD">256GB NVMe SSD</option>
                      <option value="512GB SSD">512GB NVMe SSD (Standard)</option>
                      <option value="1TB SSD">1TB NVMe SSD</option>
                      <option value="2TB SSD">2TB NVMe SSD</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Group B: Custom PC & Desktop */}
              {currentCategoryConfig.fieldGroup === "custom_pc" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Target PC Purpose</label>
                    <input
                      type="text"
                      placeholder="e.g. 1440p Gaming, 4K Video Editing, Office"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Processor Preference</label>
                    <select
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    >
                      <option value="Intel Core i5 / Ryzen 5">Intel Core i5 / AMD Ryzen 5</option>
                      <option value="Intel Core i7 / Ryzen 7">Intel Core i7 / AMD Ryzen 7</option>
                      <option value="Intel Core i9 / Ryzen 9">Intel Core i9 / AMD Ryzen 9</option>
                      <option value="Suggest Best CPU">Suggest Best Value CPU for Budget</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Graphics Card (GPU)</label>
                    <input
                      type="text"
                      placeholder="e.g. RTX 4060, RTX 4070 Ti, Radeon 7800 XT, or Integrated"
                      value={gpu}
                      onChange={(e) => setGpu(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">RAM &amp; Storage</label>
                    <input
                      type="text"
                      placeholder="e.g. 32GB DDR5 + 1TB Gen4 NVMe"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Group C: Components / SSD / RAM */}
              {currentCategoryConfig.fieldGroup === "component" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Component Name / Model</label>
                    <input
                      type="text"
                      placeholder="e.g. 1TB Samsung 980 Pro / Corsair 16GB DDR4 3200MHz"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Existing Device To Upgrade</label>
                    <input
                      type="text"
                      placeholder="e.g. Dell Inspiron 5593 / Custom Desktop"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Group D: Charger & Battery & Parts */}
              {currentCategoryConfig.fieldGroup === "charger_battery" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Laptop Brand &amp; Exact Model Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lenovo ThinkPad T480s / Dell XPS 13 9300"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Power / Wattage or Part Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. 65W Type-C Charger, 45W Round Pin, 57Wh Battery"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Group E: Repair & Service */}
              {currentCategoryConfig.fieldGroup === "repair" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Device Make &amp; Model</label>
                    <input
                      type="text"
                      placeholder="e.g. HP Pavilion 15 / Apple MacBook Pro 2020"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Issue / Fault Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. No display, liquid spill, slow boot, battery not charging"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Group F: B2B & Bulk */}
              {currentCategoryConfig.fieldGroup === "b2b" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Company / Institution Name</label>
                    <input
                      type="text"
                      placeholder="e.g. NexByte Infotech Ltd."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Requirement Details</label>
                    <input
                      type="text"
                      placeholder="e.g. 20 Laptops for Sales Team / Annual Office IT AMC"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Group G: General */}
              {currentCategoryConfig.fieldGroup === "general" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Requested Hardware or Solution</label>
                  <input
                    type="text"
                    placeholder="e.g. 4-Channel 1080p CCTV Setup / Gigabit Wi-Fi 6 Router"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                  />
                </div>
              )}

              {/* Budget & Quantity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Budget Range</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                  >
                    {currentCategoryConfig.defaultBudgetOptions?.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#475467] dark:text-[#98A2B3]">Quantity Required</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 1 Unit, 5 Units, 20 Laptops"
                    className="w-full rounded-xl bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-2 text-xs text-[#111827] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 4. Detailed Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#344054] dark:text-[#D0D5DD]">
                Additional Instructions or Questions
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention specific brand preferences, required ports, software you use, delivery urgency..."
                className="w-full rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3.5 py-2.5 text-xs text-[#111827] dark:text-white focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary !px-6 !py-3 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Submitting Enquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Requirement to Engineers</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Enquiries History & Threaded Communication */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#4F46E5] dark:text-[#7C5CFF]" />
              <span>My Enquiries &amp; Quotes</span>
            </h2>
            <button
              onClick={fetchEnquiries}
              className="text-[11px] font-semibold text-[#4F46E5] dark:text-[#7C5CFF] hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#667085] dark:text-[#A1A1AA]">
              Loading enquiries...
            </div>
          ) : enquiries.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0D0D0F] p-6 text-center text-xs text-[#667085] dark:text-[#A1A1AA] space-y-2">
              <Package className="h-8 w-8 mx-auto text-[#98A2B3]" />
              <p className="font-bold">No previous enquiries submitted.</p>
              <p className="text-[11px]">Submit your first tech requirement to receive matched specs and quotes.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
              {enquiries.map((enq) => {
                const catInfo = ENQUIRY_CATEGORIES.find((c) => c.id === enq.category) || {
                  label: enq.category || "General Tech",
                  shortLabel: "Enquiry"
                };
                const messagesList = Array.isArray(enq.messages) ? enq.messages : [];

                return (
                  <div
                    key={enq.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#0D0D0F] p-4 text-xs space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[10px] font-extrabold text-[#4F46E5] dark:text-[#7C5CFF]">
                          {enq.reference_id || enq.id}
                        </div>
                        <h3 className="font-bold text-[#111827] dark:text-white mt-0.5">
                          {enq.product_name || enq.laptop_type || catInfo.label}
                        </h3>
                      </div>
                      {getStatusBadge(enq.status || "new")}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#667085] dark:text-[#A1A1AA]">
                      <span className="rounded-md bg-[#F2F4F7] dark:bg-[#1E1E22] px-2 py-0.5 font-medium">
                        {catInfo.shortLabel}
                      </span>
                      <span>Budget: {enq.budget}</span>
                      <span>•</span>
                      <span>{new Date(enq.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
                    </div>

                    {/* Conversation Messages */}
                    {messagesList.length > 0 && (
                      <div className="rounded-xl bg-[#F7F8FC] dark:bg-[#151518] p-3 space-y-2 border border-[#E5E7EB] dark:border-[#27272A]">
                        <span className="text-[10px] font-bold text-[#667085] dark:text-[#98A2B3] uppercase tracking-wider block">
                          Discussion History
                        </span>
                        <div className="space-y-2">
                          {messagesList.map((m: any, mIdx: number) => {
                            const isAdmin = m.sender === "admin";
                            return (
                              <div
                                key={m.id || mIdx}
                                className={`p-2.5 rounded-xl text-[11px] ${
                                  isAdmin
                                    ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200"
                                    : "bg-white dark:bg-[#0D0D0F] border border-[#E5E7EB] dark:border-[#27272A] text-[#344054] dark:text-[#D0D5DD]"
                                }`}
                              >
                                <div className="flex justify-between items-center text-[9px] font-bold mb-1 opacity-75">
                                  <span>{isAdmin ? "NexLapTech Specialist" : "You"}</span>
                                  <span>{new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="leading-relaxed">{m.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Message Input */}
                    <div className="flex gap-2 pt-1 border-t border-[#E5E7EB] dark:border-[#27272A]">
                      <input
                        type="text"
                        placeholder="Reply to NexLapTech team..."
                        value={replyTextMap[enq.id] || ""}
                        onChange={(e) => setReplyTextMap((prev) => ({ ...prev, [enq.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendFollowUp(enq.id); }}
                        className="flex-1 rounded-xl bg-[#F7F8FC] dark:bg-[#151518] border border-[#E5E7EB] dark:border-[#27272A] px-3 py-1.5 text-xs text-[#111827] dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSendFollowUp(enq.id)}
                        disabled={replyingId === enq.id}
                        className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        {replyingId === enq.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
