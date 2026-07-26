"use client";

import { useState } from "react";
import { registerMaterialIntake } from "@/app/actions/material";
import { toast } from "sonner";
import "../../system-modules.css";

interface IntakeFormProps {
  materialId: number;
  materialName: string;
  lang: "en" | "ar";
}

export default function IntakeForm({
  materialId,
  materialName,
  lang,
}: IntakeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("materialId", materialId.toString());
    formData.append("amount", amount);
    formData.append("reference", reference);
    formData.append("requestId", `INTAKE-${Date.now()}`);

    try {
      const result = await registerMaterialIntake(formData);
      if (result?.success) {
        toast.success("تم تسجيل الوارد بنجاح");
        setIsOpen(false);
        setAmount("");
        setReference("");
      } else {
        toast.error(result?.error || "حدث خطأ");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary w-full"
      >
        {"تسجيل وارد (+)"}
      </button>
    );
  }

  return (
    <div className="module-info-box mt-1">
      <form onSubmit={handleSubmit} className="module-field gap-1">
        <h4 className="m-0 fs-sm">{`إضافة إلى ${materialName}`}</h4>
        <input
          type="number"
          step="0.01"
          placeholder={"الكمية"}
          title={"الكمية"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="module-input"
        />
        <input
          type="text"
          placeholder={"المرجع (رقم الطلب)"}
          title={"المرجع"}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="module-input"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 pt-2"
          >
            {loading ? "..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn-secondary flex-1 pt-2"
          >
            {"إلغاء"}
          </button>
        </div>
      </form>
    </div>
  );
}
