import { prisma } from "@/lib/prisma";

export default async function FixDB() {
  try {
    const createQuery =
      "CREATE TABLE IF NOT EXISTS BillingEvent (id INTEGER PRIMARY KEY AUTOINCREMENT, subscriptionId INTEGER NOT NULL, eventType TEXT NOT NULL, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'PENDING', reason TEXT, decidedBy INTEGER, decidedAt DATETIME, FOREIGN KEY (subscriptionId) REFERENCES Subscription(id) ON DELETE RESTRICT ON UPDATE CASCADE);";
    const createRes = await prisma.$executeRawUnsafe(createQuery);

    // Try to verify existence by selecting from sqlite_master
    const check =
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='BillingEvent'`;

    return (
      <div style={{ background: "black", color: "#00ff00", padding: 50 }}>
        <h1>FIX_SUCCESS</h1>
        <p>Create Result: {createRes.toString()}</p>
        <pre>Master Check: {JSON.stringify(check, null, 2)}</pre>
        <p>CWD: {process.cwd()}</p>
        <p>DB_URL: {process.env.DATABASE_URL}</p>
      </div>
    );
  } catch (error) {
    return (
      <div style={{ background: "black", color: "#ff0000", padding: 50 }}>
        <h1>FIX_FAILED</h1>
        <pre>{(error as Error).message}</pre>
        <p>CWD: {process.cwd()}</p>
        <p>DB_URL: {process.env.DATABASE_URL}</p>
      </div>
    );
  }
}
