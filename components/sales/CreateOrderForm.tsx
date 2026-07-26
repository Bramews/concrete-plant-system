"use client";

import { useState, useRef, useEffect } from "react";
import { createOrderWithCustomer } from "@/app/actions/create-order";
import { useRouter as useAppRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin,
  Info,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Navigation,
} from "lucide-react";
import { BidiText } from "@/components/ui/BidiText";
import { MapPickerModal } from "@/components/ui/MapPickerModal";

type MixDesign = {
  id: number;
  name: string;
  code: string;
  strengthClass: string | null;
};

interface CreateOrderFormProps {
  customers?: any[];
  projects?: any[];
  mixDesigns: MixDesign[];
  approvedPrices: Record<string, number>;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: { id: string | number; name: string }[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

function SearchableSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputCls =
    "w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-white text-xs " +
    "placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 " +
    "focus:bg-indigo-500/[0.03] transition-all font-bold pl-10";

  return (
    <div className="space-y-1.5 relative text-right" ref={containerRef}>
      <label htmlFor={id} className="text-xs font-bold text-slate-300 block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          className={inputCls}
          placeholder={placeholder}
          required={required}
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 left-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-white/5 text-right">
          {filteredOptions.length > 0
            ? filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  className="px-3 py-2 text-xs hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors font-bold text-slate-200"
                  onClick={() => {
                    onChange(opt.name);
                    setSearch(opt.name);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </li>
              ))
            : search.trim() && (
                <li
                  className="px-3 py-2 text-xs text-indigo-400 cursor-pointer font-bold bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-colors"
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                >
                  + إضافة جديد: &quot;{search}&quot;
                </li>
              )}
        </ul>
      )}
    </div>
  );
}

const steps = [
  { id: 1, label: "العميل والموقع", icon: "👤" },
  { id: 2, label: "الخلطة المطلوبة", icon: "🧪" },
  { id: 3, label: "الكمية والتسعير", icon: "📋" },
];

