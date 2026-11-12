"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  RefreshCw,
  ArrowRight,
  FileText,
  MessageSquare,
  ShieldCheck,
  X,
  Clock,
  Truck
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function CustomerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
    const handleRealtime = () => fetchOrders();
    window.addEventListener("nexbyte-realtime", handleRealtime);
    return () => window.removeEventListener("nexbyte-realtime", handleRealtime);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let ordersList: any[] = [];
      const res = await safeJsonFetch("/api/customer/orders");
      if (res.ok && Array.isArray(res.data?.orders)) {
        ordersList = res.data.orders;
      }

      // Merge with browser localStorage orders so placed orders are never lost
      try {
        const rawLocal = localStorage.getItem("nexbyte_orders");
        if (rawLocal) {
          const localParsed = JSON.parse(rawLocal);
          if (Array.isArray(localParsed) && localParsed.length > 0) {
            const map = new Map<string, any>();
            localParsed.forEach((o: any) => {
              if (o && (o.order_id || o.id)) map.set(o.order_id || o.id, o);
            });
            ordersList.forEach((o: any) => {
              if (o && (o.order_id || o.id)) map.set(o.order_id || o.id, o);
            });
            ordersList = Array.from(map.values()).sort(
              (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );

            // Sync any local orders not yet on server
            const missingOnServer = localParsed.filter((lo: any) =>
              !res.data?.orders?.some((so: any) => (so.order_id || so.id) === (lo.order_id || lo.id))
            );
            if (missingOnServer.length > 0) {
              fetch("/api/system/sync-mock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "orders", data: localParsed }),
              }).catch(() => {});
            }
          }
        }
      } catch {}

      setOrders(ordersList);
      try {
        if (ordersList.length > 0) {
          localStorage.setItem("nexbyte_orders", JSON.stringify(ordersList));
        }
      } catch {}
    } catch (e) {
      console.error("Orders load error", e);
      try {
        const rawLocal = localStorage.getItem("nexbyte_orders");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) setOrders(parsed);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered")) return 3;
    if (s.includes("out for delivery")) return 2;
    if (s.includes("processing") || s.includes("dispatched") || s.includes("shipped") || s.includes("packed")) return 1;
    if (s.includes("cancel") || s.includes("refund")) return -1;
    return 0; // Confirmed / Order Received
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="futuristic-card p-6 sm:p-8 space-y-2 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Boxes className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Purchase &amp; Order History
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Hardware Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Track hardware shipments live, view variant details, download official tax invoices, and message your seller.
        </p>
      </div>

      {/* Activity Workflow Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
        <Link
          href="/customer/orders"
          className="futuristic-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shrink-0"
        >
          <Package className="h-4 w-4" />
          <span>Product Orders ({orders.length})</span>
        </Link>
        <Link
          href="/customer/bookings"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Clock className="h-4 w-4" />
          <span>Service Bookings</span>
        </Link>
        <Link
          href="/customer/laptop-enquiry"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Boxes className="h-4 w-4" />
          <span>Laptop Enquiries</span>
        </Link>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="futuristic-card p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 dark:text-cyan-400" />
          <span>Fetching your order history...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="futuristic-card p-12 text-center space-y-3 shadow-sm">
          <Package className="h-10 w-10 text-slate-300 dark:text-white/20 mx-auto" />
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            No orders found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You haven&apos;t placed any hardware orders yet. Explore our genuine laptop and desktop catalog.
          </p>
          <Link
            href="/customer/shop"
            className="futuristic-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <span>Browse Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const orderNum = ord.order_number || ord.order_id || `NEX-2026-${ord.id?.slice(0, 4) || "0001"}`;
            const dateStr = new Date(ord.created_at || Date.now()).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const amount = (ord.total_amount || ord.total || 0).toLocaleString("en-IN");
            const status = ord.status || "Confirmed";
            const stepIdx = getStatusStepIndex(status);

            return (
              <div
                key={ord.id}
                className="futuristic-card p-6 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                        Order #{orderNum}
                      </span>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ordered on {dateStr}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="futuristic-btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
                    >
                      <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" />
                      <span>Order Details</span>
                    </button>

                    <Link
                      href="/customer/messages"
                      className="rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-3 py-2 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Message Seller</span>
                    </Link>
                  </div>
                </div>

                {/* Delivery Progress Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className={stepIdx >= 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>✓ Order Confirmed</span>
                    <span className={stepIdx >= 1 ? "text-emerald-600 dark:text-emerald-400" : ""}>Processing</span>
                    <span className={stepIdx >= 2 ? "text-emerald-600 dark:text-emerald-400" : ""}>Out for Delivery</span>
                    <span className={stepIdx >= 3 ? "text-emerald-600 dark:text-emerald-400" : ""}>Delivered</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((stepIdx + 1) / 4) * 100}%` }} />
                  </div>
                </div>

                {/* Pricing & Quick Action Row */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Total Amount Paid</span>
                    <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                      ₹{amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/track?search=${encodeURIComponent(orderNum)}`}
                      className="rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5 text-cyan-500" />
                      <span>Track Order</span>
                    </Link>

                    <Link
                      href="/customer/ewarranty"
                      className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>E-Warranty</span>
                    </Link>

                    <Link
                      href={`/invoice/view/${ord.id}`}
                      target="_blank"
                      className="futuristic-btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 shadow-sm"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Tax Invoice</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />

          <div className="futuristic-card relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 shadow-2xl z-10 text-slate-900 dark:text-white space-y-5">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                {selectedOrder.status}
              </span>
              <h3 className="font-display text-lg font-bold mt-1">
                Order #{selectedOrder.order_number || selectedOrder.id}
              </h3>
              {selectedOrder.tracking_number && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Courier: {selectedOrder.courier || "NexLapTech Express"} • Tracking #{selectedOrder.tracking_number}
                </p>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Purchased Hardware Items</h4>
              {(selectedOrder.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</div>
                    {item.variant && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400">
                        Variant: {item.variant}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="font-display font-extrabold text-xs text-slate-900 dark:text-white">
                    ₹{((item.price || selectedOrder.total_amount || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Timeline History */}
            {Array.isArray(selectedOrder.order_timeline) && selectedOrder.order_timeline.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order Event History</h4>
                <div className="space-y-1.5">
                  {selectedOrder.order_timeline.map((evt: any, i: number) => (
                    <div key={i} className="flex items-start justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{evt.status?.replace(/_/g, ' ')}</span>
                        {evt.note && <p className="text-[11px] text-slate-500">{evt.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(evt.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Grand Total Paid:</span>
              <span className="text-base text-indigo-600 dark:text-cyan-400 font-extrabold">
                ₹{(selectedOrder.total_amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                href={`/track?search=${encodeURIComponent(selectedOrder.order_number || selectedOrder.order_id || selectedOrder.tracking_number || selectedOrder.id)}`}
                className="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Truck className="h-4 w-4" /> Track Order Live
              </Link>
              <Link
                href={`/invoice/view/${selectedOrder.id}`}
                target="_blank"
                className="flex-1 futuristic-btn-primary font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="h-4 w-4" /> Tax Invoice
              </Link>
              <Link
                href="/customer/messages"
                className="flex-1 futuristic-btn-secondary font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" /> Message Seller
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
