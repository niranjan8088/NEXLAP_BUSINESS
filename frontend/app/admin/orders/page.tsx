"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  RefreshCw,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [trackingCarrierInput, setTrackingCarrierInput] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let ordersList: any[] = [];
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders) && data.orders.length > 0) {
          ordersList = data.orders;
        }
      }
      if (ordersList.length === 0) {
        const list = await dbHelper.orders.list();
        ordersList = list || [];
      }
      try {
        const rawLocal = localStorage.getItem("nexbyte_orders");
        if (rawLocal) {
          const localParsed = JSON.parse(rawLocal);
          if (Array.isArray(localParsed)) {
            const map = new Map<string, any>();
            localParsed.forEach((o: any) => map.set(o.order_id || o.id, o));
            ordersList.forEach((o: any) => map.set(o.order_id || o.id, o));
            ordersList = Array.from(map.values()).sort(
              (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
          }
        }
      } catch {}

      setOrders(ordersList);
      try {
        localStorage.setItem("nexbyte_orders", JSON.stringify(ordersList));
      } catch {}
    } catch (err) {
      console.warn("API orders fetch warning, falling back to local:", err);
      try {
        const list = await dbHelper.orders.list();
        setOrders(list);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    if (typeof window !== "undefined") {
      window.addEventListener("nexbyte-realtime", loadOrders);
      return () => window.removeEventListener("nexbyte-realtime", loadOrders);
    }
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update order status");
      }
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_id === orderId)) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
      await loadOrders();
    } catch (err: any) {
      console.warn("API update failed, trying fallback:", err);
      try {
        await dbHelper.orders.update(orderId, { status });
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_id === orderId)) {
          setSelectedOrder((prev: any) => ({ ...prev, status }));
        }
        await loadOrders();
      } catch (e: any) {
        alert(err.message || "Failed to update order status");
      }
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      const updates = {
        tracking_id: trackingIdInput.trim() || null,
        tracking_carrier: trackingCarrierInput.trim() || null,
      };
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedOrder.id || selectedOrder.order_id, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save tracking details");
      }
      setSelectedOrder((prev: any) => ({ ...prev, ...updates }));
      await loadOrders();
      alert("Fulfillment tracking details saved successfully.");
    } catch (err: any) {
      console.warn("API tracking update failed, trying fallback:", err);
      try {
        const updates = {
          tracking_id: trackingIdInput.trim() || null,
          tracking_carrier: trackingCarrierInput.trim() || null,
        };
        await dbHelper.orders.update(selectedOrder.id, updates);
        setSelectedOrder((prev: any) => ({ ...prev, ...updates }));
        await loadOrders();
        alert("Fulfillment tracking details saved successfully.");
      } catch (e: any) {
        alert(err.message || "Failed to save tracking info");
      }
    } finally {
      setSavingTracking(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchQuery =
      String(o.id || o.order_id || "").toLowerCase().includes(q) ||
      String(o.customer_name || o.name || "").toLowerCase().includes(q) ||
      String(o.customer_email || o.email || "").toLowerCase().includes(q) ||
      String(o.phone || o.customer_phone || "").toLowerCase().includes(q) ||
      String(o.shipping_address || "").toLowerCase().includes(q) ||
      String(o.applied_offer_code || o.appliedOfferCode || "").toLowerCase().includes(q);

    if (!matchQuery) return false;
    if (statusFilter !== "all") {
      const st = String(o.status || "").toLowerCase();
      if (st !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const st = String(status || "").toLowerCase();
    switch (st) {
      case "pending":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Pending</span>;
      case "confirmed":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>;
      case "processing":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 flex items-center gap-1 w-fit"><RefreshCw className="h-3 w-3 animate-spin" /> Processing</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 flex items-center gap-1 w-fit"><Truck className="h-3 w-3" /> Shipped</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Delivered</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 w-fit">{status || "Pending"}</span>;
    }
  };

  const totalRevenue = orders.reduce((acc, o) => {
    const st = String(o.status || "").toLowerCase();
    if (st !== "cancelled") {
      const amt = Number(o.total || o.total_amount || 0);
      return acc + (isNaN(amt) ? 0 : amt);
    }
    return acc;
  }, 0);
  const pendingCount = orders.filter((o) => String(o.status || "").toLowerCase() === "pending").length;
  const processingCount = orders.filter((o) => {
    const st = String(o.status || "").toLowerCase();
    return st === "processing" || st === "confirmed";
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600 dark:text-cyan-400" />
            Orders Management
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            View, track, and update fulfillment status for customer marketplace orders.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="futuristic-btn-secondary !py-2 !px-4 text-xs self-start md:self-auto flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="futuristic-card p-4 rounded-xl flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Orders</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{orders.length}</div>
        </div>

        <div className="futuristic-card p-4 rounded-xl flex flex-col justify-between border-amber-200 dark:border-amber-500/20">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Pending Fulfillment</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div className="futuristic-card p-4 rounded-xl flex flex-col justify-between border-purple-200 dark:border-purple-500/20">
          <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300">In Progress</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{processingCount}</div>
        </div>

        <div className="futuristic-card p-4 rounded-xl flex flex-col justify-between border-emerald-200 dark:border-emerald-500/20">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Total Revenue (Valid)</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Rs. {totalRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="futuristic-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, customer name, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="futuristic-input w-full pl-10 pr-4 py-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="futuristic-card rounded-2xl p-12 text-center">
          <Package className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No orders found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No customer orders match your active filter.</p>
        </div>
      ) : (
        <div className="futuristic-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Count</th>
                  <th className="py-3.5 px-4">Offer Code</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-white/90">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400">
                      {o.order_id || o.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.customer_name || o.name || "Customer"}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{o.customer_email || o.email || o.phone || "N/A"}</div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      {o.items?.length || 1} item(s)
                    </td>
                    <td className="py-4 px-4">
                      {(o.applied_offer_code || o.appliedOfferCode) ? (
                        <div>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-300">{o.applied_offer_code || o.appliedOfferCode}</span>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">₹{Number(o.discount_amount ?? o.discountAmount ?? 0).toLocaleString("en-IN")} saved</div>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      Rs. {(Number(o.total || o.total_amount) || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-4 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setTrackingIdInput(o.tracking_id || "");
                          setTrackingCarrierInput(o.tracking_carrier || "");
                        }}
                        className="futuristic-btn-secondary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="futuristic-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl z-10 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Detail</span>
                <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedOrder.order_id || selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Progression Controller */}
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Update Order Fulfillment Status:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "pending", label: "Pending" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "processing", label: "Processing" },
                  { id: "shipped", label: "Shipped" },
                  { id: "delivered", label: "Delivered" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleUpdateStatus(selectedOrder.id || selectedOrder.order_id, s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      (selectedOrder.status || "").toLowerCase() === s.id
                        ? "bg-indigo-600 text-white shadow-sm ring-1 ring-white/30"
                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking & Logistics Fulfillment Details */}
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-indigo-600 dark:text-cyan-400" /> Shipment &amp; Tracking Details
                </div>
                {selectedOrder.tracking_id && (
                  <span className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded">
                    Tracking: {selectedOrder.tracking_id}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Courier / Carrier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DTDC, Blue Dart, Delhivery, Speed Post"
                    value={trackingCarrierInput}
                    onChange={(e) => setTrackingCarrierInput(e.target.value)}
                    className="futuristic-input w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Tracking ID / AWB
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRK-8904760125"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    className="futuristic-input w-full font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveTracking}
                  disabled={savingTracking}
                  className="futuristic-btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savingTracking ? "Saving..." : "Save Tracking Info"}
                </button>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" /> Customer Information
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{selectedOrder.customer_name || selectedOrder.name || "Customer"}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> {selectedOrder.customer_email || selectedOrder.email || "N/A"}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> {selectedOrder.customer_phone || selectedOrder.phone || "Not provided"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" /> Shipping Address
                </div>
                <div className="text-xs text-slate-800 dark:text-white leading-relaxed">
                  {selectedOrder.shipping_address || "Standard NexLapTech Hub Pick-Up"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5">
                  Payment Method: <span className="text-slate-900 dark:text-white font-bold uppercase">{selectedOrder.payment_method || "COD"}</span>
                </div>
              </div>
            </div>

            {/* Promotional Offer & Protection Plan Tracking Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Offer Card */}
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Promotional Offer</span>
                  {(selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode) && (
                    <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                      ID: {selectedOrder.applied_offer_id || "Active"}
                    </span>
                  )}
                </div>
                {(selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode) ? (
                  <>
                    <div className="font-mono text-sm font-bold text-amber-600 dark:text-amber-300">
                      {selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode}
                      {selectedOrder.applied_offer_name && (
                        <span className="text-xs text-slate-700 dark:text-white/80 font-sans font-normal ml-2">({selectedOrder.applied_offer_name})</span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Discount applied: -₹{Number(selectedOrder.discount_amount ?? selectedOrder.discountAmount ?? 0).toLocaleString("en-IN")}
                    </div>
                    {selectedOrder.applied_offer_subtotal_basis && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Calculation basis: ₹{Number(selectedOrder.applied_offer_subtotal_basis).toLocaleString("en-IN")}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">No promotional offer code was redeemed for this order.</div>
                )}
              </div>

              {/* Protection Plan Card */}
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Hardware Protection Plan</span>
                  {selectedOrder.protection_plan && (
                    <span className="font-mono text-[10px] text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {selectedOrder.protection_plan.duration || "1 Year"}
                    </span>
                  )}
                </div>
                {selectedOrder.protection_plan ? (
                  <>
                    <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      {selectedOrder.protection_plan.title}
                    </div>
                    <div className="text-xs text-slate-800 dark:text-white/90">
                      Plan Price: ₹{Number(selectedOrder.protection_plan.price || selectedOrder.protection_plan_price || 0).toLocaleString("en-IN")}
                    </div>
                    {selectedOrder.protection_plan.description && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {selectedOrder.protection_plan.description}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    Standard 1-Year Warranty (Customer declined optional add-on protection plan).
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Ordered Items</div>
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 divide-y divide-slate-200 dark:divide-white/5 overflow-hidden">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{item.title || item.product_title || "Product Item"}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Quantity: {item.quantity || 1} × Rs. {(Number(item.price || item.unitPrice || 0)).toLocaleString("en-IN")}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Rs. {((Number(item.price || item.unitPrice || 0)) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">Standard System Order Package</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-indigo-600 dark:text-cyan-400 text-base">Rs. {(Number(selectedOrder.total || selectedOrder.total_amount) || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="futuristic-btn-secondary !py-2 !px-5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
