"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  User,
  Package,
  Calendar,
  GraduationCap,
  Briefcase,
  Heart,
  MessageSquare,
  Bell,
  Lock,
  Camera,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  Eye,
  EyeOff,
  ShoppingBag,
  ExternalLink,
  SlidersHorizontal
} from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import CustomerPreferencesSection from "@/components/customer/CustomerPreferencesSection";
import { getCustomerInitials } from "@/lib/utils";

export default function CustomerAccountPortal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "profile";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states for profile editing
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Not Specified");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Portal live data
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // New message input
  const [newMessageText, setNewMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  const cartAddItem = useCartStore((s) => s.addItem);
  const cartOpen = useCartStore((s) => s.openCart);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profRes = await fetch("/api/customer/profile");
      if (!profRes.ok) {
        if (profRes.status === 401) {
          router.push("/login?redirect=/customer/account");
          return;
        }
        throw new Error("Failed to load profile");
      }
      const profData = await profRes.json();
      const p = profData.profile;
      setProfile(p);
      setFullName(p?.full_name || "");
      setPhone(p?.phone || "");
      setGender(p?.gender || "Not Specified");
      setAddress(p?.address || "");
      setCity(p?.city || "");
      setState(p?.state || "");
      setPincode(p?.pincode || "");
      setCountry(p?.country || "India");

      // 2. Parallel fetch portal section data
      const [ordRes, bookRes, trRes, intRes, favRes, msgRes, notifRes] = await Promise.all([
        fetch("/api/customer/orders").then((r) => (r.ok ? r.json() : { orders: [] })),
        fetch("/api/customer/bookings").then((r) => (r.ok ? r.json() : { bookings: [] })),
        fetch("/api/customer/training").then((r) => (r.ok ? r.json() : { training: [], certificates: [] })),
        fetch("/api/customer/internships").then((r) => (r.ok ? r.json() : { internships: [] })),
        fetch("/api/customer/favorites").then((r) => (r.ok ? r.json() : { favorites: [] })),
        fetch("/api/customer/messages").then((r) => (r.ok ? r.json() : { messages: [] })),
        fetch("/api/customer/notifications").then((r) => (r.ok ? r.json() : { notifications: [], unreadCount: 0 })),
      ]);

      setOrders(ordRes.orders || []);
      setBookings(bookRes.bookings || []);
      setTraining(trRes.training || []);
      setCertificates(trRes.certificates || []);
      setInternships(intRes.internships || []);
      setFavorites(favRes.favorites || []);
      setMessagesList(msgRes.messages || []);
      setNotifications(notifRes.notifications || []);
      setUnreadNotifications(notifRes.unreadCount || 0);
    } catch (err: any) {
      console.error("Profile load error:", err);
      setMessage({ type: "error", text: "Failed to load customer profile details." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          gender,
          address,
          city,
          state,
          pincode,
          country,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      const saved = data.profile || { ...profile, full_name: fullName, phone, gender, address, city, state, pincode, country };
      setProfile(saved);
      setEditMode(false);
      setMessage({ type: "success", text: "Profile updated successfully." });
      window.dispatchEvent(new CustomEvent("nexbyte-profile-update", { detail: { profile: saved } }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save profile modifications." });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/customer/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Avatar upload failed.");

      const updated = { ...profile, avatar_url: data.avatarUrl };
      setProfile(updated);
      setMessage({ type: "success", text: "Profile photo updated successfully." });
      window.dispatchEvent(new CustomEvent("nexbyte-profile-update", { detail: { profile: updated } }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload profile picture." });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/customer/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove avatar.");

      const updated = { ...profile, avatar_url: "" };
      setProfile(updated);
      setMessage({ type: "success", text: "Profile photo removed." });
      window.dispatchEvent(new CustomEvent("nexbyte-profile-update", { detail: { profile: updated } }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return setMessage({ type: "error", text: "New password must be at least 6 characters long." });
    }
    if (newPassword !== confirmNewPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }

    setPasswordLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/customer/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed.");

      setShowPasswordSection(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage({ type: "success", text: "Password changed successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setMessageSending(true);
    try {
      const res = await fetch("/api/customer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessageText, subject: "Customer Enquiry" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message.");

      setMessagesList([...messagesList, data.message]);
      setNewMessageText("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] py-6 text-white relative">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial opacity-60" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          {/* Header Banner */}
          <div className="mb-8 glass-card border border-white/10 bg-nex-ink p-6 sm:p-8 rounded-3xl shadow-glow-blue relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-nex-blue/10 blur-3xl" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                {/* Profile Photo / Initials */}
                <div className="relative group">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-nex-blue/40 bg-nex-black flex items-center justify-center text-xl font-bold text-white shadow-glow-blue">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile?.full_name || "Customer"}
                        fill
                        className="object-cover"
                      />
                    ) : getCustomerInitials(profile?.full_name) ? (
                      <span className="text-2xl font-extrabold tracking-wider text-nex-blueLight">
                        {getCustomerInitials(profile?.full_name)}
                      </span>
                    ) : (
                      <User className="h-10 w-10 text-nex-blueLight" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-nex-blue text-white shadow-lg hover:scale-110 transition-transform"
                    title="Upload Profile Photo"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarLoading}
                    />
                  </label>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {profile?.full_name || "NexLapTech Customer"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                      <ShieldCheck className="h-3 w-3" /> Active Customer
                    </span>
                  </div>
                  <p className="text-xs text-nex-mist flex items-center gap-3">
                    <span>{profile?.email}</span>
                    <span>•</span>
                    <span>{profile?.phone}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-nex-mist/60">
                    Member Role: <strong className="text-white uppercase">{profile?.role || "user"}</strong> &nbsp;•&nbsp; Status: Active
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {profile?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={avatarLoading}
                    className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}

                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>

          {/* Alert Message Banner */}
          {message && (
            <div
              className={`mb-6 rounded-2xl p-4 text-xs flex items-start gap-3 border ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            <button
              onClick={() => router.push("/customer/account?tab=orders")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "orders"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <Package className="h-5 w-5 mb-2 text-emerald-400" />
              <p className="text-lg font-extrabold text-white">{orders.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Orders</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=bookings")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "bookings"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <Calendar className="h-5 w-5 mb-2 text-purple-400" />
              <p className="text-lg font-extrabold text-white">{bookings.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Bookings</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=training")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "training"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <GraduationCap className="h-5 w-5 mb-2 text-cyan-400" />
              <p className="text-lg font-extrabold text-white">{training.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Training</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=internship")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "internship"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <Briefcase className="h-5 w-5 mb-2 text-amber-400" />
              <p className="text-lg font-extrabold text-white">{internships.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Internships</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=favorites")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "favorites"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <Heart className="h-5 w-5 mb-2 text-red-400" />
              <p className="text-lg font-extrabold text-white">{favorites.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Favorites</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=messages")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "messages"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <MessageSquare className="h-5 w-5 mb-2 text-blue-400" />
              <p className="text-lg font-extrabold text-white">{messagesList.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Messages</p>
            </button>

            <button
              onClick={() => router.push("/customer/account?tab=notifications")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === "notifications"
                  ? "bg-nex-blue/20 border-nex-blue text-white shadow-glow-blue"
                  : "glass-card border-white/10 bg-nex-ink hover:border-white/20 text-nex-mist"
              }`}
            >
              <Bell className="h-5 w-5 mb-2 text-yellow-400" />
              <p className="text-lg font-extrabold text-white">{unreadNotifications}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider">Notifications</p>
            </button>
          </div>

          {/* Change Password Modal / Section */}
          {showPasswordSection && (
            <div className="mb-8 glass-card border border-amber-500/30 bg-nex-ink p-6 rounded-3xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-amber-400" /> Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-nex-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-nex-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-nex-blue focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="btn-secondary !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary !py-2 !px-5 text-xs font-bold shadow-glow-blue"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
            {[
              { id: "profile", label: "My Profile", icon: User },
              { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
              { id: "orders", label: "My Orders", icon: Package, count: orders.length },
              { id: "bookings", label: "My Bookings", icon: Calendar, count: bookings.length },
              { id: "training", label: "My Training", icon: GraduationCap, count: training.length },
              { id: "internship", label: "My Internships", icon: Briefcase, count: internships.length },
              { id: "favorites", label: "Favorites", icon: Heart, count: favorites.length },
              { id: "messages", label: "Messages", icon: MessageSquare, count: messagesList.length },
              { id: "notifications", label: "Notifications", icon: Bell, count: unreadNotifications },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(`/customer/account?tab=${tab.id}`)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                    isSelected
                      ? "border-nex-blue text-white bg-white/[0.03]"
                      : "border-transparent text-nex-mist hover:text-white hover:bg-white/[0.01]"
                  }`}
                >
                  <IconComp className={`h-4 w-4 ${isSelected ? "text-nex-blueLight" : ""}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="rounded-full bg-nex-blue/30 px-2 py-0.5 text-[10px] font-bold text-nex-blueLight">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Profile */}
          {activeTab === "profile" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl shadow-glow-blue">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white">Personal Profile Information</h2>
                  <p className="text-xs text-nex-mist">Manage your contact details and address settings.</p>
                </div>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-primary !py-2.5 !px-5 text-xs flex items-center gap-2 shadow-glow-blue"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(false)}
                    className="btn-secondary !py-2.5 !px-5 text-xs"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Full Name</span>
                      <p className="text-sm font-semibold text-white">{profile?.full_name || "N/A"}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Email Address (Protected)</span>
                      <p className="text-sm font-semibold text-white">{profile?.email || "N/A"}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Phone Number</span>
                      <p className="text-sm font-semibold text-white">{profile?.phone || "N/A"}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Date of Birth (Identity Verification)</span>
                      <p className="text-sm font-semibold text-white">{profile?.date_of_birth || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Gender</span>
                      <p className="text-sm font-semibold text-white">{profile?.gender || "Not Specified"}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">Delivery & Billing Address</span>
                      <p className="text-sm font-semibold text-white">
                        {profile?.address ? `${profile.address}, ${profile.city || ""}, ${profile.state || ""} - ${profile.pincode || ""}` : "No address saved"}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-nex-mist block mb-1">City / State / Country</span>
                      <p className="text-sm font-semibold text-white">
                        {profile?.city || "Bengaluru"}, {profile?.state || "Karnataka"}, {profile?.country || "India"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full rounded-xl bg-nex-ink border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Not Specified">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="#372, Uttarahalli Main Rd"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Karnataka"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="560070"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/80 block mb-1">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="btn-secondary !py-2.5 !px-5 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-glow-blue"
                    >
                      {saveLoading ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab 2: Orders */}
          {activeTab === "orders" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">My Orders</h2>
              {orders.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <Package className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">You have no active or previous orders.</p>
                  <Link href="/products" className="btn-primary inline-flex text-xs py-2 px-5">
                    Browse Hardware Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord: any) => (
                    <div key={ord.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">Order #{ord.order_id || ord.id}</span>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                            {ord.status || "Completed"}
                          </span>
                        </div>
                        <p className="text-xs text-nex-mist mt-1">Date: {new Date(ord.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">₹{(ord.total || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-nex-mist">Payment: {ord.payment_status || "Paid"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Bookings */}
          {activeTab === "bookings" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">My Service Bookings</h2>
              {bookings.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <Calendar className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">No active service bookings found.</p>
                  <Link href="/services" className="btn-primary inline-flex text-xs py-2 px-5">
                    Book Computer Service
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b: any) => (
                    <div key={b.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-nex-blueLight text-xs">ID: {b.bookingId || b.id}</span>
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                            {b.status || "Scheduled"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{b.productName || b.service_name || "Hardware Booking"}</h4>
                        <p className="text-xs text-nex-mist mt-1 flex items-center gap-3">
                          <span>Slot: {b.preferredDate || b.booking_date} ({b.preferredTime || b.booking_time})</span>
                        </p>
                      </div>
                      <div className="text-right sm:self-center">
                        <Link href="/track" className="btn-secondary !py-1.5 !px-3 text-xs">
                          Track Progress
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Training */}
          {activeTab === "training" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">My Training Courses & Certificates</h2>
              {training.length === 0 && certificates.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <GraduationCap className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">You are not enrolled in any training program currently.</p>
                  <Link href="/training" className="btn-primary inline-flex text-xs py-2 px-5">
                    Explore Academy Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {training.map((t: any) => (
                    <div key={t.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Course Enrollment</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{t.courseTitle || t.course_title}</h4>
                        <p className="text-xs text-nex-mist mt-1">Batch: {t.preferredBatch || t.batch || "Active Batch"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                        {t.status || "Enrolled"}
                      </span>
                    </div>
                  ))}

                  {certificates.map((c: any) => (
                    <div key={c.id} className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Verified Certificate</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{c.courseTitle}</h4>
                        <p className="text-xs font-mono text-nex-blueLight mt-1">Reg ID: {c.registrationId || c.certificateId || "NBT-TR-2026-001"}</p>
                      </div>
                      <Link href="/verify" className="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Verify</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Internship */}
          {activeTab === "internship" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">My Internship Applications</h2>
              {internships.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <Briefcase className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">No internship applications submitted.</p>
                  <Link href="/internship" className="btn-primary inline-flex text-xs py-2 px-5">
                    Apply for Internships
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {internships.map((i: any) => (
                    <div key={i.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-amber-400 font-bold">App ID: {i.applicationId || i.id}</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{i.domain || "Hardware & Software Internship"}</h4>
                        <p className="text-xs text-nex-mist mt-1">College: {i.college || "N/A"}</p>
                      </div>
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400 uppercase">
                        {i.status || "Under Review"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Favorites */}
          {activeTab === "favorites" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">My Favorite Hardware & Items</h2>
              {favorites.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <Heart className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">Your favorites list is currently empty.</p>
                  <Link href="/products" className="btn-primary inline-flex text-xs py-2 px-5">
                    Explore Laptops & Parts
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {favorites.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black/40">
                        <Image src={p.image || "/images/poster-products.png"} alt={p.title || p.name || "Product"} fill className="object-contain p-2" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                        <p className="text-sm font-extrabold text-nex-blueLight mt-1">₹{(p.price || 0).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          cartAddItem({ id: p.id, title: p.title, price: p.price, image: p.image });
                          cartOpen();
                        }}
                        className="btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Messages */}
          {activeTab === "messages" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">Messages & Seller Conversations</h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                {messagesList.length === 0 ? (
                  <p className="text-center text-xs text-nex-mist py-8">No messages exchanged yet. Send a direct message below.</p>
                ) : (
                  messagesList.map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl max-w-md text-xs space-y-1 ${
                        m.sender === "customer"
                          ? "ml-auto bg-nex-blue/30 border border-nex-blue/40 text-white"
                          : "mr-auto bg-white/[0.06] border border-white/10 text-nex-mist"
                      }`}
                    >
                      <p className="font-bold text-[11px] text-white/80">{m.sender === "customer" ? "You" : "NexLapTech Support"}</p>
                      <p className="leading-relaxed">{m.message}</p>
                      <p className="text-[9px] text-white/40 text-right">{new Date(m.created_at || Date.now()).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type a message to NexLapTech Support..."
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs text-white focus:border-nex-blue focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={messageSending}
                  className="btn-primary py-3 px-6 text-xs font-bold shadow-glow-blue shrink-0"
                >
                  {messageSending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 8: Notifications */}
          {activeTab === "notifications" && (
            <div className="glass-card border border-white/10 bg-nex-ink p-7 rounded-3xl">
              <h2 className="text-lg font-bold text-white mb-4">Customer Notifications</h2>
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-nex-mist space-y-3">
                  <Bell className="h-12 w-12 mx-auto text-white/20" />
                  <p className="text-xs">No notifications at present.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
                      <Bell className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{n.title || "Notification"}</h4>
                        <p className="text-xs text-nex-mist mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-white/40 mt-1 block">{new Date(n.created_at || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 9: Customer Preferences */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <CustomerPreferencesSection />
            </div>
          )}

        </div>
    </div>
  );
}
