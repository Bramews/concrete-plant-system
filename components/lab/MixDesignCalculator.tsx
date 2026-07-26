"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";

export function MixDesignCalculator() {
  const [fck, setFck] = useState<string>("30"); // Target strength in MPa
  const [maxSize, setMaxSize] = useState<string>("20"); // Max aggregate size in mm
  const [cementType, setCementType] = useState<string>("OPC"); // OPC, SRC
  const [wcRatio, setWcRatio] = useState<string>("0.45"); // W/C ratio
  const [exposureClass, setExposureClass] = useState<string>("XC3"); // Exposure
  const [trialVolume, setTrialVolume] = useState<string>("50"); // Trial batch volume in Liters

  // Calculate Mix Design Proportions (Simulated Engineering Rules)
  const proportions = useMemo(() => {
    const f = parseFloat(fck) || 30;
    const wc = parseFloat(wcRatio) || 0.45;
    const volLiters = parseFloat(trialVolume) || 50;

    // Target mean strength (fcr) = fck + 1.65 * S (assume standard deviation S = 5 MPa)
    const fcr = f + 1.65 * 5;

    // Estimation of water content based on max aggregate size (20mm: ~180 L, 10mm: ~200 L)
    const waterBase = parseFloat(maxSize) === 10 ? 200 : 180;
    // Adjust water based on exposure and slump
    const water = waterBase;

    // Cementitious content = Water / (W/C)
    const cement = Math.round(water / wc);

    // Total volume of concrete = 1000 L (1 m³)
    // Volume of cement = Weight / (SG * 1000) (OPC SG ~ 3.15)
    const cementVol = cement / 3.15;
    // Volume of water = Water / 1.0
    const waterVol = water / 1.0;
    // Entrapped air (assume 1.5% for 20mm, 2% for 10mm)
    const airVol = parseFloat(maxSize) === 10 ? 20 : 15;

    // Remaining volume for aggregates
    const aggVol = 1000 - (cementVol + waterVol + airVol);

    // Aggregate weight (Assume average SG of SSD aggregates = 2.65)
    const totalAggWeight = aggVol * 2.65;

    // Split natural sand and gravel (e.g. 40% sand, 60% gravel)
    const sandWeight = Math.round(totalAggWeight * 0.4);
    const gravelWeight = Math.round(totalAggWeight * 0.6);

    const totalWeight = cement + water + sandWeight + gravelWeight;

    // Trial Batch quantities
    const factor = volLiters / 1000;

    return {
      fcr: Number(fcr.toFixed(1)),
      water,
      cement,
      sand: sandWeight,
      gravel: gravelWeight,
      totalWeight,
      trial: {
        cement: Number((cement * factor).toFixed(2)),
        water: Number((water * factor).toFixed(2)),
        sand: Number((sandWeight * factor).toFixed(2)),
        gravel: Number((gravelWeight * factor).toFixed(2)),
        total: Number((totalWeight * factor).toFixed(2)),
      },
      strengthCurve: [
        { age: 3, strength: Number((fcr * 0.4).toFixed(1)) },
        { age: 7, strength: Number((fcr * 0.65).toFixed(1)) },
        { age: 14, strength: Number((fcr * 0.85).toFixed(1)) },
        { age: 28, strength: Number(fcr.toFixed(1)) },
      ],
    };
  }, [fck, maxSize, wcRatio, trialVolume]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 space-y-2">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Icons.FlaskConical className="w-5 h-5 text-indigo-400" />
          حاسبة تصميم الخلطة الخرسانية التجريبية
        </h3>
        <p className="text-xs text-slate-400">
          أدخل المعايير المطلوبة لتوليد نسب خلطة نظرية وكميات الصبات التجريبية
          فوراً
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 bg-slate-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
          <h4 className="font-bold text-white text-sm">المعايير والمدخلات</h4>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              المقاومة المميزة المطلوبة fck (MPa)
            </label>
            <input
              type="number"
              value={fck}
              onChange={(e) => setFck(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              المقاس الأقصى للركام (mm)
            </label>
            <select
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="10">10 ملم</option>
              <option value="20">20 ملم</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              نسبة الماء / الإسمنت (W/C)
            </label>
            <input
              type="number"
              step="0.01"
              value={wcRatio}
              onChange={(e) => setWcRatio(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              مستوى التعريض البيئي (Exposure)
            </label>
            <select
              value={exposureClass}
              onChange={(e) => setExposureClass(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="XC1">XC1 (جاف أو رطب دائم)</option>
              <option value="XC3">XC3 (رطوبة معتدلة)</option>
              <option value="XS1">XS1 (رذاذ ملحي ساحلي)</option>
              <option value="XD2">XD2 (رطوبة كلوريدات صناعية)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              حجم الخلطة التجريبية (Liters)
            </label>
            <input
              type="number"
              value={trialVolume}
              onChange={(e) => setTrialVolume(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Mix (1 m³) */}
            <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center justify-between">
                <span>
                  نسب المواد النظرية (لكل <BidiText>1</BidiText> م³)
                </span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold">
                  معيار ACI
                </span>
              </h4>

              <div className="divide-y divide-white/5 text-xs font-bold space-y-3">
                <div className="flex justify-between py-2 text-slate-400">
                  <span>الإسمنت</span>
                  <span className="text-white">
                    <BidiText>{proportions.cement}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>الرمل الطبيعي/المصنع</span>
                  <span className="text-white">
                    <BidiText>{proportions.sand}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>الحصى (الركام الخشن)</span>
                  <span className="text-white">
                    <BidiText>{proportions.gravel}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>الماء الصافي</span>
                  <span className="text-white">
                    <BidiText>{proportions.water}</BidiText> لتر
                  </span>
                </div>
                <div className="flex justify-between py-2 text-emerald-400 font-black border-t border-white/10 pt-3">
                  <span>إجمالي وزن المتر المكعب</span>
                  <span>
                    <BidiText>{proportions.totalWeight}</BidiText> كغم/م³
                  </span>
                </div>
              </div>
            </div>

            {/* Trial Mix (Liters) */}
            <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center justify-between">
                <span>
                  كميات الصبة التجريبية (<BidiText>{trialVolume}</BidiText> لتر)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                  مصححة
                </span>
              </h4>

              <div className="divide-y divide-white/5 text-xs font-bold space-y-3">
                <div className="flex justify-between py-2 text-slate-400">
                  <span>وزن الإسمنت للخلطة</span>
                  <span className="text-white">
                    <BidiText>{proportions.trial.cement}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>وزن الرمل للخلطة</span>
                  <span className="text-white">
                    <BidiText>{proportions.trial.sand}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>وزن الحصى للخلطة</span>
                  <span className="text-white">
                    <BidiText>{proportions.trial.gravel}</BidiText> كغم
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-400">
                  <span>حجم الماء للخلطة</span>
                  <span className="text-white">
                    <BidiText>{proportions.trial.water}</BidiText> لتر
                  </span>
                </div>
                <div className="flex justify-between py-2 text-indigo-400 font-black border-t border-white/10 pt-3">
                  <span>الوزن الكلي للصبة التجريبية</span>
                  <span>
                    <BidiText>{proportions.trial.total}</BidiText> كغم
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Strength Gain Forecast Chart Simulation */}
          <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-5 space-y-4">
            <h4 className="font-bold text-white text-sm">
              تطور المقاومة المتوقع (Strength Gain Forecast)
            </h4>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {proportions.strengthCurve.map((point) => (
                <div
                  key={point.age}
                  className="bg-slate-950/40 border border-white/5 p-3 rounded-2xl text-center space-y-1"
                >
                  <span className="text-[10px] text-slate-500 block">
                    عمر <BidiText>{point.age}</BidiText> أيام
                  </span>
                  <span className="text-sm font-black text-white block">
                    <BidiText>{point.strength}</BidiText> MPa
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold block">
                    <BidiText>
                      {Math.round((point.strength / proportions.fcr) * 100)}
                    </BidiText>
                    %
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-2xl text-[10px] text-indigo-400 flex gap-2">
              <Icons.ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                المقاومة المتوسطة المستهدفة بالمعايرة الإحصائية fcr تساوي{" "}
                <BidiText>{proportions.fcr}</BidiText> MPa لتأمين حدود قبول fck
                = <BidiText>{fck}</BidiText> MPa بنسبة أمان 95%.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
