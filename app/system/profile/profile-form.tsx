"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icons } from "@/components/ui/Icons";
import { updateProfile, changePassword } from "@/app/actions/profile";
import { usePreferences } from "@/context/PreferenceContext";

interface ProfileFormProps {
  user: any;
  dict: any;
}

export function ProfileForm({ user, dict }: ProfileFormProps) {
  const router = useRouter();
  const { preferences, updatePreference } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<
    "general" | "security" | "preferences"
  >("general");

  // Forms State
  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);

      const result = await updateProfile(formData);
      if (result.success) {
        toast.success(dict.common.save);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(dict.profile.new_password + " " + dict.common.no_results); // Mismatch msg
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("currentPassword", currentPassword);
      formData.set("newPassword", newPassword);
      formData.set("confirmPassword", confirmPassword);

      const result = await changePassword(formData);
      if (result.success) {
        toast.success(result.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error);
      }
    });
  };

  const tabs = [
    { id: "general", label: dict.profile.personal_info, icon: Icons.User },
    { id: "security", label: dict.profile.security, icon: Icons.Lock },
    {
      id: "preferences",
      label: dict.profile.preferences,
      icon: Icons.Settings,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar / Tabs */}
      <div className="lg:col-span-3 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="lg:col-span-9">
        <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <form
              onSubmit={handleUpdateProfile}
              className="space-y-6 relative z-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {dict.profile.full_name}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                    placeholder={dict.profile.full_name}
                  />
                </div>
                <div className="space-y-2 opacity-60 pointer-events-none">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {dict.profile.email}
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400"
                  />
                </div>
                <div className="space-y-2 opacity-60 pointer-events-none">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {dict.profile.role}
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 font-mono text-sm">
                    {user.role}
                  </div>
                </div>
                <div className="space-y-2 opacity-60 pointer-events-none">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {dict.profile.company}
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 font-mono text-sm">
                    {user.company?.name || "System"}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  {isPending ? "..." : dict.profile.update_profile}
                </button>
              </div>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <form
              onSubmit={handleChangePassword}
              className="space-y-6 max-w-lg relative z-10"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {dict.profile.current_password}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {dict.profile.new_password}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {dict.profile.confirm_password}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
                >
                  {isPending ? "..." : dict.profile.update_password}
                </button>
              </div>
            </form>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-8 relative z-10">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Icons.Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {dict.profile.theme}
                    </h3>
                    <p className="text-sm font-bold text-slate-400">
                      Switch between light and dark mode
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updatePreference(
                      "mode",
                      preferences.mode === "dark" ? "light" : "dark",
                    )
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.mode === "dark"
                      ? "bg-indigo-600"
                      : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out mt-1 ml-1 ${
                      preferences.mode === "dark"
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Icons.Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {dict.profile.language}
                    </h3>
                    <p className="text-sm font-bold text-slate-400">
                      Change system language (Arabic / English)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updatePreference(
                      "language",
                      preferences.language === "ar" ? "en" : "ar",
                    )
                  }
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-all"
                >
                  {preferences.language === "ar" ? "English" : "العربية"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
