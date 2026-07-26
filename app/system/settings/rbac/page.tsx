import {
  getRoles,
  getPermissions,
  getRolePermissions,
} from "@/app/actions/rbac";
import { PermissionMatrix } from "@/components/system/rbac/PermissionMatrix";
import { CreateRoleForm } from "@/components/system/rbac/CreateRoleForm";
import { EditRoleDialog } from "@/components/system/rbac/EditRoleDialog";
import { DeleteRoleButton } from "@/components/system/rbac/DeleteRoleButton";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { redirect } from "next/navigation";

export default async function CompanyRBACPage({
  searchParams,
}: {
  searchParams: Promise<{ roleId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) {
    redirect("/access-denied");
  }

  const roles = await getRoles(user.companyId);
  const allPermissions = await getPermissions();

  const { roleId } = await searchParams;
  const selectedRoleId = roleId ? parseInt(roleId) : roles[0]?.id;
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Fetch permissions for selected role
  const rolePermissions = selectedRole
    ? await getRolePermissions(selectedRole.id)
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            إدارة صلاحيات الشركة
          </h1>
          <p className="text-slate-500 mt-2">
            تخصيص الصلاحيات للموظفين داخل مؤسستك.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Role Card */}
          <div className="h-full">
            <CreateRoleForm companyId={user.companyId} />
          </div>

          {/* Role Cards */}
          {roles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            return (
              <div
                key={role.id}
                className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.02]"
                    : "bg-white border-slate-200 hover:border-indigo-500/50 hover:shadow-lg"
                }`}
              >
                <Link
                  href={`/system/settings/rbac?roleId=${role.id}`}
                  className="block p-6 h-full flex flex-col justify-between"
                  scroll={false} // Prevent scrolling to top
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-xl transition-colors ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}
                      >
                        <Icons.Shield className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        {role.isSystem && (
                          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase tracking-wider">
                            نظام
                          </span>
                        )}
                        {role.isSovereign && (
                          <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg uppercase tracking-wider">
                            محمي
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`text-lg font-bold mb-1 transition-colors ${
                          isSelected
                            ? "text-white"
                            : "text-slate-800 group-hover:text-indigo-700"
                        }`}
                      >
                        {role.displayName || role.name}
                      </h3>
                      <p
                        className={`text-sm font-bold leading-relaxed line-clamp-2 ${
                          isSelected ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        {role.description || "لا يوجد وصف مدخل لهذا الدور.."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t pt-4 border-slate-100 group-hover:border-indigo-50">
                    <span
                      className={`text-sm font-semibold font-mono flex items-center gap-1.5 ${
                        isSelected ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      <Icons.Users className="w-3.5 h-3.5" />
                      {role._count?.memberships || 0} مستخدم
                    </span>
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded-md transition-colors ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      }`}
                    >
                      عرض الصلاحيات
                    </span>
                  </div>
                </Link>

                {/* Actions Overlay (Edit/Delete) */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
                  <EditRoleDialog role={role} />
                  <DeleteRoleButton
                    roleId={role.id}
                    roleName={role.displayName || role.name}
                    isSovereign={role.isSovereign}
                    userCount={role._count?.memberships || 0}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Role Permissions Matrix */}
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {selectedRole ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="p-2 bg-indigo-600 rounded-lg text-white">
                      <Icons.Lock className="w-5 h-5" />
                    </span>
                    صلاحيات: {selectedRole.displayName || selectedRole.name}
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                    أدناه يمكنك التحكم في جميع الصلاحيات الخاصة بهذا الدور.
                    التغييرات يتم حفظها مباشرة.
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-900 rounded-b-3xl">
                {/* Dark Matrix in Light Page */}
                <PermissionMatrix
                  role={selectedRole}
                  allPermissions={allPermissions}
                  initialGrantedIds={rolePermissions}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center">
              <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                <Icons.Shield className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                لم يتم اختيار أي دور
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                قم بالنقر على أحد الأدوار في الأعلى لعرض وتعديل الصلاحيات الخاصة
                به
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
