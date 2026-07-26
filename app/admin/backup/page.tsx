import { prisma } from "@/lib/prisma";
import { BackupRecord } from "@prisma/client";

export default async function BackupPage() {
  let backups: BackupRecord[] = [];
  try {
    backups = await prisma.backupRecord.findMany({
      orderBy: { timestamp: "desc" },
    });
  } catch (e) {
    console.error("Backup fetch error:", e);
  }

  return (
    <div>
      <h1 className="page-title">{"النسخ الاحتياطي"}</h1>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h3>{"سجل النسخ الاحتياطي"}</h3>
          <button className="btn btn-primary" disabled>
            {"بدء نسخ يدوي"}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Status</th>
              <th>Restore Test</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td>{b.filename}</td>
                <td>{(b.sizeBytes / 1024).toFixed(2)} KB</td>
                <td>
                  <span className={`status-badge status-${b.status}`}>
                    {b.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${b.testStatus}`}>
                    {b.testStatus}
                  </span>
                </td>
                <td>{new Date(b.timestamp).toLocaleString("en-US")}</td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#94a3b8",
                  }}
                >
                  No backup records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
