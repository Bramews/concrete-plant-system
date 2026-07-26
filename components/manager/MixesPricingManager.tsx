"use client";

import { useState } from "react";
import { updateMixPricing } from "@/app/actions/manager";
import { toast } from "sonner";
import {
  DollarSign,
  Truck,
  Users,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
  Edit3,
  Settings,
} from "lucide-react";

interface CustomPriceItem {
  name: string;
  value: number;
}

interface MixDesignPrice {
  id: number;
  name: string;
  code: string;
  grade: string | null;
  strengthClass: string | null;
  concretePrice: number | null;
  pumpPrice: number | null;
  laborPrice: number | null;
  priceComponents: string | null;
  customPrices?: CustomPriceItem[];
}

export default function MixesPricingManager({
  initialMixes,
  isRtl = true,
}: {
  initialMixes: any[];
  isRtl?: boolean;
}) {
  // Parse priceComponents JSON string when initializing state
  const parsedMixes: MixDesignPrice[] = initialMixes.map((mix) => {
    let customPrices: CustomPriceItem[] = [];
    if (mix.priceComponents) {
      try {
        customPrices = JSON.parse(mix.priceComponents);
      } catch (e) {
        console.error(
          "Failed to parse priceComponents for mix ID " + mix.id,
          e,
        );
      }
    }
    return {
      ...mix,
      customPrices,
    };
  });

  const [mixes, setMixes] = useState<MixDesignPrice[]>(parsedMixes);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMixId, setSelectedMixId] = useState<number | null>(
    parsedMixes.length > 0 ? parsedMixes[0].id : null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Get currently selected mix in the modal
  const selectedMix = mixes.find((m) => m.id === selectedMixId);

  const handlePriceChange = (
    field: "concretePrice" | "pumpPrice" | "laborPrice",
    val: string,
  ) => {
    if (!selectedMixId) return;
    const parsed = val === "" ? null : parseFloat(val);
    setMixes((prev) =>
      prev.map((m) => (m.id === selectedMixId ? { ...m, [field]: parsed } : m)),
    );
  };

  const handleAddCustomPrice = () => {
    if (!selectedMixId) return;
    setMixes((prev) =>
      prev.map((m) => {
        if (m.id === selectedMixId) {
          const current = m.customPrices || [];
          return {
            ...m,
            customPrices: [...current, { name: "", value: 0 }],
          };
        }
        return m;
      }),
    );
  };

  const handleCustomPriceChange = (
    index: number,
    field: "name" | "value",
    val: string,
  ) => {
    if (!selectedMixId) return;
    setMixes((prev) =>
      prev.map((m) => {
        if (m.id === selectedMixId) {
          const current = [...(m.customPrices || [])];
          if (current[index]) {
            if (field === "name") {
              current[index].name = val;
            } else {
              current[index].value = val === "" ? 0 : parseFloat(val);
            }
          }
          return { ...m, customPrices: current };
        }
        return m;
      }),
    );
  };

  const handleRemoveCustomPrice = (index: number) => {
    if (!selectedMixId) return;
    setMixes((prev) =>
      prev.map((m) => {
        if (m.id === selectedMixId) {
          const current = (m.customPrices || []).filter((_, i) => i !== index);
          return { ...m, customPrices: current };
        }
        return m;
      }),
    );
  };

  const handleSave = async () => {
    if (!selectedMixId || !selectedMix) return;

    // Filter out empty custom pricing items
    const filteredCustomPrices = (selectedMix.customPrices || []).filter(
      (item) => item.name.trim() !== "",
    );

    setIsSaving(true);
    try {
      const res = await updateMixPricing(selectedMixId, {
        concretePrice: selectedMix.concretePrice,
        pumpPrice: selectedMix.pumpPrice,
        laborPrice: selectedMix.laborPrice,
        priceComponents:
          filteredCustomPrices.length > 0
            ? JSON.stringify(filteredCustomPrices)
            : null,
      });

      if (res.success) {
        toast.success(
          isRtl
            ? `تم حفظ أسعار الخلطة (${selectedMix.code}) بنجاح`
            : `Prices for mix (${selectedMix.code}) saved successfully`,
        );
        setIsOpen(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save prices");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return isRtl ? "افتراضي" : "Default";
    return val.toLocaleString() + (isRtl ? " د.ع" : " IQD");
  };

  return (
    <div
      className="glass-panel w-full"
      style={{ padding: "1.5rem" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-card-title text-white mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            {isRtl ? "أسعار الخلطات المعتمدة" : "Mixes Pricing List"}
          </h3>
          <p className="text-caption text-slate-300">
            {isRtl
              ? "استعرض تسعير الخرسانة، البامب، والكوادر. اضغط على خيار التعديل لتحديث أو إضافة أسعار مخصصة ديناميكياً."
              : "Review prices for concrete, pump, and labor. Click edit to update or add dynamic price components."}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <Settings className="w-4 h-4" />
          <span>{isRtl ? "تعديل وتسعير الخلطات" : "Edit Mix Prices"}</span>
        </button>
      </div>

      {/* Neat Overview Table */}
      {mixes.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm font-bold">
          {isRtl
            ? "لا توجد خلطات معتمدة حالياً."
            : "No active mix designs found."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "الخلطة" : "Mix"}
                </th>
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "الكود" : "Code"}
                </th>
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "سعر الخرسانة" : "Concrete Price"}
                </th>
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "سعر البامب" : "Pump Price"}
                </th>
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "سعر الكادر" : "Labor Price"}
                </th>
                <th className="p-4 text-sm font-bold text-slate-300 text-start">
                  {isRtl ? "أسعار مخصصة" : "Custom Prices"}
                </th>
              </tr>
            </thead>
            <tbody>
              {mixes.map((mix) => (
                <tr
                  key={mix.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 text-sm font-bold text-slate-100">
                    {mix.name}
                  </td>
                  <td className="p-4 text-sm font-bold font-mono text-indigo-400">
                    {mix.code}
                  </td>
                  <td className="p-4 text-sm font-bold font-mono text-slate-200">
                    {formatCurrency(mix.concretePrice)}
                  </td>
                  <td className="p-4 text-sm font-bold font-mono text-slate-200">
                    {formatCurrency(mix.pumpPrice)}
                  </td>
                  <td className="p-4 text-sm font-bold font-mono text-slate-200">
                    {formatCurrency(mix.laborPrice)}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-300">
                    {mix.customPrices && mix.customPrices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mix.customPrices.map((cp, idx) => (
                          <span
                            key={idx}
                            className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-caption"
                          >
                            {cp.name}: {cp.value.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODERN CLASSIC CREATIVE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="relative glass-panel w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 overflow-y-auto max-h-[90vh] animate-scale-in"
            style={{ background: "#0b1120" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h4 className="text-card-title text-white font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                {isRtl ? "تعديل وتسعير خلطة معتمدة" : "Edit Approved Mix Price"}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector Dropdown */}
            <div className="form-group mb-5">
              <label className="text-sm font-bold text-slate-300 mb-2 block">
                {isRtl ? "اختر الخلطة للتسعير:" : "Select Mix Design:"}
              </label>
              <select
                value={selectedMixId || ""}
                onChange={(e) => setSelectedMixId(parseInt(e.target.value))}
                className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 font-bold"
              >
                {mixes.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    style={{ background: "#0f172a" }}
                  >
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedMix && (
              <div className="space-y-4">
                {/* Standard Prices inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Concrete Price */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption font-bold text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {isRtl ? "سعر الخرسانة" : "Concrete Price"}
                    </label>
                    <input
                      type="number"
                      value={selectedMix.concretePrice ?? ""}
                      onChange={(e) =>
                        handlePriceChange("concretePrice", e.target.value)
                      }
                      placeholder="0"
                      className="bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 w-full font-mono font-bold"
                    />
                  </div>

                  {/* Pump Price */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption font-bold text-slate-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-400" />
                      {isRtl ? "سعر البامب" : "Pump Price"}
                    </label>
                    <input
                      type="number"
                      value={selectedMix.pumpPrice ?? ""}
                      onChange={(e) =>
                        handlePriceChange("pumpPrice", e.target.value)
                      }
                      placeholder="0"
                      className="bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 w-full font-mono font-bold"
                    />
                  </div>

                  {/* Labor Price */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-caption font-bold text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      {isRtl ? "سعر الكادر" : "Labor Price"}
                    </label>
                    <input
                      type="number"
                      value={selectedMix.laborPrice ?? ""}
                      onChange={(e) =>
                        handlePriceChange("laborPrice", e.target.value)
                      }
                      placeholder="0"
                      className="bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 w-full font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Custom dynamic prices */}
                <div className="border-t border-white/5 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-caption font-bold text-slate-300">
                      {isRtl
                        ? "بنود التسعير الإضافية المخصصة:"
                        : "Custom Pricing Components:"}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomPrice}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? "إضافة سعر مخصص" : "Add Price"}</span>
                    </button>
                  </div>

                  {!selectedMix.customPrices ||
                  selectedMix.customPrices.length === 0 ? (
                    <p className="text-caption text-slate-500 italic text-center py-2">
                      {isRtl
                        ? "لا توجد بنود إضافية مخصصة لهذه الخلطة."
                        : "No custom price components added."}
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {selectedMix.customPrices.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleCustomPriceChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder={
                              isRtl ? "البند (مثال: سعر النقل)" : "Item Name"
                            }
                            className="bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500 flex-1 font-bold"
                          />
                          <input
                            type="number"
                            value={item.value || ""}
                            onChange={(e) =>
                              handleCustomPriceChange(
                                index,
                                "value",
                                e.target.value,
                              )
                            }
                            placeholder={isRtl ? "القيمة (د.ع)" : "Value"}
                            className="bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500 w-[110px] sm:w-[130px] font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomPrice(index)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save and Cancel buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/5 hover:bg-white/5 text-slate-300 text-sm font-bold transition-all"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isRtl ? "حفظ التغييرات" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
