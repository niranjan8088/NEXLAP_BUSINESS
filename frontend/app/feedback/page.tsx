"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/ui/StarRating";
import { services, products } from "@/lib/data";
import { Send, Image as ImageIcon, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackPage() {
  // Form state
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [serviceUsed, setServiceUsed] = useState("");
  const [productPurchased, setProductPurchased] = useState("");
  const [isManualProduct, setIsManualProduct] = useState(false);
  const [manualProduct, setManualProduct] = useState("");
  const [overallExperience, setOverallExperience] = useState("");
  const [message, setMessage] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  
  // Bot Honeypot
  const [honeypot, setHoneypot] = useState("");

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 3) {
        setErrorMsg("You can upload a maximum of 3 images.");
        return;
      }
      
      const invalidFiles = selectedFiles.filter(
        (file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      );

      if (invalidFiles.length > 0) {
        setErrorMsg("All images must be JPG, PNG, or WEBP, and less than 5MB each.");
        return;
      }

      setErrorMsg("");
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg("Name is required.");
    if (!city.trim()) return setErrorMsg("City is required.");
    if (!message.trim()) return setErrorMsg("Review message is required.");
    if (rating < 1 || rating > 5) return setErrorMsg("Rating must be between 1 and 5.");

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("customer_name", name);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("city", city);
      const finalProduct = isManualProduct
        ? manualProduct.trim()
        : (productPurchased === "__custom__" ? manualProduct.trim() : productPurchased);

      formData.append("service_used", serviceUsed);
      formData.append("product_purchased", finalProduct);
      formData.append("overall_experience", overallExperience);
      formData.append("rating", rating.toString());
      formData.append("review_message", message);
      formData.append("recommend", recommend.toString());
      formData.append("source", "public_form");
      formData.append("honeypot", honeypot);
      
      files.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const res = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Home
          </Link>

          <div className="mb-10 text-center sm:text-left">
            <span className="section-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Customer Feedback
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tell Us About <span className="text-blue-700">Your Experience.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Your feedback is essential in helping us refine our IT services, custom builds, and hardware supply. Thank you for taking the time to write to us!
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {success ? (
              <div className="text-center py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-950">
                  Thank You for Your Review!
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
                  Your feedback has been successfully submitted. Out of respect for our customer community, all public reviews go through a quick validation process before appearing live.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <Link href="/reviews" className="btn-primary">
                    View Other Reviews
                  </Link>
                  <Link href="/" className="btn-secondary">
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {errorMsg}
                  </div>
                )}

                {/* Honeypot hidden input (Spam trap) */}
                <input
                  type="text"
                  name="honeypot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Overall Rating *
                  </label>
                  <div className="py-1">
                    <StarRating rating={rating} onChange={setRating} size="lg" />
                  </div>
                </div>

                {/* Name, City */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="feedback-name" className="text-sm font-semibold text-slate-800">
                      Your Name *
                    </label>
                    <input
                      id="feedback-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Rao"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="feedback-city" className="text-sm font-semibold text-slate-800">
                      City *
                    </label>
                    <input
                      id="feedback-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Email, Phone */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="feedback-email" className="text-sm font-semibold text-slate-800">
                      Email Address <span className="text-xs font-normal text-slate-500">(Optional)</span>
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ananya@example.com"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="feedback-phone" className="text-sm font-semibold text-slate-800">
                      Phone Number <span className="text-xs font-normal text-slate-500">(Optional)</span>
                    </label>
                    <input
                      id="feedback-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Dropdowns: Service, Product */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="feedback-service" className="text-sm font-semibold text-slate-800">
                      Service Availed <span className="text-xs font-normal text-slate-500">(If applicable)</span>
                    </label>
                    <select
                      id="feedback-service"
                      value={serviceUsed}
                      onChange={(e) => setServiceUsed(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="feedback-product" className="text-sm font-semibold text-slate-800">
                        Product Purchased <span className="text-xs font-normal text-slate-500">(If applicable)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isManualProduct;
                          setIsManualProduct(next);
                          if (next && !manualProduct && productPurchased && productPurchased !== "__custom__") {
                            setManualProduct(productPurchased);
                          }
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                      >
                        {isManualProduct ? "Choose from list" : "Enter manually"}
                      </button>
                    </div>

                    {isManualProduct ? (
                      <input
                        id="feedback-product"
                        type="text"
                        value={manualProduct}
                        onChange={(e) => setManualProduct(e.target.value)}
                        placeholder="Type product name (e.g. Dell XPS 15, HP Victus, 1TB NVMe SSD...)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoFocus
                      />
                    ) : (
                      <select
                        id="feedback-product"
                        value={productPurchased}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsManualProduct(true);
                            if (!manualProduct) setManualProduct("");
                          } else {
                            setProductPurchased(e.target.value);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select a product category</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.title}>
                            {p.title}
                          </option>
                        ))}
                        <option value="__custom__">Other (Enter manually)...</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Overall experience */}
                <div className="space-y-2">
                  <label htmlFor="feedback-experience" className="text-sm font-semibold text-slate-800">
                    Overall Experience <span className="text-xs font-normal text-slate-500">(Short summary)</span>
                  </label>
                  <input
                    id="feedback-experience"
                    type="text"
                    value={overallExperience}
                    onChange={(e) => setOverallExperience(e.target.value)}
                    placeholder="e.g. Excellent service and support, Fast repairs"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label htmlFor="feedback-message" className="text-sm font-semibold text-slate-800">
                    Detailed Review * <span className="text-xs font-normal text-slate-500">({message.length}/1000)</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    required
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your review here. What did you like? How can we improve?"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Toggle: Recommend */}
                <div className="flex items-center gap-3">
                  <input
                    id="feedback-recommend"
                    type="checkbox"
                    checked={recommend}
                    onChange={(e) => setRecommend(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 bg-white text-blue-700 focus:ring-blue-600"
                  />
                  <label htmlFor="feedback-recommend" className="cursor-pointer select-none text-sm font-medium text-slate-700">
                    I recommend NexLapTech to others
                  </label>
                </div>

                {/* Images upload */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-800">
                    Upload Images <span className="text-xs font-normal text-slate-500">(Optional, max 3, up to 5MB each)</span>
                  </label>
                  
                  <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:bg-blue-50">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={files.length >= 3}
                      className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    />
                    <ImageIcon className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-xs text-nex-white font-medium">
                      Click to upload or drag &amp; drop images
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, or WEBP only (max. 3 files)
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="overflow-hidden pr-2">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="shrink-0 text-slate-400 transition-colors hover:text-red-600"
                            aria-label={`Remove image ${file.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
