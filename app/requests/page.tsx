import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { createRequest, processRequest } from "@/app/actions/request";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BidiText } from "@/components/ui/BidiText";

export default async function RequestsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];
  const tr = t.requests || {
    title: "الطلبــات الداخليــة",
    new_request: "طلب جديد",
    request_type: "النوع",
    details: "التفاصيل",
    details_placeholder: "Explain the requirement...",
    submit: "إرسال للمراجعة",
    history: "سجل الطلبات",
    manager_note_placeholder: "Manager note...",
    approve: "موافقة",
    reject: "رفض",
    note: "ملاحظة",
    types: {
      PURCHASE: "Purchase Request",
      MAINTENANCE: "Plant Maintenance",
      SAFETY: "Safety Equipment",
      OTHER: "Other",
    },
    status: {
      PENDING: "Pending",
      PM_APPROVED: "Approved",
      REJECTED: "Rejected",
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
    <div style={{ padding: "2rem" }}>
      <h1 className="page-title">{tr.title}</h1>

      <div className="grid-2" style={{ gap: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3>{tr.new_request}</h3>
          <form action={createRequest} className="glass-form">
            <input type="hidden" name="requestId" value={newRequestId} />

            <div className="form-group">
              <label>{tr.request_type}</label>
              <select name="type" className="form-input" required>
                <option value="PURCHASE">{tr.types.PURCHASE}</option>
                <option value="MAINTENANCE">{tr.types.MAINTENANCE}</option>
                <option value="SAFETY">{tr.types.SAFETY}</option>
                <option value="OTHER">{tr.types.OTHER}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{tr.details}</label>
              <textarea
                name="details"
                className="form-input"
                placeholder={tr.details_placeholder}
                required
                style={{ height: "120px" }}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              {tr.submit}
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3>{tr.history}</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {requests.map((req) => {
              // eslint-disable-next-line react-hooks/purity
              const procId = `REQ-PROC-${req.id}-${Date.now()}`;
              return (
                <div
                  key={req.id}
                  style={{
                    padding: "1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      className="status-badge"
                      style={{ background: "#3b82f6" }}
                    >
                      {tr.types[req.type as keyof typeof tr.types] || req.type}
                    </span>
                    <span className={`status-badge status-${req.status}`}>
                      {tr.status[req.status as keyof typeof tr.status] ||
                        req.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>
                    {req.details}
                  </p>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.5rem",
                    }}
                  >
                    <span>
                      {req.requester?.name ||
                        req.creatorName ||
                        (lang === "ar" ? "مستخدم محذوف" : "Deleted User")}
                    </span>
                    <BidiText className="font-mono">
                      {new Date(req.createdAt).toLocaleString(
                        lang === "ar" ? "ar-EG" : "en-US",
                      )}
                    </BidiText>
                  </div>

                  {req.status === "PENDING" && canApprove && (
                    <form
                      action={processRequest}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="requestId" value={procId} />
                      <input
                        type="text"
                        name="note"
                        className="form-input"
                        placeholder={tr.manager_note_placeholder}
                        style={{ flex: 1, padding: "0.2rem" }}
                      />
                      <button
                        type="submit"
                        name="action"
                        value="APPROVE"
                        className="btn btn-primary"
                        style={{ padding: "0.2rem 0.5rem" }}
                      >
                        {tr.approve}
                      </button>
                      <button
                        type="submit"
                        name="action"
                        value="REJECT"
                        className="btn btn-secondary"
                        style={{ padding: "0.2rem 0.5rem" }}
                      >
                        {tr.reject}
                      </button>
                    </form>
                  )}
                  {req.managerNote && (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                        fontStyle: "italic",
                        marginTop: "0.5rem",
                      }}
                    >
                      {tr.note}: {req.managerNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
