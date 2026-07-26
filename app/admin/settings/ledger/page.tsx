import { getLedgerList, verifyLedgerChain } from "@/app/actions/ledger";
import { getServerDictionary } from "@/lib/dictionary.server";
import { LedgerManagementClient } from "./_components/LedgerManagementClient";

import { redirect } from "next/navigation";

export default async function LedgerPage() {
  const dict = await getServerDictionary();
  const listResult = await getLedgerList();

  if (!listResult.success && listResult.error === "NOT_AUTHENTICATED") {
    redirect("/api/auth/session-cleanup");
  }

  const chainResult = await verifyLedgerChain();

  if (!chainResult.success && chainResult.error === "NOT_AUTHENTICATED") {
    redirect("/api/auth/session-cleanup");
  }

  const logs = listResult.success && listResult.logs ? listResult.logs : [];
  const currentLedgerId = listResult.success
    ? (listResult as any).currentLedgerId
    : 0;
  const initialChainStatus = chainResult.success
    ? {
        status: chainResult.status || "SECURE",
        corruptedCount: chainResult.corruptedCount || 0,
      }
    : {
        status: "TAMPERED_ALERT",
        corruptedCount: 1,
      };

  // Serialize logs dates to strings
  const serializedLogs = logs.map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    tableName: log.tableName,
    recordId: log.recordId,
    actionType: log.actionType,
    oldValues: log.oldValues,
    newValues: log.newValues,
    changedColumns: log.changedColumns,
    userId: log.userId,
    sessionId: log.sessionId,
    sourceType: log.sourceType || "UNKNOWN",
    sourceMachine: log.sourceMachine,
    sourceIp: log.sourceIp,
    checksum: log.checksum,
    hashChain: log.hashChain,
  }));

  return (
    <div
      className="min-h-screen bg-slate-950 text-white p-6"
      style={{
        fontFamily: "var(--font-cairo), sans-serif",
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: 1.8,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <LedgerManagementClient
          dict={dict}
          initialLogs={serializedLogs}
          initialChainStatus={initialChainStatus}
          currentLedgerId={currentLedgerId}
        />
      </div>
    </div>
  );
}
