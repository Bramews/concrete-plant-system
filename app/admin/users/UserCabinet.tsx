"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "@/app/actions/auth";
import {
  impersonateUser,
  killUserSession,
  suspendUser,
} from "@/app/actions/sovereign-user-actions";
import {
  inviteUser,
  removeUserFromCompany,
  saveUserCustomPermissions,
  fetchUserCustomPermissions,
} from "@/app/actions/user-management";

import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { getCreatableRoles } from "@/lib/permissions";

import { ExtendedUser } from "@/lib/auth";
import { AuditLog } from "@prisma/client";

type MembershipWithRole = {
  id: number;
  companyId: number;
  userId: number;
  role: {
    id: number;
    name: string;
    displayName: string | null;
  };
  company: {
    name: string;
    slug: string;
  };
  status: string;
  deletedAt: Date | null;
};

type CabinetUser = ExtendedUser & {
  memberships: MembershipWithRole[];
  company?: { name: string; slug: string } | null;
};

interface UserCabinetProps {
  initialUsers: CabinetUser[];
  auditLogs: (AuditLog & { user: ExtendedUser | null })[];
  lang: "en" | "ar";
  translations: {
    roles: Record<string, string>;
    title?: string;
    search?: string;
    add?: string;
    table?: {
      username?: string;
      fullname?: string;
      role?: string;
      memberships?: string;
      actions?: string;
      status?: string;
    };
    na?: string;
  };
  currentUserRole: string;
  currentUserId: number;
  companies: { id: number; name: string; slug: string }[];
  companySlug?: string;
}

import styles from "./users.module.css";
import { searchGlobalUsers } from "@/app/actions/admin-sovereignty";
import { Icons } from "@/components/ui/Icons";
import { useFieldValidation } from "@/hooks/useFieldValidation";

