import { requireRole } from "@/lib/auth";

export default async function ManagerBackupPage() {
  await requireRole(["MANAGER"]);

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>
        Backup & Disaster Recovery - النسخ الاحتياطي
      </h2>

      <div
        className="glass-panel"
        style={{
          padding: "2rem",
          background: "rgba(59, 130, 246, 0.05)",
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>System Database State: SECURE</h3>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
          Last automated backup completed successfully 4 hours ago.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn btn-primary" style={{ padding: "1rem 2rem" }}>
            Run Backup Now
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "1rem 2rem" }}
          >
            Restore from Local
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: "1rem" }}>Backup Archives - الأرشيف</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Size</th>
            <th>Status</th>
            <th>Restoration Integrity</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>backup-2026-01-15-1400.sqlite</td>
            <td>12.4 MB</td>
            <td>
              <span className="status-badge status-LOG_SUCCESS">SUCCESS</span>
            </td>
            <td>Verified ✅</td>
            <td>2026-01-15 14:00</td>
          </tr>
          <tr>
            <td>backup-2026-01-14-1400.sqlite</td>
            <td>12.1 MB</td>
            <td>
              <span className="status-badge status-LOG_SUCCESS">SUCCESS</span>
            </td>
            <td>Verified ✅</td>
            <td>2026-01-14 14:00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
