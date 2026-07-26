import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPermissionMatrix } from "@/app/actions/permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { PermissionMatrix } from "../_components/PermissionMatrix";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") redirect("/");

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  const matrix = await getPermissionMatrix();
  const roles = Object.keys(matrix);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {dict.admin.permissions.title}
          </h1>
          <p className="text-slate-400">
            {dict.admin.permissions.desc}{" "}
            <span className="text-yellow-400">
              ● {dict.admin.permissions.legend.default}
            </span>{" "}
            <span className="text-cyan-400">
              ● {dict.admin.permissions.legend.db}
            </span>
          </p>
        </div>
      </div>

      <PermissionMatrix
        matrix={matrix}
        roles={roles}
        permissions={PERMISSIONS as unknown as string[]}
        dict={dict}
      />
    </div>
  );
}
