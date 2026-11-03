"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowLeft, Loader2, CheckCircle, AlertCircle, Star } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { val: "gaming_pcs", label: "Gaming PCs" },
  { val: "business_laptops", label: "Business Laptops" },
  { val: "premium_used_laptops", label: "Premium Used Laptops" },
  { val: "second_hand_laptops", label: "Second-Hand Laptops" },
  { val: "servers", label: "Servers" },
  { val: "desktop_systems", label: "Desktop Systems" },
  { val: "accessories", label: "Accessories" },
  { val: "storage", label: "Storage" },
  { val: "networking", label: "Networking" },
  { val: "monitors", label: "Monitors" },
  { val: "cctv", label: "CCTV" },
];

export default function ResellerAddProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("gaming_pcs");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("");
  const [warranty, setWarranty] = useState("");
  const [condition, setCondition] = useState("new");
  const [images, setImages] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (files: File[]) => {
    setImageError("");
    const valid = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { setImageError(`"${f.name}" exceeds 5MB limit.`); return false; }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setImageError(`"${f.name}" must be JPG, PNG, or WebP.`); return false; }
      return true;
    });
    const remaining = 10 - images.length;
    const toAdd = valid.slice(0, remaining);
    if (toAdd.length < valid.length) setImageError("Maximum 10 images allowed.");
    setImages(prev => [
      ...prev,
      ...toAdd.map((file, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        url: URL.createObjectURL(file),
        file,
        is_primary: prev.length === 0 && idx === 0,
        sort_order: prev.length + idx + 1,
        alt_text: "",
      }))
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (images.length === 0) { setError("At least 1 product image is required."); return; }
    setSubmitting(true);

    try {
      // Upload images first
      const uploaded: any[] = [];
      const tempProductId = `prod-${Date.now()}`;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.file) {
          setUploadProgress(`Uploading image ${i + 1} of ${images.length}...`);
          const form = new FormData();
          form.append("file", img.file);
          form.append("productId", tempProductId);

          let fileUrl = "";
          try {
            const res = await fetch("/api/upload", { method: "POST", body: form });
            const text = await res.text();
            let json: any = null;
            try {
              json = JSON.parse(text);
            } catch {}
            if (json && json.success && json.fileUrl) {
              fileUrl = json.fileUrl;
            }
          } catch (uploadErr) {
            console.warn("Server /api/upload failed, using base64 fallback:", uploadErr);
          }

          if (!fileUrl && img.file) {
            fileUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(img.file!);
            });
          }

          if (!fileUrl) throw new Error("Upload failed.");
          uploaded.push({ id: img.id, url: fileUrl, is_primary: img.is_primary, sort_order: i + 1, alt_text: img.alt_text });
        }
      }

      setUploadProgress("Saving product...");
      const res = await fetch("/api/reseller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, category, price: Number(price),
          discount: Number(discount), stock: Number(stock),
          warranty, condition, images: uploaded,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const inputCls = "w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-nex-blue/40 focus:outline-none transition-colors";
  const labelCls = "text-[11px] font-semibold text-white/80 block mb-1";

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-white">Product Submitted!</h2>
        <p className="text-xs text-nex-mist max-w-xs mx-auto leading-relaxed">
          Your product has been submitted and is pending admin review.
          It will appear in the public catalog once approved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/reseller/products" className="btn-primary !py-2.5 !px-5 text-xs">
            View My Products
          </Link>
          <button onClick={() => { setSuccess(false); setImages([]); setTitle(""); setDescription(""); setPrice(""); setStock(""); }}
            className="btn-secondary !py-2.5 !px-5 text-xs">
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reseller/products" className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Add New Product</h1>
          <p className="text-xs text-nex-mist mt-0.5">Product will be reviewed by admin before going live.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">{error}</div>
        )}

        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-nex-ink space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lenovo ThinkPad T480" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select required value={category} onChange={e => setCategory(e.target.value)}
                className={inputCls + " bg-nex-ink"}>
                {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className={inputCls + " bg-nex-ink"}>
                <option value="new">Brand New</option>
                <option value="premium_used">Premium Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Describe the product specifications..."
                className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-nex-ink space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Pricing & Inventory</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input type="number" required min={0} value={price} onChange={e => setPrice(e.target.value)}
                placeholder="45000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Discount (%)</label>
              <input type="number" min={0} max={100} value={discount} onChange={e => setDiscount(e.target.value)}
                placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock Qty *</label>
              <input type="number" required min={0} value={stock} onChange={e => setStock(e.target.value)}
                placeholder="10" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Warranty</label>
              <input value={warranty} onChange={e => setWarranty(e.target.value)}
                placeholder="1 Year" className={inputCls} />
            </div>
          </div>
          {price && discount && Number(discount) > 0 && (
            <div className="text-xs text-green-400 font-semibold">
              Selling Price: ₹{Math.round(Number(price) * (1 - Number(discount) / 100)).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-nex-ink space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white">Product Images *</h3>
            <span className={`text-[11px] font-bold ${images.length >= 10 ? "text-amber-400" : "text-nex-mist"}`}>
              {images.length} / 10
            </span>
          </div>

          {imageError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{imageError}</div>
          )}

          {images.length < 10 && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFileSelect(Array.from(e.dataTransfer.files)); }}
              className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all ${isDragging ? "border-nex-blue bg-nex-blue/10" : "border-white/15 hover:border-white/30"}`}
            >
              <input type="file" multiple accept="image/jpeg,image/png,image/webp"
                onChange={e => { if (e.target.files?.length) handleFileSelect(Array.from(e.target.files)); e.target.value = ""; }}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload className="h-8 w-8 text-nex-mist mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Drop images or click to upload</p>
              <p className="text-[10px] text-nex-mist mt-1">JPG, PNG, WebP — max 5MB each</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 bg-nex-blue rounded px-1 py-0.5 text-[8px] font-bold text-white flex items-center gap-0.5">
                      <Star className="h-2 w-2 fill-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {!img.is_primary && (
                      <button type="button" onClick={() => setImages(prev => prev.map((i, j) => ({ ...i, is_primary: j === idx })))}
                        className="p-1 bg-nex-blue rounded text-white text-[9px]">★</button>
                    )}
                    <button type="button" onClick={() => {
                      if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
                      setImages(prev => {
                        const next = prev.filter((_, j) => j !== idx);
                        if (!next.some(i => i.is_primary) && next.length > 0) next[0].is_primary = true;
                        return next;
                      });
                    }} className="p-1 bg-red-600 rounded text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/reseller/products" className="btn-secondary !py-2.5 !px-5 text-xs">Cancel</Link>
          <button type="submit" disabled={submitting || !title || !price || !stock || images.length === 0}
            className="btn-primary !py-2.5 !px-6 text-xs font-bold flex items-center gap-2">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{uploadProgress || "Saving..."}</>
            ) : (
              <><CheckCircle className="h-4 w-4" /> Submit for Approval</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
