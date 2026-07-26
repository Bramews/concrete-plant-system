"use client";

import { useState } from "react";
import { updateRolePermissions } from "@/app/actions/rbac";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import { toast } from "@/lib/toast";

interface Permission {
  id: string;
  resource: string;
  action: string;
}

interface Role {
  id: number;
  name: string;
  displayName?: string | null;
}

interface Props {
  role: Role;
  allPermissions: Permission[];
  initialGrantedIds: string[];
}

export function PermissionMatrix({
  role,
  allPermissions,
  initialGrantedIds,
}: Props) {
  const [granted, setGranted] = useState<Set<string>>(
    new Set(initialGrantedIds),
  );
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const resources = Array.from(
    new Set(allPermissions.map((p) => p.resource)),
  ).sort();

  const actions = ["create", "read", "update", "delete", "export", "approve"];

  const resourceNames: Record<string, string> = {
    audit_logs: "سجلات النظام",
    clients: "العملاء",
    fleet: "الأسطول والخلاطات",
    inventory: "المخزون والمواد",
    invoices: "الفواتير والمالية",
    lab_tests: "فحوصات المختبر",
    mix_designs: "تصاميم الخلطات",
    orders: "المبيعات والطلبات",
    production: "الإنتاج والتشغيل",
    projects: "المشاريع",
    users: "المستخدمين والموظفين",
    roles: "الأدوار والصلاحيات",
    reports: "التقارير",
    settings: "إعدادات النظام",
  };

  const actionLabels: Record<string, string> = {
    create: "إضافة",
    read: "عرض",
    update: "تعديل",
    delete: "حذف",
    export: "تصدير",
    approve: "اعتماد",
  };

  const togglePermission = (permId: string) => {
    const next = new Set(granted);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setGranted(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRolePermissions(role.id, Array.from(granted));
      router.refresh();
      toast.success("تم حفظ الصلاحيات بنجاح");
    } catch (e) {
      console.error(e);
      toast.error("فشل في حفظ الصلاحيات.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] relative" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-slate-900 sticky top-0 z-20 shrink-0">
        {/* RIGHT SIDE: Title */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h3 className="text-sm font-bold text-white">جدول الصلاحيات</h3>
            <p className="text-sm font-bold text-slate-400">
              تعديل صلاحيات {role.displayName || role.name}
            </p>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Icons.Unlock className="w-4 h-4" />
          </div>
        </div>

        {/* LEFT SIDE: Save Button - FORCE LEFT */}
        <div className="flex items-center" style={{ direction: "ltr" }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
                group flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/10 border border-indigo-500/20
                ${
                  isSaving
                    ? "bg-slate-700 text-slate-400 cursor-wait"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105"
                }
            `}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icons.Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-0">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="text-sm font-bold uppercase bg-slate-800/50 text-slate-300 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-3 font-bold text-right border-b border-white/5 w-1/4">
                القسم / المورد
              </th>
              {actions.map((action) => (
                <th
                  key={action}
                  className="px-2 py-3 text-center font-bold border-b border-white/5"
                >
                  {actionLabels[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {resources.map((resource) => (
              <tr
                key={resource}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-3 font-medium text-slate-200 text-sm border-l border-white/5 bg-slate-900/20">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors"></span>
                    {resourceNames[resource] || resource}
                  </div>
                </td>
                {actions.map((action) => {
                  const perm = allPermissions.find(
                    (p) =>
                      p.resource.toLowerCase() === resource.toLowerCase() &&
                      p.action.toLowerCase() === action.toLowerCase(),
                  );

                  return (
                    <td key={action} className="px-2 py-3 text-center">
                      {perm ? (
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={granted.has(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-1 focus:ring-indigo-500/50 cursor-pointer accent-indigo-500 transition-transform hover:scale-110"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-800 text-sm font-bold">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
