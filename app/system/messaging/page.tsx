import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";

export default async function MessagingSystemPage() {
  await requireRole(["MANAGER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>{dict.manager.ai}</h2>

      <div style={{ marginBottom: "3rem" }}>
        <h3>{dict.sales.templates}</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <div
            className="card"
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h4>{dict.sales.lab_rejection}</h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginTop: "0.5rem",
              }}
            >
              {dict.sales.lab_rejection_desc}
            </p>
            <button
              className="btn btn-secondary"
              style={{
                marginTop: "1rem",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
              }}
            >
              {dict.sales.edit_template}
            </button>
          </div>
          <div
            className="card"
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h4>{dict.sales.invoice_ready}</h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginTop: "0.5rem",
              }}
            >
              {dict.sales.invoice_ready_desc}
            </p>
            <button
              className="btn btn-secondary"
              style={{
                marginTop: "1rem",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
              }}
            >
              {dict.sales.edit_template}
            </button>
          </div>
        </div>
      </div>

      <h3>{dict.sales.audit_log}</h3>
      <table className="data-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>{dict.manager.timestamp}</th>
            <th>{dict.sales.type}</th>
            <th>{dict.sales.recipient}</th>
            <th>{dict.common.status}</th>
            <th>{dict.sales.event_context}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-01-15 18:10</td>
            <td>SMTP / Email</td>
            <td>manager@plant.com</td>
            <td>
              <span className="status-badge status-LOG_SUCCESS">
                {dict.common.delivered}
              </span>
            </td>
            <td>Material Rejected (Sand #S-902)</td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "8px",
        }}
      >
        <p style={{ color: "#f87171", fontSize: "0.85rem" }}>
          🔒 {dict.sales.automated_note}
        </p>
      </div>
    </div>
  );
}
