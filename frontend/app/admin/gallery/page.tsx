"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, PlusCircle, Trash2, Eye, EyeOff, X, Search } from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";

const CATEGORIES = ["store", "products", "services", "team", "events", "other"];

export default function AdminGalleryPage() {
  const [gallery, setGallery] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("store");

  const load = async () => {
    const list = await dbHelper.gallery.list();
    setGallery(list);
  };

  useEffect(() => {
    load();
    window.addEventListener("nexbyte-realtime", load);
    return () => window.removeEventListener("nexbyte-realtime", load);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    await dbHelper.gallery.create({ title, url, category });
    setIsModalOpen(false);
    setTitle(""); setUrl(""); setCategory("store");
    load();
  };

  const handleToggle = async (item: any) => {
    await dbHelper.gallery.update(item.id, { visible: !item.visible });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this gallery image?")) {
      await dbHelper.gallery.delete(id);
      load();
    }
  };

  const filtered = gallery.filter((g) =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Gallery Manager</h1>
          <p className="text-xs text-nex-mist mt-0.5">Manage website gallery images, categories, and visibility.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary !py-2.5 !px-4 text-xs flex items-center gap-1.5">
          <PlusCircle className="h-4 w-4" /> Add Image
        </button>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-nex-ink">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nex-mist" />
          <input type="text" placeholder="Search title or category..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-nex-black border border-white/[0.08] pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <ImageIcon className="h-10 w-10 text-nex-mist mx-auto mb-3" />
          <p className="text-xs text-white">No gallery images found. Add your first image above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className={`glass-panel rounded-2xl bg-nex-ink border overflow-hidden transition-all ${item.visible ? "border-white/5" : "border-white/[0.02] opacity-50"}`}>
              <div className="aspect-video bg-white/[0.02] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/images/poster-products.webp"; }} />
              </div>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-white truncate">{item.title}</h3>
                <span className="inline-block mt-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[8px] text-nex-mist uppercase font-bold">{item.category}</span>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <button onClick={() => handleToggle(item)} className={`text-[10px] font-semibold flex items-center gap-1 ${item.visible ? "text-green-400" : "text-red-400"}`}>
                    {item.visible ? <><Eye className="h-3.5 w-3.5" /> Visible</> : <><EyeOff className="h-3.5 w-3.5" /> Hidden</>}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="glass-panel relative w-full max-w-md rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            <h3 className="font-display text-base font-bold text-white mb-5">Add Gallery Image</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Image Title *</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Store Interior"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Image URL *</label>
                <input type="text" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/images/store-photo.jpg or https://..."
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/80 font-semibold">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-nex-ink border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary !py-2 !px-4">Cancel</button>
                <button type="submit" className="btn-primary !py-2 !px-5">Add Image</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
