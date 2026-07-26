import {
  getRoles,
  getPermissions,
  getRolePermissions,
  getDepartments,
  getCompanies,
} from "@/app/actions/rbac";
import { RolesManagerClient } from "@/components/system/rbac/RolesManagerClient";

export default async function RBACPage() {
  const roles = await getRoles();
  const allPermissions = await getPermissions();
  const departments = await getDepartments();
  const companies = await getCompanies();

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const perms = await getRolePermissions(role.id);
      return {
        ...role,
        permissions: perms.map((id: string) => ({ permissionId: id })),
      };
    }),
  );

  return (
    <div
      className="h-[calc(100vh-4rem)] bg-[#0f172a] text-slate-200 overflow-hidden flex flex-col pt-1"
      dir="rtl"
    >
      <RolesManagerClient
        initialRoles={rolesWithPermissions}
        allPermissions={allPermissions}
        departments={departments}
        companies={companies}
      />
    </div>
  );
}
