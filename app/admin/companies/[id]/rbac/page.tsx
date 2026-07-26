import {
  getRoles,
  getPermissions,
  getRolePermissions,
} from "@/app/actions/rbac";
import { PermissionMatrix } from "@/components/system/rbac/PermissionMatrix";
import { CreateRoleForm } from "@/components/system/rbac/CreateRoleForm";
import { EditRoleDialog } from "@/components/system/rbac/EditRoleDialog";
import { DeleteRoleButton } from "@/components/system/rbac/DeleteRoleButton";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering if params are involved in data fetching that might change
export const dynamic = "force-dynamic";

export default async function CompanyAdminRBACPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ roleId?: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id);
  if (isNaN(companyId)) return notFound();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, slug: true },
  });

  if (!company) return notFound();

  // Fetch roles for THIS company + System roles
  const roles = await getRoles(companyId);
  const allPermissions = await getPermissions();

  const { roleId } = await searchParams;
  const selectedRoleId = roleId ? parseInt(roleId) : roles[0]?.id;
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Fetch permissions for selected role
  const rolePermissions = selectedRole
    ? await getRolePermissions(selectedRole.id)
    : [];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-white/5 p-6 rounded-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/companies/${companyId}`}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border border-slate-200"
          >
            <Icons.ArrowLeft className="w-5 h-5 transform rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Icons.Lock className="w-6 h-6 text-amber-500" />
              إدارة صلاحيات: {company.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-mono">
              {company.slug} | تعديل الأدوار والصلاحيات
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Role List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create Role for THIS company */}
          <CreateRoleForm companyId={companyId} />

          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">
              الأدوار الوظيفية
            </h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <Link
                  key={role.id}
                  href={`/admin/companies/${companyId}/rbac?roleId=${role.id}`}
                  className={`block px-4 py-3 rounded-xl border transition-all ${
                    selectedRoleId === role.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {role.displayName || role.name}
                    </span>
                    {role.isSystem && (
                      <span className="text-sm font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase font-black">
                        نظام
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold mt-1 truncate ${selectedRoleId === role.id ? "text-indigo-100" : "text-slate-400"}`}
                  >
                    {role.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Matrix Editor */}
        <div className="lg:col-span-3">
          {selectedRole ? (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 shadow-sm border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedRole.displayName || selectedRole.name}
                    {selectedRole.isSystem && (
                      <span className="text-sm font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase font-black tracking-wider">
                        نظام (System Role)
                      </span>
                    )}
                    {selectedRole.isSovereign && (
                      <span className="text-sm font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase font-black tracking-wider flex items-center gap-1">
                        <Icons.Shield className="w-3 h-3" />
                        سيادي (Sovereign)
                      </span>
                    )}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedRole.description || "لا يوجد وصف"}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Icons.Users className="w-3 h-3" />
                      {selectedRole._count?.memberships || 0} مستخدمين
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      ID: {selectedRole.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <EditRoleDialog role={selectedRole} />
                  <DeleteRoleButton
                    roleId={selectedRole.id}
                    roleName={selectedRole.displayName || selectedRole.name}
                    isSovereign={selectedRole.isSovereign}
                    userCount={selectedRole._count?.memberships || 0}
                  />
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-sm border border-white/5">
                <PermissionMatrix
                  role={selectedRole}
                  allPermissions={allPermissions}
                  initialGrantedIds={rolePermissions}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]"></div>
              <p className="text-slate-500 font-medium relative z-10">
                قم باختيار دور وظيفي من القائمة الجانبية
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
