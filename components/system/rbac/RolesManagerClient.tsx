"use client";

import { useState, useEffect } from "react";
import { PermissionMatrix } from "@/components/system/rbac/PermissionMatrix";
import { CreateRoleForm } from "@/components/system/rbac/CreateRoleForm";
import { EditRoleDialog } from "@/components/system/rbac/EditRoleDialog";
import { DeleteRoleButton } from "@/components/system/rbac/DeleteRoleButton";
import { Icons } from "@/components/ui/Icons";
import { useRouter, useSearchParams } from "next/navigation";

interface Role {
  id: number;
  name: string;
  displayName: string | null;
  description: string | null;
  isSystem: boolean;
  isSovereign: boolean;
  companyId: number | null;
  _count: { memberships: number };
  permissions: { permissionId: string }[];
}

interface Permission {
  id: string;
  name?: string;
  description: string | null;
  resource: string;
  action: string;
}

interface Props {
  initialRoles: Role[];
  allPermissions: Permission[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  departments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companies: any[];
}

export function RolesManagerClient({
  initialRoles,
  allPermissions,
  departments,
  companies,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");

  useEffect(() => {
    const roleIdParam = searchParams.get("roleId");
    if (roleIdParam) {
      const id = parseInt(roleIdParam);
      if (!isNaN(id)) {
        if (selectedRoleId !== id) {
          setSelectedRoleId(id);
          setViewMode("detail");
        }
      }
    } else {
      if (viewMode !== "grid") {
        setSelectedRoleId(null);
        setViewMode("grid");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleRoleSelect = (roleId: number) => {
    setSelectedRoleId(roleId);
    setViewMode("detail");
    router.push(`?roleId=${roleId}`, { scroll: false });
  };

  const handleBackToGrid = () => {
    setSelectedRoleId(null);
    setViewMode("grid");
    router.push("/admin/rbac", { scroll: false });
  };

  const selectedRole = initialRoles.find((r) => r.id === selectedRoleId);
  const selectedRolePermissions =
    selectedRole?.permissions.map((p) => p.permissionId) || [];

  return (
    <div className="relative h-full flex-1 overflow-hidden">
      {/* Grid View */}
      <div
        className={`transition-all duration-500 ease-in-out absolute inset-0 ${
          viewMode === "grid"
            ? "opacity-100 translate-y-0 z-10 visible delay-200"
            : "opacity-0 -translate-y-10 z-0 invisible pointer-events-none"
        }`}
      >
        <div className="h-full overflow-y-auto custom-scrollbar pb-20 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="min-h-[250px]">
              <CreateRoleForm departments={departments} companies={companies} />
            </div>

            {initialRoles.map((role) => (
              <div
                key={role.id}
                className="relative group rounded-2xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer min-h-[250px]"
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="block p-6 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-white/5 rounded-xl text-indigo-400 group-hover:text-white group-hover:bg-indigo-500/20 transition-colors">
                        <Icons.Shield className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        {role.isSystem && (
                          <span className="text-sm font-bold font-black bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20 uppercase tracking-wider">
                            نظام
                          </span>
                        )}
                        {role.isSovereign && (
                          <span className="text-sm font-bold font-black bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg border border-purple-500/20 uppercase tracking-wider">
                            محمي
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-1 text-slate-200 group-hover:text-white transition-colors">
                        {role.displayName || role.name}
                      </h3>
                      <p className="text-sm font-bold text-slate-400 leading-relaxed line-clamp-2">
                        {role.description || "لا يوجد وصف مدخل لهذا الدور.."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-sm font-bold font-mono text-slate-500 flex items-center gap-1.5">
                      <Icons.Users className="w-3.5 h-3.5" />
                      {role._count?.memberships || 0} مستخدم
                    </span>
                    <span className="text-sm font-bold bg-white/5 text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 px-2 py-1 rounded-md transition-colors">
                      عرض
                    </span>
                  </div>
                </div>

                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 z-20">
                  <div onClick={(e) => e.stopPropagation()}>
                    <EditRoleDialog role={role} />
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DeleteRoleButton
                      roleId={role.id}
                      roleName={role.displayName || role.name}
                      isSovereign={role.isSovereign}
                      userCount={role._count?.memberships}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail View */}
      <div
        className={`transition-all duration-500 ease-in-out absolute inset-0 ${
          viewMode === "detail"
            ? "opacity-100 translate-y-0 visible delay-200 z-20"
            : "opacity-0 translate-y-10 invisible pointer-events-none z-0"
        }`}
      >
        {selectedRole && (
          <div className="flex h-full gap-4 overflow-hidden">
            {/* Compact Sidebar */}
            <div className="w-[260px] shrink-0 flex flex-col gap-4 h-full">
              {/* Modern Back Button - Gradient Style */}
              <button
                onClick={handleBackToGrid}
                className="group relative overflow-hidden w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 text-white p-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Icons.ArrowRight className="w-5 h-5 rotate-180 relative z-10 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm relative z-10 tracking-wide">
                  العودة للرئيسية
                </span>
              </button>

              {/* Active Role Card - Compact & Modern */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-5 shadow-2xl shadow-indigo-900/30 border border-indigo-500/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white shadow-lg">
                      <Icons.Shield className="w-6 h-6" />
                    </div>
                    <div className="bg-white/15 hover:bg-white/25 rounded-lg transition-all scale-95 hover:scale-100">
                      <EditRoleDialog role={selectedRole} />
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-white mb-3 leading-tight tracking-tight">
                    {selectedRole.displayName || selectedRole.name}
                  </h2>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white bg-white/15 backdrop-blur-md p-2 px-3 rounded-xl border border-white/10">
                      <Icons.Users className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">
                        {selectedRole._count?.memberships || 0}
                      </span>
                    </div>

                    <div className="bg-red-500/25 hover:bg-red-500/40 rounded-lg transition-all border border-red-500/30 scale-95 hover:scale-100">
                      <DeleteRoleButton
                        roleId={selectedRole.id}
                        roleName={selectedRole.displayName || selectedRole.name}
                        isSovereign={selectedRole.isSovereign}
                        userCount={selectedRole._count?.memberships}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Matrix - Clean & Modern */}
            <div className="flex-1 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-full">
              {/* Matrix Content */}
              <div className="flex-1 overflow-hidden relative bg-[#0f172a]">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                  <PermissionMatrix
                    role={selectedRole}
                    allPermissions={allPermissions}
                    initialGrantedIds={selectedRolePermissions}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
