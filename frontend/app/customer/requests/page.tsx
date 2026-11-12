"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Wrench,
  GraduationCap,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Filter,
  RefreshCw,
  Laptop,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";
import { cn } from "@/lib/utils";

const PROGRESS_STEPS = ["Submitted", "Confirmed", "In Progress", "Completed"];

export default function CustomerRequestsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "services" | "training" | "internships">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Combined data list
  const [requests, setRequests] = useState<any[]>([]);

  const fetchCustomerRequests = async () => {
    setLoading(true);
    try {
      // 1. Fetch user bookings / service requests
      const bookingsRes = await safeJsonFetch("/api/customer/bookings");
      // 2. Fetch user orders
      const ordersRes = await safeJsonFetch("/api/customer/orders");
      // 3. Fetch user internship apps
      const internshipsRes = await safeJsonFetch("/api/customer/internships");

      const list: any[] = [];

      if (bookingsRes.ok && bookingsRes.data?.bookings) {
        bookingsRes.data.bookings.forEach((b: any) => {
          list.push({
            id: b.id,
            reqId: b.booking_id || b.bookingId || `REQ-${b.id.slice(0, 8)}`,
            type: "Service / Booking",
            title: b.selected_item || b.product_name || "Device Service & Repair",
            date: b.created_at || new Date().toISOString(),
            status: mapStatus(b.status),
            rawStatus: b.status,
            lastUpdate: b.updated_at || b.created_at || new Date().toISOString(),
            details: b,
            category: "services",
          });
        });
      }

      const fetchedOrders: any[] = (ordersRes.ok && Array.isArray(ordersRes.data?.orders)) ? [...ordersRes.data.orders] : [];
      try {
        const rawLocal = localStorage.getItem("nexbyte_orders");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            parsed.forEach((lo: any) => {
              if (lo && (lo.order_id || lo.id) && !fetchedOrders.some((fo) => (fo.order_id || fo.id) === (lo.order_id || lo.id))) {
                fetchedOrders.push(lo);
              }
            });
          }
        }
      } catch {}

      fetchedOrders.forEach((o: any) => {
        list.push({
          id: o.id,
          reqId: o.order_number || o.order_id || o.id,
          type: "Product Order",
          title: `Order for ₹${(o.total_amount || 0).toLocaleString("en-IN")}`,
          date: o.created_at || new Date().toISOString(),
          status: mapStatus(o.status),
          rawStatus: o.status,
          lastUpdate: o.updated_at || o.created_at || new Date().toISOString(),
          details: o,
          category: "orders",
        });
      });

      if (internshipsRes.ok && internshipsRes.data?.internships) {
        internshipsRes.data.internships.forEach((i: any) => {
          list.push({
            id: i.id,
            reqId: i.application_id || `INT-${i.id.slice(0, 8)}`,
            type: "Internship Application",
            title: i.domain || "Academic Internship",
            date: i.created_at || new Date().toISOString(),
            status: mapStatus(i.status),
            rawStatus: i.status,
            lastUpdate: i.updated_at || i.created_at || new Date().toISOString(),
            details: i,
            category: "internships",
          });
        });
      }

      // Sort newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRequests(list);
    } catch (e) {
      console.error("Failed to fetch customer requests", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerRequests();
    window.addEventListener("nexbyte-realtime", fetchCustomerRequests);
    return () => window.removeEventListener("nexbyte-realtime", fetchCustomerRequests);
  }, []);

  function mapStatus(statusStr: string = "") {
    const s = statusStr.toLowerCase();
    if (s.includes("completed") || s.includes("delivered") || s.includes("converted")) return "Completed";
    if (s.includes("progress") || s.includes("review") || s.includes("contacted")) return "In Progress";
    if (s.includes("confirm") || s.includes("approved")) return "Confirmed";
    if (s.includes("cancel") || s.includes("reject")) return "Cancelled";
    return "Submitted";
  }

  const filtered = requests.filter((r) => {
    const matchesTab = activeTab === "all" || r.category === activeTab;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || r.reqId.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-nex-blue/10 border border-nex-blue/20 px-3 py-1 text-xs font-bold text-nex-blue dark:text-nex-blueLight mb-3">
              <Package className="h-3.5 w-3.5" /> Unified Tracking Portal
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Requests &amp; Orders
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              View real-time progress for your hardware purchases, service bookings, and training applications.
            </p>
          </div>

          {/* Search & Tabs Controls */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {[
                { val: "all", label: "All Requests" },
                { val: "services", label: "Service Bookings" },
                { val: "orders", label: "Orders" },
                { val: "internships", label: "Internships" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setActiveTab(tab.val as any)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border",
                    activeTab === tab.val
                      ? "bg-nex-blue text-white border-nex-blue"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Request ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* List of Requests */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-nex-blue mb-2" />
              Loading real-time request status...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
              <Package className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                No request records found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have you booked a repair or bought a computer? You can track status here once your booking is created.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => {
                const isCancelled = req.status === "Cancelled";
                const currentStepIdx = isCancelled ? -1 : PROGRESS_STEPS.indexOf(req.status);

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4"
                  >
                    {/* Top Row: Request ID | Type | Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-nex-blue dark:text-nex-blueLight">
                            {req.reqId}
                          </span>
                          <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                            {req.type}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {req.title}
                        </h3>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                        <span>Submitted: {new Date(req.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Progress Bar Timeline */}
                    {isCancelled ? (
                      <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>This request has been cancelled.</span>
                      </div>
                    ) : (
                      <div className="py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                          Progress Timeline
                        </span>
                        <div className="grid grid-cols-4 items-center text-center gap-2 relative">
                          <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-200 dark:bg-white/10 -z-0" />

                          {PROGRESS_STEPS.map((stepName, idx) => {
                            const isDone = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;

                            return (
                              <div key={stepName} className="flex flex-col items-center gap-1.5 relative z-10">
                                <div
                                  className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                                    isDone
                                      ? "bg-nex-blue border-nex-blue text-white shadow-sm"
                                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-white/20 text-slate-400"
                                  )}
                                >
                                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                </div>
                                <span className={cn(
                                  "text-[10px] font-semibold",
                                  isCurrent ? "text-nex-blue dark:text-nex-blueLight font-bold" : "text-slate-500"
                                )}>
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Status & Last Update */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <span>Last Update: {new Date(req.lastUpdate).toLocaleString("en-IN")}</span>
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("nexbyte-open-booking-modal", {
                              detail: { tab: "track", bookingId: req.reqId, phone: req.details?.phone || "" },
                            })
                          );
                        }}
                        className="font-bold text-nex-blue dark:text-nex-blueLight hover:underline"
                      >
                        View Full History &amp; Discussion →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
  );
}
