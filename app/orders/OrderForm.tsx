"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { createOrder, updateOrder } from "@/app/actions/order";
import Link from "next/link";

interface OrderFormProps {
  initialData?: any;
  customers: any[];
  projects: any[];
  mixes: any[];
  lang: "en" | "ar";
  translations: any;
}

export default function OrderForm({
  initialData,
  customers,
  projects,
  mixes,
  lang,
  translations: t,
}: OrderFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialData?.customerId || "",
  );

  const availableProjects = projects;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const loadingToast = toast.loading(
      isEditing ? "جاري التحديث..." : "جاري الإنشاء...",
    );

    try {
      const result = isEditing
        ? await updateOrder(formData)
        : await createOrder(formData);

      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        router.push("/orders");
        router.refresh();
      } else {
        toast.error(result.error, { id: loadingToast });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "2rem" }}>
      <form onSubmit={handleSubmit}>
        {isEditing && <input type="hidden" name="id" value={initialData.id} />}

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="customer-select"
            className="small-title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            {t.order.customer}
          </label>
          <select
            id="customer-select"
            name="customerId"
            title={t.order.customer}
            className="form-input"
            required
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={isEditing}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
          >
            <option value="">{t.order.form.selectCustomer}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="project-select"
            className="small-title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            {t.order.project}
          </label>
          <select
            id="project-select"
            name="projectId"
            title={t.order.project}
            className="form-input"
            required
            defaultValue={initialData?.projectId || ""}
            disabled={isEditing}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
          >
            <option value="">{t.order.form.selectProject}</option>
            {availableProjects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="mix-select"
            className="small-title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            {t.order.mix}
          </label>
          <select
            id="mix-select"
            name="mixDesignId"
            title={t.order.mix}
            className="form-input"
            required
            defaultValue={initialData?.mixDesignId || ""}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
          >
            <option value="">{t.order.form.selectMix}</option>
            {mixes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.strength}MPa
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="quantity-input"
            className="small-title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            {t.order.qty} (m³)
          </label>
          <input
            id="quantity-input"
            type="number"
            name="quantity"
            title={t.order.qty}
            step="0.1"
            className="form-input"
            required
            defaultValue={initialData?.originalQuantity || ""}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label
            htmlFor="date-input"
            className="small-title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            {t.common.date}
          </label>
          <input
            id="date-input"
            type="date"
            name="date"
            title={t.common.date}
            className="form-input"
            required
            defaultValue={
              initialData
                ? new Date(initialData.date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]
            }
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ flex: 1, padding: "0.75rem" }}
          >
            {isEditing ? t.common.save : t.order.form.create}
          </button>
          <Link href="/orders" style={{ flex: 1 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "0.75rem" }}
            >
              {t.common.cancel}
            </button>
          </Link>
        </div>
      </form>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
