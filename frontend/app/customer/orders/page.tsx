"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Truck,
  CheckCircle2,
  FileText,
  MessageSquare,
  ShieldCheck,
  X,
  Clock
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function CustomerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await safeJsonFetch("/api/customer/orders");
      if (res.ok && Array.isArray(res.data?.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Orders load error", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return 3;
    if (s.includes("out for delivery")) return 2;
    if (s.includes("processing") || s.includes("dispatched")) return 1;
    return 0; // Confirmed
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Boxes className="h-3.5 w-3.5 text-emerald-600" /> Purchase &amp; Order History
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Hardware Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Track hardware shipments live, view variant details, download official tax invoices, and message your seller.
        </p>
      </div>

      {/* Activity Workflow Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
        <Link
          href="/customer/orders"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Package className="h-4 w-4" />
          <span>Product Orders ({orders.length})</span>
        </Link>
        <Link
          href="/customer/bookings"
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Clock className="h-4 w-4" />
          <span>Service Bookings</span>
        </Link>
        <Link
          href="/customer/laptop-enquiry"
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Boxes className="h-4 w-4" />
          <span>Laptop Enquiries</span>
        </Link>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="rounded-2xl border border-[#E6EAF0] dark:border-white/10 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-500 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-600" />
          <span>Fetching your order history...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[#E6EAF0] dark:border-white/10 bg-white dark:bg-slate-900 p-12 text-center space-y-3 shadow-sm">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            No orders found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any hardware orders yet. Explore our genuine laptop and desktop catalog.
          </p>
          <Link
            href="/customer/shop"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs px-4 py-2 shadow-sm hover:bg-sky-700 transition-colors"
          >
            <span>Browse Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const orderNum = ord.order_number || ord.order_id || `NEX-2026-${ord.id.slice(0, 4)}`;
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
                className="rounded-3xl border border-[#E6EAF0] dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                        Order #{orderNum}
                      </span>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Ordered on {dateStr}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Package className="h-3.5 w-3.5 text-nex-blue" />
                      <span>Order Details</span>
                    </button>

                    <Link
                      href="/customer/messages"
                      className="rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-700 dark:text-purple-300 px-3 py-2 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Message Seller</span>
                    </Link>
                  </div>
                </div>

                {/* Delivery Progress Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
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
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Amount Paid</span>
                    <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                      ₹{amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/customer/ewarranty"
                      className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>E-Warranty</span>
                    </Link>

                    <Link
                      href={`/invoice/view/${ord.id}`}
                      target="_blank"
                      className="rounded-xl bg-nex-blue text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm"
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
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />

          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl z-10 text-slate-900 dark:text-white space-y-5">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                {selectedOrder.status}
              </span>
              <h3 className="font-display text-lg font-bold mt-1">
                Order #{selectedOrder.order_number || selectedOrder.id}
              </h3>
              {selectedOrder.tracking_number && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Courier: {selectedOrder.courier || "NexLapTech Express"} • Tracking #{selectedOrder.tracking_number}
                </p>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Purchased Hardware Items</h4>
              {(selectedOrder.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/10">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</div>
                    {item.variant && (
                      <span className="text-[10px] font-bold text-nex-blue dark:text-nex-blueLight">
                        Variant: {item.variant}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-500">Qty: {item.quantity || 1}</div>
                  </div>
                  <div className="font-display font-extrabold text-xs text-slate-900 dark:text-white">
                    ₹{((item.price || selectedOrder.total_amount || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center text-xs font-bold">
              <span>Grand Total Paid:</span>
              <span className="text-base text-nex-blue font-extrabold">
                ₹{(selectedOrder.total_amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <Link
                href={`/invoice/view/${selectedOrder.id}`}
                target="_blank"
                className="flex-1 rounded-xl bg-nex-blue text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="h-4 w-4" /> Download Tax Invoice
              </Link>
              <Link
                href="/customer/messages"
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" /> Contact Seller
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
