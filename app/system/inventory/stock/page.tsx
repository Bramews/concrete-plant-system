import { Material, InventoryTransaction } from "@prisma/client";
import "../../system-modules.css";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IntakeForm from "./IntakeForm";
import { cookies } from "next/headers";

interface MaterialWithTransactions extends Material {
  transactions: InventoryTransaction[];
}

interface TransactionWithMaterial extends InventoryTransaction {
  material: Material | null;
}

export default async function StockManagementPage() {
  await requireRole(["MANAGER", "ACCOUNTANT", "OPERATOR"]);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "ar") || "en";

  const rawMaterials = await prisma.material.findMany({
    where: { status: "ACTIVE" },
    include: {
      inventoryTransactions: {
        take: 10,
        orderBy: { timestamp: "desc" },
      },
    },
  });

  const materials = rawMaterials.map((mat) => ({
    ...mat,
    transactions: mat.inventoryTransactions,
  })) as any as MaterialWithTransactions[];

  const rawRecentTransactions = await prisma.inventoryTransaction.findMany({
    take: 20,
    orderBy: { timestamp: "desc" },
    include: { material: true },
  });

  const recentTransactions = rawRecentTransactions.map((tx) => ({
    ...tx,
    material: tx.material,
  })) as any as TransactionWithMaterial[];

  return (
    <div className="glass-panel">
      <h2 className="mb-2">{"إدارة المخزون"}</h2>

      <div className="module-grid">
        {materials.map((mat) => (
          <div key={mat.id} className="glass-panel pt-2">
            <h3 className="mb-1">{mat.name}</h3>
            <div className="flex justify-between mb-1">
              <span>{"الرصيد الحالي:"}</span>
              <span className="fw-600">
                {mat.stock.toFixed(2)} {mat.unit}
              </span>
            </div>
            <IntakeForm
              materialId={mat.id}
              materialName={mat.name}
              lang={lang}
            />
          </div>
        ))}
      </div>

      <h3 className="mt-2 mb-1">{"سجل الحركات"}</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{"التاريخ"}</th>
              <th>{"المادة"}</th>
              <th>{"النوع"}</th>
              <th>{"الكمية"}</th>
              <th>{"المرجع"}</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  {new Date(tx.timestamp).toLocaleDateString("ar-u-nu-latn")}
                </td>
                <td>{tx.material?.name}</td>
                <td>
                  <span
                    className={
                      tx.type === "IN"
                        ? "neon-text"
                        : "dropdown-item danger m-0"
                    }
                  >
                    {tx.type}
                  </span>
                </td>
                <td>
                  {tx.quantity} {tx.material?.unit}
                </td>
                <td>{tx.reference || "-"}</td>
              </tr>
            ))}
            {recentTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="module-secondary-text">
                  {"لا توجد حركات مسجلة"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
