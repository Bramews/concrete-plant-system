import { prisma } from "@/lib/prisma";
import { getCurrentRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuditLogPage() {
  const role = await getCurrentRole();
  if (role !== "SYSTEM_OWNER" && role !== "MANAGER") {
    redirect("/");
  }

  // Limit audit logs based on role
  // SYSTEM_OWNER: unlimited (all logs)
  // MANAGER: limited to 50 logs
  const logLimit = role === "SYSTEM_OWNER" ? undefined : 50;

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { timestamp: "desc" },
    take: logLimit,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Operational Audit Log</h1>
        {role !== "SYSTEM_OWNER" && (
          <div className="text-sm text-slate-400">
            Showing last {logLimit} logs (MANAGER view)
          </div>
        )}
        {role === "SYSTEM_OWNER" && (
          <div className="text-sm text-green-400 font-semibold">
            ✓ Full Access - All Logs (SYSTEM_OWNER)
          </div>
        )}
      </div>

      <div className="glass-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="log-text">
                  {log.timestamp.toLocaleString("en-US")}
                </td>
                <td>
                  {log.user?.name || "System"} ({log.role})
                </td>
                <td>
                  <span className={`status-badge status-${log.action}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.entity}</td>
                <td>{log.entityId}</td>
                <td className="log-text">{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-log">
                  No log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        .log-text { font-size: 0.8rem; }
        .empty-log { text-align: center; padding: 2rem; color: #94a3b8; }
      `}</style>
    </div>
  );
}
