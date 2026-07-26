import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ApproveOrderDialog from "@/components/lab/ApproveOrderDialog";

export default async function LabApprovalsPage() {
  await requireRole([
    "LAB_TECH",
    "LAB_ENGINEER",
    "LAB_MANAGER",
    "LAB_TECHNICIAN",
    "SYSTEM_OWNER",
  ]);

  const orders = await prisma.order.findMany({
    where: { status: "SUBMITTED" },
    include: {
      customer: true,
      project: true,
      mixDesign: {
        include: { MixComponent: true },
      },
      labApproval: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedOrders = orders.map((order) => ({
    ...order,
    customer: order.customer,
    project: order.project,
    mixDesign: order.mixDesign
      ? {
          ...order.mixDesign,
          strength: order.mixDesign.strengthClass,
        }
      : null,
    originalQuantity: order.volume,
  }));

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>اعتمادات طلبيات المختبر</h2>
      <p style={{ color: "#94a3b8" }}>
        الطلبيات المعلقة في انتظار موافقة المختبر
      </p>

      <div style={{ marginTop: "2rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الطلبية</th>
              <th>العميل</th>
              <th>كود الخلطة</th>
              <th>المقاومة</th>
              <th>الكمية (ثابتة 🔒)</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {formattedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>
                  No pending approvals.
                </td>
              </tr>
            ) : (
              formattedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customer?.name}</td>
                  <td>{order.mixDesign?.code}</td>
                  <td>{order.mixDesign?.strength} MPa</td>
                  <td style={{ fontWeight: "bold" }}>
                    {order.originalQuantity} m³ 🔒
                  </td>
                  <td>
                    <span className="status-badge status-SUBMITTED">
                      بانتظار موافقة المختبر
                    </span>
                  </td>
                  <td>
                    <ApproveOrderDialog order={order as any} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
