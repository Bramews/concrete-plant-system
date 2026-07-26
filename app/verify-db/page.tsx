import { prisma } from "@/lib/prisma";

export default async function VerifyDB() {
  try {
    const count = await prisma.billingEvent.count();
    return (
      <div style={{ background: "black", color: "#00ff00", padding: 50 }}>
        <h1>VERIFICATION_SUCCESS</h1>
        <p>Row Count: {count}</p>
        <p>CWD: {process.cwd()}</p>
        <p>DB_URL: {process.env.DATABASE_URL}</p>
      </div>
    );
  } catch (error) {
    return (
      <div style={{ background: "black", color: "#ff0000", padding: 50 }}>
        <h1>VERIFICATION_FAILED</h1>
        <pre>{(error as Error).message}</pre>
        <p>CWD: {process.cwd()}</p>
        <p>DB_URL: {process.env.DATABASE_URL}</p>
        {/* Force raw query check if prisma client is old */}
        <TryRaw />
      </div>
    );
  }
}

async function TryRaw() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM BillingEvent LIMIT 1`;
    return <h2>RAW_QUERY_SUCCESS</h2>;
  } catch (e) {
    return <h2>RAW_QUERY_FAILED: {(e as Error).message}</h2>;
  }
}
