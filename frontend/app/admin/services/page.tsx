"use client";

import { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  Wrench,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Laptop,
  Monitor,
  Cpu,
  Wifi,
  Video,
  HardDrive,
  Code,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  FileText,
  DollarSign,
  AlertCircle,
  Star,
  Activity,
  UserCheck,
  Building,
  Shield,
  Tag,
  Zap,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";

// ─── TECHNICIANS ROSTER ───────────────────────────────────────────────────────
const AUTHORIZED_TECHNICIANS = [
  { id: "tech-1", name: "Niranjan M.", role: "Lead Chip-Level Specialist", phone: "+91 8088979706" },
  { id: "tech-2", name: "Ramesh Kumar", role: "Senior Laptop Hardware Tech", phone: "+91 8904760125" },
  { id: "tech-3", name: "Suresh Nair", role: "Motherboard & BGA Specialist", phone: "+91 9845012345" },
  { id: "tech-4", name: "Anand Verma", role: "Network, LAN & CCTV Engineer", phone: "+91 9741098765" },
  { id: "tech-5", name: "Priya Sharma", role: "OS, Software & Data Recovery", phone: "+91 9632054321" },
];

// ─── SERVICE CATEGORIES ───────────────────────────────────────────────────────
const SERVICE_CATEGORIES = [
  { val: "all", label: "All Categories" },
  { val: "repairs", label: "Laptop & PC Repairs" },
  { val: "upgrades", label: "SSD & RAM Upgrades" },
  { val: "hardware", label: "Hardware & Component Replacement" },
  { val: "software", label: "Software & Windows Installation" },
  { val: "networking", label: "Networking & WiFi Solutions" },
  { val: "cctv", label: "CCTV Installation & Repair" },
  { val: "data", label: "Data Recovery & Backup" },
  { val: "amc", label: "Business IT Support (AMC)" },
];

// ─── PIPELINE STATUS CONFIG ──────────────────────────────────────────────────
const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  new: {
    label: "New Enquiry",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  },
  confirmed: {
    label: "Admin Confirmed",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  },
  assigned: {
    label: "Technician Assigned",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  },
  quality_check: {
    label: "Quality Check",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
  },
  completed: {
    label: "Repaired & Ready",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  },
  delivered: {
    label: "Delivered / Handed Over",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    badge: "bg-teal-500/10 text-teal-400 border border-teal-500/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
  },
};

// Map icon name to Lucide component
function renderServiceIcon(name?: string, className = "h-5 w-5") {
  switch ((name || "").toLowerCase()) {
    case "laptop": return <Laptop className={className} />;
    case "cpu":
    case "monitor": return <Monitor className={className} />;
    case "wifi":
    case "networking": return <Wifi className={className} />;
    case "video":
    case "cctv": return <Video className={className} />;
    case "harddrive":
    case "storage": return <HardDrive className={className} />;
    case "terminal":
    case "code": return <Code className={className} />;
    case "amc":
    case "building": return <Building className={className} />;
    default: return <Wrench className={className} />;
  }
}

