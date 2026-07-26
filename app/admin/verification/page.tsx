import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";

// We import the actions we want to verify
import { createUser, toggleUserStatus } from "@/app/actions/auth";
import { createOrder, submitOrderToLab } from "@/app/actions/order";
import { approveOrder } from "@/app/actions/lab";
import { createBatch } from "@/app/actions/production";
import { addOperationalExpense } from "@/app/actions/expense";

export default async function VerificationPage() {
  await requireRole(["SYSTEM_OWNER"]);

  // Fetch current state for verification display
  const users = await (prisma as any).user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  const material = await (prisma as any).material.findFirst({
    where: { name: "OPC Cement" },
  });
  const recentTransactions = await (
    prisma as any
  ).inventoryTransaction.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
    include: { material: true },
  });
  const recentOrders = await (prisma as any).order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  const recentExpenses = await (prisma as any).operationalExpense.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
  });
  const emailLogs = await (prisma as any).emailLog.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
  });

  return (
    <div className="p-8 text-white bg-[#0a0a0f] min-h-screen">
      <h1 className="text-[#00f2ff] mb-8 text-3xl font-bold">
        Phase 12: Practical Verification Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Section 1: User & Governance */}
        <section className="glass-panel p-6 border border-[#00f2ff]/20">
          <h2 className="text-[#00f2ff] text-xl font-semibold mb-4">
            1. User Management (CRUD & Status)
          </h2>
          <table className="w-full mt-4">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th>User</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>
                    <span
                      className={
                        u.status === "ACTIVE"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex gap-4">
            <form
              action={async (formData) => {
                "use server";
                // This is a test trigger
                await toggleUserStatus(formData);
                revalidatePath("/admin/verification");
              }}
            >
              <input type="hidden" name="id" value={users[0]?.id} />
              <button className="btn btn-secondary" type="submit">
                Toggle First User Status
              </button>
            </form>
          </div>
        </section>

        {/* Section 2: Order & Lab Flow */}
        <section className="glass-panel p-6 border border-[#00f2ff]/20">
          <h2 className="text-[#00f2ff] text-xl font-semibold">
            2. Order Guardrails & Lab Flow
          </h2>
          <p className="text-[0.8rem] text-gray-500">
            Proving: Draft -&gt; Submitted (Locked) -&gt; Approved
          </p>
          <table className="w-full mt-4">
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    {o.status === "DRAFT" && (
                      <form
                        action={async (formData) => {
                          "use server";
                          await submitOrderToLab(formData);
                          revalidatePath("/admin/verification");
                        }}
                      >
                        <input type="hidden" name="id" value={o.id} />
                        <button className="btn btn-primary px-2 py-0.5 text-sm font-bold">
                          Submit to Lab
                        </button>
                      </form>
                    )}
                    {o.status === "SUBMITTED" && (
                      <form
                        action={async () => {
                          "use server";
                          await approveOrder(o.id);
                          revalidatePath("/admin/verification");
                        }}
                      >
                        <button className="btn btn-secondary px-2 py-0.5 text-sm font-bold bg-green-500">
                          Approve Mix
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 3: Inventory & Production */}
        <section className="glass-panel p-6 border border-[#00f2ff]/20">
          <h2 className="text-[#00f2ff] text-xl font-semibold">
            3. Real Inventory Deduction
          </h2>
          <div className="p-4 bg-white/5 rounded-lg mb-4">
            <strong>Current OPC Cement Stock:</strong>
            <span className="text-2xl ml-4 text-[#00f2ff]">
              {material?.stock || 0} kg
            </span>
          </div>
          <h3 className="text-base font-medium">
            Recent Stock Movements (Real OUT/IN):
          </h3>
          <ul className="text-[0.9rem] text-gray-400">
            {recentTransactions.map((t: any) => (
              <li key={t.id}>
                [{t.type}] {t.quantity} kg of {t.material.name} (Ref:{" "}
                {t.reference})
              </li>
            ))}
          </ul>
          {recentOrders.filter(
            (o: any) =>
              o.status === "LAB_APPROVED" || o.status === "PRODUCTION",
          ).length > 0 && (
            <form
              action={async (formData) => {
                "use server";
                // Simulate a production batch request
                const orderId = parseInt(formData.get("orderId") as string);
                const mockData = new FormData();
                mockData.append("orderId", orderId.toString());
                mockData.append("quantity", "10"); // 10 m3
                mockData.append("truckNumber", "T-100");
                mockData.append("driverName", "Verification Driver");
                mockData.append("requestId", `REQ-${Date.now()}`);
                await createBatch(mockData);
                revalidatePath("/admin/verification");
              }}
            >
              <input
                type="hidden"
                name="orderId"
                value={
                  recentOrders.find(
                    (o: any) =>
                      o.status === "LAB_APPROVED" || o.status === "PRODUCTION",
                  )?.id
                }
              />
              <button className="btn btn-secondary mt-4 bg-amber-500 text-black border-none">
                🚀 Trigger 10m³ Batch (Deducts Stock)
              </button>
            </form>
          )}
        </section>

        {/* Section 4: Accounting & AI */}
        <section className="glass-panel p-6 border border-[#00f2ff]/20">
          <h2 className="text-[#00f2ff] text-xl font-semibold">
            4. Accounting & Real Analysis
          </h2>
          <div className="flex gap-8">
            <div>
              <strong>Recent Expenses:</strong>
              <ul className="text-[0.8rem]">
                {recentExpenses.map((e: any) => (
                  <li key={e.id}>
                    {e.type}: ${e.amount}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Email System Logs:</strong>
              <ul className="text-[0.8rem]">
                {emailLogs.map((l: any) => (
                  <li key={l.id}>
                    {l.subject} ({l.status})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 border-t border-gray-800">
        <p>
          💡{" "}
          <em>
            This dashboard uses real Server Actions and real Database Queries.
            No mocked data here.
          </em>
        </p>
      </div>
    </div>
  );
}