export default function UserCabinet({
  initialUsers,
  auditLogs,
  lang,
  translations,
  currentUserRole,
  currentUserId,
  companies,
  companySlug,
}: UserCabinetProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Membership Modal
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<CabinetUser | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedMembershipRole, setSelectedMembershipRole] =
    useState<string>("OPERATOR");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const [_selectedRole, setSelectedRole] = useState<string>("OPERATOR");
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [mounted, setMounted] = useState(false);

  const getCreatableRolesForUI = (role: string): string[] => {
    return getCreatableRoles(role) as string[];
  };

  // Field Validation states
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  const fullUsernameInput = usernameInput
    ? companySlug &&
      currentUserRole !== "SYSTEM_OWNER" &&
      !usernameInput.includes("@")
      ? `${usernameInput}@${companySlug}`
      : usernameInput
    : "";

  const { isAvailable: isEmailAvailable, isValidating: isEmailValidating } =
    useFieldValidation("email", emailInput, editingUser?.id);
  const {
    isAvailable: isUsernameAvailable,
    isValidating: isUsernameValidating,
  } = useFieldValidation("username", fullUsernameInput, editingUser?.id);
  const hasValidationErrors =
    isEmailAvailable === false ||
    isUsernameAvailable === false ||
    isEmailValidating ||
    isUsernameValidating;

  // Custom Permissions Modal
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [managingPermissionsUser, setManagingPermissionsUser] =
    useState<CabinetUser | null>(null);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Search State
  const [users, setUsers] = useState<CabinetUser[]>(initialUsers);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(window.location.origin + inviteLink);
      toast.success("تم نسخ الرابط! أرسله الآن للموظف.");
      setInviteLink(null);
      setIsModalOpen(false);
    }
  };

  const translateAction = (action: string) => {
    const map: Record<string, string> = {
      CREATE: "إنشاء",
      UPDATE: "تحديث",
      DELETE: "حذف",
      LOGIN: "تسجيل دخول",
      LOGOUT: "تسجيل خروج",
      SUSPEND: "تجميد",
      ACTIVATE: "تفعيل",
      impersonate: "تقمص شخصية",
    };
    return map[action] || action;
  };

  const translateDetails = (details: string | null) => {
    if (!details) return "-";
    if (lang === "ar") {
      return details
        .replace("User", "المستخدم")
        .replace("logged in securely", "سجل دخول بآمان")
        .replace("Created new user", "تم إنشاء مستخدم جديد")
        .replace("Updated user", "تم تحديث بيانات المستخدم")
        .replace("Deleted user", "تم حذف المستخدم")
        .replace("Successfully impersonated", "تم تقمص الشخصية بنجاح")
        .replace("Reset password for user", "تم إعادة تعيين كلمة المرور")
        .replace("Suspended user", "تم تجميد المستخدم")
        .replace("Activated user", "تم تفعيل المستخدم");
    }
    return details;
  };

  const formatLogDate = (date: Date | string) => {
    if (!mounted) return "";
    const d = new Date(date);
    return d.toLocaleString("ar-u-nu-latn");
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (query.length < 2) {
      if (isSearching) {
        setUsers(initialUsers);
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchGlobalUsers(query);
      setUsers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.map((u: any) => ({
          ...u,
          role: u.memberships?.[0]?.role?.name || "OPERATOR",
          status: u.status as "ACTIVE" | "DISABLED",
          memberships: u.memberships || [],
        })),
      );
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setInviteLink(null);
    setSelectedRole("OPERATOR");
    setEmailInput("");
    setUsernameInput("");
    setIsModalOpen(true);
  };

  const handleEdit = (user: ExtendedUser) => {
    setEditingUser(user);
    setInviteLink(null);
    setEmailInput(user.email || "");

    let uName = user.username || "";
    if (
      companySlug &&
      currentUserRole !== "SYSTEM_OWNER" &&
      uName.endsWith(`@${companySlug}`)
    ) {
      uName = uName.replace(`@${companySlug}`, "");
    }
    setUsernameInput(uName);
    setIsModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const loadingToast = toast.loading(
      editingUser ? "جاري التحديث..." : "جاري الإنشاء...",
    );

    try {
      // Format the username with companySlug suffix if appropriate
      const finalUsername = usernameInput
        ? companySlug &&
          currentUserRole !== "SYSTEM_OWNER" &&
          !usernameInput.includes("@")
          ? `${usernameInput}@${companySlug.toLowerCase()}`
          : usernameInput
        : "";
      if (finalUsername) {
        formData.set("username", finalUsername);
      }

      let result;
      if (editingUser) {
        formData.append("id", editingUser.id.toString());
        result = await updateUser(formData);
      } else {
        result = await createUser(formData);
      }

      if (result.success) {
        toast.success(
          (result as { success: boolean; message?: string }).message ||
            "تم بنجاح",
          { id: loadingToast },
        );
        if (!editingUser && (result as { inviteUrl?: string }).inviteUrl) {
          setInviteLink((result as { inviteUrl?: string }).inviteUrl || null);
        } else {
          setIsModalOpen(false);
        }
        router.refresh();
      } else {
        toast.error(result.error || "فشلت العملية", { id: loadingToast });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "فشلت العملية", {
        id: loadingToast,
      });
    }
  };

  // Sovereign Actions
  const handleImpersonate = async (userId: number, name: string) => {
    const loadingToast = toast.loading(`جاري انتحال شخصية ${name}...`);
    try {
      const result = await impersonateUser(userId);
      if (result.success) {
        toast.success("جاري التحويل...", {
          id: loadingToast,
        });
        window.location.assign("/");
      } else {
        toast.error(result.error || "Failed", { id: loadingToast });
      }
    } catch {
      toast.error("Error impersonating", { id: loadingToast });
    }
  };

  const handleKillSession = async (userId: number) => {
    setConfirmConfig({
      title: "إنهاء الجلسات",
      description: "هل أنت متأكد من إنهاء جميع جلسات هذا المستخدم؟",
      variant: "danger",
      onConfirm: async () => {
        const loadingToast = toast.loading("جاري إنهاء الجلسات...");
        try {
          const result = await killUserSession(userId);
          if (result.success) {
            toast.success("تم إنهاء الجلسات", {
              id: loadingToast,
            });
          } else {
            toast.error(result.error || "Failed", { id: loadingToast });
          }
        } catch {
          toast.error("Error", { id: loadingToast });
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleSuspend = async (userId: number) => {
    setConfirmConfig({
      title: "تجميد المستخدم",
      description: "هل أنت متأكد من تجميد هذا المستخدم؟",
      variant: "warning",
      onConfirm: async () => {
        const loadingToast = toast.loading("جاري التجميد...");
        try {
          const result = await suspendUser(userId);
          if (result.success) {
            toast.success("تم تجميد المستخدم", {
              id: loadingToast,
            });
            router.refresh();
          } else {
            toast.error(result.error || "Failed", { id: loadingToast });
          }
        } catch {
          toast.error("Error", { id: loadingToast });
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleActivate = async (id: number) => {
    const formData = new FormData();
    formData.append("id", id.toString());
    const loadingToast = toast.loading("جاري التفعيل...");
    try {
      const result = await toggleUserStatus(formData);
      if (result.success) {
        toast.success("تم بنجاح", {
          id: loadingToast,
        });
        router.refresh();
      } else {
        toast.error(result.error || "Failed", { id: loadingToast });
      }
    } catch {
      toast.error("Error", { id: loadingToast });
    }
  };

  // Membership Management
  const openMembershipModal = (user: CabinetUser) => {
    setManagingUser(user);
    setSelectedCompanyId(companies[0]?.id.toString() || "");
    setSelectedMembershipRole("OPERATOR");
    setIsMembershipModalOpen(true);
  };

  const handleAddMembership = async () => {
    if (!managingUser || !selectedCompanyId) return;

    const loadingToast = toast.loading("Adding membership...");
    try {
      // Use inviteUser to add membership
      // Role type assertion needed or ensure types match
      const result = await inviteUser(
        managingUser.email,
        parseInt(selectedCompanyId),
        selectedMembershipRole, // Role name
        managingUser.name,
        managingUser.username,
      );

      if (result.success) {
        toast.success("Membership added", { id: loadingToast });
        router.refresh();
        setIsMembershipModalOpen(false); // Close or keep open?
      } else {
        toast.error(result.error || "Failed", { id: loadingToast });
      }
    } catch {
      toast.error("Error", { id: loadingToast });
    }
  };

  const handleRemoveMembership = async (companyId: number) => {
    if (!managingUser) return;
    setConfirmConfig({
      title: "إزالة العضوية",
      description: "هل أنت متأكد من إزالة هذه العضوية؟",
      variant: "danger",
      onConfirm: async () => {
        const loadingToast = toast.loading("Removing membership...");
        try {
          const result = await removeUserFromCompany(
            managingUser.id,
            companyId,
          );
          if (result.success) {
            toast.success("Membership removed", { id: loadingToast });
            router.refresh();
            setIsMembershipModalOpen(false);
          } else {
            toast.error(result.error || "Failed", { id: loadingToast });
          }
        } catch {
          toast.error("Failed to revoke session", { id: loadingToast });
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleDelete = async (id: number) => {
    const formData = new FormData();
    formData.append("id", id.toString());
    const loadingToast = toast.loading("جاري الحذف...");
    try {
      const result = await deleteUser(formData);
      if (result.success) {
        toast.success(result.message || "تم بنجاح", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "فشلت العملية", { id: loadingToast });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "فشلت العملية", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmConfig?.title || ""}
        description={confirmConfig?.description || ""}
        variant={confirmConfig?.variant || "danger"}
        onConfirm={confirmConfig?.onConfirm || (async () => {})}
      />
      <div className={styles.header}>
        <h1 className="page-title">
          {translations.title || "User Management"}
        </h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={translations.search || "Search users..."}
              onChange={handleSearch}
              className="pl-9 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-sm w-64 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            {translations.add || "+ Add User"}
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{translations.table?.username || "Username"}</th>
              <th>{translations.table?.fullname || "Full Name"}</th>
              <th>{translations.table?.role || "Global Role"}</th>
              {["SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"].includes(
                currentUserRole,
              ) && <th>{translations.table?.memberships || "Memberships"}</th>}
              {["SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"].includes(
                currentUserRole,
              ) && <th>{translations.table?.actions || "Actions"}</th>}
              {!["SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"].includes(
                currentUserRole,
              ) && <th>{translations.table?.status || "Status"}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isTargetSystemOwner =
                user.memberships?.some(
                  (m: MembershipWithRole) => m.role?.name === "SYSTEM_OWNER",
                ) || user.role === "SYSTEM_OWNER";
              return (
                <tr key={user.id}>
                  <td className={styles.usernameCell}>{user.username}</td>
                  <td>{user.name}</td>
                  <td>
                    <span
                      className={`status-badge status-LAB_APPROVED ${styles.badgeLab}`}
                    >
                      {translations.roles[
                        typeof user.role === "string"
                          ? user.role
                          : (user.role as { name?: string })?.name || ""
                      ] ||
                        (typeof user.role === "string"
                          ? user.role
                          : String(
                              (user.role as { name?: string })?.name || "",
                            ))}
                    </span>
                  </td>
                  {["SYSTEM_OWNER", "COMPANY_ADMIN", "MANAGER"].includes(
                    currentUserRole,
                  ) && (
                    <td>
                      <div className="flex flex-wrap gap-1 items-center">
                        {user.memberships && user.memberships.length > 0 ? (
                          user.memberships
                            .filter((m: MembershipWithRole) => !m.deletedAt)
                            .map((m: MembershipWithRole, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-sm font-bold bg-cyan-900/50 rounded text-cyan-200 border border-cyan-800"
                              >
                                {m.company.slug} (
                                {translations.roles[m.role?.name] ||
                                  m.role?.name ||
                                  String(m.role)}
                              </span>
                            ))
                        ) : (
                          <span className="text-sm font-bold text-white/30">
                            -
                          </span>
                        )}
                        {!isTargetSystemOwner && (
                          <button
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 ml-2"
                            onClick={() => openMembershipModal(user)}
                            title="Manage Memberships"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                  <td>
                    <div className={styles.actionGroup}>
                      {/* Edit Button */}
                      {!isTargetSystemOwner &&
                        (currentUserRole === "SYSTEM_OWNER" ||
                          ["COMPANY_ADMIN", "MANAGER"].includes(
                            currentUserRole,
                          )) && (
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                            onClick={() => handleEdit(user)}
                          >
                            تعديل
                          </button>
                        )}

                      {/* Permissions Button */}
                      {!isTargetSystemOwner &&
                        [
                          "SYSTEM_OWNER",
                          "LAB_MANAGER",
                          "SALES_MANAGER",
                          "DEPARTMENT_MANAGER",
                        ].includes(currentUserRole) && (
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm} !border-indigo-500/50 !text-indigo-400 hover:!bg-indigo-500/10`}
                            onClick={async () => {
                              setManagingPermissionsUser(user);
                              setCustomPermissions([]); // Clear while loading
                              setIsPermissionsModalOpen(true);
                              const perms = await fetchUserCustomPermissions(
                                user.id,
                              );
                              setCustomPermissions(perms);
                            }}
                            title="الصلاحيات المخصصة"
                          >
                            الصلاحيات
                          </button>
                        )}

                      {/* Impersonate */}
                      {currentUserRole === "SYSTEM_OWNER" &&
                        user.status === "ACTIVE" && (
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm} !border-amber-500/50 !text-amber-400 hover:!bg-amber-500/10`}
                            onClick={() =>
                              handleImpersonate(user.id, user.name)
                            }
                            title="انتحال"
                          >
                            <Icons.User className="w-3 h-3" />
                          </button>
                        )}

                      {/* Suspend / Activate */}
                      {!isTargetSystemOwner &&
                        (currentUserRole === "SYSTEM_OWNER" ||
                          (["MANAGER", "COMPANY_ADMIN"].includes(
                            currentUserRole,
                          ) &&
                            user.role !== "SYSTEM_OWNER")) && (
                          <button
                            className={`${styles.btnSecondary} ${styles.btnSm}`}
                            onClick={() =>
                              user.status === "ACTIVE"
                                ? handleSuspend(user.id)
                                : handleActivate(user.id)
                            }
                          >
                            {user.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                          </button>
                        )}

                      {/* Kill Session */}
                      {currentUserRole === "SYSTEM_OWNER" && (
                        <button
                          className={`${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleKillSession(user.id)}
                          title="جلسات"
                        >
                          ☠
                        </button>
                      )}

                      {/* Delete */}
                      {!isTargetSystemOwner && (
                        <button
                          className={`${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUserId}
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MEMBERSHIP MODAL */}
      {isMembershipModalOpen && managingUser && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modalContent} max-w-lg`}>
            <h2 className={styles.modalTitle}>
              {`عضويات: ${managingUser.name}`}
            </h2>

            {/* Add New Membership */}
            <div className="mb-6 p-4 rounded bg-slate-900/50 border border-white/5">
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">
                إضافة إلى شركة
              </h4>
              <div className="flex gap-2">
                <select
                  className={`form-input ${styles.formInput} !w-auto grow`}
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  aria-label="اختر الشركة"
                >
                  <option value="" disabled>
                    اختر الشركة
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
                <select
                  className={`form-input ${styles.formInput} !w-auto`}
                  value={selectedMembershipRole}
                  onChange={(e) => setSelectedMembershipRole(e.target.value)}
                  aria-label="اختر الصلاحية"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="LAB_TECH">LAB_TECH</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="GUARD">GUARD</option>
                  <option value="SAFETY">SAFETY</option>
                </select>
                <button
                  onClick={handleAddMembership}
                  className={styles.btnPrimary}
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* List Existing Memberships */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-400 mb-2">
                العضويات الحالية
              </h4>
              {managingUser.memberships &&
              managingUser.memberships.filter(
                (m: MembershipWithRole) => !m.deletedAt,
              ).length > 0 ? (
                managingUser.memberships
                  .filter((m: MembershipWithRole) => !m.deletedAt)
                  .map((m: MembershipWithRole) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {m.company.name}
                        </div>
                        <div className="text-sm font-bold text-slate-400">
                          {m.role?.name || String(m.role)} • {m.status}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMembership(m.companyId)}
                        className="text-red-400 hover:text-red-300 text-sm font-bold px-2 py-1"
                      >
                        إزالة
                      </button>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4 text-slate-500 italic">
                  لا توجد عضويات نشطة
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setIsMembershipModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modalContent}`}>
            <div className={styles.modalHeader}>
              <h2>
                {inviteLink
                  ? "رابط الدعوة جاهز"
                  : editingUser
                    ? "تعديل مستخدم"
                    : "إضافة مستخدم جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
                title="إغلاق"
              >
                &times;
              </button>
            </div>

            {inviteLink ? (
              <div className="p-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-center">
                  تم إنشاء الحساب بنجاح!
                </h3>
                <p className="text-center text-slate-500 text-sm">
                  النظام لا يحفظ كلمات مرور افتراضية. يرجى نسخ رابط الإعداد
                  أدناه وإرساله للموظف ليقوم بإنشاء كلمة المرور الخاصة به.
                </p>
                <div className="w-full bg-slate-100 p-3 rounded text-center truncate text-indigo-600 font-mono text-sm">
                  {window.location.origin + inviteLink}
                </div>
                <button
                  onClick={copyInviteLink}
                  className={`${styles.btnPrimary} w-full py-3 mt-4 text-lg font-bold shadow-lg`}
                >
                  نسخ الرابط وإغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className={styles.modalForm}>
                <div className={styles.formSection}>
                  <label
                    className={`small-title ${styles.labelBlock} flex justify-between`}
                  >
                    <span>اسم المستخدم</span>
                    {isUsernameValidating && (
                      <span className="text-xs text-slate-400">
                        جاري التحقق...
                      </span>
                    )}
                  </label>
                  {companySlug && currentUserRole !== "SYSTEM_OWNER" ? (
                    <div
                      className={`flex items-center w-full form-input ${styles.formInput} !p-0 pr-4 transition-all ${isUsernameAvailable === false ? "!border-red-400" : ""}`}
                      dir="ltr"
                    >
                      <input
                        name="username"
                        required={!editingUser}
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        readOnly={
                          !!editingUser && currentUserRole !== "SYSTEM_OWNER"
                        }
                        className="bg-transparent border-none outline-none text-right font-mono w-full py-2.5"
                        aria-label="اسم المستخدم"
                        dir="ltr"
                      />
                      <span className="text-slate-500 text-sm font-mono opacity-50 whitespace-nowrap select-none ml-1 pr-4">
                        @{companySlug}
                      </span>
                    </div>
                  ) : (
                    <input
                      name="username"
                      required={!editingUser}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      readOnly={
                        !!editingUser && currentUserRole !== "SYSTEM_OWNER"
                      }
                      className={`form-input ${styles.formInput} ${isUsernameAvailable === false ? "!border-red-400" : ""}`}
                      aria-label="اسم المستخدم"
                    />
                  )}
                  {isUsernameAvailable === false && (
                    <p className="text-xs text-red-500 font-bold px-2 mt-1 animate-in fade-in">
                      اسم المستخدم هذا موجود بالفعل ومسجل لمستخدم آخر
                    </p>
                  )}
                </div>
                <div className={styles.formSection}>
                  <label className={`small-title ${styles.labelBlock}`}>
                    الاسم الكامل
                  </label>
                  <input
                    name="name"
                    defaultValue={editingUser?.name}
                    required
                    className={`form-input ${styles.formInput}`}
                    aria-label="الاسم الكامل"
                  />
                </div>
                <div className={styles.formSection}>
                  <label
                    className={`small-title ${styles.labelBlock} flex justify-between`}
                  >
                    <span>البريد</span>
                    {isEmailValidating && (
                      <span className="text-xs text-slate-400">
                        جاري التحقق...
                      </span>
                    )}
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className={`form-input ${styles.formInput} ${isEmailAvailable === false ? "!border-red-400" : ""}`}
                    aria-label="البريد"
                  />
                  {isEmailAvailable === false && (
                    <p className="text-xs text-red-500 font-bold px-2 mt-1 animate-in fade-in">
                      البريد الإلكتروني موجود بالفعل ومسجل لمستخدم آخر
                    </p>
                  )}
                </div>

                <div className={styles.formSection}>
                  <label className={`small-title ${styles.labelBlock}`}>
                    تاريخ انتهاء الصلاحية (مؤقت) - اختياري
                  </label>
                  <input
                    name="expiresAt"
                    type="date"
                    defaultValue={
                      editingUser?.expiresAt
                        ? new Date(editingUser.expiresAt)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    className={`form-input ${styles.formInput}`}
                    aria-label="تاريخ الانتهاء"
                  />
                </div>

                <div className={styles.roleSection}>
                  <label className={`small-title ${styles.labelBlock}`}>
                    الصلاحية العامة
                  </label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role || "OPERATOR"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className={`form-input ${styles.formInput}`}
                    aria-label="الصلاحية العامة"
                  >
                    {getCreatableRolesForUI(currentUserRole).map((role) => (
                      <option key={role} value={role}>
                        {translations.roles[role] || role}
                      </option>
                    ))}
                    {editingUser &&
                      !getCreatableRolesForUI(currentUserRole).includes(
                        editingUser.role as string,
                      ) && (
                        <option value={editingUser.role as string}>
                          {editingUser.role as string}
                        </option>
                      )}
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setIsModalOpen(false)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={hasValidationErrors}
                  >
                    {editingUser ? "حفظ التغييرات" : "إضافة مستخدم"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Table - Kept Same */}
      <div className={`glass-panel ${styles.auditSection}`}>
        <h3 className={`small-title ${styles.auditTitle}`}>
          سجلات العمليات الأخيرة
        </h3>
        <table className={`table ${styles.auditTable}`}>
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>العملية</th>
              <th>التفاصيل</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {(auditLogs || []).map((log) => (
              <tr key={log.id}>
                <td>{log.user?.username || "النظام"}</td>
                <td>
                  <span className={`status-badge ${styles.auditBadge}`}>
                    {translateAction(log.action)}
                  </span>
                </td>
                <td className={styles.auditDetails}>
                  {translateDetails(log.details)}
                </td>
                <td className={styles.auditTime}>
                  {formatLogDate(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Modal */}
      {isPermissionsModalOpen && managingPermissionsUser && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modalContent} max-w-lg`}>
            <h2 className={styles.modalTitle}>
              {`صلاحيات مخصصة: ${managingPermissionsUser.name}`}
            </h2>
            <div className="mb-4 text-sm text-slate-400">
              قم باختيار الصلاحيات الإضافية التي ترغب بمنحها للمستخدم، بغض النظر
              عن دوره الافتراضي.
            </div>

            <div className="flex flex-col gap-3 mb-6 p-4 rounded bg-slate-900/50 border border-white/5 max-h-60 overflow-y-auto">
              {[
                { id: "MANAGE_LAB", label: "إدارة المختبر" },
                { id: "CREATE_MIX_DESIGN", label: "إنشاء تصاميم خلطات" },
                { id: "APPROVE_RESULTS", label: "اعتماد نتائج الفحوصات" },
                { id: "MANAGE_PRODUCTION", label: "إدارة الإنتاج" },
                { id: "VIEW_FINANCE", label: "الاطلاع على المالية" },
                { id: "MANAGE_SALES", label: "إدارة المبيعات" },
              ].map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-800"
                    checked={customPermissions.includes(perm.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCustomPermissions([...customPermissions, perm.id]);
                      } else {
                        setCustomPermissions(
                          customPermissions.filter((p) => p !== perm.id),
                        );
                      }
                    }}
                  />
                  <span className="text-slate-300 font-medium">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsPermissionsModalOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  if (!managingPermissionsUser) return;
                  const loadingId = toast.loading("جاري حفظ الصلاحيات...");
                  try {
                    const res = await saveUserCustomPermissions(
                      managingPermissionsUser.id,
                      customPermissions,
                    );
                    if (res.success) {
                      toast.success("تم حفظ الصلاحيات بنجاح!", {
                        id: loadingId,
                      });
                      setIsPermissionsModalOpen(false);
                    } else {
                      toast.error((res as { error?: string }).error || "خطأ", {
                        id: loadingId,
                      });
                    }
                  } catch {
                    toast.error("خطأ", { id: loadingId });
                  }
                }}
              >
                حفظ الصلاحيات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
