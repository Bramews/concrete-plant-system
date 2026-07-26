import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import {
  updateMaterialStock,
  rejectMaterialBatch,
  acknowledgeMaterialRejection,
} from "@/app/actions/material";

const renderTime = Date.now();

export default async function MaterialsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];
  console.log("Rendering Materials with t:", !!t);

  let materials: any[] = [];
  let rejections: any[] = [];

  if (prisma.material) {
    materials = (await prisma.material.findMany({
      take: 100,
    })) as any[];
    rejections = (await prisma.materialRejection.findMany({
      take: 20,
      include: { material: true },
    })) as any[];
  } else {
    console.warn(
      "Material model not found on Prisma Client. Returning empty data.",
    );
  }

  return (
    <div>
      <h1 className="page-title">{"مخزون المواد"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3>{"مستويات المخزون"}</h3>
          <table className="table w-full">
            <thead>
              <tr>
                <th>{"المادة"}</th>
                <th>{"المخزون"}</th>
                <th>{"تحديث"}</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.name} ({m.unit})
                  </td>
                  <td
                    className={`font-semibold ${
                      m.stock < 1000 ? "text-red-500" : "text-inherit"
                    }`}
                  >
                    {m.stock}
                  </td>
                  <td>
                    <form action={updateMaterialStock} className="flex gap-2">
                      <input type="hidden" name="materialId" value={m.id} />
                      <input
                        type="hidden"
                        name="requestId"
                        value={`STOCK-${m.id}-${renderTime}`}
                      />
                      <input
                        type="number"
                        name="amount"
                        className="form-input w-[60px] p-1 text-sm bg-slate-900 border border-slate-700 lg:w-20"
                        placeholder="+/-"
                        required
                        aria-label="Stock Amount change"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary px-2 py-1 text-sm font-bold"
                      >
                        Set
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel p-6">
          <h3>{"رفض المختبر"}</h3>
          <p className="text-slate-400 text-sm font-bold mb-4">
            Initiated by Lab Techs, approved by Manager.
          </p>

          <form action={rejectMaterialBatch} className="glass-form mb-8">
            <input
              type="hidden"
              name="requestId"
              value={`REJECT-SUB-${renderTime}`}
            />
            <select
              name="materialId"
              className="form-input w-full bg-slate-900 border border-slate-700"
              required
              aria-label="Select Material for Rejection"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <textarea
              name="comments"
              className="form-input w-full bg-slate-900 border border-slate-700 h-16 mt-2"
              placeholder="Rejection reason..."
              required
            ></textarea>
            <button
              type="submit"
              className="btn btn-secondary bg-red-500 hover:bg-red-600 w-full mt-2"
            >
              Submit Rejection
            </button>
          </form>

          <table className="table w-full text-sm font-bold">
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rejections.map((r) => (
                <tr key={r.id}>
                  <td>{r.material.name}</td>
                  <td>
                    <span className={`status-badge status-${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "PENDING" && (
                      <form
                        action={acknowledgeMaterialRejection}
                        className="flex gap-1"
                      >
                        <input type="hidden" name="rejectionId" value={r.id} />
                        <input
                          type="hidden"
                          name="requestId"
                          value={`REJECT-APP-${r.id}-${renderTime}`}
                        />
                        <button
                          type="submit"
                          name="action"
                          value="APPROVE"
                          className="btn btn-primary px-1.5 py-0.5 text-sm font-bold"
                        >
                          Ok
                        </button>
                        <button
                          type="submit"
                          name="action"
                          value="DENY"
                          className="btn btn-secondary px-1.5 py-0.5 text-sm font-bold"
                        >
                          X
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
