"use client";

import {
  removeUserFromCompany,
  toggleMemberStatus,
  updateMemberData,
  toggleUserStatus,
} from "@/app/actions/user-management";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast"; // Used wrapper lib
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: number;
  companyId: number;
  initialData: {
    name: string;
    username: string;
    email: string;
    phone: string;
    roleId: number;
    userStatus: "ACTIVE" | "DISABLED" | "PENDING";
    membershipStatus: "ACTIVE" | "SUSPENDED";
  };
  availableRoles: { id: number; name: string; displayName: string | null }[];
  companySlug: string;
}

export function UserActions({
  userId,
  companyId,
  initialData,
  availableRoles,
  companySlug,
}: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Extract username prefix
  const getUsernamePrefix = (fullUsername: string) => {
    if (!fullUsername) return "";
    const idx = fullUsername.indexOf("@");
    return idx !== -1 ? fullUsername.substring(0, idx) : fullUsername;
  };

  // Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "info" | "success";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
    action: async () => {},
  });

  const [formData, setFormData] = useState({
    name: initialData.name,
    username: initialData.username,
    email: initialData.email,
    phone: initialData.phone,
    roleId: initialData.roleId,
    password: "",
  });

  // Sync state with props when initialData changes (e.g. after revalidation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: initialData.name,
      username: initialData.username,
      email: initialData.email,
      phone: initialData.phone,
      roleId: initialData.roleId,
      password: "",
    });
  }, [initialData]);

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const executeAction = async () => {
    startTransition(async () => {
      try {
        await confirmConfig.action();
        closeConfirm();
      } catch (error) {
        console.error("Action failed:", error);
        toast.error("فشل تنفيذ الإجراء");
      }
    });
  };

  const handleRemove = async () => {
    setConfirmConfig({
      isOpen: true,
      title: "إزالة المستخدم",
      description:
        "هل أنت متأكد من رغبتك في إزالة هذا المستخدم من الشركة؟ هذا الإجراء لا يمكن التراجع عنه.",
      variant: "danger",
      action: async () => {
        const res = await removeUserFromCompany(userId, companyId);
        if (res?.error) {
          toast.error("خطأ: " + res.error);
        } else {
          toast.success("تم إزالة المستخدم بنجاح");
        }
      },
    });
  };

  const handleToggleMembershipStatus = async () => {
    const isActive = initialData.membershipStatus === "ACTIVE";
    setConfirmConfig({
      isOpen: true,
      title: isActive ? "تعليق العضوية" : "تفعيل العضوية",
      description: isActive
        ? "هل أنت متأكد من رغبتك في تعليق عضوية هذا المستخدم؟ لن يتمكن من الوصول لبيانات هذه الشركة."
        : "هل تريد إعادة تفعيل عضوية هذا المستخدم في الشركة؟",
      variant: isActive ? "warning" : "success",
      action: async () => {
        const res = await toggleMemberStatus(userId, companyId);
        if (res?.error) {
          toast.error("خطأ: " + res.error);
        } else {
          toast.success(
            isActive ? "تم تعليق عضوية المستخدم" : "تم تفعيل عضوية المستخدم",
          );
        }
      },
    });
  };

  const handleToggleUserStatus = async () => {
    const isActive = initialData.userStatus === "ACTIVE";
    setConfirmConfig({
      isOpen: true,
      title: isActive ? "تعطيل الحساب" : "تفعيل الحساب",
      description: isActive
        ? "تحذير: تعطيل الحساب سيمنع المستخدم من الدخول للنظام بالكامل. هل أنت متأكد؟"
        : "هل تريد تفعيل حساب المستخدم والسماح له بالدخول للنظام؟",
      variant: isActive ? "danger" : "success",
      action: async () => {
        const res = await toggleUserStatus(userId);
        if (res?.error) {
          toast.error("خطأ: " + res.error);
        } else {
          toast.success(
            isActive ? "تم تعطيل حساب المستخدم" : "تم تفعيل حساب المستخدم",
          );
        }
      },
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const usernamePrefix = getUsernamePrefix(formData.username);
        const finalUsername = `${usernamePrefix}@${companySlug.toLowerCase()}`;
        const res = await updateMemberData(userId, companyId, {
          ...formData,
          username: finalUsername,
        });
        if (res?.error) {
          toast.error("خطأ: " + res.error);
        } else {
          toast.success("تم تحديث بيانات المستخدم بنجاح");
          setIsEditOpen(false);
          router.refresh(); // Refresh data from server
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("حدث خطأ غير متوقع.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1.5" dir="rtl">
        {/* Edit Button */}
        <button
          onClick={() => setIsEditOpen(true)}
          aria-label="تعديل بيانات المستخدم"
          className="p-2 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all"
          title="تعديل البيانات"
        >
          <Icons.Edit className="w-4 h-4" />
        </button>

        {/* Status Controls Container */}
        <div className="flex items-center gap-2">
          {/* User Account Status Toggle */}
          <button
            onClick={handleToggleUserStatus}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              initialData.userStatus === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
            }`}
            title={
              initialData.userStatus === "ACTIVE"
                ? "حساب المستخدم نشط (اضغط للتعطيل)"
                : "حساب المستخدم معطل/معلق (اضغط للتفعيل)"
            }
          >
            {initialData.userStatus === "ACTIVE" ? (
              <>
                <Icons.CheckCircle className="w-3.5 h-3.5" />
                <span>حساب نشط</span>
              </>
            ) : (
              <>
                <Icons.XCircle className="w-3.5 h-3.5" />
                <span>
                  حساب {initialData.userStatus === "PENDING" ? "معلق" : "معطل"}
                </span>
              </>
            )}
          </button>

          {/* Membership Status Toggle */}
          <button
            onClick={handleToggleMembershipStatus}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              initialData.membershipStatus === "ACTIVE"
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300"
                : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            }`}
            title={
              initialData.membershipStatus === "ACTIVE"
                ? "عضوية فعالة (اضغط للتعليق)"
                : "عضوية معلقة (اضغط للتفعيل)"
            }
          >
            {initialData.membershipStatus === "ACTIVE" ? (
              <>
                <Icons.UserCheck className="w-3.5 h-3.5" />
                <span>عضوية فعالة</span>
              </>
            ) : (
              <>
                <Icons.UserX className="w-3.5 h-3.5" />
                <span>عضوية معلقة</span>
              </>
            )}
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isPending}
          aria-label="إزالة المستخدم من الشركة"
          className="p-2 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-all"
          title="إزالة المستخدم"
        >
          <Icons.Trash className="w-4 h-4" />
        </button>

        {/* Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEditOpen(false)}
            />
            <div
              className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95"
              dir="rtl"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Icons.Edit className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    تعديل المستخدم
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  aria-label="إغلاق التعديل"
                  className="text-slate-400 hover:text-slate-600"
                  title="إغلاق التعديل"
                >
                  <Icons.X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleUpdate}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-name"
                      className="text-xs font-bold text-slate-500 px-1"
                    >
                      الاسم الكامل
                    </label>
                    <input
                      id="edit-name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-username"
                        className="text-xs font-bold text-slate-500 px-1"
                      >
                        اسم المستخدم
                      </label>
                      <div
                        className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
                        dir="ltr"
                      >
                        <input
                          id="edit-username"
                          required
                          value={getUsernamePrefix(formData.username)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const cleanVal = val.includes("@")
                              ? val.split("@")[0]
                              : val;
                            setFormData({ ...formData, username: cleanVal });
                          }}
                          className="bg-transparent border-none outline-none text-right font-mono font-bold text-slate-900 w-full"
                          dir="ltr"
                        />
                        <span className="text-slate-400 font-mono text-sm opacity-60 whitespace-nowrap select-none ml-1">
                          @{companySlug}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-phone"
                        className="text-xs font-bold text-slate-500 px-1"
                      >
                        الهاتف
                      </label>
                      <input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-email"
                      className="text-xs font-bold text-slate-500 px-1"
                    >
                      البريد الإلكتروني
                    </label>
                    <input
                      id="edit-email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-role"
                      className="text-xs font-bold text-slate-500 px-1"
                    >
                      الصلاحية
                    </label>
                    <select
                      id="edit-role"
                      value={formData.roleId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          roleId: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.displayName || role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password Field (Edit & View) */}
                  <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <label
                      htmlFor="edit-password"
                      className="text-xs font-bold text-slate-500 px-1"
                    >
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        id="edit-password"
                        type="text"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-sm font-bold"
                        autoComplete="off"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Icons.Key className="w-4 h-4 text-amber-500/50" />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-600/80 px-1">
                      * يمكنك تعديل كلمة المرور مباشرة من هنا
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                  >
                    {isPending ? (
                      <Icons.Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      "حفظ التغييرات"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 bg-slate-50 text-slate-500 font-bold py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirm}
        onConfirm={executeAction}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant as any}
        isPending={isPending}
      />
    </>
  );
}
