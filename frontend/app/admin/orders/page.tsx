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
  Filter,
  RefreshCw,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight
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
      const list = await dbHelper.orders.list();
      setOrders(list);
    } catch (err) {
      console.error(err);
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
      await dbHelper.orders.update(orderId, { status });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status }));
      }
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
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
      await dbHelper.orders.update(selectedOrder.id, updates);
      setSelectedOrder((prev: any) => ({ ...prev, ...updates }));
      loadOrders();
      alert("Fulfillment tracking details saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save tracking info");
    } finally {
      setSavingTracking(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchQuery =
      String(o.id || o.order_id || "").toLowerCase().includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      String(o.shipping_address || "").toLowerCase().includes(q) ||
      String(o.applied_offer_code || o.appliedOfferCode || "").toLowerCase().includes(q);

    if (!matchQuery) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Pending</span>;
      case "confirmed":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>;
      case "processing":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1 w-fit"><RefreshCw className="h-3 w-3 animate-spin" /> Processing</span>;
      case "shipped":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 w-fit"><Truck className="h-3 w-3" /> Shipped</span>;
      case "delivered":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Delivered</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/70 border border-white/10 w-fit">{status}</span>;
    }
  };

  const totalRevenue = orders.reduce((acc, o) => (o.status !== "cancelled" ? acc + Number(o.total || 0) : acc), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing" || o.status === "confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-nex-blueLight" />
            Orders Management
          </h1>
          <p className="text-xs text-nex-mist mt-1">
            View, track, and update fulfillment status for customer marketplace orders.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="btn-secondary !py-2 !px-4 text-xs self-start md:self-auto flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-nex-ink/80">
          <div className="text-[11px] font-medium text-nex-mist">Total Orders</div>
          <div className="text-xl font-bold text-white mt-1">{orders.length}</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] font-medium text-amber-300">Pending Fulfillment</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <div className="text-[11px] font-medium text-purple-300">In Progress</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{processingCount}</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] font-medium text-emerald-300">Total Revenue (Valid)</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">Rs. {totalRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-nex-ink flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nex-mist" />
          <input
            type="text"
            placeholder="Search Order ID, customer name, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-nex-black border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-nex-mist focus:outline-none focus:border-nex-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-nex-blue text-white shadow-glow-blue"
                  : "text-nex-mist hover:text-white hover:bg-white/5"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/5">
          <Package className="h-10 w-10 text-nex-mist mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No orders found</p>
          <p className="text-xs text-nex-mist mt-1">No customer orders match your active filter.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden bg-nex-ink">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-nex-mist font-semibold">
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
              <tbody className="divide-y divide-white/5 text-white/90">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-nex-blueLight">
                      {o.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{o.customer_name || "Guest Customer"}</div>
                      <div className="text-[10px] text-nex-mist">{o.customer_email || "N/A"}</div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      {o.items?.length || 1} item(s)
                    </td>
                    <td className="py-4 px-4">
                      {(o.applied_offer_code || o.appliedOfferCode) ? (
                        <div>
                          <span className="font-mono font-bold text-amber-300">{o.applied_offer_code || o.appliedOfferCode}</span>
                          <div className="text-[10px] text-emerald-300">₹{Number(o.discount_amount ?? o.discountAmount ?? 0).toLocaleString("en-IN")} saved</div>
                        </div>
                      ) : <span className="text-nex-mist">—</span>}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      Rs. {(Number(o.total) || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-4 px-4 text-[11px] text-nex-mist">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setTrackingIdInput(o.tracking_id || "");
                          setTrackingCarrierInput(o.tracking_carrier || "");
                        }}
                        className="btn-secondary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold text-nex-mist uppercase tracking-wider">Order Detail</span>
                <h3 className="font-mono text-lg font-bold text-white mt-0.5">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-nex-mist hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Progression Controller */}
            <div className="rounded-xl bg-nex-black/60 border border-white/10 p-4 space-y-3">
              <div className="text-xs font-semibold text-white/90">Update Order Fulfillment Status:</div>
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
                    onClick={() => handleUpdateStatus(selectedOrder.id, s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedOrder.status === s.id
                        ? "bg-nex-blue text-white shadow-glow-blue ring-1 ring-white/30"
                        : "bg-white/5 text-nex-mist hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking & Logistics Fulfillment Details */}
            <div className="rounded-xl bg-nex-black/60 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-cyan-400" /> Shipment & Tracking Details
                </div>
                {selectedOrder.tracking_id && (
                  <span className="text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded">
                    Tracking: {selectedOrder.tracking_id}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-nex-mist uppercase tracking-wider block mb-1">
                    Courier / Carrier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DTDC, Blue Dart, Delhivery, Speed Post"
                    value={trackingCarrierInput}
                    onChange={(e) => setTrackingCarrierInput(e.target.value)}
                    className="w-full rounded-lg bg-nex-black border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-nex-mist uppercase tracking-wider block mb-1">
                    Tracking ID / AWB
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRK-8904760125"
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    className="w-full rounded-lg bg-nex-black border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveTracking}
                  disabled={savingTracking}
                  className="btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savingTracking ? "Saving..." : "Save Tracking Info"}
                </button>
              </div>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2">
                <div className="text-[11px] font-bold text-nex-mist uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-nex-blueLight" /> Customer Information
                </div>
                <div className="text-xs font-semibold text-white">{selectedOrder.customer_name || "N/A"}</div>
                <div className="text-xs text-nex-mist flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> {selectedOrder.customer_email || "N/A"}
                </div>
                <div className="text-xs text-nex-mist flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> {selectedOrder.customer_phone || "Not provided"}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2">
                <div className="text-[11px] font-bold text-nex-mist uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-nex-blueLight" /> Shipping Address
                </div>
                <div className="text-xs text-white leading-relaxed">
                  {selectedOrder.shipping_address || "Standard NexLapTech Hub Pick-Up"}
                </div>
                <div className="text-[11px] text-nex-mist pt-1 border-t border-white/5">
                  Payment Method: <span className="text-white font-bold uppercase">{selectedOrder.payment_method || "COD"}</span>
                </div>
              </div>
            </div>

            {/* Promotional Offer & Protection Plan Tracking Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Offer Card */}
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-nex-mist uppercase tracking-wider flex items-center justify-between">
                  <span>Promotional Offer</span>
                  {(selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode) && (
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      ID: {selectedOrder.applied_offer_id || "Active"}
                    </span>
                  )}
                </div>
                {(selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode) ? (
                  <>
                    <div className="font-mono text-sm font-bold text-amber-300">
                      {selectedOrder.applied_offer_code || selectedOrder.appliedOfferCode}
                      {selectedOrder.applied_offer_name && (
                        <span className="text-xs text-white/80 font-sans font-normal ml-2">({selectedOrder.applied_offer_name})</span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold">
                      Discount applied: -₹{Number(selectedOrder.discount_amount ?? selectedOrder.discountAmount ?? 0).toLocaleString("en-IN")}
                    </div>
                    {selectedOrder.applied_offer_subtotal_basis && (
                      <div className="text-[10px] text-nex-mist">
                        Calculation basis: ₹{Number(selectedOrder.applied_offer_subtotal_basis).toLocaleString("en-IN")}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-nex-mist pt-1">No promotional offer code was redeemed for this order.</div>
                )}
              </div>

              {/* Protection Plan Card */}
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-nex-mist uppercase tracking-wider flex items-center justify-between">
                  <span>Hardware Protection Plan</span>
                  {selectedOrder.protection_plan && (
                    <span className="font-mono text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {selectedOrder.protection_plan.duration || "1 Year"}
                    </span>
                  )}
                </div>
                {selectedOrder.protection_plan ? (
                  <>
                    <div className="text-xs font-bold text-purple-300">
                      {selectedOrder.protection_plan.title}
                    </div>
                    <div className="text-xs text-white/90">
                      Plan Price: ₹{Number(selectedOrder.protection_plan.price || selectedOrder.protection_plan_price || 0).toLocaleString("en-IN")}
                    </div>
                    {selectedOrder.protection_plan.description && (
                      <div className="text-[10px] text-nex-mist line-clamp-2">
                        {selectedOrder.protection_plan.description}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-nex-mist pt-1">
                    Standard 1-Year Warranty (Customer declined optional add-on protection plan).
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Ordered Items</div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5 overflow-hidden">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-white">{item.title || item.product_title || "Product Item"}</div>
                        <div className="text-[10px] text-nex-mist mt-0.5">Quantity: {item.quantity || 1} × Rs. {(Number(item.price) || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <div className="text-xs font-bold text-white">
                        Rs. {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-nex-mist text-center">Standard System Order Package</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm font-bold text-white">
                <span>Grand Total</span>
                <span className="text-nex-blueLight text-base">Rs. {(Number(selectedOrder.total) || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary !py-2 !px-5 text-xs"
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
