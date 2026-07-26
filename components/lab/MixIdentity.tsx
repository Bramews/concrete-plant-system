"use client";

import { Icons } from "@/components/ui/Icons";

interface MixIdentityProps {
  mixInfo: any;
  setMixInfo: (i: any) => void;
  dict: any;
  readOnly?: boolean;
}

export function MixIdentity({
  mixInfo,
  setMixInfo,
  dict,
  readOnly,
}: MixIdentityProps) {
  const update = (field: string, val: any) => {
    setMixInfo((prev: any) => ({ ...prev, [field]: val }));
  };

  const fieldCls =
    "w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:bg-white/10 transition-all font-bold western-nums placeholder:text-slate-700 focus:border-indigo-500/50";

  return (
    <div
      className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500"
      dir="rtl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Project Details */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            بيانات المشروع والعميل
          </h3>
          <div className="grid grid-cols-1 gap-6 p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            {[
              {
                label: "اسم المصنع (Plant)",
                value: mixInfo.plant,
                field: "plant",
                icon: Icons.Activity,
              },
              {
                label: "اسم العميل (Customer)",
                value: mixInfo.customer,
                field: "customer",
                icon: Icons.User,
              },
              {
                label: "موقع العمل (Site)",
                value: mixInfo.site,
                field: "site",
                icon: Icons.Globe,
              },
            ].map((f, i) => (
              <div key={i} className="group flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-indigo-400 transition-colors uppercase">
                  {f.label}
                </label>
                <div className="relative">
                  <f.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => update(f.field, e.target.value)}
                    disabled={readOnly}
                    className={`${fieldCls} pr-12`}
                    placeholder="..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Specifications */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-r-2 border-indigo-500 pr-3">
            المواصفات الفنية للتصميم
          </h3>
          <div className="grid grid-cols-1 gap-6 p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            <div className="group flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                صنف المقاومة (Strength Class)
              </label>
              <select
                className={fieldCls}
                value={mixInfo.strength}
                onChange={(e) => update("strength", e.target.value)}
                disabled={readOnly}
              >
                <option value="" className="bg-slate-900">
                  اختر الصنف المطلوب...
                </option>
                {[
                  "C20/25",
                  "C25/30",
                  "C30/37",
                  "C35/45",
                  "C40/50",
                  "C45/55",
                  "C50/60",
                ].map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  رمز الخلطة (Code)
                </label>
                <input
                  type="text"
                  value={mixInfo.mixRef}
                  onChange={(e) => update("mixRef", e.target.value)}
                  disabled={readOnly}
                  className={fieldCls}
                />
              </div>
              <div className="group flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  حجم الخلطة التجريبية
                </label>
                <input
                  type="number"
                  value={mixInfo.trialLiters}
                  onChange={(e) =>
                    update("trialLiters", parseFloat(e.target.value))
                  }
                  disabled={readOnly}
                  className={fieldCls}
                  placeholder="لتر (L)"
                />
              </div>
            </div>

            <div className="group flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                اسم الخلطة (Design Name)
              </label>
              <input
                type="text"
                value={mixInfo.mixName}
                onChange={(e) => update("mixName", e.target.value)}
                disabled={readOnly}
                className={fieldCls}
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
