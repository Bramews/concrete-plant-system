import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

export default async function AdminPlansPage() {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") redirect("/access-denied");

  const plans = await prisma.plan.findMany({
    orderBy: { id: "asc" },
    include: {
      Subscription: true,
    },
  });

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            خطط الاشتراك (SaaS Plans)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            إدارة مسارات الاشتراك والميزات المتاحة
          </p>
        </div>
        <Link
          href="/admin/plans/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>إضافة خطة جديدة</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group"
          >
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Icons.CreditCard className="w-5 h-5" />
                </div>
                <span className="bg-slate-800 text-gray-300 text-sm font-bold px-2 py-1 rounded font-mono">
                  {plan.key}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-400 min-h-[40px]">
                {plan.description}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm font-bold">
                    المستخدمين
                  </span>
                  <span className="text-gray-200 font-medium">
                    {plan.maxUsers === -1 ? "غير محدود" : plan.maxUsers}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm font-bold">
                    سعة التخزين
                  </span>
                  <span className="text-gray-200 font-medium">
                    {plan.maxStorage} MB
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm font-bold">
                    الطلبات / شهر
                  </span>
                  <span className="text-gray-200 font-medium">
                    {plan.maxOrders === -1 ? "غير محدود" : plan.maxOrders}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm font-bold">
                    المشاريع
                  </span>
                  <span className="text-gray-200 font-medium">
                    {plan.maxProjects === -1 ? "غير محدود" : plan.maxProjects}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
                  <span>عدد المشتركين:</span>
                  <span className="text-white font-bold">
                    {plan.Subscription.length}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(plan.Subscription.length * 5, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
              <Link
                href={`/admin/plans/${plan.id}`}
                className="text-sm font-bold text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
              >
                تعديل
              </Link>
              <button className="text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors">
                التفاصيل
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add New Placeholder */}
        <Link
          href="/admin/plans/new"
          className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-900/30 transition-colors cursor-pointer min-h-[300px]"
        >
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-gray-500 mb-4">
            <Icons.Plus className="w-6 h-6" />
          </div>
          <h3 className="text-gray-300 font-medium">إنشاء خطة جديدة</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
            قم بإضافة مستوى اشتراك جديد وقواعد حدود الاستخدام.
          </p>
        </Link>
      </div>
    </div>
  );
}
