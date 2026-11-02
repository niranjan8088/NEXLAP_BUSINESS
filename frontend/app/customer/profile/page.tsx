"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  User,
  ShieldCheck,
  Camera,
  Trash2,
  Lock,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { safeJsonFetch } from "@/lib/apiHelper";
import { getCustomerInitials } from "@/lib/utils";

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Not Specified");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await safeJsonFetch("/api/customer/profile");
      if (res.ok && res.data?.profile) {
        const p = res.data.profile;
        setProfile(p);
        setFullName(p.full_name || "");
        setPhone(p.phone || "");
        setDob(p.date_of_birth || "");
        setGender(p.gender || "Not Specified");
        setAddress(p.address || "");
        setCity(p.city || "");
        setState(p.state || "");
        setPincode(p.pincode || "");
        setCountry(p.country || "India");
      }
    } catch (e) {
      console.error("Failed to load profile", e);
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
          dateOfBirth: dob,
          gender,
          address,
          city,
          state,
          pincode,
          country,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      const saved = data.profile || { ...profile, full_name: fullName, phone, date_of_birth: dob, gender, address, city, state, pincode, country };
      setProfile(saved);
      setFullName(saved.full_name || "");
      setPhone(saved.phone || "");
      setDob(saved.date_of_birth || "");
      setGender(saved.gender || "Not Specified");
      setAddress(saved.address || "");
      setCity(saved.city || "");
      setState(saved.state || "");
      setPincode(saved.pincode || "");
      setCountry(saved.country || "India");
      setEditMode(false);
      setMessage({ type: "success", text: "Profile updated successfully." });

      // Immediately notify headers and layout of updated name and profile
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

      const updatedProf = { ...profile, avatar_url: data.avatarUrl };
      setProfile(updatedProf);
      setMessage({ type: "success", text: "Profile photo updated successfully." });
      window.dispatchEvent(new CustomEvent("nexbyte-profile-update", { detail: { profile: updatedProf } }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload photo." });
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
      if (!res.ok) throw new Error(data.error || "Failed to remove photo.");

      const updatedProf = { ...profile, avatar_url: "" };
      setProfile(updatedProf);
      setMessage({ type: "success", text: "Profile photo removed." });
      window.dispatchEvent(new CustomEvent("nexbyte-profile-update", { detail: { profile: updatedProf } }));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to remove photo." });
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

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message && (
        <div
          className={`rounded-2xl p-4 text-xs flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-sky-600 bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-xl shadow-sm">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile?.full_name || "Customer"} fill className="object-cover" />
              ) : getCustomerInitials(profile?.full_name) ? (
                <span>{getCustomerInitials(profile?.full_name)}</span>
              ) : (
                <User className="h-10 w-10 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-sky-600 text-white shadow-md hover:scale-110 transition-transform"
              title="Upload Profile Photo"
            >
              <Camera className="h-3.5 w-3.5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarLoading}
              />
            </label>
            {profile?.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarLoading}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:scale-110 transition-transform"
                title="Remove Profile Photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {profile?.full_name || "NexLapTech Customer"}
              </h1>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{profile?.email || "customer@nexbytetechnologies.com"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Account Overview Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm text-center">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">2</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Hardware Orders</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm text-center">
          <span className="text-2xl font-extrabold text-emerald-600 font-display">3</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Active E-Warranties</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm text-center">
          <span className="text-2xl font-extrabold text-purple-600 font-display">1</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Service Request</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm text-center">
          <span className="text-2xl font-extrabold text-sky-600 font-display">100%</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Genuine Parts</span>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordSection && (
        <form onSubmit={handleChangePassword} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" /> Change Security Password
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
            />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowPasswordSection(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">
              Cancel
            </button>
            <button type="submit" disabled={passwordLoading} className="rounded-xl bg-sky-600 text-white font-bold text-xs px-4 py-2">
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      )}

      {/* Profile Details Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#E6EAF0] dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">Personal &amp; Contact Details</h2>
            <p className="text-xs text-slate-500">Your official account profile for service delivery and billing.</p>
          </div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditMode(false)}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          )}
        </div>

        {!editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Full Name</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{profile?.full_name || "N/A"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Email Address (Primary Login)</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{profile?.email || "N/A"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Phone Number</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{profile?.phone || "N/A"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{profile?.date_of_birth || "N/A"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Gender</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{profile?.gender || "Not Specified"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Address &amp; City</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {profile?.address ? `${profile.address}, ${profile.city || ""}` : "No address specified"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1 md:col-span-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">State / Pincode / Country</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {profile?.state || "Karnataka"} - {profile?.pincode || "560070"}, {profile?.country || "India"}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Not Specified">Prefer not to say</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                {saveLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
