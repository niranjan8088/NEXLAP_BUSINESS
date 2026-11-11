"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  Loader2,
} from "lucide-react";

type Status = "all" | "pending" | "active" | "suspended" | "rejected";

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resellers");
      if (res.ok) {
        const data = await res.json();
        if (data.resellers && Array.isArray(data.resellers)) {
          setResellers(data.resellers);
        }
      }
    } catch (err) {
      console.error("Failed to load resellers:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();

    const handleDataChange = (e: any) => {
      if (e.detail?.table === "resellers") {
        load();
      }
    };
    window.addEventListener("nexbyte-data-changed", handleDataChange);
    return () => window.removeEventListener("nexbyte-data-changed", handleDataChange);
  }, []);

  const handleAction = async (id: string, newStatus: string) => {
    setActionLoading(id + newStatus);
    try {
      const res = await fetch("/api/admin/resellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await load();
      }
    } catch (err) {
      console.error("Failed to update reseller status:", err);
    }
    setActionLoading(null);
  };

  const filtered = resellers.filter((r) => {
    const matchSearch =
      !search ||
      r.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      suspended: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
      rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
    };
    return map[s] || "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white/60 border-slate-200 dark:border-white/10";
  };

  const counts = {
    all: resellers.length,
    pending: resellers.filter((r) => r.status === "pending").length,
    active: resellers.filter((r) => r.status === "active").length,
    suspended: resellers.filter((r) => r.status === "suspended").length,
    rejected: resellers.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Reseller Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approve, suspend, and manage NexLapTech partner resellers.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/20 px-3 py-1.5 rounded-full">
            {counts.pending} Pending
          </span>
          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
            {counts.active} Active
          </span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, city..."
            className="w-full rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-black/30 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
          {(["all", "pending", "active", "suspended", "rejected"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
              }`}
            >
              {s} {counts[s] > 0 && <span className="ml-1 text-[9px]">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-cyan-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] shadow-sm">
          <Building2 className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-xs text-slate-600 dark:text-slate-400">No resellers found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-900 dark:text-white border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-5">Business</th>
                  <th className="py-3 px-4">Owner / Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{r.business_name}</div>
                        {r.gstin && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">GST: {r.gstin}</div>}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(r.created_at || Date.now()).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.owner_name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{r.email}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.phone}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                      {r.city}
                      {r.state ? `, ${r.state}` : ""}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 capitalize">{r.business_type?.replace("_", " ")}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {/* View details */}
                        <button
                          onClick={() => setSelected(r)}
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Approve */}
                        {(r.status === "pending" || r.status === "suspended" || r.status === "rejected") && (
                          <button
                            onClick={() => handleAction(r.id, "active")}
                            disabled={actionLoading === r.id + "active"}
                            className="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Approve"
                          >
                            {actionLoading === r.id + "active" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>
                        )}

                        {/* Reject */}
                        {r.status === "pending" && (
                          <button
                            onClick={() => handleAction(r.id, "rejected")}
                            disabled={actionLoading === r.id + "rejected"}
                            className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}

                        {/* Suspend */}
                        {r.status === "active" && (
                          <button
                            onClick={() => handleAction(r.id, "suspended")}
                            disabled={actionLoading === r.id + "suspended"}
                            className="h-8 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Suspend"
                          >
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F1E] p-6 shadow-2xl z-10 text-slate-900 dark:text-white">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-indigo-600 dark:text-cyan-400" /> {selected.business_name}
            </h3>
            <div className="space-y-3 text-xs">
              {[
                ["Owner", selected.owner_name],
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["City", `${selected.city || ""}${selected.state ? ", " + selected.state : ""}`],
                ["Business Type", selected.business_type?.replace("_", " ")],
                ["GSTIN", selected.gstin || "N/A"],
                ["Status", selected.status],
                ["Joined", new Date(selected.created_at || Date.now()).toLocaleDateString("en-IN")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">{k}</span>
                  <span className="text-slate-900 dark:text-white font-medium capitalize">{v}</span>
                </div>
              ))}
              {selected.description && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Business Description</span>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-3 rounded-xl">
                    {selected.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