export default function AdminServicesManager() {
  const [activeTab, setActiveTab] = useState<"services" | "bookings">("services");
  const [loading, setLoading] = useState(false);

  // ── Services Catalog State ──
  const [services, setServices] = useState<any[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const deferredServiceSearch = useDeferredValue(serviceSearch);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [servicePage, setServicePage] = useState(1);
  const [servicePageSize, setServicePageSize] = useState(15);

  // ── Bookings & Workflow State ──
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const deferredBookingSearch = useDeferredValue(bookingSearch);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPageSize, setBookingPageSize] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Service Add / Edit Modal ──
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [srvTitle, setSrvTitle] = useState("");
  const [srvDescription, setSrvDescription] = useState("");
  const [srvCategory, setSrvCategory] = useState("repairs");
  const [srvPrice, setSrvPrice] = useState("1500");
  const [srvDuration, setSrvDuration] = useState("2-4 Hours");
  const [srvWarranty, setSrvWarranty] = useState("90 Days Service Warranty");
  const [srvServiceType, setSrvServiceType] = useState<"both" | "carry_in" | "on_site">("both");
  const [srvIconName, setSrvIconName] = useState("Laptop");
  const [srvSupportedBrands, setSrvSupportedBrands] = useState("Dell, Lenovo, HP, Apple, Asus, Acer, Custom Rig");
  const [srvFeatures, setSrvFeatures] = useState("Component testing, Genuine parts, 90-Day repair warranty");

  // ── Booking Workflow Drawer / Modal ──
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingStatus, setBookingStatus] = useState("new");
  const [assignedTechnician, setAssignedTechnician] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [labourCharge, setLabourCharge] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [customerUpdateMsg, setCustomerUpdateMsg] = useState("");
  const [savingBooking, setSavingBooking] = useState(false);

  // ── Loaders ──
  const loadServices = async () => {
    try {
      const list = await dbHelper.services.list();
      setServices(list || []);
    } catch (err) {
      console.error("Failed to load services:", err);
    }
  };

  const loadBookings = async () => {
    try {
      const list = await dbHelper.bookings.list();
      setBookings(list || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadServices(), loadBookings()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
    const handleRealtime = () => {
      loadServices();
      loadBookings();
    };
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, []);

  // ── Services Filter & Calculation ──
  const serviceCounts = useMemo(() => ({
    all: services.length,
    enabled: services.filter((s) => s.status !== "disabled").length,
    disabled: services.filter((s) => s.status === "disabled").length,
  }), [services]);

  const filteredServices = useMemo(() => {
    const q = deferredServiceSearch.trim().toLowerCase();
    return services.filter((s) => {
      if (q) {
        const titleMatch = (s.title || "").toLowerCase().includes(q);
        const descMatch = (s.description || "").toLowerCase().includes(q);
        const catMatch = (s.category || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      if (serviceCategoryFilter !== "all") {
        const cat = (s.category || "").toLowerCase();
        if (!cat.includes(serviceCategoryFilter.toLowerCase())) return false;
      }
      if (serviceStatusFilter === "enabled" && s.status === "disabled") return false;
      if (serviceStatusFilter === "disabled" && s.status !== "disabled") return false;
      return true;
    });
  }, [services, deferredServiceSearch, serviceCategoryFilter, serviceStatusFilter]);

  const serviceTotalPages = Math.max(1, Math.ceil(filteredServices.length / servicePageSize));
  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * servicePageSize;
    return filteredServices.slice(start, start + servicePageSize);
  }, [filteredServices, servicePage, servicePageSize]);

  // ── Bookings Filter & Calculation ──
  const bookingCounts = useMemo(() => ({
    all: bookings.length,
    new: bookings.filter((b) => b.status === "new" || !b.status).length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    assigned: bookings.filter((b) => b.status === "assigned").length,
    in_progress: bookings.filter((b) => b.status === "in_progress" || b.status === "progress").length,
    quality_check: bookings.filter((b) => b.status === "quality_check").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    delivered: bookings.filter((b) => b.status === "delivered").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings]);

  const filteredBookings = useMemo(() => {
    const q = deferredBookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      if (q) {
        const idMatch = (b.bookingId || b.id || "").toLowerCase().includes(q);
        const nameMatch = (b.customerName || b.customer_name || "").toLowerCase().includes(q);
        const phoneMatch = (b.phone || "").toLowerCase().includes(q);
        const srvMatch = (b.productName || b.service_name || "").toLowerCase().includes(q);
        const techMatch = (b.technician || b.assignedTo || "").toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !srvMatch && !techMatch) return false;
      }
      if (bookingStatusFilter !== "all") {
        if (bookingStatusFilter === "new") {
          if (b.status !== "new" && b.status) return false;
        } else if (b.status !== bookingStatusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, deferredBookingSearch, bookingStatusFilter]);

  const bookingTotalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingPageSize));
  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * bookingPageSize;
    return filteredBookings.slice(start, start + bookingPageSize);
  }, [filteredBookings, bookingPage, bookingPageSize]);

  // Reset pages on search/filter changes
  useEffect(() => { setServicePage(1); }, [deferredServiceSearch, serviceCategoryFilter, serviceStatusFilter]);
  useEffect(() => { setBookingPage(1); }, [deferredBookingSearch, bookingStatusFilter]);

  // ── Services Handlers ──
  const handleOpenAddService = () => {
    setEditingService(null);
    setSrvTitle("");
    setSrvDescription("");
    setSrvCategory("repairs");
    setSrvPrice("1500");
    setSrvDuration("2-4 Hours");
    setSrvWarranty("90 Days Service Warranty");
    setSrvServiceType("both");
    setSrvIconName("Laptop");
    setSrvSupportedBrands("Dell, Lenovo, HP, Apple, Asus, Acer, Custom Rig");
    setSrvFeatures("Component testing, Genuine parts, 90-Day repair warranty");
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: any) => {
    setEditingService(s);
    setSrvTitle(s.title || "");
    setSrvDescription(s.description || "");
    setSrvCategory(s.category || "repairs");
    setSrvPrice(String(s.price ?? 1500));
    setSrvDuration(s.duration || "2-4 Hours");
    setSrvWarranty(s.warranty || "90 Days Service Warranty");
    setSrvServiceType(s.serviceType || "both");
    setSrvIconName(s.iconName || "Laptop");
    setSrvSupportedBrands(Array.isArray(s.supportedBrands) ? s.supportedBrands.join(", ") : (s.supportedBrands || "All Major Brands"));
    setSrvFeatures(Array.isArray(s.features) ? s.features.join(", ") : (s.features || ""));
    setIsServiceModalOpen(true);
  };

  const handleToggleServiceStatus = async (s: any) => {
    const nextStatus = s.status === "disabled" ? "enabled" : "disabled";
    // Optimistic UI update (<16ms)
    setServices((prev) => prev.map((item) => (item.id === s.id ? { ...item, status: nextStatus } : item)));
    try {
      await dbHelper.services.update(s.id, { status: nextStatus });
    } catch {
      loadServices();
    }
  };

  const handleDeleteService = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete service offering "${title}"?`)) {
      await dbHelper.services.delete(id);
      loadServices();
    }
  };

  const handleServiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim() || !srvPrice) return;

    const payload = {
      title: srvTitle.trim(),
      description: srvDescription.trim(),
      category: srvCategory,
      price: Number(srvPrice),
      duration: srvDuration,
      warranty: srvWarranty,
      serviceType: srvServiceType,
      iconName: srvIconName,
      supportedBrands: srvSupportedBrands.split(",").map((b) => b.trim()).filter(Boolean),
      features: srvFeatures.split(",").map((f) => f.trim()).filter(Boolean),
      status: editingService ? editingService.status : "enabled",
    };

    if (editingService) {
      await dbHelper.services.update(editingService.id, payload);
    } else {
      await dbHelper.services.create(payload);
    }

    setIsServiceModalOpen(false);
    setEditingService(null);
    loadServices();
  };

  // ── Booking Workflow Handlers ──
  const handleOpenBookingManage = (booking: any) => {
    setSelectedBooking(booking);
    setBookingStatus(booking.status || "new");
    setAssignedTechnician(booking.technician || booking.assignedTo || "");
    setEstimatedCompletion(booking.estimatedCompletion || "");
    setLabourCharge(String(booking.labourCharge ?? booking.servicePrice ?? ""));
    setPartsCost(String(booking.partsCost ?? ""));
    setAdminNotes(booking.notes || "");
    setCustomerUpdateMsg(booking.replyMessage || "");
    setIsBookingModalOpen(true);
  };

  const handleSaveBookingWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSavingBooking(true);

    try {
      const labour = Number(labourCharge || 0);
      const parts = Number(partsCost || 0);
      const totalAmount = labour + parts;
      const now = new Date().toISOString();

      const timeline = Array.isArray(selectedBooking.timeline) ? [...selectedBooking.timeline] : [];
      if (bookingStatus !== selectedBooking.status) {
        timeline.push({
          status: bookingStatus,
          timestamp: now,
          message: `Status transitioned to ${BOOKING_STATUS_CONFIG[bookingStatus]?.label || bookingStatus}`,
          by: "Admin",
        });
      }
      if (assignedTechnician && assignedTechnician !== selectedBooking.technician) {
        timeline.push({
          status: bookingStatus,
          timestamp: now,
          message: `Assigned to technician: ${assignedTechnician}`,
          by: "Admin",
        });
      }
      if (customerUpdateMsg && customerUpdateMsg !== selectedBooking.replyMessage) {
        timeline.push({
          status: bookingStatus,
          timestamp: now,
          message: `Notice to customer: "${customerUpdateMsg}"`,
          by: "Admin",
        });
      }

      const updates = {
        status: bookingStatus,
        technician: assignedTechnician,
        assignedTo: assignedTechnician,
        estimatedCompletion,
        labourCharge: labour,
        partsCost: parts,
        totalAmount,
        notes: adminNotes,
        replyMessage: customerUpdateMsg,
        replyDate: now,
        timeline,
        updatedAt: now,
        updated_at: now,
      };

      await dbHelper.bookings.update(selectedBooking.id, updates);

      // Realtime notification dispatch
      if (bookingStatus !== selectedBooking.status || customerUpdateMsg) {
        try {
          await dispatchPipelineEvent({
            eventType: (bookingStatus === "completed" ? "SERVICE_COMPLETED" : bookingStatus === "in_progress" ? "SERVICE_IN_PROGRESS" : "SERVICE_CONFIRMED") as any,
            title: `Service Status: ${BOOKING_STATUS_CONFIG[bookingStatus]?.label || bookingStatus}`,
            message: customerUpdateMsg || `Your booking ${selectedBooking.bookingId || selectedBooking.id} is now ${bookingStatus.replace("_", " ")}.`,
            recipientRole: "user",
            recipientUserId: selectedBooking.user_id || undefined,
            referenceType: "booking",
            referenceId: selectedBooking.bookingId || selectedBooking.id,
            actorRole: "admin",
          });
        } catch {}
      }

      setIsBookingModalOpen(false);
      loadBookings();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update booking workflow.");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard?.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => {
      setCopiedId((curr) => (curr === idText ? null : curr));
    }, 1500);
  };

  return (
    <div className="admin-services space-y-6 max-w-full overflow-x-hidden">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-nex-blue/10 border border-nex-blue/20 text-nex-blueLight flex items-center justify-center shadow-xs shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                IT Services &amp; Diagnostics Management
              </h1>
              <p className="text-xs text-nex-mist mt-0.5">
                Repair catalog, technician assignment pipeline, hardware diagnostic tracking &amp; customer AMC support.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="btn-secondary !py-2.5 !px-3.5 text-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            aria-label="Refresh service records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-nex-blue" : ""}`} />
            <span>Refresh</span>
          </button>

          {activeTab === "services" && (
            <button
              type="button"
              onClick={handleOpenAddService}
              className="btn-primary !py-2.5 !px-4 text-xs flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer shadow-glow-blue"
              aria-label="Register new service offering"
            >
              <PlusCircle className="h-4 w-4" /> Add Service Profile
            </button>
          )}
        </div>
      </div>

      {/* ── TABS NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
            activeTab === "services"
              ? "bg-nex-blue text-white shadow-glow-blue"
              : "text-nex-mist hover:text-white hover:bg-white/5"
          }`}
          aria-label="Open Services Catalog Tab"
          aria-selected={activeTab === "services"}
        >
          <Layers className="h-4 w-4" />
          <span>Services Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
            {serviceCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
            activeTab === "bookings"
              ? "bg-nex-blue text-white shadow-glow-blue"
              : "text-nex-mist hover:text-white hover:bg-white/5"
          }`}
          aria-label="Open Service Bookings & Technician Workflow Tab"
          aria-selected={activeTab === "bookings"}
        >
          <Calendar className="h-4 w-4" />
          <span>Service Bookings &amp; Technician Pipeline</span>
          {bookingCounts.new > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-extrabold animate-pulse">
              {bookingCounts.new} NEW
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-white font-bold">
              {bookingCounts.all}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: SERVICES CATALOG & PRICING ───────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "services" && (
        <div className="space-y-4">
          
          {/* Search & Category Filter Strip */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-nex-ink space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              
              {/* Search input with clear button */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nex-mist pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search service title, description, or brands..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full rounded-xl bg-nex-black border border-white/10 pl-10 pr-9 py-2.5 text-xs text-white placeholder-nex-mist/60 focus:outline-none focus:border-nex-blue transition-colors min-h-[44px]"
                  aria-label="Search service catalog"
                />
                {serviceSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-nex-mist hover:text-white rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category dropdown */}
              <div className="w-full sm:w-auto">
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="w-full sm:w-60 rounded-xl bg-nex-black border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-nex-blue cursor-pointer min-h-[44px]"
                  aria-label="Filter services by category"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.val} value={c.val}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status pills strip */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              {[
                { id: "all", label: `All Services (${serviceCounts.all})` },
                { id: "enabled", label: `Active on Store (${serviceCounts.enabled})` },
                { id: "disabled", label: `Disabled (${serviceCounts.disabled})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setServiceStatusFilter(pill.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] flex items-center shrink-0 ${
                    serviceStatusFilter === pill.id
                      ? "bg-nex-blue text-white shadow-glow-blue font-bold"
                      : "text-nex-mist hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
                  }`}
                  aria-label={`Filter by ${pill.label}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 bg-nex-ink space-y-3">
              <Wrench className="h-10 w-10 text-nex-mist mx-auto opacity-50" />
              <p className="text-sm font-semibold text-white">No service offerings match your filters.</p>
              <p className="text-xs text-nex-mist max-w-sm mx-auto">
                Try searching with different terms, selecting &quot;All Categories&quot;, or adding a new service offering.
              </p>
              {(serviceSearch || serviceCategoryFilter !== "all" || serviceStatusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setServiceSearch("");
                    setServiceCategoryFilter("all");
                    setServiceStatusFilter("all");
                  }}
                  className="btn-secondary !py-2 !px-4 text-xs mt-2 min-h-[44px] cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 1. Mobile Cards Layout (< 1024px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3.5">
                {paginatedServices.map((s) => {
                  const isEnabled = s.status !== "disabled";
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-white/10 bg-nex-ink hover:border-white/20 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Header: Icon + Title + Status Switch */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-xl bg-nex-blue/10 border border-nex-blue/20 text-nex-blueLight flex items-center justify-center shrink-0">
                              {renderServiceIcon(s.iconName)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-xs text-white leading-snug">
                                {s.title}
                              </h3>
                              <span className="text-[10px] text-nex-mist capitalize block mt-0.5">
                                {s.category || "General Repairs"}
                              </span>
                            </div>
                          </div>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleServiceStatus(s)}
                            className={`min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors ${
                              isEnabled ? "text-emerald-400" : "text-rose-400 opacity-60"
                            }`}
                            aria-label={`Toggle status for ${s.title}`}
                            title={isEnabled ? "Service Active on Website" : "Service Disabled"}
                          >
                            {isEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                          </button>
                        </div>

                        {/* Description */}
                        {s.description && (
                          <p className="text-[11px] text-nex-mist leading-relaxed line-clamp-2">
                            {s.description}
                          </p>
                        )}

                        {/* Pricing & Duration Strip */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-[10px] text-nex-mist block">Base Charge</span>
                            <span className="font-bold text-white text-sm">
                              Rs. {(s.price ?? 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-nex-mist block">Estimated Duration</span>
                            <span className="font-semibold text-nex-blueLight text-xs">
                              {s.duration || "2-4 Hours"}
                            </span>
                          </div>
                        </div>

                        {/* Badges: Supported Brands / On-site / Warranty */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 font-medium">
                            {s.serviceType === "on_site" ? "Doorstep Only" : s.serviceType === "carry_in" ? "Carry-in Depot" : "Carry-in & Doorstep"}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-emerald-400 font-medium flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> {s.warranty || "90-Day Warranty"}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isEnabled ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isEnabled ? "● Published Online" : "○ Hidden from Public"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(s)}
                            className="min-h-[44px] px-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                            aria-label={`Edit ${s.title}`}
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(s.id, s.title)}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer"
                            aria-label={`Delete ${s.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop Table Layout (>= 1024px) */}
              <div className="hidden lg:block glass-panel rounded-2xl border border-white/5 bg-nex-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-white border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01] text-nex-mist font-semibold">
                        <th className="py-3 px-5">Service Offering</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Fee / Pricing</th>
                        <th className="py-3 px-4">Duration &amp; Warranty</th>
                        <th className="py-3 px-4">Store Visibility</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedServices.map((s) => {
                        const isEnabled = s.status !== "disabled";
                        return (
                          <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                            {/* Service Offering */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-nex-blue/10 border border-nex-blue/20 text-nex-blueLight flex items-center justify-center shrink-0">
                                  {renderServiceIcon(s.iconName)}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{s.title}</div>
                                  <div className="text-[10px] text-nex-mist max-w-[280px] truncate mt-0.5">
                                    {s.description || "Diagnostics and tested hardware service."}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-4 px-4 font-medium text-white/80 capitalize">
                              {s.category || "General Repairs"}
                            </td>

                            {/* Price */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-sm">
                                Rs. {(s.price ?? 0).toLocaleString("en-IN")}
                              </div>
                              <div className="text-[10px] text-nex-mist">Tax invoice included</div>
                            </td>

                            {/* Duration & Warranty */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-nex-blueLight">{s.duration || "2-4 Hours"}</div>
                              <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> {s.warranty || "90-Day Warranty"}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleServiceStatus(s)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                                  isEnabled
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                }`}
                                aria-label={`Toggle publish state for ${s.title}`}
                              >
                                {isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                <span>{isEnabled ? "Published" : "Disabled"}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditService(s)}
                                className="h-8 w-8 rounded-full bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 inline-flex items-center justify-center text-white cursor-pointer"
                                aria-label={`Edit ${s.title}`}
                                title="Edit Service Configuration"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteService(s.id, s.title)}
                                className="h-8 w-8 rounded-full bg-red-500/10 border border-transparent hover:border-red-500/20 hover:bg-red-500/20 inline-flex items-center justify-center text-red-400 cursor-pointer"
                                aria-label={`Delete ${s.title}`}
                                title="Delete Service Configuration"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-nex-mist">
                <div>
                  Showing {Math.min((servicePage - 1) * servicePageSize + 1, filteredServices.length)} to{" "}
                  {Math.min(servicePage * servicePageSize, filteredServices.length)} of {filteredServices.length} service profiles
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setServicePage((p) => Math.max(1, p - 1))}
                    disabled={servicePage === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Previous services page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-white bg-nex-blue/20 rounded-lg">
                    Page {servicePage} of {serviceTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setServicePage((p) => Math.min(serviceTotalPages, p + 1))}
                    disabled={servicePage === serviceTotalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Next services page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SERVICE BOOKINGS & TECHNICIAN WORKFLOW ───────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">New Enquiries</span>
              <span className="font-display text-2xl font-bold text-white">{bookingCounts.new}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Assigned / In Progress</span>
              <span className="font-display text-2xl font-bold text-white">{bookingCounts.assigned + bookingCounts.in_progress}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Repaired &amp; Completed</span>
              <span className="font-display text-2xl font-bold text-white">{bookingCounts.completed}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">Delivered to Clients</span>
              <span className="font-display text-2xl font-bold text-white">{bookingCounts.delivered}</span>
            </div>
          </div>

          {/* Search & Status Pipeline Strip */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-nex-ink space-y-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nex-mist pointer-events-none" />
              <input
                type="text"
                placeholder="Search booking ID, customer name, phone, or technician..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full rounded-xl bg-nex-black border border-white/10 pl-10 pr-9 py-2.5 text-xs text-white placeholder-nex-mist/60 focus:outline-none focus:border-nex-blue transition-colors min-h-[44px]"
                aria-label="Search bookings by name, id, or phone"
              />
              {bookingSearch && (
                <button
                  type="button"
                  onClick={() => setBookingSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-nex-mist hover:text-white rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Pipeline Status Buttons Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs whitespace-nowrap">
              {[
                { id: "all", label: `All Requests (${bookingCounts.all})` },
                { id: "new", label: `New (${bookingCounts.new})` },
                { id: "confirmed", label: `Confirmed (${bookingCounts.confirmed})` },
                { id: "assigned", label: `Assigned (${bookingCounts.assigned})` },
                { id: "in_progress", label: `In Progress (${bookingCounts.in_progress})` },
                { id: "quality_check", label: `Quality Check (${bookingCounts.quality_check})` },
                { id: "completed", label: `Completed (${bookingCounts.completed})` },
                { id: "delivered", label: `Delivered (${bookingCounts.delivered})` },
                { id: "cancelled", label: `Cancelled (${bookingCounts.cancelled})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setBookingStatusFilter(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] flex items-center shrink-0 ${
                    bookingStatusFilter === pill.id
                      ? "bg-nex-blue text-white shadow-glow-blue font-bold"
                      : pill.id === "new" && bookingCounts.new > 0
                      ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                      : "text-nex-mist hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
                  }`}
                  aria-label={`Filter by ${pill.label}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings View */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 bg-nex-ink space-y-3">
              <Calendar className="h-10 w-10 text-nex-mist mx-auto opacity-50" />
              <p className="text-sm font-semibold text-white">No service bookings match your filter criteria.</p>
              <p className="text-xs text-nex-mist max-w-sm mx-auto">
                Customer bookings submitted via the website automatically populate here.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Mobile Cards Layout (< 1024px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3.5">
                {paginatedBookings.map((b) => {
                  const statusKey = b.status || "new";
                  const statusConf = BOOKING_STATUS_CONFIG[statusKey] || BOOKING_STATUS_CONFIG.new;
                  const refId = b.bookingId || b.id;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-white/10 bg-nex-ink hover:border-white/20 transition-all space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: ID + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyId(refId)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-nex-blueLight bg-nex-blue/10 border border-nex-blue/20 px-2 py-0.5 rounded cursor-pointer hover:bg-nex-blue/20"
                            title="Click to copy Reference ID"
                            aria-label={`Copy reference ID ${refId}`}
                          >
                            {copiedId === refId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{refId}</span>
                          </button>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConf.badge}`}>
                            {statusConf.label}
                          </span>
                        </div>

                        {/* Customer & Service Info */}
                        <div>
                          <h3 className="font-semibold text-xs text-white leading-snug">
                            {b.customerName || b.customer_name || "Customer"}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-nex-mist mt-0.5">
                            <Phone className="h-3 w-3 text-nex-blueLight" />
                            <a href={`tel:${b.phone}`} className="hover:text-white underline">{b.phone || "No phone"}</a>
                            {b.city && <span>&bull; {b.city}</span>}
                          </div>
                        </div>

                        {/* Service Item & Remarks */}
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-nex-blueLight" />
                            <span>{b.productName || b.service_name || "Hardware Repair"}</span>
                          </div>
                          {(b.description || b.message || b.notes) && (
                            <p className="text-[10px] text-nex-mist line-clamp-2">
                              {b.description || b.message || b.notes}
                            </p>
                          )}
                        </div>

                        {/* Assigned Technician & Date */}
                        <div className="flex items-center justify-between text-[11px] text-nex-mist pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-white font-medium">
                              {b.technician || b.assignedTo ? b.technician || b.assignedTo : "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{b.preferredDate || b.booking_date || b.createdAt?.split("T")[0] || "Today"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenBookingManage(b)}
                        className="w-full btn-primary !py-2.5 text-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-glow-blue"
                        aria-label={`Manage booking ${refId}`}
                      >
                        <UserCheck className="h-4 w-4" /> Manage &amp; Assign Tech
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop Table Layout (>= 1024px) */}
              <div className="hidden lg:block glass-panel rounded-2xl border border-white/5 bg-nex-ink overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-white border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01] text-nex-mist font-semibold">
                        <th className="py-3 px-5">Ref ID &amp; Customer</th>
                        <th className="py-3 px-4">Service Requested</th>
                        <th className="py-3 px-4">Assigned Tech</th>
                        <th className="py-3 px-4">Scheduled Date</th>
                        <th className="py-3 px-4">Status Pipeline</th>
                        <th className="py-3 px-5 text-right">Workflow Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((b) => {
                        const statusKey = b.status || "new";
                        const statusConf = BOOKING_STATUS_CONFIG[statusKey] || BOOKING_STATUS_CONFIG.new;
                        const refId = b.bookingId || b.id;

                        return (
                          <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                            {/* Ref ID & Customer */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-nex-blueLight font-bold">
                                  {refId}
                                </span>
                              </div>
                              <div className="font-semibold text-white mt-0.5">
                                {b.customerName || b.customer_name || "Customer"}
                              </div>
                              <div className="text-[10px] text-nex-mist">
                                <a href={`tel:${b.phone}`} className="hover:text-white underline">{b.phone}</a>
                                {b.city && ` • ${b.city}`}
                              </div>
                            </td>

                            {/* Service Requested */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white max-w-[220px] truncate">
                                {b.productName || b.service_name || "Hardware Repair"}
                              </div>
                              <div className="text-[10px] text-nex-mist max-w-[220px] truncate mt-0.5">
                                {b.description || b.message || b.notes || "Standard hardware diagnostic"}
                              </div>
                            </td>

                            {/* Assigned Tech */}
                            <td className="py-4 px-4">
                              {b.technician || b.assignedTo ? (
                                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold inline-flex items-center gap-1.5">
                                  <UserCheck className="h-3 w-3" /> {b.technician || b.assignedTo}
                                </span>
                              ) : (
                                <span className="text-[11px] text-nex-mist italic">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            {/* Scheduled Date */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white">
                                {b.preferredDate || b.booking_date || "Immediate"}
                              </div>
                              <div className="text-[10px] text-nex-mist">
                                {b.preferredTime || b.booking_time || "10:30 AM"}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${statusConf.badge}`}>
                                {statusConf.label}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-4 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenBookingManage(b)}
                                className="min-h-[38px] px-3.5 rounded-xl bg-nex-blue/10 border border-nex-blue/20 hover:bg-nex-blue/20 text-nex-blueLight text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                aria-label={`Manage booking ${refId}`}
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Manage &amp; Assign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-nex-mist">
                <div>
                  Showing {Math.min((bookingPage - 1) * bookingPageSize + 1, filteredBookings.length)} to{" "}
                  {Math.min(bookingPage * bookingPageSize, filteredBookings.length)} of {filteredBookings.length} booking records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                    disabled={bookingPage === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Previous bookings page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-white bg-nex-blue/20 rounded-lg">
                    Page {bookingPage} of {bookingTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setBookingPage((p) => Math.min(bookingTotalPages, p + 1))}
                    disabled={bookingPage === bookingTotalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    aria-label="Next bookings page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── SERVICE ADD / EDIT MODAL ────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsServiceModalOpen(false)} />

          <div className="glass-panel relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-nex-ink shadow-glow-blue overflow-hidden z-10">
            
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-nex-ink shrink-0">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  {editingService ? "Edit Service Parameters" : "Register IT Service Profile"}
                </h3>
                <p className="text-[11px] text-nex-mist mt-0.5">
                  Configure repair descriptions, pricing, turnaround estimates, and device compatibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close service modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleServiceFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Service Name *</label>
                <input
                  type="text"
                  required
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="e.g. Broken Screen Replacement"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-nex-blue min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Service Description *</label>
                <textarea
                  required
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  placeholder="Outline hardware diagnosis protocols, replacement procedures, and quality checks..."
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-nex-blue resize-none"
                />
              </div>

              {/* Pricing, Duration, Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Base Fee (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Turnaround Time</label>
                  <input
                    type="text"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    placeholder="e.g. 2-4 Hours / Same-Day"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Category</label>
                  <select
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    {SERVICE_CATEGORIES.filter((c) => c.val !== "all").map((c) => (
                      <option key={c.val} value={c.val}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Type & Icon Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Service Delivery Mode</label>
                  <select
                    value={srvServiceType}
                    onChange={(e) => setSrvServiceType(e.target.value as any)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    <option value="both">Both Carry-in &amp; Doorstep</option>
                    <option value="carry_in">Carry-in Depot Only</option>
                    <option value="on_site">On-Site Doorstep Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Warranty Policy</label>
                  <input
                    type="text"
                    value={srvWarranty}
                    onChange={(e) => setSrvWarranty(e.target.value)}
                    placeholder="e.g. 90 Days Service Warranty"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Supported Brands */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Supported Brands / Devices (comma-separated)</label>
                <input
                  type="text"
                  value={srvSupportedBrands}
                  onChange={(e) => setSrvSupportedBrands(e.target.value)}
                  placeholder="Dell, Lenovo, HP, Apple, Asus, Acer, Custom Rig"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Key Features */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Key Deliverables &amp; Features (comma-separated)</label>
                <input
                  type="text"
                  value={srvFeatures}
                  onChange={(e) => setSrvFeatures(e.target.value)}
                  placeholder="Hardware diagnostic, Genuine replacement, Clean thermal paste"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-6 p-4 border-t border-white/10 bg-nex-ink/95 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="btn-secondary !py-2.5 !px-5 min-h-[44px] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary !py-2.5 !px-6 min-h-[44px] text-xs font-bold shadow-glow-blue cursor-pointer"
                >
                  {editingService ? "Update Service Profile" : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── BOOKING MANAGEMENT & TECHNICIAN ASSIGNMENT DRAWER / MODAL ──────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isBookingModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsBookingModalOpen(false)} />

          <div className="glass-panel relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-nex-ink shadow-glow-blue overflow-hidden z-10">
            
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-nex-ink shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-nex-blueLight bg-nex-blue/10 px-2 py-0.5 rounded">
                    {selectedBooking.bookingId || selectedBooking.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    BOOKING_STATUS_CONFIG[bookingStatus]?.badge || ""
                  }`}>
                    {BOOKING_STATUS_CONFIG[bookingStatus]?.label || bookingStatus}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white mt-1">
                  Manage Service Booking &amp; Technician Assignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close booking modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSaveBookingWorkflow} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* Customer & Device Information Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-nex-blueLight uppercase tracking-wider">
                  Customer &amp; Hardware Request Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-white">
                  <div>
                    <span className="text-[10px] text-nex-mist block">Customer Name</span>
                    <span className="font-semibold">{selectedBooking.customerName || selectedBooking.customer_name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-nex-mist block">Contact Phone</span>
                    <a href={`tel:${selectedBooking.phone}`} className="font-semibold text-nex-blueLight hover:underline">
                      {selectedBooking.phone || "N/A"}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-nex-mist block">Email / Location</span>
                    <span className="truncate block">{selectedBooking.city || selectedBooking.email || "Bengaluru"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-xs">
                  <span className="text-[10px] text-nex-mist block">Service / Device Requested</span>
                  <span className="font-bold text-white">
                    {selectedBooking.productName || selectedBooking.service_name || "Hardware Diagnostic"}
                  </span>
                  {(selectedBooking.description || selectedBooking.message || selectedBooking.notes) && (
                    <p className="text-[11px] text-nex-mist mt-1 italic bg-black/20 p-2 rounded-lg">
                      &quot;{selectedBooking.description || selectedBooking.message || selectedBooking.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Status Transition & Technician Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Pipeline Status */}
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Service Status Pipeline *</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    <option value="new">1. New Enquiry</option>
                    <option value="confirmed">2. Confirmed by Admin</option>
                    <option value="assigned">3. Technician Assigned</option>
                    <option value="in_progress">4. In Progress (Repair Underway)</option>
                    <option value="quality_check">5. Quality Check / Diagnostic Testing</option>
                    <option value="completed">6. Repaired &amp; Completed</option>
                    <option value="delivered">7. Delivered to Client</option>
                    <option value="cancelled">8. Cancelled / Void</option>
                  </select>
                </div>

                {/* Technician Assignment */}
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Assign Technician *</label>
                  <select
                    value={assignedTechnician}
                    onChange={(e) => setAssignedTechnician(e.target.value)}
                    className="w-full rounded-xl bg-nex-ink border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    <option value="">-- Select Specialist --</option>
                    {AUTHORIZED_TECHNICIANS.map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name} ({tech.role})
                      </option>
                    ))}
                    <option value="External Service Partner">External Service Partner</option>
                  </select>
                </div>
              </div>

              {/* Estimated Completion & Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Est. Completion</label>
                  <input
                    type="text"
                    value={estimatedCompletion}
                    onChange={(e) => setEstimatedCompletion(e.target.value)}
                    placeholder="e.g. Tomorrow 4:00 PM"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Labour Fee (Rs.)</label>
                  <input
                    type="number"
                    value={labourCharge}
                    onChange={(e) => setLabourCharge(e.target.value)}
                    placeholder="1200"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-semibold">Parts Cost (Rs.)</label>
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-nex-blue/10 border border-nex-blue/20 text-xs">
                <span className="font-semibold text-nex-mist">Total Estimated Billable Amount:</span>
                <span className="font-bold text-white text-sm">
                  Rs. {(Number(labourCharge || 0) + Number(partsCost || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Customer-Visible Update Message */}
              <div className="space-y-1">
                <label className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Customer-Facing Status Notification
                </label>
                <input
                  type="text"
                  value={customerUpdateMsg}
                  onChange={(e) => setCustomerUpdateMsg(e.target.value)}
                  placeholder="e.g. Device inspected. Replacement display being fitted."
                  className="w-full rounded-xl bg-white/[0.03] border border-cyan-500/30 px-3.5 py-2.5 text-xs text-white focus:outline-none min-h-[44px]"
                />
                <p className="text-[10px] text-nex-mist">
                  This message is visible to the customer when tracking their booking status online.
                </p>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Internal Team Notes (Confidential)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Diagnostic test findings, serial numbers, technician observations..."
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Timeline Audit History */}
              {Array.isArray(selectedBooking.timeline) && selectedBooking.timeline.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                    Workflow Audit History ({selectedBooking.timeline.length})
                  </span>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 max-h-36 overflow-y-auto">
                    {selectedBooking.timeline.map((entry: any, i: number) => (
                      <div key={i} className="text-[11px] flex items-start gap-2 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <Activity className="h-3.5 w-3.5 text-nex-blueLight shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white">{entry.message || entry.status}</span>
                          <span className="text-[10px] text-nex-mist block">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString("en-IN") : "Recorded"} • by {entry.by || "Admin"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticky Footer */}
              <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-6 p-4 border-t border-white/10 bg-nex-ink/95 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={savingBooking}
                  className="btn-secondary !py-2.5 !px-5 min-h-[44px] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="btn-primary !py-2.5 !px-6 min-h-[44px] text-xs font-bold shadow-glow-blue flex items-center gap-2 cursor-pointer"
                >
                  {savingBooking ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & Update Workflow"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
