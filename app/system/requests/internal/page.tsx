import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";
import { createRequest, processRequest } from "@/app/actions/request";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BidiText } from "@/components/ui/BidiText";

export default async function InternalRequests() {
  const lang = await getCurrentLanguage();
  const t = getDictionary(lang);
  const tr = t.requests || {
    title: "الطلبات الداخلية",
    new_request: "طلب جديد",
    request_type: "النوع",
    details: "التفاصيل",
    details_placeholder: "اشرح المتطلبات بالتفصيل...",
    submit: "إرسال للمراجعة",
    history: "سجل الطلبات",
    manager_note_placeholder: "ملاحظة المدير...",
    approve: "موافقة",
    reject: "رفض",
    note: "ملاحظة",
    types: {
      PURCHASE: "طلب شراء",
      MAINTENANCE: "صيانة المحطة",
      SAFETY: "معدات السلامة",
      OTHER: "أخرى",
    },
    status: {
      PENDING: "قيد المراجعة",
      PM_APPROVED: "مقبول",
      REJECTED: "مرفوض",
    },
  };

  const user = await getCurrentUser();
  if (!user || !user.companyId) {
    redirect("/api/auth/session-cleanup");
  }

  const requests = await prisma.request.findMany({
    where: {
      companyId: user.companyId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: true,
    },
  });

  const canApprove = ["MANAGER", "ACCOUNTANT", "SYSTEM_OWNER"].includes(
    user.role,
  );

  // eslint-disable-next-line react-hooks/purity
  const newRequestId = `REQ-NEW-${Date.now()}`;

  return (
    <div className="flex-1 flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-white font-bold">{tr.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-card-title text-white font-bold border-b border-slate-800/30 pb-3">
            {tr.new_request}
          </h3>

          <form action={createRequest} className="flex flex-col gap-4">
            <input type="hidden" name="requestId" value={newRequestId} />

            <div className="flex flex-col gap-2">
              <label className="text-body text-slate-300 font-bold">
                {tr.request_type}
              </label>
              <select
                name="type"
                className="form-input bg-slate-950/40 border-slate-800 text-white rounded-md p-2 text-sm font-bold"
                required
              >
                <option value="PURCHASE" className="bg-slate-900">
                  {tr.types.PURCHASE}
                </option>
                <option value="MAINTENANCE" className="bg-slate-900">
                  {tr.types.MAINTENANCE}
                </option>
                <option value="SAFETY" className="bg-slate-900">
                  {tr.types.SAFETY}
                </option>
                <option value="OTHER" className="bg-slate-900">
                  {tr.types.OTHER}
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body text-slate-300 font-bold">
                {tr.details}
              </label>
              <textarea
                name="details"
                className="form-input bg-slate-950/40 border-slate-800 text-white rounded-md p-2 min-h-[120px] text-sm font-bold"
                placeholder={tr.details_placeholder}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2 font-bold mt-2"
            >
              {tr.submit}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-card-title text-white font-bold border-b border-slate-800/30 pb-3">
            {tr.history}
          </h3>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] no-scrollbar">
            {requests.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-body">
                لا توجد طلبات مسجلة حالياً.
              </p>
            ) : (
              requests.map((req) => {
                const badgeColor =
                  req.status === "PM_APPROVED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : req.status === "REJECTED"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

                // eslint-disable-next-line react-hooks/purity
                const procId = `REQ-PROC-${req.id}-${Date.now()}`;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-lg border border-slate-800/30 bg-slate-900/20 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-sm font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {tr.types[req.type as keyof typeof tr.types] ||
                          req.type}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-sm font-bold rounded-md ${badgeColor}`}
                      >
                        {tr.status[req.status as keyof typeof tr.status] ||
                          req.status}
                      </span>
                    </div>

                    <p className="text-body text-slate-200">{req.details}</p>

                    <div className="flex items-center justify-between text-sm font-bold text-slate-400 border-t border-slate-800/20 pt-2.5 mt-1">
                      <span className="font-bold">
                        {req.requester?.name ||
                          req.creatorName ||
                          "مستخدم محذوف"}
                      </span>
                      <BidiText className="font-mono text-slate-500 text-sm font-bold">
                        {new Date(req.createdAt).toLocaleString(
                          lang === "ar" ? "ar-EG" : "en-US",
                        )}
                      </BidiText>
                    </div>

                    {req.status === "PENDING" && canApprove && (
                      <form
                        action={processRequest}
                        className="flex items-center gap-2 mt-2 bg-slate-950/20 p-2 rounded-md border border-slate-800/20"
                      >
                        <input type="hidden" name="id" value={req.id} />
                        <input type="hidden" name="requestId" value={procId} />
                        <input
                          type="text"
                          name="note"
                          className="form-input bg-slate-900/60 border-slate-800 text-white rounded-md px-3 py-1.5 text-sm font-bold flex-1"
                          placeholder={tr.manager_note_placeholder}
                        />
                        <button
                          type="submit"
                          name="action"
                          value="APPROVE"
                          className="px-4 py-1.5 text-sm font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-md transition-colors"
                        >
                          {tr.approve}
                        </button>
                        <button
                          type="submit"
                          name="action"
                          value="REJECT"
                          className="px-4 py-1.5 text-sm font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-md transition-colors"
                        >
                          {tr.reject}
                        </button>
                      </form>
                    )}

                    {req.managerNote && (
                      <div className="text-sm font-bold text-amber-500/80 bg-amber-500/5 p-2 rounded-md border border-amber-500/10">
                        <span className="font-bold">{tr.note}: </span>
                        <span>{req.managerNote}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
