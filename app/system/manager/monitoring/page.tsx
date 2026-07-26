import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";

export default async function ManagerMonitoringPage() {
  await requireRole(["MANAGER"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const dict = getDictionary(lang);

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>{dict.manager.console}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <h4 style={{ color: "#10b981" }}>{dict.manager.db_connection}</h4>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.5rem" }}
          >
            {dict.manager.health_healthy}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            {dict.manager.latency}: 12ms
          </p>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <h4 style={{ color: "#3b82f6" }}>{dict.manager.prisma_client}</h4>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.5rem" }}
          >
            {dict.manager.health_ready}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            {dict.manager.pool}: 8/10 {dict.manager.utilized}
          </p>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <h4 style={{ color: "#f59e0b" }}>{dict.manager.bg_tasks}</h4>
          <div
            style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.5rem" }}
          >
            3 {dict.manager.running}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            {dict.manager.backup_active}
          </p>
        </div>
      </div>
    </div>
  );
}