export default function CreateOrderForm({
  customers = [],
  projects = [],
  mixDesigns,
  approvedPrices,
}: CreateOrderFormProps) {
  const router = useAppRouter();

  /* ── form state ─────────────────────────────────────────── */
  const [step, setStep] = useState(1);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [projectName, setProjectName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");

  // Step 2
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);

  // Step 3
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Logistics & Pump State
  const [showPumpAlert, setShowPumpAlert] = useState(false);
  const [pumpFeeAnswered, setPumpFeeAnswered] = useState(false);
  const [addPumpFee, setAddPumpFee] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [locationFileUrl, setLocationFileUrl] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleLocationFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("companyId", "1");
      formDataUpload.append("scope", "location");

      const res = await fetch("/api/network/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success && data.share?.fileUrl) {
        setLocationFileUrl(data.share.fileUrl);
        toast.success("تم رفع ملف الموقع بنجاح");
      } else {
        toast.error("فشل رفع الملف: " + data.error);
      }
    } catch (err: any) {
      toast.error("حدث خطأ أثناء الرفع: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // Automatically pre-fill phone number if existing customer is selected
  useEffect(() => {
    const cust = customers.find((c) => c.name === customerName);
    if (cust && cust.phone) {
      setCustomerPhone(cust.phone || "");
    }
  }, [customerName, customers]);

  // Automatically pre-fill location if existing project is selected
  useEffect(() => {
    const proj = projects.find((p) => p.name === projectName);
    if (proj && proj.location) {
      const loc = proj.location || "";

      let cleanLoc = loc;
      const idx = loc.search(/\((GPS|FILE):|GPS:|FILE:/);
      if (idx !== -1) {
        cleanLoc = loc.substring(0, idx).trim();
      }

      let gpsCoords = "";
      const gpsIdx = loc.indexOf("GPS:");
      if (gpsIdx !== -1) {
        let gpsPart = loc.substring(gpsIdx + 4).trim();
        const fileIdx = gpsPart.search(/\(?FILE:/);
        if (fileIdx !== -1) {
          gpsPart = gpsPart.substring(0, fileIdx).trim();
        }
        gpsCoords = gpsPart.replace(/[)]+$/, "").trim();
      }

      let fileUrl = "";
      const fileIdx = loc.indexOf("FILE:");
      if (fileIdx !== -1) {
        let filePart = loc.substring(fileIdx + 5).trim();
        const nextFileIdx = filePart.search(/\(?FILE:/);
        if (nextFileIdx !== -1) {
          filePart = filePart.substring(0, nextFileIdx).trim();
        }
        fileUrl = filePart.replace(/[)]+$/, "").trim();
      }

      setSiteLocation(cleanLoc);
      setGpsLocation(gpsCoords);
      if (fileUrl) {
        setLocationFileUrl(fileUrl);
      }
    }
  }, [projectName, projects]);

  /* ── derived calculations ────────────────────────────────── */
  const selectedMix = mixDesigns.find((m) => m.id === selectedMixId);
  const grade = selectedMix?.strengthClass || "C30";
  const unitPrice = approvedPrices[grade] || 72000;
  const vol = parseFloat(quantity) || 0;
  const baseCost = unitPrice * vol;
  const pumpCost = addPumpFee ? 5000 * vol : 0;
  const totalCost = baseCost + pumpCost;

  const canNext = () => {
    return true; // Always true so the button can be clicked to show validation errors
  };

  /* ── intercept step navigation for pump alert ────────────── */
  const handleNextOrSubmit = () => {
    if (step === 1) {
      if (customerName.trim().length < 2)
        return setError("يجب إدخال اسم العميل");
      if (!customerPhone.trim())
        return setError("عذراً، يجب إدخال رقم هاتف العميل للتواصل.");
      if (!projectName.trim())
        return setError("عذراً، يجب اختيار اسم المشروع التابع للعميل.");
      if (!siteLocation.trim())
        return setError(
          "عذراً، حقل العنوان الوصفي للموقع إجباري لتسهيل وصول الخلاطات.",
        );
      if (!gpsLocation.trim())
        return setError(
          "عذراً، يجب إدخال إحداثيات الموقع (GPS) لضمان دقة التوصيل والمطابقة.",
        );
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!selectedMixId)
        return setError(
          "عذراً، يجب اختيار تصميم الخلطة الخرسانية المعتمدة من القائمة.",
        );
      setError(null);
      setStep(3);
    } else if (step === 3) {
      if (vol <= 0)
        return setError(
          "عذراً، يجب إدخال الكمية المطلوبة بشكل صحيح (أكبر من 0).",
        );
      if (!date)
        return setError(
          "عذراً، تاريخ التوصيل إجباري. يرجى اختيار تاريخ توصيل الطلبية.",
        );
      if (vol < 20 && !pumpFeeAnswered) {
        setShowPumpAlert(true);
        return;
      }
      handleSubmit();
    }
  };

  /* ── submit ──────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("customerName", customerName.trim());
    fd.set("customerPhone", customerPhone.trim());

    // Append [شامل مضخة] to project name if selected
    const finalProjectName = `${projectName.trim()}${addPumpFee ? " [شامل مضخة]" : ""}`;
    fd.set("projectName", finalProjectName);

    // Combine manual address, GPS coordinates, and uploaded file URL
    let finalLocation = siteLocation.trim();
    if (gpsLocation.trim()) {
      finalLocation += ` (GPS: ${gpsLocation.trim()})`;
    }
    if (locationFileUrl) {
      finalLocation += finalLocation
        ? ` (FILE: ${locationFileUrl})`
        : `(FILE: ${locationFileUrl})`;
    }
    fd.set("siteLocation", finalLocation);

    fd.set("mixDesignId", String(selectedMixId));
    fd.set("quantity", quantity);
    fd.set("date", date);
    fd.set("notes", notes.trim());

    const res = await createOrderWithCustomer(fd);
    if (res.success) {
      toast.success("تم تسجيل الطلب بنجاح وإرساله للمدير للموافقة.");
      const targetPath = window.location.pathname.includes("/sales")
        ? "/system/sales/orders"
        : "/system/orders";
      router.push(targetPath);
      router.refresh();
    } else {
      setError(res.error ?? "خطأ غير متوقع");
      setSubmitting(false);
    }
  }

  /* ── input style ─────────────────────────────────────────── */
  const inputCls =
    "w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-white text-xs " +
    "placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 " +
    "focus:bg-indigo-500/[0.03] transition-all font-bold";

  return (
    <div className="high-density space-y-4 text-right" dir="rtl">
      {/* ── Stepper ── */}
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 right-0 left-0 h-px bg-white/5 mx-8" />
        {steps.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center gap-2 relative z-10"
          >
            <button
              onClick={() => s.id < step && setStep(s.id)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all duration-300 ${
                s.id === step
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 scale-110"
                  : s.id < step
                    ? "bg-emerald-500/20 border border-emerald-500/40 cursor-pointer hover:scale-105"
                    : "bg-white/5 border border-white/10 cursor-not-allowed"
              }`}
            >
              {s.id < step ? (
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span>{s.icon}</span>
              )}
            </button>
            <span
              className={`text-[11px] font-bold ${
                s.id === step
                  ? "text-violet-300"
                  : s.id < step
                    ? "text-emerald-400"
                    : "text-slate-600"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22 }}
        >
          {/* STEP 1 ── بيانات العميل والموقع */}
          {step === 1 && (
            <div className="space-y-3">
              {/* اسم العميل */}
              <SearchableSelect
                id="customer-name"
                label="اسم العميل *"
                placeholder="ابحث أو اكتب اسم عميل جديد..."
                options={customers}
                value={customerName}
                onChange={(val) => setCustomerName(val)}
                required
              />

              {/* رقم الهاتف */}
              <div className="space-y-1.5">
                <label
                  htmlFor="customer-phone"
                  className="text-xs font-bold text-slate-300"
                >
                  رقم الهاتف <span className="text-violet-400">*</span>
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="07XX-XXX-XXXX"
                  className={inputCls}
                  dir="ltr"
                  title="رقم الهاتف"
                />
              </div>

              {/* اسم المشروع */}
              <SearchableSelect
                id="project-name"
                label="اسم المشروع *"
                placeholder="ابحث أو اكتب اسم مشروع جديد..."
                options={projects}
                value={projectName}
                onChange={(val) => setProjectName(val)}
              />

              {/* الموقع / العنوان */}
              <div className="space-y-1.5">
                <label
                  htmlFor="site-location"
                  className="text-xs font-bold text-slate-300"
                >
                  العنوان الوصفي للموقع{" "}
                  <span className="text-violet-400">*</span>
                </label>
                <input
                  id="site-location"
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  placeholder="مثال: البصرة — حي الجزائر — قرب الجسر الأحمر"
                  className={inputCls}
                  title="الموقع / العنوان"
                />
              </div>

              {/* إحداثيات GPS & رفع الملف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* إحداثيات GPS */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="gps-location"
                    className="text-xs font-bold text-slate-300 block"
                  >
                    إحداثيات الموقع (GPS){" "}
                    <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="gps-location"
                      type="text"
                      value={gpsLocation}
                      onChange={(e) => setGpsLocation(e.target.value)}
                      placeholder="مثال: 30.5012, 47.8123"
                      className={`${inputCls} pl-24 text-left`}
                      dir="ltr"
                      title="إحداثيات الموقع الجغرافي"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setGpsLocation(
                                `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
                              );
                              toast.success(
                                "تم تحديد إحداثيات موقعك الحالي بنجاح.",
                              );
                            },
                            () => {
                              toast.error(
                                "فشل تحديد الموقع تلقائياً. يرجى إدخال الإحداثيات يدوياً.",
                              );
                            },
                          );
                        } else {
                          toast.error("المتصفح لا يدعم تحديد الموقع التلقائي.");
                        }
                      }}
                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2 py-1 rounded-lg transition-all font-bold"
                    >
                      تحديد موقعي
                    </button>
                  </div>
                </div>

                {/* رفع صورة/ملف الموقع */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    رفع الموقع (ملف/صورة){" "}
                    <span className="text-slate-500 font-normal text-[10px]">
                      (اختياري)
                    </span>
                  </label>
                  <input
                    type="file"
                    className="hidden"
                    id="location-file-upload-sales"
                    accept="image/*,application/pdf"
                    onChange={handleLocationFileUpload}
                  />
                  <label
                    htmlFor="location-file-upload-sales"
                    className="w-full h-[32px] border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/5 text-xs text-indigo-400 font-bold transition-all"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : locationFileUrl ? (
                      <span className="text-emerald-400">✓ تم الرفع</span>
                    ) : (
                      <span>اختر صورة/ملف</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 ── الخلطة */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {mixDesigns.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    لا توجد خلطات معتمدة حالياً
                  </div>
                ) : (
                  mixDesigns.map((m) => {
                    const activeGrade = m.strengthClass || "C30";
                    const activePrice = approvedPrices[activeGrade] || 72000;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMixId(m.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-right transition-all duration-200 ${
                          selectedMixId === m.id
                            ? "bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10"
                        }`}
                      >
                        {/* strength badge */}
                        <div
                          className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                            selectedMixId === m.id
                              ? "bg-indigo-600"
                              : "bg-white/5"
                          }`}
                        >
                          <span className="text-[7px] font-bold text-white/50 uppercase leading-none">
                            MPa
                          </span>
                          <span className="text-[11px] font-black text-white leading-none mt-0.5">
                            {m.strengthClass || "—"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">
                            {m.name}
                          </p>
                          <p className="text-slate-500 text-xs font-bold mt-0.5">
                            كود الخلطة: {m.code}
                          </p>
                        </div>

                        <div className="text-left">
                          <span className="text-emerald-400 font-mono font-black text-sm">
                            <BidiText>{activePrice.toLocaleString()}</BidiText>
                          </span>
                          <p className="text-[9px] text-slate-500 font-bold">
                            د.ع / م³
                          </p>
                        </div>

                        {selectedMixId === m.id && (
                          <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 3 ── الكمية والتسعير المباشر */}
          {step === 3 && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2 text-xs font-bold">
                {[
                  ["العميل المستهدف", customerName || "—"],
                  [
                    "الموقع الجغرافي",
                    gpsLocation ? `إحداثيات (${gpsLocation})` : "—",
                  ],
                  [
                    "رتبة الخرسانة",
                    selectedMix
                      ? `${selectedMix.strengthClass || "C30"} — (${selectedMix.name})`
                      : "—",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-bold text-white truncate max-w-[60%] text-left">
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label
                  htmlFor="order-quantity"
                  className="text-xs font-bold text-slate-300"
                >
                  الكمية الإجمالية المطلوبة (م³){" "}
                  <span className="text-violet-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="order-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setPumpFeeAnswered(false);
                    }}
                    min="1"
                    step="1"
                    placeholder="0"
                    className={`${inputCls} text-2xl font-black pl-14 font-mono`}
                    title="الكمية المطلوبة بالمتر المكعب"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    م³
                  </span>
                </div>
              </div>

              {/* Direct Pricing Preview Box */}
              {vol > 0 && (
                <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-500/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    تفاصيل حساب الفاتورة (تسعير مباشر)
                  </h4>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-400">
                      <span>سعر المتر الرتبة ({grade}):</span>
                      <span className="text-white font-mono">
                        <BidiText>{unitPrice.toLocaleString()}</BidiText> د.ع
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>سعر الخرسانة الأساسي ({vol} م³):</span>
                      <span className="text-white font-mono">
                        <BidiText>{baseCost.toLocaleString()}</BidiText> د.ع
                      </span>
                    </div>
                    {addPumpFee && (
                      <div className="flex justify-between text-emerald-400">
                        <span>أجور خدمة مضخة الصب (5,000 د.ع/م³):</span>
                        <span className="font-mono">
                          <BidiText>{pumpCost.toLocaleString()}</BidiText> د.ع
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-white/5 my-1" />
                    <div className="flex justify-between text-sm font-black text-white">
                      <span>المجموع الكلي المقدر:</span>
                      <span className="text-emerald-400 font-mono">
                        <BidiText>{totalCost.toLocaleString()}</BidiText> د.ع
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <label
                  htmlFor="delivery-date"
                  className="text-xs font-bold text-slate-300"
                >
                  تاريخ التسليم المطلوب
                </label>
                <input
                  id="delivery-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                  title="تاريخ التسليم المطلوب"
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
              </div>

              {/* Pump Toggle */}
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                <input
                  id="sales-pump-checkbox"
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={addPumpFee}
                  onChange={(e) => {
                    setAddPumpFee(e.target.checked);
                    setPumpFeeAnswered(true);
                  }}
                />
                <div className="space-y-0.5 text-right">
                  <label
                    htmlFor="sales-pump-checkbox"
                    className="text-xs font-bold select-none cursor-pointer text-slate-200"
                  >
                    طلب مضخة صب الخرسانة
                  </label>
                  <p className="text-[10px] text-slate-500 font-bold">
                    سيتم إضافة رسوم أجور المضخة (5,000 د.ع لكل متر مكعب)
                    تلقائياً إلى الفاتورة
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 text-right">
                <label
                  htmlFor="sales-notes-input"
                  className="text-xs font-bold text-slate-300"
                >
                  الملاحظات والتعليمات الإضافية
                </label>
                <textarea
                  id="sales-notes-input"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/[0.03] transition-all font-bold h-20 resize-none"
                  placeholder="أكتب أي ملاحظات أو تعليمات خاصة بالطلب هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-400 text-xs font-bold">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation ── */}
      <div className="flex items-center gap-3 pt-2">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all"
          >
            ← رجوع
          </button>
        )}

        <button
          type="button"
          onClick={handleNextOrSubmit}
          disabled={!canNext() || isSubmitting}
          className="flex-1 py-3.5 rounded-2xl font-black text-xs transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>جاري التسجيل...</span>
            </span>
          ) : step === 3 ? (
            "تأكيد الطلب وارسال للموافقة"
          ) : (
            "التالي ←"
          )}
        </button>
      </div>

      <p className="text-center text-slate-600 text-xs font-black">
        الخطوة {step} من {steps.length}
      </p>

      {/* ── Logistics Pump Alert Dialog ── */}
      {showPumpAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-right animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-amber-400 border-b border-white/5 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black">
                تنبيه لوجستي حاسم (حجم قليل)
              </h3>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              إن حجم الطلبية الحالي هو{" "}
              <span className="text-white font-black">{vol} م³</span> وهو أقل من
              الحد الأدنى الاقتصادي لتوريد خرسانة المضخة (20 م³).
              <br />
              <br />
              هل ترغب في إضافة{" "}
              <span className="text-emerald-400 font-black">
                أجور خدمة مضخة صب الخرسانة (5,000 د.ع/م³)
              </span>{" "}
              لعقد العميل؟
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddPumpFee(false);
                  setPumpFeeAnswered(true);
                  setShowPumpAlert(false);
                  handleSubmit();
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-3.5 rounded-xl text-xs font-bold transition-all"
              >
                لا، بدون مضخة
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddPumpFee(true);
                  setPumpFeeAnswered(true);
                  setShowPumpAlert(false);
                  setTimeout(() => handleSubmit(), 50);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-900/40"
              >
                نعم، أضف الرسوم
              </button>
            </div>
          </div>
        </div>
      )}
      {isMapOpen && (
        <MapPickerModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onSelectLocation={(lat, lng, resolvedAddress) => {
            setGpsLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            if (resolvedAddress && !siteLocation) {
              setSiteLocation(resolvedAddress);
            }
          }}
          isAr={true}
        />
      )}
    </div>
  );
}
