import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ManagerMachinesPage() {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">{"قائمة الآليات"}</h1>

      <div className="card glass-panel w-full overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{"الرمز"}</th>
              <th>{"النوع"}</th>
              <th>{"الحالة"}</th>
              <th>{"الموقع"}</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="font-bold text-white">{v.code}</td>
                <td>{v.type}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold font-semibold ${
                      v.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td>{v.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
