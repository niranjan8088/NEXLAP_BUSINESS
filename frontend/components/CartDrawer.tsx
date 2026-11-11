"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, CheckCircle2, Loader2, Sparkles, Tag } from "lucide-react";
import { getSafeImageSrc } from "@/lib/utils";
import { safeJsonFetch } from "@/lib/apiHelper";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, getTotal, getItemCount, appliedOfferCode, setAppliedOfferCode } = useCartStore();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && (pathname.includes("/signin") || pathname.includes("/login") || pathname.includes("/checkout"))) {
      closeCart();
    }
  }, [pathname, closeCart]);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Referral / Promo Offer State
  const [promoCodeInput, setPromoCodeInput] = useState(appliedOfferCode);
  const [appliedOffer, setAppliedOffer] = useState<{
    code: string;
    discountValue: number;
    discountType: "percentage" | "fixed";
    maximumDiscount: number;
    title: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);

  useEffect(() => {
    if (appliedOfferCode) setPromoCodeInput(appliedOfferCode);
  }, [appliedOfferCode]);

  if (!isOpen) return null;

  const subtotal = getTotal();

  // Calculate discount according to rule: Subtotal -> Offer Discount -> Grand Total
  let discountAmount = 0;
  if (appliedOffer) {
  if (appliedOffer.discountType === "percentage") {
    discountAmount = Math.round((subtotal * appliedOffer.discountValue) / 100);
    } else {
    discountAmount = appliedOffer.discountValue;
    }
  if (appliedOffer.maximumDiscount > 0) discountAmount = Math.min(discountAmount, appliedOffer.maximumDiscount);
  discountAmount = Math.min(discountAmount, subtotal);
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(taxableSubtotal * 0.18);
  const shippingFee = subtotal < 1000 ? 99 : 0;
  const grandTotal = taxableSubtotal + gstAmount + shippingFee;

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError("Please enter a referral or offer code.");
      return;
    }

    setValidatingPromo(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await safeJsonFetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerCode: promoCodeInput.trim(),
          cartItems: items,
          subtotalAmount: subtotal,
        }),
      });

      if (!res.ok || !res.data?.valid) {
        setPromoError(res.data?.error || res.error || "Invalid or expired referral code.");
        setAppliedOffer(null);
        setAppliedOfferCode("");
      } else {
        const offer = res.data.offer;
        setAppliedOffer({
          code: offer.code,
          discountValue: Number(offer.discountValue),
          discountType: offer.discountType,
          maximumDiscount: Number(offer.maximumDiscount) || 0,
          title: offer.name,
        });
        setAppliedOfferCode(offer.code);
        setPromoSuccess(`Offer applied — you save ₹${Number(res.data.discountAmount || 0).toLocaleString("en-IN")}`);
      }
    } catch (e: any) {
      setAppliedOffer(null);
      setAppliedOfferCode("");
      setPromoError("Failed to validate code. Please try again.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedOffer(null);
    setAppliedOfferCode("");
    setPromoSuccess("");
    setPromoError("");
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
      alert("Please enter Name, Email, Phone, and Delivery Address.");
      return;
    }

    const pincode = shippingAddress.match(/\b\d{6}\b/)?.[0];
    if (!pincode) {
      alert("Please include a valid 6-digit pincode in your delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const addressParts = shippingAddress
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      const addressWithoutPincode = addressParts.filter(
        (part) => !/\b\d{6}\b/.test(part)
      );
      let city = addressWithoutPincode.at(-1) || "Tumkur";
      if (city.toLowerCase() === "karnataka") {
        city = addressWithoutPincode.at(-2) || "Tumkur";
      }

      const res = await safeJsonFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          shippingAddress: {
            addressLine1: shippingAddress,
            addressLine2: "",
            city,
            state: "Karnataka",
            pincode,
          },
          deliveryOption: "standard",
          paymentMethod,
          offerCode: appliedOffer?.code || "",
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            title: i.title,
            variantId: i.variantId,
            variantSku: i.variantSku,
            variant: i.variantName,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
      });

      if (res.status === 401) {
        closeCart();
        window.location.assign(`/customer/signin?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (!res.ok || !res.data?.success) {
        throw new Error(res.data?.error || res.error || "Failed to place order.");
      }

      const placedOrder = res.data.order;
      setCompletedOrder(placedOrder);
      clearCart();

      if (placedOrder) {
        try {
          const raw = localStorage.getItem("nexbyte_orders");
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [placedOrder, ...existing.filter((o: any) => (o.order_id || o.id) !== (placedOrder.order_id || placedOrder.id))];
          localStorage.setItem("nexbyte_orders", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("nexbyte-data-changed", { detail: { table: "orders", action: "insert", data: placedOrder } }));
        } catch {}
      }
    } catch (err: any) {
      console.error("Cart checkout failed.", err);
      alert(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBeginCheckout = async () => {
    try {
      const res = await fetch("/api/customer/favorites");
      if (res.status === 401) {
        closeCart();
        window.location.assign(`/customer/signin?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (!res.ok) {
        throw new Error("Unable to verify your customer sign-in. Please try again.");
      }
      setIsCheckingOut(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to verify your customer sign-in.");
    }
  };

  const handleClose = () => {
    setIsCheckingOut(false);
    setCompletedOrder(null);
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-nex-blue/10 border border-nex-blue/20 text-nex-blue dark:text-nex-blueLight flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">Your Shopping Cart</h3>
              <p className="text-[10px] text-slate-500">{getItemCount()} item(s) selected</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {completedOrder ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-display text-lg font-bold">Order Confirmed!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Thank you for ordering with NexLapTech.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-left space-y-1.5 text-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Order Reference Number</div>
                <div className="font-mono text-base font-bold text-nex-blue dark:text-nex-blueLight">
                  {completedOrder.order_number || completedOrder.order_id || completedOrder.id}
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Total Amount Due: <span className="font-bold text-slate-900 dark:text-white">₹{(completedOrder.total_amount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <a
                  href={`/customer/requests`}
                  onClick={handleClose}
                  className="rounded-xl bg-nex-blue text-white py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  Track Order Status <ArrowRight className="h-4 w-4" />
                </a>
                <button onClick={handleClose} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : isCheckingOut ? (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <span className="font-bold uppercase text-[11px] tracking-wider text-slate-700 dark:text-slate-300">Customer Delivery Details</span>
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="text-nex-blue dark:text-nex-blueLight hover:underline text-[11px]"
                >
                  ← Back to Cart
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="rahul@gmail.com"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="House/Flat No., Building Name, Street, City, Pincode"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-nex-blue resize-none"
                />
              </div>

              {/* Referral / Promo Code Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                  <Tag className="h-3.5 w-3.5 text-nex-blue" />
                  <span>Have a referral code?</span>
                </div>

                {appliedOffer ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{appliedOffer.code}</span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Referral code applied — {appliedOffer.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Enter promo / referral code"
                      className="flex-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs uppercase font-mono"
                    />
                    <button
                      type="button"
                      disabled={validatingPromo}
                      onClick={handleApplyPromoCode}
                      className="rounded-xl bg-nex-blue hover:bg-blue-600 text-white font-bold px-3 py-1.5 text-xs shadow-sm shrink-0"
                    >
                      {validatingPromo ? "Checking..." : "Apply"}
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] font-bold text-rose-500">{promoError}</p>
                )}
                {promoSuccess && !appliedOffer && (
                  <p className="text-[11px] font-bold text-emerald-500">{promoSuccess}</p>
                )}
              </div>

              {/* Order Summary & Pricing Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {appliedOffer && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Offer Discount ({appliedOffer.code})</span>
                    <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Doorstep Delivery</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shippingFee ? `₹${shippingFee}` : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST (18%)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{gstAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1.5 border-t border-slate-200 dark:border-white/10 text-sm">
                  <span>Grand Total</span>
                  <span className="text-nex-blue dark:text-nex-blueLight">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-nex-blue hover:bg-blue-600 text-white font-bold py-3 text-xs shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Confirm Order (₹{grandTotal.toLocaleString("en-IN")})
                  </>
                )}
              </button>
            </form>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Your cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our catalog to add gaming PCs, laptops, and accessories.
              </p>
              <button
                onClick={handleClose}
                className="rounded-full bg-nex-blue text-white px-5 py-2 text-xs font-bold mt-2 shadow-sm"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 p-3 flex gap-3 items-center"
                >
                  <img
                    src={getSafeImageSrc(item.image)}
                    alt={item.title}
                    className="h-14 w-14 object-contain rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{item.title}</div>
                    {item.variantSku && <div className="text-[10px] text-slate-500 mt-0.5">SKU: {item.variantSku}</div>}
                    <div className="text-xs font-bold text-nex-blue dark:text-nex-blueLight mt-0.5">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-700 dark:text-slate-300"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-[11px] font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-700 dark:text-slate-300"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Bar */}
        {!isCheckingOut && !completedOrder && items.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Subtotal Amount</span>
              <span className="font-display text-lg font-extrabold text-nex-blue dark:text-white">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <button
              onClick={handleBeginCheckout}
              className="w-full rounded-xl bg-nex-blue hover:bg-blue-600 text-white font-bold py-3 text-xs shadow-md flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
