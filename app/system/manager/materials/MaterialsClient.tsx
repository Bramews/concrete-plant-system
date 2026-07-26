"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { Material } from "@prisma/client";
import { deleteMaterial } from "@/app/actions/materials";
import { toast } from "sonner";
import { MaterialModal } from "./MaterialModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface MaterialsClientProps {
  initialMaterials: Material[];
  initialSearch?: string;
}

export function MaterialsClient({
  initialMaterials,
  initialSearch = "",
}: MaterialsClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(
    undefined,
  );
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    const result = await deleteMaterial(id);
    if (result.success) {
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success("تم حذف المادة بنجاح");
    } else {
      toast.error(result.error);
    }
    setIsDeleting(null);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingMaterial(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="بحث عن مادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <button
          onClick={openCreate}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>إضافة مادة جديدة</span>
        </button>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMaterials.map((mat) => (
          <div
            key={mat.id}
            className="group relative overflow-hidden bg-[#0d111c]/60 backdrop-blur-xl border border-white/5 rounded-2xl transition-all duration-500 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] flex flex-col"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {/* Action Buttons Layer */}
            <div className="absolute top-3 ltr:right-3 rtl:left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-4px] group-hover:translate-y-0 z-20">
              <button
                onClick={() => openEdit(mat)}
                className="w-9 h-9 flex items-center justify-center bg-slate-900/90 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-xl border border-white/5"
                title="تعديل"
              >
                <Icons.Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDeleting(mat.id)}
                className="w-9 h-9 flex items-center justify-center bg-slate-900/90 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-xl border border-white/5"
                title="حذف"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content */}
            <div className="p-6 flex-1 flex flex-col items-center text-center">
              {/* Hexagonal/Circular Icon Container */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-colors" />
                <div className="relative w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-indigo-400 transform rotate-45 group-hover:rotate-[225deg] transition-transform duration-700">
                  <Icons.Box className="w-8 h-8 transform -rotate-45 group-hover:-rotate-[225deg] transition-transform duration-700" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight leading-tight uppercase line-clamp-1">
                  {mat.name}
                </h3>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                  <span className="text-sm font-bold font-mono font-bold text-slate-500 tracking-widest">
                    {mat.code || "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Integration (Bottom bar) */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col items-start rtl:items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  INVENTORY
                </span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">
                  {mat.stock.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex flex-col items-end rtl:items-start text-right rtl:text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  UNIT
                </span>
                <span className="text-sm font-bold text-slate-300">
                  {mat.unit}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-20">
            <Icons.Archive className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl font-bold uppercase tracking-widest">
              لا توجد مواد تطابق البحث
            </p>
          </div>
        )}
      </div>

      {/* Modal Integration */}
      {isModalOpen && (
        <MaterialModal
          onClose={() => setIsModalOpen(false)}
          initialData={editingMaterial}
          onSuccess={(newMat) => {
            if (editingMaterial) {
              setMaterials(
                materials.map((m) => (m.id === newMat.id ? newMat : m)),
              );
            } else {
              setMaterials([newMat, ...materials]);
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleting !== null}
        onClose={() => setIsDeleting(null)}
        onConfirm={() => isDeleting && handleDelete(isDeleting)}
        title="حذف المادة"
        description="هل أنت متأكد من حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء إذا كانت المادة مستخدمة في أي عمليات."
        variant="danger"
      />
    </div>
  );
}
