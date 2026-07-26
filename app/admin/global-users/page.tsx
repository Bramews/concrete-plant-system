import { getGlobalUsers } from "@/app/actions/admin-saas";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";

// Read-Only view of all users across the system
export default async function GlobalUsersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const users = await getGlobalUsers();

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {"دليل المستخدمين العالمي"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {"عرض للقراءة فقط لجميع مستخدمي النظام."}
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-sm font-bold text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">{"المستخدم"}</th>
              <th className="px-6 py-4">{"الشركة"}</th>
              <th className="px-6 py-4">{"الدور"}</th>
              <th className="px-6 py-4">{"الحالة"}</th>
              <th className="px-6 py-4">{"تاريخ الانضمام"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm font-bold text-gray-500">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.company ? (
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-200">
                        {user.company.name}
                      </div>
                      <div className="text-sm font-bold text-blue-500">
                        {user.company.slug}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">
                      System / Unassigned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-bold font-mono">
                    {user.userRoles
                      ?.map((ur: any) => ur.role.displayName || ur.role.name)
                      .join(", ") || "لا يوجد دور"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
