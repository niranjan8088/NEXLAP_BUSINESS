"use client";

import React, { useEffect, useState } from "react";
import { Search, User, Edit3, RefreshCw } from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [totalBookings, setTotalBookings] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [productsPurchased, setProductsPurchased] = useState("");
  const [servicesTaken, setServicesTaken] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.customers)) {
          setCustomers(data.customers);
          try {
            localStorage.setItem("nexbyte_customers", JSON.stringify(data.customers));
          } catch {}
          return;
        }
      }
      const list = await dbHelper.customers.list();
      setCustomers(list);
    } catch (err) {
      console.warn("Customers API fetch warning, using local fallback:", err);
      try {
        const list = await dbHelper.customers.list();
        setCustomers(list);
      } catch {
        alert("Failed to load customer profiles.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("nexbyte-realtime", handler);
    return () => window.removeEventListener("nexbyte-realtime", handler);
  }, []);

  const openEdit = (cust: any) => {
    setSelectedCust(cust);
    setName(cust.name || "");
    setPhone(cust.phone || "");
    setEmail(cust.email || "");
    setCity(cust.city || "");
    setAddress(cust.address || "");
    setTotalBookings(cust.totalBookings || 0);
    setReviewsCount(cust.reviewsCount || 0);
    setCertificatesCount(cust.certificatesCount || 0);
    setProductsPurchased(cust.productsPurchased || "");
    setServicesTaken(cust.servicesTaken || "");
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;

    const payload = {
      name,
      phone,
      email,
      city,
      address,
      totalBookings,
      reviewsCount,
      certificatesCount,
      productsPurchased,
      servicesTaken,
    };

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCust.id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update customer");
      }
      setShowEditModal(false);
      await load();
      window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
    } catch (err: any) {
      console.warn("API update failed, trying fallback:", err);
      try {
        await dbHelper.customers.update(selectedCust.id, payload);
        setShowEditModal(false);
        await load();
        window.dispatchEvent(new CustomEvent("nexbyte-realtime"));
      } catch {
        alert("Failed to save customer profile.");
      }
    }
  };

  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.phone?.includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s) ||
      c.customerId?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600 dark:text-cyan-400" /> Customer Directory Database
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Realtime consolidated database profiles auto-generated upon enquiries.</p>
        </div>
      </div>

      {/* Search */}
      <div className="futuristic-card p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone number, city, email..."
            className="futuristic-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>
      </div>

      {/* Customers List Grid */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 dark:text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading directories...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 futuristic-card rounded-2xl">
          <User className="h-10 w-10 text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">No customer profiles registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="futuristic-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/5 pb-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      {c.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block">{c.customerId}</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 dark:text-cyan-400 font-mono font-bold bg-indigo-50 dark:bg-cyan-500/10 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-cyan-500/30">
                    {c.city}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <p><strong className="text-slate-900 dark:text-white">Phone:</strong> {c.phone}</p>
                  <p><strong className="text-slate-900 dark:text-white">Email:</strong> {c.email || "N/A"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Address:</strong> {c.address || "N/A"}</p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Bookings</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">{c.totalBookings || 0}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Reviews</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">{c.reviewsCount || 0}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Certs</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">{c.certificatesCount || 0}</span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-1 border-t border-slate-100 dark:border-white/5 mt-3">
                    <p><strong className="text-slate-900 dark:text-white">Products Purchased:</strong> <span className="italic">{c.productsPurchased || "None recorded"}</span></p>
                    <p><strong className="text-slate-900 dark:text-white">Services Rendered:</strong> <span className="italic">{c.servicesTaken || "None recorded"}</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 dark:border-white/5 pt-4 flex gap-2 justify-end">
                <button onClick={() => openEdit(c)} className="futuristic-btn-secondary !py-1.5 !px-3 text-[11px] flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3" /> Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-lg futuristic-card bg-white dark:bg-[#0B0F1E] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white z-10">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Customer Profile</h3>
            
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="futuristic-input w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Phone</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="futuristic-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="futuristic-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="futuristic-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="futuristic-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Total Bookings</label>
                  <input type="number" value={totalBookings} onChange={(e) => setTotalBookings(parseInt(e.target.value) || 0)} className="futuristic-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Reviews Count</label>
                  <input type="number" value={reviewsCount} onChange={(e) => setReviewsCount(parseInt(e.target.value) || 0)} className="futuristic-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Certs Issued</label>
                  <input type="number" value={certificatesCount} onChange={(e) => setCertificatesCount(parseInt(e.target.value) || 0)} className="futuristic-input w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Products Enquired / Purchased</label>
                <input type="text" value={productsPurchased} onChange={(e) => setProductsPurchased(e.target.value)} placeholder="comma separated items..." className="futuristic-input w-full" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Services Taken</label>
                <input type="text" value={servicesTaken} onChange={(e) => setServicesTaken(e.target.value)} placeholder="comma separated services..." className="futuristic-input w-full" />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)} className="futuristic-btn-secondary !py-2 !px-4 text-xs">Cancel</button>
                <button type="submit" className="futuristic-btn-primary !py-2 !px-6 text-xs font-semibold">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
