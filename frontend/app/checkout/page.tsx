"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomerHeader from "@/components/CustomerHeader";
import { useCartStore } from "@/lib/cartStore";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  Tag,
  ArrowRight,
  AlertCircle,
  FileText,
  Lock,
  ChevronRight,
  Check,
  Package,
  Shield,
  X
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotal, appliedOfferCode, setAppliedOfferCode } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);

  // Customer Contact State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Address State
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Tumkur");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("572101");

  // Delivery Option State
  const [deliveryOption, setDeliveryOption] = useState<"standard" | "express">("standard");

  // Optional Protection Plan State (Default: none)
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("none");

  // B2B GST Invoice State
  const [isGstInvoice, setIsGstInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");

  // Coupon & Offer State
  const [couponCode, setCouponCode] = useState(appliedOfferCode);
  const [appliedOffer, setAppliedOffer] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "BANK">("COD");

  // Load customer profile if logged in
  useEffect(() => {
    async function loadCustomerProfile() {
      try {
        const res = await fetch("/api/customer/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCustomerName(data.user.full_name || data.user.name || "");
            setCustomerEmail(data.user.email || "");
            setCustomerPhone(data.user.phone || "");
            if (data.user.address) setAddressLine1(data.user.address);
            if (data.user.city) setCity(data.user.city);
            if (data.user.pincode) setPincode(data.user.pincode);
          }
        }
      } catch (e) {
        // Guest mode fallback
      }
    }

    async function loadProtectionPlans() {
      try {
        const res = await fetch("/api/protection-plans");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.plans)) {
            setAvailablePlans(data.plans);
          }
        }
      } catch (e) {
        console.error("Failed to load protection plans", e);
      }
    }

    loadCustomerProfile();
    loadProtectionPlans();
  }, []);

  // Calculate Subtotals
  const cartSubtotal = getTotal();
  const discountAmount = appliedOffer ? appliedOffer.discountAmount : 0;
  const taxableSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const shippingFee = deliveryOption === "express" ? 199 : (cartSubtotal < 1000 ? 99 : 0);
  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
  const planPrice = selectedPlan ? Number(selectedPlan.price) || 0 : 0;
  const gstAmount = Math.round(taxableSubtotal * 0.18);
  const grandTotal = taxableSubtotal + gstAmount + shippingFee + planPrice;

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerCode: couponCode.trim(),
          cartItems: items,
          customerEmail: customerEmail.trim() || undefined,
          subtotalAmount: cartSubtotal,
        }),
      });

      const data = await res.json();
      if (data.valid) {
        const discountVal = Number(data.discountAmount) || 0;
        setAppliedOffer({
          code: data.offer?.code || couponCode.trim().toUpperCase(),
          discountAmount: discountVal,
        });
        setAppliedOfferCode(data.offer?.code || couponCode.trim().toUpperCase());
        setCouponMessage({
          type: "success",
          text: `Code ${data.offer?.code || couponCode.trim().toUpperCase()} applied! You save ₹${discountVal.toLocaleString("en-IN")}`,
        });
      } else {
        setAppliedOffer(null);
        setAppliedOfferCode("");
        setCouponMessage({
          type: "error",
          text: data.error || "Invalid or expired offer code.",
        });
      }
    } catch (err) {
      setAppliedOfferCode("");
      setCouponMessage({ type: "error", text: "Failed to validate coupon code." });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setAppliedOfferCode("");
    setCouponCode("");
    setCouponMessage(null);
  };

  // Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty. Please add products before checking out.");
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setError("Please complete your contact details (Name, Email, Phone).");
      return;
    }

    if (!addressLine1 || !city || !pincode) {
      setError("Please complete your shipping address.");
      return;
    }

    if (isGstInvoice && !gstin.trim()) {
      setError("Please enter your 15-character GSTIN number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          shippingAddress: {
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
          },
          deliveryOption,
          protectionPlanId: selectedPlanId !== "none" ? selectedPlanId : undefined,
          gstDetails: {
            isGstInvoice,
            companyName,
            gstin,
          },
          paymentMethod,
          offerCode: appliedOffer?.code || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to place order.");
        setLoading(false);
        return;
      }

      setOrderPlaced({ ...data.order, warning: data.warning });
      clearCart();

      if (data?.order) {
        try {
          const raw = localStorage.getItem("nexbyte_orders");
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [data.order, ...existing.filter((o: any) => (o.order_id || o.id) !== (data.order.order_id || data.order.id))];
          localStorage.setItem("nexbyte_orders", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("nexbyte-data-changed", { detail: { table: "orders", action: "insert", data: data.order } }));
        } catch {}
      }
    } catch (err: any) {
      setError("Network error. Please try placing your order again.");
    } finally {
      setLoading(false);
    }
  };

  // ORDER SUCCESS SCREEN
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC]">
        <CustomerHeader />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase rounded-full border border-emerald-500/20">
              Order Confirmed &amp; Invoiced
            </span>
            <h1 className="heading-h1">Thank You For Your Order!</h1>
            <p className="text-sm text-readable-secondary">
              Order <code className="font-mono font-bold text-slate-900 dark:text-slate-100">#{orderPlaced.order_number || orderPlaced.order_id}</code> has been successfully received.
            </p>
          </div>

          <div className="futuristic-card p-6 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10 text-xs">
              <span className="text-readable-secondary font-semibold">Grand Total Paid / Due</span>
              <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">
                ₹{(orderPlaced.total_amount || grandTotal).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-xs space-y-1.5 text-readable-secondary">
              <p><strong className="text-slate-900 dark:text-slate-100">Deliver to:</strong> {customerName}, {addressLine1}, {city} - {pincode}</p>
              <p><strong className="text-slate-900 dark:text-slate-100">Delivery Status:</strong> {orderPlaced.status || "Confirmed"} via {orderPlaced.courier}</p>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">Tracking Number:</strong>{" "}
                <Link
                  href={`/track?search=${encodeURIComponent(orderPlaced.order_number || orderPlaced.order_id || orderPlaced.tracking_number)}`}
                  className="font-mono text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                >
                  {orderPlaced.tracking_number || orderPlaced.tracking_id}
                </Link>
              </p>
              
              {orderPlaced.applied_offer_code && (
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  <strong>Offer Applied:</strong> {orderPlaced.applied_offer_code} (Saved ₹{Number(orderPlaced.discount_amount || 0).toLocaleString("en-IN")})
                </p>
              )}

              {orderPlaced.protection_plan ? (
                <p className="text-violet-600 dark:text-violet-400 font-semibold">
                  <strong>Protection Plan:</strong> {orderPlaced.protection_plan.title} ({orderPlaced.protection_plan.duration}) — ₹{Number(orderPlaced.protection_plan.price).toLocaleString("en-IN")}
                </p>
              ) : (
                <p className="text-readable-muted">
                  <strong>Protection Plan:</strong> None selected (Standard 1-Year NexLapTech Warranty applies)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={`/track?search=${encodeURIComponent(orderPlaced.order_number || orderPlaced.order_id || orderPlaced.tracking_number)}`}
              className="futuristic-btn-primary px-6 py-3 text-xs inline-flex items-center justify-center font-bold rounded-xl gap-2 shadow-lg"
            >
              <Truck className="h-4 w-4" />
              <span>Track Order Live</span>
            </Link>
            <Link
              href="/customer/orders"
              className="futuristic-btn-secondary px-6 py-3 text-xs inline-flex items-center justify-center font-bold rounded-xl"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="futuristic-btn-secondary px-6 py-3 text-xs inline-flex items-center justify-center font-bold rounded-xl"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1A] text-[#0F172A] dark:text-[#F8FAFC] pb-20">
      <CustomerHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
            <Lock className="w-3 h-3 text-cyan-500" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h1 className="heading-h1">Secure Checkout</h1>
          <p className="text-xs text-readable-secondary">
            Complete your shipping details, review optional protection plans, and confirm your order.
          </p>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: FORM INPUTS */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Contact Information */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/20">1</span>
                <span>Contact Details</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="order-confirmation@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/20">2</span>
                <span>Shipping Address</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No., Building, Street Name"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Landmark, Area, Colony"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="futuristic-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delivery Options */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/20">3</span>
                <span>Select Delivery Option</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryOption("standard")}
                  className={`p-4 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                    deliveryOption === "standard"
                      ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                      : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <Truck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Standard Delivery</h3>
                    <p className="text-readable-secondary text-[11px] mt-0.5">3–5 Business Days</p>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                      {cartSubtotal >= 1000 ? "FREE" : "₹99"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryOption("express")}
                  className={`p-4 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                    deliveryOption === "express"
                      ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
                      : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <Truck className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Priority Express</h3>
                    <p className="text-readable-secondary text-[11px] mt-0.5">1–2 Days Doorstep</p>
                    <span className="font-bold text-violet-600 dark:text-violet-400 block mt-1">₹199</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. OPTIONAL PROTECTION PLANS */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-extrabold flex items-center justify-center border border-violet-500/20">4</span>
                    <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    <span>Optional Device Protection Plans</span>
                  </h2>
                  <p className="text-xs text-readable-secondary mt-1">
                    Add peace of mind with accidental damage, spill protection, and extended doorstep repairs. Protection is 100% optional.
                  </p>
                </div>
              </div>

              {/* Option A: Decline / Continue Without Plan (DEFAULT) */}
              <div
                onClick={() => setSelectedPlanId("none")}
                className={`p-4 rounded-xl border text-left cursor-pointer transition flex items-start justify-between ${
                  selectedPlanId === "none"
                    ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20 font-bold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="protectionPlanOption"
                      checked={selectedPlanId === "none"}
                      onChange={() => setSelectedPlanId("none")}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Continue Without Protection Plan</span>
                  </div>
                  <p className="text-[11px] text-readable-secondary pl-5">
                    Include standard 1-Year NexLapTech warranty with no additional charge.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹0 Free</span>
              </div>

              {/* Option B: Available Active Protection Plans */}
              {availablePlans.length > 0 && (
                <div className="space-y-3 pt-1">
                  <span className="text-[11px] font-bold text-readable-secondary uppercase tracking-wider block">
                    Available Add-On Protection Packages:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {availablePlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition space-y-2.5 relative ${
                            isSelected
                              ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
                              : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="protectionPlanOption"
                                checked={isSelected}
                                onChange={() => setSelectedPlanId(plan.id)}
                                className="text-violet-600 focus:ring-violet-500"
                              />
                              <h3 className="font-bold text-slate-900 dark:text-white">{plan.title}</h3>
                            </div>
                            <span className="font-extrabold text-violet-600 dark:text-violet-400 shrink-0">
                              +₹{plan.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <p className="text-readable-secondary text-[11px] pl-5 leading-relaxed">
                            {plan.description}
                          </p>

                          <div className="pl-5 text-[10px] text-readable-muted flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-1.5">
                            <span>Duration: {plan.duration || "1 Year"}</span>
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">Zero-Deductible</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. GST B2B Invoice Option */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Need a GST B2B Invoice?</h2>
                </div>
                <input
                  type="checkbox"
                  checked={isGstInvoice}
                  onChange={(e) => setIsGstInvoice(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded border-slate-300 dark:border-slate-600"
                />
              </div>

              {isGstInvoice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-white/10">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Company Registered Name</label>
                    <input
                      type="text"
                      placeholder="e.g. NexLapTech Private Limited"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="futuristic-input w-full p-3 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-character GST Number"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="futuristic-input w-full p-3 rounded-xl text-xs uppercase font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. Payment Methods */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-extrabold flex items-center justify-center border border-cyan-500/20">5</span>
                <span>Payment Method</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    paymentMethod === "COD"
                      ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20 font-bold"
                      : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="block text-slate-900 dark:text-white">Cash on Delivery</span>
                  <span className="text-[11px] text-readable-secondary font-normal">Pay upon receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    paymentMethod === "UPI"
                      ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20 font-bold"
                      : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="block text-slate-900 dark:text-white">UPI / QR Code</span>
                  <span className="text-[11px] text-readable-secondary font-normal">Google Pay, PhonePe, Paytm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK")}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    paymentMethod === "BANK"
                      ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20 font-bold"
                      : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="block text-slate-900 dark:text-white">Direct Bank Transfer</span>
                  <span className="text-[11px] text-readable-secondary font-normal">NEFT / RTGS</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: ORDER SUMMARY & FINAL BILL */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">

            {/* Cart Items List */}
            <div className="futuristic-card p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Order Summary ({items.length} Items)</span>
                <Link href="/customer/cart" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-normal">
                  Edit Cart
                </Link>
              </h2>

              <div className="divide-y divide-slate-200 dark:divide-white/10 max-h-60 overflow-y-auto pr-1 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{item.title}</p>
                      <p className="text-readable-secondary">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Promo / Referral Code</span>
                  </span>
                  {appliedOffer && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-rose-500 hover:underline font-semibold flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove Code
                    </button>
                  )}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. NEX10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="futuristic-input flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="futuristic-btn-primary px-3.5 py-2 text-xs rounded-xl"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-xs font-medium ${
                    couponMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-500"
                  }`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Price Calculation Matrix */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-readable-secondary">
                  <span>Items Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-semibold">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>

                {appliedOffer && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount ({appliedOffer.code})</span>
                    <span>- ₹{appliedOffer.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {/* Optional Protection Plan Line Item */}
                {selectedPlan && (
                  <div className="flex justify-between text-violet-600 dark:text-violet-400 font-semibold bg-violet-500/10 p-2 rounded-lg border border-violet-500/20">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{selectedPlan.title}</span>
                    </span>
                    <span>+ ₹{planPrice.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-readable-secondary">
                  <span>Estimated Shipping</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
                </div>

                <div className="flex justify-between text-readable-secondary">
                  <span>GST (18% Tax Breakdown)</span>
                  <span className="text-slate-900 dark:text-white font-semibold">₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total</span>
                  <span className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="futuristic-btn-accent w-full py-4 text-sm font-extrabold rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Place Order &amp; Generate Invoice</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-readable-muted text-center space-y-1 pt-1">
                <p>🔒 256-Bit SSL Encrypted &amp; Server-Verified Transaction</p>
                <p>Official NexLapTech Tax Invoice generated automatically upon placement.</p>
              </div>
            </div>

          </div>

        </form>
      </main>
    </div>
  );
}
