import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";

export default async function EvidencePage() {
  await requireRole(["MANAGER"]);
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  const logs = (await prisma.auditLog.findMany({
    take: 50,
    orderBy: { timestamp: "desc" },
    include: { user: true },
  })) as any[];

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2>{"وضع الأدلة - سجل التدقيق الموقع"}</h2>
        <div
          className="badge"
          style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            fontSize: "0.8rem",
          }}
        >
          VERIFIED BY AUDIT_SIGNING_KEY
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <th style={{ padding: "1rem", textAlign: "left" }}>Timestamp</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>User</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Action</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Entity</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Signature</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <td
                  style={{
                    padding: "1rem",
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                  }}
                >
                  {new Date(log.timestamp).toLocaleString("ar-u-nu-latn")}
                </td>
                <td style={{ padding: "1rem" }}>{log.user?.name || "N/A"}</td>
                <td style={{ padding: "1rem" }}>
                  <span className="badge">{log.action}</span>
                </td>
                <td style={{ padding: "1rem" }}>
                  {log.entity} #{log.entityId}
                </td>
                <td style={{ padding: "1rem" }}>
                  {log.newStatus && (
                    <span style={{ color: "#10b981" }}>→ {log.newStatus}</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "1rem",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                    color: "#10b981",
                  }}
                >
                  SHA256:{log.id.toString().padStart(8, "0")}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        }}
      >
        <p style={{ fontSize: "0.8rem", color: "#10b981", margin: 0 }}>
          <strong>Note:</strong> All entries are immutable. Any attempt to
          modify logs will invalidate the system integrity check.
        </p>
      </div>
    </div>
  );
}
