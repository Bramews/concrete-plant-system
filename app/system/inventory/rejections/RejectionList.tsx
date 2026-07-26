"use client";

import { acknowledgeMaterialRejection } from "@/app/actions/material";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import styles from "./rejections.module.css";
import { MaterialRejection, Material } from "@prisma/client";

interface RejectionListProps {
  rejections: (MaterialRejection & { material: Material })[];
  // userId prop removed as it was unused
  userRole: string;
  lang: "en" | "ar";
}

export default function RejectionList({
  rejections,
  userRole,
  lang,
}: RejectionListProps) {
  const [list, setList] = useState(rejections);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAcknowledge = async (id: number) => {
    // eslint-disable-next-line react-hooks/purity
    const requestId = `ACK-${Date.now()}`;
    const formData = new FormData();
    formData.append("rejectionId", id.toString());
    formData.append("requestId", requestId);

    const toastId = toast.loading("جاري التأكيد...");

    try {
      await acknowledgeMaterialRejection(formData);
      toast.success("تم الاطلاع", {
        id: toastId,
      });

      // Optimistic update
      setList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "APPROVED", managerApproval: true }
            : item,
        ),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An error occurred";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div>
      {list.filter((r) => r.status === "PENDING").length === 0 && (
        <div className={styles.emptyState}>{"لا توجد طلبات معلقة"}</div>
      )}

      {list.map((rejection) => (
        <div
          key={rejection.id}
          className={`card glass-panel ${styles.rejectionCard}`}
        >
          <div className={styles.cardContent}>
            <div>
              <h3 className={styles.materialName}>
                {rejection.material?.name || "Unknown Material"}
              </h3>
              <p className={styles.comments}>{rejection.comments}</p>
              <div className={styles.timestamp}>
                {mounted
                  ? new Date(rejection.createdAt).toLocaleString("ar-u-nu-latn")
                  : ""}
              </div>
            </div>

            <div>
              <span
                className={`status-badge ${rejection.status === "PENDING" ? "status-DRAFT" : "status-LAB_APPROVED"}`}
              >
                {rejection.status}
              </span>
            </div>
          </div>

          <div className={styles.actionsContainer}>
            {rejection.status === "PENDING" && userRole === "MANAGER" && (
              <button
                onClick={() => handleAcknowledge(rejection.id)}
                className={`btn btn-primary ${styles.acknowledgeBtn}`}
              >
                {"✅ تم الاطلاع"}
              </button>
            )}
            {rejection.status !== "PENDING" && (
              <span className={styles.acknowledgedText}>
                {"تم الاطلاع من المدير"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
