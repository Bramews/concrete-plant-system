"use client";

import { Order } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/Icons";

interface OrdersListProps {
  orders: Order[];
  lang: "en" | "ar";
}

export default function OrdersList({
  orders,
  lang,
  totalCount = 0,
  currentPage = 1,
  currentStatus = "ALL",
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.set("page", "1"); // Reset to page 1
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="card glass-panel p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="section-title">
          {"قائمة الأوردرات"}
          <span className="text-sm font-normal text-slate-400 mx-2">
            ({totalCount})
          </span>
        </h3>

        {/* Status Filter */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          {["ALL", "PENDING_APPROVAL", "IN_PROGRESS", "COMPLETED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${
                  currentStatus === status
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {status === "ALL" ? "الكل" : status.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="table w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-slate-300 border-b border-white/10">
              <th className="py-3 px-4 text-start">{"رقم"}</th>
              <th className="py-3 px-4 text-start">{"العميل"}</th>
              <th className="py-3 px-4 text-start">{"المشروع"}</th>
              <th className="py-3 px-4 text-start">{"الخلطة"}</th>
              <th className="py-3 px-4 text-start">{"الكمية"}</th>
              <th className="py-3 px-4 text-start">{"التاريخ"}</th>
              <th className="py-3 px-4 text-start">{"الحالة"}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Icons.Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  {"لا توجد أوردرات تطابق البحث"}
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
                <tr
                  key={order.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-indigo-300">
                    #{order.orderNumber || order.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-white max-w-[150px] truncate">
                    {order.customer?.name || "---"}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">
                    {order.project?.name || "---"}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {order.mixDesign?.code || "---"}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {order.volume} m³
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-sm font-bold">
                    {new Date(order.date).toLocaleDateString("ar-u-nu-latn")}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-bold uppercase tracking-wider ${
                        order.status === "PENDING_APPROVAL"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : order.status === "IN_PROGRESS"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400 border border-white/10"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-4">
          <p className="text-sm font-bold text-slate-500">
            {`صفحة ${currentPage} من ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              {"السابق"}
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            >
              {"التالي"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
