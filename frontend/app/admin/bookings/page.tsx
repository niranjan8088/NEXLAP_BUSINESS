"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Search,
  Filter,
  Trash2,
  Edit,
  Printer,
  X,
  FileSpreadsheet,
  Phone,
  Mail,
  MessageCircle,
  Save,
  MessageSquare,
  Activity,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";
import { cn } from "@/lib/utils";

// Status configuration for badges
const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  { value: "contacted", label: "Contacted", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
  { value: "quoted", label: "Quoted", color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" },
  { value: "waiting", label: "Waiting", color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20" },
  { value: "confirmed", label: "Confirmed", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  { value: "delivered", label: "Delivered", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  { value: "cancelled", label: "Cancelled", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" },
  { value: "completed", label: "Completed", color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20" },
];

const KANBAN_COLUMNS = [
  {
    id: "new",
    title: "New Enquiries",
    color: "border-blue-200 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/[0.02]",
    badgeColor: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/25",
    statuses: ["new"]
  },
  {
    id: "progress",
    title: "Contacted & Quoted",
    color: "border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/[0.02]",
    badgeColor: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25",
    statuses: ["contacted", "quoted", "waiting"]
  },
  {
    id: "confirmed",
    title: "Confirmed Servicing",
    color: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/[0.02]",
    badgeColor: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25",
    statuses: ["confirmed", "delivered"]
  },
  {
    id: "archived",
    title: "Archived & Done",
    color: "border-slate-200 dark:border-neutral-500/20 bg-slate-50/60 dark:bg-neutral-500/[0.02]",
    badgeColor: "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/60 border border-slate-200 dark:border-white/10",
    statuses: ["completed", "cancelled"]
  }
];

export default function AdminBookingsConsole() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Modal controllers
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit / Update fields
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTechnician, setEditTechnician] = useState("");

  // Reply fields
  const [replyText, setReplyText] = useState("");
  const [replySaved, setReplySaved] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  const loadBookings = async () => {
    try {
      const res = await safeJsonFetch('/api/bookings');
      if (res.ok && res.data?.success && Array.isArray(res.data.bookings)) {
        setBookings(res.data.bookings);
      }
    } catch (e) {
      console.error('[ADMIN BOOKINGS FETCH ERROR]', e);
    }
  };

  useEffect(() => {
    loadBookings();

    const handleRealtime = (e: any) => {
      const { table, eventType, new: newRecord } = e.detail || {};
      if (table === "bookings") {
        loadBookings();
        if (eventType === "INSERT" && newRecord?.id) {
          setNewlyAddedIds((prev) => new Set(prev).add(newRecord.id));
          setTimeout(() => {
            setNewlyAddedIds((prev) => {
              const updated = new Set(prev);
              updated.delete(newRecord.id);
              return updated;
            });
          }, 8000);
        }
      }
    };

    window.addEventListener("nexbyte-data-changed", handleRealtime);
    return () => window.removeEventListener("nexbyte-data-changed", handleRealtime);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await safeJsonFetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
      }
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this booking enquiry?")) return;

    const res = await safeJsonFetch(`/api/bookings?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBooking?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
      }
    }
  };

  const handleOpenEdit = (booking: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBooking(booking);
    setEditDate(booking.booking_date || booking.date || "");
    setEditTime(booking.booking_time || booking.time || "10:30 AM");
    setEditNotes(booking.notes || "");
    setEditTechnician(booking.assignedTo || booking.technician || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const res = await safeJsonFetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedBooking.id,
        booking_date: editDate,
        booking_time: editTime,
        notes: editNotes,
        technician: editTechnician,
        assignedTo: editTechnician
      }),
    });

    if (res.ok) {
      loadBookings();
      setIsEditModalOpen(false);
    }
  };

  const handleSaveReply = async () => {
    if (!selectedBooking || !replyText.trim()) return;

    const now = new Date().toISOString();
    const newStatus = selectedBooking.status === "new" ? "quoted" : selectedBooking.status;

    const res = await safeJsonFetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedBooking.id,
        chatMessage: replyText.trim(),
        sender: 'admin',
        replyMessage: replyText.trim(),
        replyDate: now,
        replyBy: 'NexLapTech Admin',
        status: newStatus,
      }),
    });

    if (res.ok && res.data?.booking) {
      setSelectedBooking(res.data.booking);
    }
    setReplyText("");
    setReplySaved(true);
    setTimeout(() => setReplySaved(false), 2500);
    loadBookings();
  };

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Customer,Phone,Email,Product,Status,Contact Preference,Budget,Quantity,Assigned Tech,Notes,Date\n";
    
    bookings.forEach((b) => {
      csvContent += `"${b.bookingId || b.id}","${b.customerName || b.customer_name}","${b.phone}","${b.email || "N/A"}","${b.productName || b.service_name}","${b.status}","${b.preferredContact || "WhatsApp"}","${b.budget}","${b.quantity || 1}","${b.assignedTo || ""}","${(b.notes || "").replace(/"/g, '""')}","${b.createdAt || b.created_at}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "NexLapTech_Service_Bookings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print single booking
  const handlePrintBooking = (b: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${b.customerName || b.customer_name}</title>
          <style>
            body { font-family: monospace; padding: 40px; color: #333; line-height: 1.5; }
            h2 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td { padding: 10px 0; }
            .label { font-weight: bold; width: 180px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>NEXLAPTECH - SERVICE BOOKING</h2>
          <table>
            <tr><td class="label">Booking ID</td><td>${b.bookingId || b.id}</td></tr>
            <tr><td class="label">Customer Name</td><td>${b.customerName || b.customer_name}</td></tr>
            <tr><td class="label">Contact Phone</td><td>${b.phone}</td></tr>
            <tr><td class="label">Email Address</td><td>${b.email || "N/A"}</td></tr>
            <tr><td class="label">Product / Service</td><td>${b.productName || b.service_name}</td></tr>
            <tr><td class="label">Assigned Status</td><td>${b.status?.toUpperCase() || "PENDING"}</td></tr>
            <tr><td class="label">Quantity</td><td>${b.quantity || 1}</td></tr>
            <tr><td class="label">Preferred Contact</td><td>${b.preferredContact || "WhatsApp"}</td></tr>
            <tr><td class="label">Client budget</td><td>${b.budget || "N/A"}</td></tr>
            <tr><td class="label">Client message</td><td>${b.message || "None"}</td></tr>
            <tr><td class="label">Internal notes</td><td>${b.notes || "None"}</td></tr>
          </table>
          <p style="margin-top: 50px; text-align: center; font-size: 11px;">Authorised NexLapTech Service Center</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenDetail = (booking: any) => {
    router.push(`/admin/bookings/${booking.id}`);
  };

  // Preset template replies
  const handleApplyTemplate = (type: "available" | "unavailable") => {
    if (!selectedBooking) return;
    if (type === "available") {
      setReplyText(
        `Hello Sir/Madam,\n\nThank you for contacting NexLapTech.\n\nWe are pleased to inform you that "${selectedBooking.productName || selectedBooking.service_name}" is currently available.\n\n- Ref Price: ${selectedBooking.budget !== "N/A" ? selectedBooking.budget : "Standard rate"}\n- Warranty: 6 Months NexLapTech Support\n\nPlease let us know if you would like to proceed with confirmation.\n\nBest regards,\nNexLapTech Team`
      );
    } else {
      setReplyText(
        `Hello Sir/Madam,\n\nThank you for contacting NexLapTech.\n\nCurrently, "${selectedBooking.productName || selectedBooking.service_name}" is out of stock. We expect fresh units next week.\n\nWe can offer alternative specifications. Please reply to discuss options.\n\nBest regards,\nNexLapTech Team`
      );
    }
  };

  // Filters calculations (memoized for performance)
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesSearch =
          (b.customerName || b.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.phone || "").includes(search) ||
          (b.bookingId || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.productName || b.service_name || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "all" ? true : b.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime();
        }
        return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime();
      });
  }, [bookings, search, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Bookings Console</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage doorstep servicing, support schedules, and invoice downloads.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-cyan-400" /> Export Bookings CSV
          </button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search booking ID, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none w-36"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none w-36"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* View switcher */}
          <div className="flex bg-slate-100 dark:bg-black/30 rounded-xl p-1 border border-slate-200 dark:border-white/10 shrink-0 text-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              CRM Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Bookings View */}
      {viewMode === "list" ? (
        filteredBookings.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] shadow-sm">
            <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-600 dark:text-slate-400">No service bookings match filter criteria.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-900 dark:text-white border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-5">Booking ID</th>
                    <th className="py-3 px-5">Customer Details</th>
                    <th className="py-3 px-4">Enquiry Subject</th>
                    <th className="py-3 px-4">Assigned Tech</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const statusCfg = STATUS_OPTIONS.find((s) => s.value === b.status) || STATUS_OPTIONS[0];
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleOpenDetail(b)}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        {/* Booking ID */}
                        <td className="py-4.5 px-5 font-mono font-bold text-indigo-600 dark:text-cyan-400">
                          {b.bookingId || b.id}
                        </td>

                        {/* Customer */}
                        <td className="py-4.5 px-5">
                          <div className="font-semibold text-slate-900 dark:text-white">{b.customerName || b.customer_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{b.phone}</div>
                        </td>

                        {/* Subject */}
                        <td className="py-4.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {b.productName || b.service_name || "Device Service"}
                        </td>

                        {/* Tech */}
                        <td className="py-4.5 px-4 text-slate-600 dark:text-slate-400">
                          {b.assignedTo || b.technician || "Unassigned"}
                        </td>

                        {/* Status */}
                        <td className="py-4.5 px-4">
                          <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 justify-end">
                            <a
                              href={`tel:${b.phone}`}
                              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 flex items-center justify-center inline-flex"
                              title="Call Customer"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${(b.phone || "").replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 flex items-center justify-center inline-flex"
                              title="WhatsApp Customer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={(e) => handlePrintBooking(b, e)}
                              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center inline-flex cursor-pointer"
                              title="Print Booking Invoice"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenEdit(b, e)}
                              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center inline-flex cursor-pointer"
                              title="Edit Booking"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(b.id, e)}
                              className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center inline-flex cursor-pointer"
                              title="Delete Booking"
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
          </div>
        )
      ) : (
        /* CRM Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colBookings = filteredBookings.filter((b) => col.statuses.includes(b.status));
            return (
              <div key={col.id} className={`rounded-2xl border p-4 flex flex-col space-y-4 ${col.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white tracking-wide">{col.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colBookings.length}
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                  {colBookings.length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      Empty column
                    </div>
                  ) : (
                    colBookings.map((b) => {
                      const statusCfg = STATUS_OPTIONS.find((s) => s.value === b.status) || STATUS_OPTIONS[0];
                      const isNew = newlyAddedIds.has(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleOpenDetail(b)}
                          className={cn(
                            "p-4 rounded-xl bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300 cursor-pointer space-y-3 relative group overflow-hidden hover:shadow-md",
                            isNew
                              ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse"
                              : "hover:border-indigo-400 dark:hover:border-cyan-400/50"
                          )}
                        >
                          {isNew && (
                            <span className="absolute top-0 right-0 bg-cyan-500 text-black text-[8px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg uppercase animate-bounce">
                              NEW
                            </span>
                          )}
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-cyan-400">{b.bookingId || b.id.slice(0, 8)}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>

                          <div className="text-left">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{b.productName || b.service_name}</h5>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{b.customerName || b.customer_name}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{b.phone}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 text-left">
                            <span>Tech: <strong className="text-slate-700 dark:text-slate-300">{b.assignedTo || b.technician || "None"}</strong></span>
                            <span>{new Date(b.createdAt || b.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                          </div>

                          {/* Quick controls on hover or view */}
                          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                              className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-[9px] rounded px-2 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>

                            <div className="flex gap-1">
                              <a
                                href={`tel:${b.phone}`}
                                className="h-6 w-6 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center text-emerald-600"
                                title="Call Customer"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                              <a
                                href={`https://wa.me/${(b.phone || "").replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 w-6 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center text-emerald-600"
                                title="WhatsApp Customer"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgraded Full Booking Detail Modal */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)} />
          
          <div className="relative w-full max-w-4xl overflow-y-auto max-h-[90vh] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] p-6 shadow-2xl sm:p-8 z-10 text-slate-900 dark:text-white">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Left Column - Booking info */}
              <div className="flex-1 space-y-5">
                <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">{selectedBooking.bookingId}</span>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedBooking.productName || selectedBooking.service_name}</h3>
                  <div className="mt-2.5 flex items-center gap-2">
                    {(() => {
                      const cfg = getStatusConfig(selectedBooking.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Client Details</p>
                    <p className="text-slate-900 dark:text-white font-bold">{selectedBooking.customerName || selectedBooking.customer_name}</p>
                    <p className="text-slate-600 dark:text-slate-300">{selectedBooking.phone}</p>
                    {selectedBooking.email && <p className="text-slate-600 dark:text-slate-300">{selectedBooking.email}</p>}
                    <p className="text-slate-600 dark:text-slate-300">{selectedBooking.city || "Bengaluru"}, {selectedBooking.state || "Karnataka"}</p>
                  </div>
                  <div className="space-y-1.5 sm:border-l sm:border-slate-100 dark:sm:border-white/5 sm:pl-4.5">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Specifications</p>
                    <p className="text-slate-600 dark:text-slate-300">Reference Budget: <strong className="text-slate-900 dark:text-white">{selectedBooking.budget || "Standard"}</strong></p>
                    <p className="text-slate-600 dark:text-slate-300">Order Quantity: <strong className="text-slate-900 dark:text-white">{selectedBooking.quantity || 1}</strong></p>
                    <p className="text-slate-600 dark:text-slate-300">Contact preference: <strong className="text-slate-900 dark:text-white">{selectedBooking.preferredContact || "WhatsApp"}</strong></p>
                    <p className="text-slate-600 dark:text-slate-300">Assigned Tech: <strong className="text-slate-900 dark:text-white">{selectedBooking.assignedTo || selectedBooking.technician || "Unassigned"}</strong></p>
                  </div>
                </div>

                {selectedBooking.message && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-xs">
                    <p className="font-semibold text-slate-800 dark:text-white/80 mb-1">Customer Message:</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedBooking.message}</p>
                  </div>
                )}

                {selectedBooking.notes && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold mb-1">Internal Admin Notes:</p>
                    <p>{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Timeline / Status History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3.5 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-600 dark:text-cyan-400" /> Timeline &amp; Activity History
                  </h4>
                  <div className="space-y-4 pl-1 relative before:absolute before:left-3 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                    {selectedBooking.timeline && selectedBooking.timeline.filter((step: any) => step.type !== "chat").map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start relative pl-1.5">
                        <div className="h-6 w-6 rounded-full bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 z-10">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.02] p-2.5 rounded-lg text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 dark:text-white capitalize">{step.status}</span>
                            <span className="text-[9px] text-slate-400 dark:text-white/40">
                              {new Date(step.timestamp).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{step.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Reply templates and forms */}
              <div className="w-full md:w-96 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/5 pt-5 md:pt-0 md:pl-5 shrink-0 flex flex-col">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 shrink-0">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-600 dark:text-cyan-400" /> Two-Way Customer Chat
                </h4>

                {/* Live Chat Log */}
                <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 scrollbar-thin">
                  {(() => {
                    const chats = selectedBooking.timeline?.filter((t: any) => t.type === "chat") || [];
                    if (chats.length === 0) {
                      return (
                        <div className="text-center py-10 text-[10px] text-slate-400 dark:text-slate-500">
                          No messages yet. Send a reply below.
                        </div>
                      );
                    }
                    return chats.map((msg: any, idx: number) => {
                      const isClient = msg.sender === "customer";
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${
                            isClient ? "mr-auto items-start" : "ml-auto items-end"
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl text-[11px] leading-relaxed text-left ${
                              isClient
                                ? "bg-slate-200 dark:bg-white/[0.05] border border-slate-300 dark:border-white/10 rounded-tl-none text-slate-900 dark:text-white"
                                : "bg-indigo-600 rounded-tr-none text-white"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[8px] text-slate-400 dark:text-white/40 mt-0.5">
                            {isClient ? "Customer" : "You"} •{" "}
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {replySaved && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-semibold shrink-0">
                    Reply saved to database history!
                  </div>
                )}

                {/* Templates buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApplyTemplate("available")}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-semibold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Template: Available
                  </button>
                  <button
                    onClick={() => handleApplyTemplate("unavailable")}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-semibold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Template: Out-Of-Stock
                  </button>
                </div>

                <div className="space-y-2 shrink-0">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official message reply here..."
                    rows={4}
                    className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none"
                  />

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handleSaveReply}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Save className="h-4 w-4" /> Save Reply to DB
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${(selectedBooking.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(replyText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-xl py-2 text-[10px] font-bold flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20ba5a] text-white transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      {selectedBooking.email ? (
                        <a
                          href={`mailto:${selectedBooking.email}?subject=${encodeURIComponent(
                            `Booking Status Update - ${selectedBooking.bookingId}`
                          )}&body=${encodeURIComponent(replyText)}`}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 py-2 text-[10px] font-bold flex items-center justify-center gap-1 text-indigo-600 dark:text-cyan-400 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      ) : (
                        <span className="w-full text-center py-2 text-[10px] text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] rounded-xl">
                          No Email
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between gap-4">
              <button
                onClick={() => handleDelete(selectedBooking.id)}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete Booking
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold py-2 px-6 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {isEditModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] p-6 shadow-2xl sm:p-8 z-10 text-slate-900 dark:text-white">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-2">Edit Booking Details</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5">Enquiry for: {selectedBooking.customerName || selectedBooking.customer_name}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Preferred Time Slot</label>
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="05:30 PM">05:30 PM</option>
                  <option value="06:30 PM">06:30 PM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Internal Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Assigned Technician</label>
                <input
                  type="text"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  placeholder="e.g. Niranjan M."
                  className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 shadow-sm transition-colors cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function getStatusConfig(val: string) {
  return STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0];
}
