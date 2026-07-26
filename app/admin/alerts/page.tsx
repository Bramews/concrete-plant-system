import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function resolveAlert(id: number) {
  "use server";
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  await prisma.systemAlert.update({
    where: { id },
    data: { resolved: true },
  });
  revalidatePath("/admin/alerts");
}

export default async function AdminAlertsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") redirect("/access-denied");

  const alerts = await prisma.systemAlert.findMany({
    orderBy: { timestamp: "desc" },
    include: { company: true },
    take: 100,
  });

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          سجل التنبيهات ونظام الإنذار المبكر
        </h1>
        <div className="text-sm text-gray-400">
          مراقبة الأمان والامتثال (Security & Integrity)
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-right text-sm text-gray-300">
          <thead className="bg-slate-900 text-gray-400 uppercase text-sm font-bold font-semibold">
            <tr>
              <th className="px-4 py-3">المستوى</th>
              <th className="px-4 py-3">الرسالة</th>
              <th className="px-4 py-3">التصنيف</th>
              <th className="px-4 py-3">الشركة</th>
              <th className="px-4 py-3">الوقت</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {alerts.map((alert) => (
              <tr
                key={alert.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium">
                  <SeverityBadge severity={alert.severity} />
                </td>
                <td className="px-4 py-3">{alert.message}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-slate-800 text-sm font-bold">
                    {alert.category || "عام"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {alert.company ? (
                    <span className="text-blue-400">{alert.company.name}</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-sm font-bold text-gray-500">
                  {new Date(alert.timestamp).toLocaleString("ar-u-nu-latn")}
                </td>
                <td className="px-4 py-3">
                  {alert.resolved ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      تم الحل
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      نشط
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!alert.resolved && (
                    <form action={resolveAlert.bind(null, alert.id)}>
                      <button className="text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors">
                        إغلاق
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  لا توجد تنبيهات مسجلة حالياً. النظام آمن.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-500 border border-red-500/20",
    HIGH: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
    LOW: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    INFO: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-sm font-bold ${
        styles[severity.toUpperCase()] || styles.INFO
      }`}
    >
      {severity}
    </span>
  );
}
