"use client";

import { useState, useMemo, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";
import { BidiText } from "@/components/ui/BidiText";
import { toast } from "sonner";
import {
  FileText,
  Calculator,
  Printer,
  Send,
  Trash2,
  CheckCircle,
  Save,
} from "lucide-react";
import {
  getQuotes,
  saveQuote,
  deleteQuote as removeQuote,
  QuoteItem,
  getApprovedPrices,
} from "@/app/actions/sales";

export function SalesQuotesManager() {
  const [customerName, setCustomerName] = useState<string>(
    "مكتب الإعمار الهندسي",
  );
  const [projectName, setProjectName] = useState<string>(
    "مشروع صيانة وتأهيل الطرق",
  );
  const [mixGrade, setMixGrade] = useState<string>("C30");
  const [volume, setVolume] = useState<string>("100");
  const [distance, setDistance] = useState<string>("20");
  const [includePump, setIncludePump] = useState<boolean>(true);
  const [additionalAdmixture, setAdditionalAdmixture] =
    useState<boolean>(false);

  const [savedQuotes, setSavedQuotes] = useState<QuoteItem[]>([]);
  const [approvedPrices, setApprovedPrices] = useState<Record<string, number>>({
    C20: 65000,
    C25: 68000,
    C30: 72000,
    C40: 80000,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load saved quotes and approved prices on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [quotes, prices] = await Promise.all([
          getQuotes(),
          getApprovedPrices(),
        ]);
        setSavedQuotes(quotes);
        setApprovedPrices(prices);
      } catch (err) {
        console.error("Failed to load quotes or prices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const quoteCalculations = useMemo(() => {
    const v = parseFloat(volume) || 0;
    const d = parseFloat(distance) || 0;

    const rate = approvedPrices[mixGrade] || 72000;
    const baseMaterialCost = rate * v;

    // Transport fee: e.g. 2,000 IQD per km per m3
    const transportCost = d * 2000 * v;

    // Pump fee: e.g. 5,000 IQD per m3 if checked
    const pumpCost = includePump ? 5000 * v : 0;

    // Admixture fee: e.g. 2,000 IQD per m3 if checked
    const admixtureCost = additionalAdmixture ? 2000 * v : 0;

    const subtotal =
      baseMaterialCost + transportCost + pumpCost + admixtureCost;
    // Add 5% sales tax
    const tax = subtotal * 0.05;
    const grandTotal = subtotal + tax;

    return {
      rate,
      baseMaterialCost,
      transportCost,
      pumpCost,
      admixtureCost,
      subtotal,
      tax,
      grandTotal,
    };
  }, [mixGrade, volume, distance, includePump, additionalAdmixture]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveQuote = async () => {
    if (!customerName.trim()) {
      toast.error("يرجى إدخال اسم العميل لحفظ عرض السعر");
      return;
    }
    try {
      const res = await saveQuote({
        customerName: customerName.trim(),
        projectName: projectName.trim() || "عام",
        mixGrade,
        volume: parseFloat(volume) || 0,
        distance: parseFloat(distance) || 0,
        includePump,
        additionalAdmixture,
        grandTotal: quoteCalculations.grandTotal,
      });

      if (res.success && res.quote) {
        setSavedQuotes((prev) => [res.quote!, ...prev]);
        toast.success("تم حفظ عرض السعر بنجاح.");
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ عرض السعر.");
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      setSavedQuotes((prev) => prev.filter((q) => q.id !== id));
      await removeQuote(id);
      toast.success("تم حذف عرض السعر بنجاح.");
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف عرض السعر.");
      const quotes = await getQuotes();
      setSavedQuotes(quotes);
    }
  };

  const handleLoadQuoteToForm = (quote: QuoteItem) => {
    setCustomerName(quote.customerName);
    setProjectName(quote.projectName);
    setMixGrade(quote.mixGrade);
    setVolume(quote.volume.toString());
    setDistance(quote.distance.toString());
    setIncludePump(quote.includePump);
    setAdditionalAdmixture(quote.additionalAdmixture);
    toast.success("تم تحميل بيانات عرض السعر للنموذج.");
  };

  return (
    <div className="high-density space-y-3 text-right" dir="rtl">
      <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 space-y-1">
        <h3 className="text-sm font-black text-white flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-400" />
          حاسبة عروض الأسعار الذكية والتوثيق
        </h3>
        <p className="text-[10px] text-slate-500 font-bold">
          احسب التكلفة الإجمالية وصافي عروض الأسعار للزبائن مع إمكانية التصدير
          كـ PDF فوري وحفظها بقاعدة البيانات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form Inputs */}
        <div className="lg:col-span-1 bg-slate-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            بيانات تسعير العقد
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              اسم العميل
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
              placeholder="مثال: شركة المستقبل للمقاولات"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              اسم المشروع
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
              placeholder="مثال: تشييد بناية مصرف الرشيد"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              رتبة الخرسانة المطلوبة
            </label>
            <select
              value={mixGrade}
              onChange={(e) => setMixGrade(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="C20">C20/25 (خلطة عادية)</option>
              <option value="C25">C25/30 (أسس وسقوف)</option>
              <option value="C30">C30/37 (إنشائي عالي القوة)</option>
              <option value="C40">C40/50 (خرسانة خاصة)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              الكمية المطلوبة (م³)
            </label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">
              مسافة النقل للموقع (كم)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Checklist options */}
          <div className="space-y-3 pt-2 text-xs font-bold text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePump}
                onChange={(e) => setIncludePump(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <span>شامل خدمة مضخة الخرسانة (Pump)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={additionalAdmixture}
                onChange={(e) => setAdditionalAdmixture(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <span>إضافة محسنات / إضافات كيميائية خاصة</span>
            </label>
          </div>
        </div>

        {/* Invoice / Quote Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white text-slate-900 p-8 border border-slate-200 shadow-2xl relative font-serif rounded-3xl">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-950 pb-6 mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950 leading-none">
                  شركة الخرسانة الجاهزة الوطنية
                </h3>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 uppercase">
                  National Ready Mix Concrete
                </p>
                <div className="text-[11px] text-slate-600 mt-2 font-sans space-y-0.5">
                  <p>الفرع الرئيسي: المنطقة الصناعية الكبرى</p>
                  <p>
                    هاتف المبيعات: <BidiText>0770-000-000</BidiText>
                  </p>
                </div>
              </div>
              <div className="text-left font-sans">
                <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded">
                  عرض سعر رسمي
                </span>
                <p className="text-[10px] text-slate-500 mt-2">
                  التاريخ:{" "}
                  <BidiText>{new Date().toISOString().split("T")[0]}</BidiText>
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-8">
              <div className="flex gap-2">
                <span className="font-bold text-slate-500">
                  العميل المستهدف:
                </span>
                <span className="text-slate-900 font-extrabold">
                  {customerName || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-500">المشروع:</span>
                <span className="text-slate-900 font-extrabold">
                  {projectName || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-500">مسافة التوصيل:</span>
                <span className="text-slate-900 font-extrabold">
                  <BidiText>{distance}</BidiText> كم
                </span>
              </div>
            </div>

            {/* Calculations Table */}
            <table className="w-full border-collapse border-2 border-slate-950 text-right text-xs mb-8">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-950 font-black">
                  <th className="p-3 border-l border-slate-950">
                    المكون / الخدمة
                  </th>
                  <th className="p-3 border-l border-slate-950 text-center">
                    الكمية
                  </th>
                  <th className="p-3 border-l border-slate-950 text-center">
                    سعر الوحدة (د.ع)
                  </th>
                  <th className="p-3 text-center">الإجمالي (د.ع)</th>
                </tr>
              </thead>
              <tbody className="font-bold font-sans">
                <tr className="border-b border-slate-950">
                  <td className="p-3 border-l border-slate-950 font-serif">
                    خرسانة جاهزة رتبة{" "}
                    <span className="font-mono font-extrabold">{mixGrade}</span>
                  </td>
                  <td className="p-3 border-l border-slate-950 text-center">
                    <BidiText>{volume}</BidiText> م³
                  </td>
                  <td className="p-3 border-l border-slate-950 text-center">
                    <BidiText>
                      {quoteCalculations.rate.toLocaleString()}
                    </BidiText>
                  </td>
                  <td className="p-3 text-center">
                    <BidiText>
                      {quoteCalculations.baseMaterialCost.toLocaleString()}
                    </BidiText>
                  </td>
                </tr>
                <tr className="border-b border-slate-950">
                  <td className="p-3 border-l border-slate-950">
                    أجور النقل والتوريد للموقع
                  </td>
                  <td className="p-3 border-l border-slate-950 text-center">
                    <BidiText>{distance}</BidiText> كم
                  </td>
                  <td className="p-3 border-l border-slate-950 text-center">
                    <BidiText>
                      {(2000 * parseFloat(volume || "0")).toLocaleString()}
                    </BidiText>
                  </td>
                  <td className="p-3 text-center">
                    <BidiText>
                      {quoteCalculations.transportCost.toLocaleString()}
                    </BidiText>
                  </td>
                </tr>
                {includePump && (
                  <tr className="border-b border-slate-950">
                    <td className="p-3 border-l border-slate-950">
                      خدمة مضخة صب الخرسانة
                    </td>
                    <td className="p-3 border-l border-slate-950 text-center">
                      <BidiText>{volume}</BidiText> م³
                    </td>
                    <td className="p-3 border-l border-slate-950 text-center">
                      <BidiText>{(5000).toLocaleString()}</BidiText>
                    </td>
                    <td className="p-3 text-center">
                      <BidiText>
                        {quoteCalculations.pumpCost.toLocaleString()}
                      </BidiText>
                    </td>
                  </tr>
                )}
                {additionalAdmixture && (
                  <tr className="border-b border-slate-950">
                    <td className="p-3 border-l border-slate-950">
                      إضافات تحسين الخلطة الخاصة
                    </td>
                    <td className="p-3 border-l border-slate-950 text-center">
                      <BidiText>{volume}</BidiText> م³
                    </td>
                    <td className="p-3 border-l border-slate-950 text-center">
                      <BidiText>{(2000).toLocaleString()}</BidiText>
                    </td>
                    <td className="p-3 text-center">
                      <BidiText>
                        {quoteCalculations.admixtureCost.toLocaleString()}
                      </BidiText>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary Totals */}
            <div className="w-1/2 mr-auto text-xs font-bold space-y-2 border-t-2 border-slate-950 pt-4 mb-8 font-sans">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span className="text-slate-950">
                  <BidiText>
                    {quoteCalculations.subtotal.toLocaleString()}
                  </BidiText>{" "}
                  د.ع
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>
                  ضريبة المبيعات (<BidiText>5</BidiText>%):
                </span>
                <span className="text-slate-950">
                  <BidiText>{quoteCalculations.tax.toLocaleString()}</BidiText>{" "}
                  د.ع
                </span>
              </div>
              <div className="flex justify-between text-indigo-600 text-sm font-black border-t border-slate-300 pt-2">
                <span>المجموع الكلي:</span>
                <span>
                  <BidiText>
                    {quoteCalculations.grandTotal.toLocaleString()}
                  </BidiText>{" "}
                  د.ع
                </span>
              </div>
            </div>

            {/* Official Stamps */}
            <div className="flex justify-between items-end pt-6 border-t border-slate-200 font-sans">
              <div className="flex items-center gap-3">
                {/* SVG mock QR */}
                <div className="w-12 h-12 bg-white border border-slate-300 p-1 flex items-center justify-center">
                  <svg
                    className="w-full h-full text-slate-900"
                    viewBox="0 0 100 100"
                  >
                    <rect
                      x="10"
                      y="10"
                      width="20"
                      height="20"
                      fill="currentColor"
                    />
                    <rect
                      x="70"
                      y="10"
                      width="20"
                      height="20"
                      fill="currentColor"
                    />
                    <rect
                      x="10"
                      y="70"
                      width="20"
                      height="20"
                      fill="currentColor"
                    />
                    <rect
                      x="40"
                      y="40"
                      width="20"
                      height="20"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className="text-[8px] font-bold text-slate-500 leading-tight">
                  عرض سعر الكتروني موحد
                </span>
              </div>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-indigo-600/30 flex flex-col items-center justify-center text-indigo-600/40 rotate-12 absolute bottom-6 left-12 bg-white/50 backdrop-blur-[1px]">
                  <span className="text-[8px] font-bold">قسم المبيعات</span>
                  <span className="text-[10px] font-black">VALID QUOTE</span>
                </div>
                <p className="font-bold text-slate-900 text-xs">
                  مدير مبيعات المحطة
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3 print:hidden flex-wrap">
            <button
              onClick={handlePrint}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[130px]"
            >
              <Printer className="w-4 h-4" />
              طباعة عرض السعر / PDF
            </button>
            <button
              onClick={handleSaveQuote}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 min-w-[130px]"
            >
              <Save className="w-4 h-4" />
              حفظ عرض السعر
            </button>
          </div>
        </div>
      </div>

      {/* Saved Quotes List */}
      <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
        <h4 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-white/5">
          <FileText className="w-4 h-4 text-indigo-400" />
          عروض الأسعار المحفوظة بقاعدة البيانات
        </h4>

        {loading ? (
          <div className="text-center py-6 text-slate-500 text-xs font-bold">
            جاري تحميل عروض الأسعار...
          </div>
        ) : savedQuotes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            لا توجد عروض أسعار محفوظة حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-bold">
                  <th className="pb-3 text-right">رقم العرض</th>
                  <th className="pb-3 text-right">اسم العميل</th>
                  <th className="pb-3 text-right">المشروع</th>
                  <th className="pb-3 text-center">الرتبة</th>
                  <th className="pb-3 text-center">الكمية</th>
                  <th className="pb-3 text-left">المجموع الإجمالي</th>
                  <th className="pb-3 text-left">التاريخ</th>
                  <th className="pb-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {savedQuotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group"
                  >
                    <td className="py-3 font-bold text-slate-400 font-mono">
                      {q.id}
                    </td>
                    <td className="py-3 font-bold text-white">
                      {q.customerName}
                    </td>
                    <td className="py-3 text-slate-400">{q.projectName}</td>
                    <td className="py-3 text-center text-indigo-400 font-mono font-extrabold">
                      {q.mixGrade}
                    </td>
                    <td className="py-3 text-center text-slate-300 font-mono">
                      {q.volume} م³
                    </td>
                    <td className="py-3 text-left font-black text-emerald-400 font-mono">
                      <BidiText>{q.grandTotal.toLocaleString()}</BidiText> د.ع
                    </td>
                    <td className="py-3 text-left text-slate-500">
                      {new Date(q.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleLoadQuoteToForm(q)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        >
                          تحميل للنموذج
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(q.id)}
                          className="text-slate-600 hover:text-rose-400 p-1.5 rounded transition-all"
                          title="حذف عرض السعر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
