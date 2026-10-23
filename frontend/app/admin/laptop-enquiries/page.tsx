"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Laptop,
  Search,
  Filter,
  Phone,
  MessageCircle,
  X,
  FileSpreadsheet,
  Save,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Send,
  Lock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  RefreshCw
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { getSafeImageSrc } from "@/lib/utils";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES } from "@/lib/enquiryCategories";

function LaptopEnquiriesContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams ? searchParams.get("id") : null;

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Detail Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [recommendedProductsList, setRecommendedProductsList] = useState<any[]>([]);
  const [showProductSelectorModal, setShowProductSelectorModal] = useState(false);
  const [savingEnquiry, setSavingEnquiry] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    const [enqList, prodList] = await Promise.all([
      dbHelper.laptopEnquiries.list(),
      dbHelper.products.list()
    ]);
    setEnquiries(enqList);
    setProductsCatalog(prodList);

    if (targetId) {
      const match = enqList.find(
        (e: any) =>
          e.id === targetId ||
          e.reference_id?.toLowerCase() === targetId.toLowerCase()
      );
      if (match) {
        handleOpenDetail(match);
      }
    }
  };

  useEffect(() => {
    loadData();
    let throttleTimer: any = null;
    const handler = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        loadData();
        throttleTimer = null;
      }, 1500);
    };
    window.addEventListener("nexbyte-realtime", handler);
    return () => {
      window.removeEventListener("nexbyte-realtime", handler);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [targetId]);

  const handleOpenDetail = (e: any) => {
    setSelectedEnquiry(e);
    setAdminReplyInput("");
    setInternalNoteInput("");
    setRecommendedProductsList(e.recommended_products || []);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await dbHelper.laptopEnquiries.update(id, { status: newStatus });
    loadData();
    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const handleSendCustomerReply = async () => {
    if (!selectedEnquiry || !adminReplyInput.trim()) return;
    setSendingReply(true);
    try {
      const updated = await dbHelper.laptopEnquiries.addMessage(selectedEnquiry.id, {
        sender: "admin",
        sender_name: "NexLapTech Tech Expert",
        text: adminReplyInput.trim(),
        is_internal: false,
      });
      setAdminReplyInput("");
      setSelectedEnquiry(updated);
      loadData();
    } catch (err: any) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!selectedEnquiry || !internalNoteInput.trim()) return;
    setSendingReply(true);
    try {
      const updated = await dbHelper.laptopEnquiries.addMessage(selectedEnquiry.id, {
        sender: "admin",
        sender_name: "Staff Internal Note",
        text: internalNoteInput.trim(),
        is_internal: true,
      });
      setInternalNoteInput("");
      setSelectedEnquiry(updated);
      loadData();
    } catch (err: any) {
      alert("Failed to save note: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveDetailModal = async () => {
    if (!selectedEnquiry) return;
    setSavingEnquiry(true);
    try {
      await dbHelper.laptopEnquiries.update(selectedEnquiry.id, {
        status: selectedEnquiry.status,
        recommended_products: recommendedProductsList,
      });
      loadData();
      setSelectedEnquiry(null);
    } catch (err) {
      alert("Failed to update enquiry.");
    } finally {
      setSavingEnquiry(false);
    }
  };

  const handleToggleRecommendProduct = (prod: any) => {
    setRecommendedProductsList((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      if (exists) {
        return prev.filter((p) => p.id !== prod.id);
      } else {
        return [...prev, {
          id: prod.id,
          title: prod.title,
          price: prod.price,
          image: prod.image,
          category: prod.category,
          specs: prod.specs
        }];
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this tech enquiry permanently?")) {
      await dbHelper.laptopEnquiries.delete(id);
      loadData();
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(null);
      }
    }
  };

  // Filtered enquiries
  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch =
        !q ||
        (e.customer_name || "").toLowerCase().includes(q) ||
        (e.phone || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.reference_id || "").toLowerCase().includes(q) ||
        (e.product_name || e.laptop_type || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q);

      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [enquiries, debouncedSearch, categoryFilter, statusFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No enquiry records to export.");
      return;
    }
    const headers = ["Reference ID", "Customer Name", "Phone", "Email", "City", "Category", "Product/Service", "Budget", "Quantity", "Status", "Date"];
    const rows = filtered.map((e) => [
      `"${e.reference_id || e.id}"`,
      `"${(e.customer_name || "").replace(/"/g, '""')}"`,
      `"${e.phone || ""}"`,
      `"${e.email || ""}"`,
      `"${e.city || ""}"`,
      `"${e.category || "laptop_purchase"}"`,
      `"${(e.product_name || e.laptop_type || "").replace(/"/g, '""')}"`,
      `"${e.budget || ""}"`,
      `"${e.quantity || "1"}"`,
      `"${e.status || "new"}"`,
      `"${new Date(e.created_at || Date.now()).toISOString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NexLapTech_Enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-nex-blueLight" />
            Centralized Enquiry &amp; Lead Management
          </h1>
          <p className="text-xs text-nex-mist mt-1">
            Manage customer requests across all 18 categories: laptops, custom PC builds, SSD/RAM upgrades, replacement parts, repairs, and corporate IT AMC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-2"
            title="Export filtered records to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadData}
            className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5 text-nex-blueLight" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Enquiries", val: enquiries.length, color: "text-white" },
          { label: "New Unreviewed", val: enquiries.filter((e) => e.status === "new").length, color: "text-blue-400" },
          { label: "In Discussion / Replied", val: enquiries.filter((e) => ["reviewed", "replied", "quotation_sent"].includes(e.status)).length, color: "text-amber-400" },
          { label: "Converted / Closed", val: enquiries.filter((e) => ["converted", "closed"].includes(e.status)).length, color: "text-emerald-400" },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-3.5 rounded-xl border border-white/5 bg-nex-ink/80">
            <span className="text-[10px] uppercase font-bold text-nex-mist">{stat.label}</span>
            <div className={`text-xl font-display font-bold mt-1 ${stat.color}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 bg-nex-ink flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nex-mist" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ref ID, customer name, phone, or product requirement..."
            className="w-full rounded-xl bg-nex-black border border-white/10 pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl bg-nex-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Categories ({enquiries.length})</option>
            {ENQUIRY_CATEGORIES.map((cat) => {
              const count = enquiries.filter((e) => e.category === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.shortLabel} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl bg-nex-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none font-bold"
          >
            <option value="all">All Statuses</option>
            {ENQUIRY_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 bg-nex-ink space-y-2">
          <Layers className="h-8 w-8 text-nex-mist mx-auto" />
          <p className="text-xs text-white font-semibold">No enquiries found matching current filters.</p>
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); }}
            className="text-[11px] text-nex-blueLight hover:underline font-bold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 bg-nex-ink overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-nex-mist font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Customer &amp; Phone</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Requirement / Specs</th>
                  <th className="py-3 px-4">Budget / Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {paginated.map((e) => {
                  const catInfo = ENQUIRY_CATEGORIES.find((c) => c.id === e.category) || {
                    shortLabel: "Enquiry"
                  };
                  const cleanPhone = (e.phone || "").replace(/\D/g, "");

                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-nex-blueLight">
                        {e.reference_id || e.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{e.customer_name}</div>
                        <div className="text-[11px] text-nex-mist flex items-center gap-1.5 mt-0.5">
                          <span>{e.phone}</span>
                          {e.city && <span className="text-[10px] opacity-75">• {e.city}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/90">
                          {catInfo.shortLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">
                          {e.product_name || e.laptop_type || "Technical Requirement"}
                        </div>
                        <div className="text-[10px] text-nex-mist truncate mt-0.5">
                          {e.specs || e.message || "No additional specs"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-amber-300 font-bold">{e.budget || "Unspecified"}</div>
                        <div className="text-[10px] text-nex-mist">{e.quantity || "1 Unit"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(e.status || "new")}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-nex-mist">
                        {new Date(e.created_at || Date.now()).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(e)}
                            className="p-1.5 rounded-lg bg-nex-blue/20 text-nex-blueLight hover:bg-nex-blue/30 border border-nex-blue/30"
                            title="View & Reply to Enquiry"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${e.customer_name}, regarding your NexLapTech enquiry ${e.reference_id || e.id} for ${e.product_name || e.laptop_type}...`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                              title="Message via WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                            title="Delete Enquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-white/10 flex items-center justify-between text-xs text-nex-mist">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-white px-2">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enquiry Detail & Communication Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => !savingEnquiry && setSelectedEnquiry(null)} />

          <div className="glass-panel relative w-full max-w-4xl overflow-y-auto max-h-[92vh] rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue sm:p-8 z-10 space-y-6">
            <button
              onClick={() => !savingEnquiry && setSelectedEnquiry(null)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-nex-blueLight bg-nex-blue/10 px-2 py-0.5 rounded border border-nex-blue/20">
                  {selectedEnquiry.reference_id || selectedEnquiry.id}
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-1">
                  {selectedEnquiry.product_name || selectedEnquiry.laptop_type || "Technical Enquiry Details"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedEnquiry.status)}
              </div>
            </div>

            {/* Customer Contact & Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <div>
                <span className="text-[10px] text-nex-mist uppercase block font-bold">Customer Name</span>
                <span className="font-bold text-white text-sm">{selectedEnquiry.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-nex-mist uppercase block font-bold">Phone Number</span>
                <a href={`tel:${selectedEnquiry.phone}`} className="font-bold text-nex-blueLight hover:underline">
                  {selectedEnquiry.phone}
                </a>
              </div>
              <div>
                <span className="text-[10px] text-nex-mist uppercase block font-bold">Location</span>
                <span className="font-bold text-white">{selectedEnquiry.city || "Tumkur / Bengaluru Hub"}</span>
              </div>
            </div>

            {/* Workflow Status Selector */}
            <div className="p-4 rounded-xl bg-nex-black/60 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-white block">Workflow Progression:</span>
              <div className="flex flex-wrap gap-2">
                {ENQUIRY_STATUSES.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => handleStatusChange(selectedEnquiry.id, st.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedEnquiry.status === st.value
                        ? "bg-nex-blue text-white border-white/30 shadow-glow-blue"
                        : "bg-white/5 text-nex-mist border-white/5 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Thread & Communication */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-nex-blueLight" />
                <span>Conversation &amp; Audit Thread</span>
              </h4>

              <div className="rounded-xl bg-black/40 border border-white/10 p-4 max-h-60 overflow-y-auto space-y-3">
                {Array.isArray(selectedEnquiry.messages) && selectedEnquiry.messages.length > 0 ? (
                  selectedEnquiry.messages.map((m: any, idx: number) => {
                    const isInternal = Boolean(m.is_internal);
                    const isAdmin = m.sender === "admin";

                    return (
                      <div
                        key={m.id || idx}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          isInternal
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-200"
                            : isAdmin
                            ? "bg-nex-blue/20 border border-nex-blue/40 text-blue-100 ml-6"
                            : "bg-white/[0.04] border border-white/10 text-white mr-6"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold opacity-80">
                          <span className="flex items-center gap-1.5">
                            {isInternal && <Lock className="h-3 w-3 text-amber-400" />}
                            {isInternal ? "Internal Staff Note" : isAdmin ? "NexLapTech Admin Reply" : (selectedEnquiry.customer_name || "Customer")}
                          </span>
                          <span>{new Date(m.timestamp || Date.now()).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-nex-mist text-xs">
                    Initial requirement: &ldquo;{selectedEnquiry.message || selectedEnquiry.requirements || "Details submitted"}&rdquo;
                  </div>
                )}
              </div>

              {/* Action Forms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 1. Customer-Visible Reply */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Reply to Customer (Public)</span>
                    <span className="text-[10px] text-nex-mist font-normal">Visible on Tracking Portal</span>
                  </label>
                  <textarea
                    rows={2}
                    value={adminReplyInput}
                    onChange={(e) => setAdminReplyInput(e.target.value)}
                    placeholder="Type quote details, component availability, or delivery timeframe..."
                    className="w-full rounded-lg bg-nex-black border border-white/10 p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleSendCustomerReply}
                    disabled={sendingReply || !adminReplyInput.trim()}
                    className="btn-primary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5 ml-auto"
                  >
                    <Send className="h-3 w-3" /> Send Reply
                  </button>
                </div>

                {/* 2. Staff Internal Note */}
                <div className="p-3.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 space-y-2">
                  <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private Internal Note</span>
                    <span className="text-[10px] text-amber-400/70 font-normal">Admins Only</span>
                  </label>
                  <textarea
                    rows={2}
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Log phone discussion, supplier cost, or technician assignment..."
                    className="w-full rounded-lg bg-nex-black border border-amber-500/30 p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleAddInternalNote}
                    disabled={sendingReply || !internalNoteInput.trim()}
                    className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 ml-auto"
                  >
                    <Save className="h-3 w-3" /> Save Note
                  </button>
                </div>
              </div>
            </div>

            {/* Recommend Products Strip */}
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-nex-blueLight">Recommended Hardware from Inventory</h4>
                  <p className="text-[11px] text-nex-mist mt-0.5">Attach catalog products as proposed solutions for this customer.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductSelectorModal(true)}
                  className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Attach Product
                </button>
              </div>

              {recommendedProductsList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendedProductsList.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-white/5 p-1 flex items-center justify-center shrink-0 border border-white/5">
                          <img src={getSafeImageSrc(p.image)} alt={p.title} className="object-contain max-h-full max-w-full" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs truncate max-w-[160px]">{p.title}</div>
                          <div className="text-[10px] text-nex-blueLight font-semibold">₹{(p.price ?? 0).toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRecommendProduct(p)}
                        className="text-rose-400 hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="btn-secondary !py-2 !px-4"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveDetailModal}
                disabled={savingEnquiry}
                className="btn-primary !py-2 !px-6 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {savingEnquiry ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Selector Modal */}
      {showProductSelectorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowProductSelectorModal(false)} />
          <div className="glass-panel relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-nex-ink p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-base font-bold text-white">Select Product to Attach</h3>
              <button onClick={() => setShowProductSelectorModal(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {productsCatalog.map((prod) => {
                const isSelected = recommendedProductsList.some((p) => p.id === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleRecommendProduct(prod)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-nex-blueLight bg-nex-blue/20 ring-1 ring-nex-blueLight/50"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-white/5 p-1 flex items-center justify-center shrink-0">
                        <img src={getSafeImageSrc(prod.image)} alt={prod.title} className="object-contain max-h-full max-w-full" />
                      </div>
                      <div className="truncate max-w-[140px]">
                        <div className="text-xs font-bold text-white truncate">{prod.title}</div>
                        <div className="text-[10px] text-nex-mist">₹{(prod.price ?? 0).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-nex-blueLight shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLaptopEnquiriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-white">Loading Enquiries Dashboard...</div>}>
      <LaptopEnquiriesContent />
    </Suspense>
  );
}
