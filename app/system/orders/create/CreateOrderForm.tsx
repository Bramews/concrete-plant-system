"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { Icons } from "@/components/ui/Icons";
import { Locale, getDictionary } from "@/lib/dictionary";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MapPickerModal } from "@/components/ui/MapPickerModal";

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
}

interface Project {
  id: number;
  name: string;
  location?: string | null;
}

interface Mix {
  id: number;
  code: string;
  name: string;
  strengthClass?: string | null;
  pumpPrice?: number | null;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: { id: string | number; name: string }[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  isAr?: boolean;
}

export function SearchableSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false,
  isAr = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync search input with value prop
  useEffect(() => {
    const selected = options.find((o) => String(o.id) === value);
    if (selected) {
      setSearch(selected.name);
    } else {
      setSearch(value); // Custom typed value
    }
  }, [value, options]);

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

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label htmlFor={id} className="font-bold text-sm block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          className="w-full bg-muted/20 border border-input rounded-lg px-3 py-2 text-sm font-bold pl-10 text-right"
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
        <ul className="absolute z-50 w-full mt-1 bg-[#151b2c] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-white/5 text-right">
          {filteredOptions.length > 0
            ? filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  className="px-3 py-2 text-sm hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors font-bold text-slate-200"
                  onClick={() => {
                    onChange(String(opt.id));
                    setSearch(opt.name);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </li>
              ))
            : search.trim() && (
                <li
                  className="px-3 py-2 text-sm text-indigo-400 cursor-pointer font-bold bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-colors"
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                >
                  {isAr
                    ? `+ إضافة جديد: "${search}"`
                    : `+ Add new: "${search}"`}
                </li>
              )}
        </ul>
      )}
    </div>
  );
}

interface CreateOrderFormProps {
  customers: Customer[];
  projects: Project[];
  mixes: Mix[];
  lang: Locale;
  congestionMin: number;
  congestionMax: number;
  dailyVolumes: Record<string, number>;
}

export function CreateOrderForm({
  customers,
  projects,
  mixes,
  lang,
  congestionMin,
  congestionMax,
  dailyVolumes,
}: CreateOrderFormProps) {
  const dict = getDictionary(lang);
  const isAr = lang === "ar";

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPump, setHasPump] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [locationFileUrl, setLocationFileUrl] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    customerPhone: "",
    projectId: "",
    siteLocation: "",
    gpsLocation: "",
    mixDesignId: "",
    volume: "",
    date: "", // Make it empty by default
    notes: "",
  });

  const selectedMix = mixes.find((m) => String(m.id) === formData.mixDesignId);
  const currentPumpPrice =
    selectedMix?.pumpPrice !== undefined && selectedMix?.pumpPrice !== null
      ? selectedMix.pumpPrice
      : 0;

  // -- Modern Calendar Popover States --
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarYear, setCurrentCalendarYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(() =>
    new Date().getMonth(),
  );
  const calendarPopoverRef = useRef<HTMLDivElement>(null);

  // Close calendar on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarPopoverRef.current &&
        !calendarPopoverRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatArabicDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const weekdays = [
        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت",
      ];
      const months = [
        "كانون الثاني",
        "شباط",
        "آذار",
        "نيسان",
        "أيار",
        "حزيران",
        "تموز",
        "آب",
        "أيلول",
        "تشرين الأول",
        "تشرين الثاني",
        "كانون الأول",
      ];

      return isAr
        ? `${weekdays[d.getDay()]}، ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
        : d.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    } catch (e) {
      return dateStr;
    }
  };

  const getCongestionForDate = (dateString: string) => {
    if (!dateString) return { ratio: 0, label: "", color: "#10b981", vol: 0 };

    const vol = dailyVolumes[dateString] || 0;
    const ratio = Math.min(100, Math.round((vol / congestionMax) * 100));

    if (vol < congestionMin) {
      return {
        ratio,
        label: isAr ? "متاح بالكامل" : "Available",
        color: "#10b981",
        vol,
      };
    } else if (vol < congestionMax) {
      return {
        ratio,
        label: isAr ? "إشغال متوسط" : "Moderate",
        color: "#f59e0b",
        vol,
      };
    } else {
      return {
        ratio,
        label: isAr ? "مزدحم جداً" : "Fully Booked",
        color: "#ef4444",
        vol,
      };
    }
  };

  const weekdaysAr = [
    "سبت",
    "أحد",
    "اثنين",
    "ثلاثاء",
    "أربعاء",
    "خميس",
    "جمعة",
  ];
  const weekdaysEn = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const monthsNamesAr = [
    "كانون الثاني",
    "شباط",
    "آذار",
    "نيسان",
    "أيار",
    "حزيران",
    "تموز",
    "آب",
    "أيلول",
    "تشرين الأول",
    "تشرين الثاني",
    "كانون الأول",
  ];
  const monthsNamesEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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
        toast.success(
          isAr
            ? "تم رفع ملف الموقع بنجاح"
            : "Location file uploaded successfully",
        );
      } else {
        toast.error(
          isAr
            ? "فشل رفع الملف: " + data.error
            : "Upload failed: " + data.error,
        );
      }
    } catch (err: any) {
      toast.error(
        isAr
          ? "حدث خطأ أثناء الرفع: " + err.message
          : "Error during upload: " + err.message,
      );
    } finally {
      setUploadingFile(false);
    }
  };

  // Automatically pre-fill phone number if existing customer is selected
  useEffect(() => {
    const cust = customers.find((c) => String(c.id) === formData.customerId);
    if (cust && cust.phone) {
      setFormData((prev) => ({ ...prev, customerPhone: cust.phone || "" }));
    }
  }, [formData.customerId, customers]);

  // Automatically pre-fill location if existing project is selected
  useEffect(() => {
    const proj = projects.find((p) => String(p.id) === formData.projectId);
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

      setFormData((prev) => ({
        ...prev,
        siteLocation: cleanLoc,
        gpsLocation: gpsCoords,
      }));
      if (fileUrl) {
        setLocationFileUrl(fileUrl);
      }
    }
  }, [formData.projectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const customerVal = isNaN(Number(formData.customerId))
        ? formData.customerId
        : parseInt(formData.customerId);
      const projectVal = formData.projectId
        ? isNaN(Number(formData.projectId))
          ? formData.projectId
          : parseInt(formData.projectId)
        : undefined;

      if (!formData.customerId || !formData.customerId.trim()) {
        throw new Error(
          isAr
            ? "عذراً، يجب اختيار أو كتابة اسم العميل لإتمام الطلبية."
            : "Sorry, customer name must be selected or typed to complete the order.",
        );
      }
      if (!formData.projectId || !formData.projectId.trim()) {
        throw new Error(
          isAr
            ? "عذراً، يجب اختيار اسم المشروع التابع للعميل."
            : "Sorry, you must select the project associated with the customer.",
        );
      }
      if (!formData.siteLocation || !formData.siteLocation.trim()) {
        throw new Error(
          isAr
            ? "عذراً، حقل العنوان الوصفي للموقع إجباري لتسهيل وصول الخلاطات."
            : "Sorry, the descriptive site address is mandatory to facilitate mixer access.",
        );
      }
      if (!formData.gpsLocation || !formData.gpsLocation.trim()) {
        throw new Error(
          isAr
            ? "عذراً، يجب إدخال إحداثيات الموقع (GPS) لضمان دقة التوصيل والمطابقة."
            : "Sorry, GPS coordinates must be entered to ensure delivery accuracy and compliance.",
        );
      }
      if (!formData.mixDesignId) {
        throw new Error(
          isAr
            ? "عذراً، يجب اختيار تصميم الخلطة الخرسانية المعتمدة من القائمة."
            : "Sorry, you must select an approved concrete mix design from the list.",
        );
      }
      if (!formData.volume || parseFloat(formData.volume) <= 0) {
        throw new Error(
          isAr
            ? "عذراً، يجب إدخال الكمية المطلوبة بشكل صحيح (أكبر من 0)."
            : "Sorry, you must enter a valid requested volume (greater than 0).",
        );
      }
      if (!formData.date) {
        throw new Error(
          isAr
            ? "عذراً، تاريخ التوصيل إجباري. يرجى اختيار تاريخ توصيل الطلبية من التقويم."
            : "Sorry, delivery date is mandatory. Please select a delivery date from the calendar.",
        );
      }

      let gpsWithFile = (formData.gpsLocation || "").trim();
      if (locationFileUrl) {
        gpsWithFile += gpsWithFile
          ? ` (FILE: ${locationFileUrl})`
          : `(FILE: ${locationFileUrl})`;
      }

      await createOrder({
        customerId: customerVal,
        projectId: projectVal,
        mixDesignId: parseInt(formData.mixDesignId),
        volume: parseFloat(formData.volume),
        date: new Date(formData.date),
        hasPump: hasPump,
        notes: formData.notes || undefined,
        customerPhone: formData.customerPhone || undefined,
        siteLocation: formData.siteLocation || undefined,
        gpsLocation: gpsWithFile || undefined,
      });
      router.push("/system/orders");
      toast.success(
        isAr
          ? "تم تأكيد وإنشاء الطلبية بنجاح"
          : "Order confirmed and created successfully",
      );
    } catch (err: unknown) {
      const error = err as Error;
      setError(
        error.message ||
          (isAr
            ? "فشل إنشاء الطلبية لأسباب تقنية. يرجى المحاولة مرة أخرى."
            : "Failed to create order due to technical reasons. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => router.back()} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-white/10 p-5 rounded-[2rem] shadow-2xl text-right animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none !important;
          }
        `}</style>

        {/* Close Button X */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all z-20"
        >
          ✕
        </button>

        {/* Modal Title */}
        <div className="md:col-span-2 flex justify-between items-center border-b border-white/5 pb-2 mb-1">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Icons.Box className="w-5 h-5 text-indigo-400" />
            {isAr ? "إنشاء طلب خرسانة جديد" : "Create New Concrete Order"}
          </h2>
        </div>

        {error && (
          <div className="md:col-span-2 bg-red-500/10 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <Icons.Alert className="w-4 h-4" /> {error}
          </div>
        )}

        {/* COLUMN 1: Customer & Concrete specifications */}
        <div className="space-y-3">
          {/* CUSTOMER NAME */}
          <SearchableSelect
            id="customer-select"
            label={isAr ? "العميل *" : "Customer *"}
            placeholder={
              isAr ? "اختر أو اكتب اسم العميل..." : "Select or type customer..."
            }
            options={customers}
            value={formData.customerId}
            onChange={(val) => setFormData({ ...formData, customerId: val })}
            required
            isAr={isAr}
          />

          {/* CUSTOMER PHONE */}
          <div className="space-y-1">
            <label
              htmlFor="customer-phone-input"
              className="font-bold text-xs text-slate-400 block"
            >
              {isAr ? "رقم الهاتف" : "Phone Number"}
            </label>
            <input
              id="customer-phone-input"
              type="tel"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-left text-white"
              dir="ltr"
              placeholder="07XX-XXX-XXXX"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
            />
          </div>

          {/* MIX DESIGN */}
          <div className="space-y-1">
            <label
              htmlFor="mix-select"
              className="font-bold text-xs text-slate-400 block"
            >
              {isAr
                ? "تصميم الخلطة (المعتمدة فقط) *"
                : "Mix Design (Approved Only) *"}
            </label>
            <div className="relative">
              <select
                id="mix-select"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pl-10 appearance-none text-xs font-bold text-white text-right"
                required
                aria-label={isAr ? "اختر تصميم الخلطة" : "Select Mix Design"}
                value={formData.mixDesignId}
                onChange={(e) =>
                  setFormData({ ...formData, mixDesignId: e.target.value })
                }
              >
                <option value="" className="bg-slate-900">
                  {isAr ? "اختر تصميم الخلطة" : "Select Mix Design"}
                </option>
                {mixes.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900">
                    {m.code} - {m.name} ({m.strengthClass || "N/A"})
                  </option>
                ))}
              </select>
              <Icons.Beaker className="w-4 h-4 absolute left-3 top-2 text-muted-foreground pointer-events-none" />
            </div>
            {mixes.length === 0 && (
              <p className="text-xs text-amber-500 font-bold mt-1">
                {isAr
                  ? "لم يتم العثور على خلطات معتمدة. اتصل بالمختبر."
                  : "No approved mixes found. Contact Lab."}
              </p>
            )}
          </div>

          {/* VOLUME & DATE (Inline grid) */}
          <div className="grid grid-cols-2 gap-3">
            {/* VOLUME */}
            <div className="space-y-1">
              <label
                htmlFor="volume-input"
                className="font-bold text-xs text-slate-400 block"
              >
                {isAr ? "الكمية المطلوبة (m³) *" : "Volume (m³) *"}
              </label>
              <input
                id="volume-input"
                type="number"
                step="0.5"
                min="1"
                dir="ltr"
                lang="en"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono font-bold text-xs text-white"
                required
                placeholder="e.g. 12"
                value={formData.volume}
                onChange={(e) =>
                  setFormData({ ...formData, volume: e.target.value })
                }
              />
            </div>

            {/* DATE */}
            <div className="space-y-1 relative" ref={calendarPopoverRef}>
              <label
                htmlFor="date-input"
                className="font-bold text-xs text-slate-400 block"
              >
                {isAr ? "تاريخ التوصيل *" : "Delivery Date *"}
              </label>
              <div className="relative">
                <input
                  id="date-input"
                  type="text"
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white cursor-pointer placeholder-slate-500 text-right pr-3 pl-10"
                  placeholder={
                    isAr ? "اختر تاريخ التوصيل..." : "Select delivery date..."
                  }
                  required
                  value={formData.date ? formatArabicDate(formData.date) : ""}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <Icons.Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Custom Calendar Popover */}
              {isCalendarOpen && (
                <div
                  className="absolute z-50 left-[-100px] right-[-100px] sm:left-[-120px] sm:right-[-120px] md:left-[-180px] md:right-0 mt-2 p-4 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl animate-scale-in"
                  style={{ background: "#0b1120" }}
                >
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentCalendarMonth === 0) {
                          setCurrentCalendarMonth(11);
                          setCurrentCalendarYear(currentCalendarYear - 1);
                        } else {
                          setCurrentCalendarMonth(currentCalendarMonth - 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    <span className="text-sm font-black text-white">
                      {isAr
                        ? `${monthsNamesAr[currentCalendarMonth]} ${currentCalendarYear}`
                        : `${monthsNamesEn[currentCalendarMonth]} ${currentCalendarYear}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentCalendarMonth === 11) {
                          setCurrentCalendarMonth(0);
                          setCurrentCalendarYear(currentCalendarYear + 1);
                        } else {
                          setCurrentCalendarMonth(currentCalendarMonth + 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Weekdays Header */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {(isAr ? weekdaysAr : weekdaysEn).map((day) => (
                      <span
                        key={day}
                        className="text-[10px] font-bold text-slate-400 py-1"
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const daysInMonth = new Date(
                        currentCalendarYear,
                        currentCalendarMonth + 1,
                        0,
                      ).getDate();
                      const firstDayOfWeek = new Date(
                        currentCalendarYear,
                        currentCalendarMonth,
                        1,
                      ).getDay();
                      const offset = (firstDayOfWeek + 1) % 7;
                      const prevMonthDays = new Date(
                        currentCalendarYear,
                        currentCalendarMonth,
                        0,
                      ).getDate();

                      const cells = [];

                      for (let i = offset - 1; i >= 0; i--) {
                        cells.push({
                          dayNum: prevMonthDays - i,
                          isCurrentMonth: false,
                          dateString: "",
                        });
                      }

                      for (let i = 1; i <= daysInMonth; i++) {
                        const mm = String(currentCalendarMonth + 1).padStart(
                          2,
                          "0",
                        );
                        const dd = String(i).padStart(2, "0");
                        cells.push({
                          dayNum: i,
                          isCurrentMonth: true,
                          dateString: `${currentCalendarYear}-${mm}-${dd}`,
                        });
                      }

                      const remaining = 42 - cells.length;
                      for (let i = 1; i <= remaining; i++) {
                        cells.push({
                          dayNum: i,
                          isCurrentMonth: false,
                          dateString: "",
                        });
                      }

                      return cells;
                    })().map((cell, idx) => {
                      const isSelected = cell.dateString === formData.date;
                      const occupancy = getCongestionForDate(cell.dateString);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!cell.isCurrentMonth}
                          onClick={() => {
                            if (cell.dateString) {
                              setFormData({
                                ...formData,
                                date: cell.dateString,
                              });
                              setIsCalendarOpen(false);
                            }
                          }}
                          className={`flex flex-col items-center justify-between p-1 h-10 rounded-lg border text-center transition-all ${
                            !cell.isCurrentMonth
                              ? "opacity-20 border-transparent pointer-events-none"
                              : isSelected
                                ? "bg-indigo-600/30 border-indigo-500 text-white shadow-[0_0_8px_rgba(79,124,255,0.15)] scale-105"
                                : "bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          <span className="text-[10px] font-bold font-mono leading-none">
                            {cell.dayNum}
                          </span>
                          {cell.isCurrentMonth && (
                            <div className="w-full flex flex-col items-center justify-center gap-0.5 mt-0.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: occupancy.color }}
                                title={`${occupancy.label} (${occupancy.ratio}%)`}
                              />
                              <div className="w-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${occupancy.ratio}%`,
                                    backgroundColor: occupancy.color,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend and details */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        {isAr ? "متاح" : "Available"} (&lt; {congestionMin} m³)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                        {isAr ? "متوسط" : "Moderate"} ({congestionMin} -{" "}
                        {congestionMax} m³)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                        {isAr ? "مزدحم" : "Busy"} ({congestionMax}+ m³)
                      </span>
                    </div>
                    {formData.date && (
                      <div className="text-white font-bold font-mono">
                        {isAr ? "المجدول:" : "Scheduled:"}{" "}
                        {getCongestionForDate(formData.date).vol} m³ /{" "}
                        {congestionMax} m³
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Project & Location info */}
        <div className="space-y-3">
          {/* PROJECT NAME */}
          <SearchableSelect
            id="project-select"
            label={isAr ? "اسم المشروع *" : "Project Name *"}
            placeholder={
              isAr ? "اختر أو اكتب اسم المشروع..." : "Select or type project..."
            }
            options={projects}
            value={formData.projectId}
            onChange={(val) => setFormData({ ...formData, projectId: val })}
            isAr={isAr}
          />

          {/* SITE DESCRIPTIVE LOCATION */}
          <div className="space-y-1">
            <label
              htmlFor="site-location-input"
              className="font-bold text-xs text-slate-400 block"
            >
              {isAr ? "العنوان الوصفي للموقع *" : "Descriptive Address *"}
            </label>
            <input
              id="site-location-input"
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
              placeholder={
                isAr
                  ? "مثال: البصرة — حي الجزائر — قرب الجسر الأحمر"
                  : "e.g. Basra - Al-Jazaer"
              }
              value={formData.siteLocation}
              onChange={(e) =>
                setFormData({ ...formData, siteLocation: e.target.value })
              }
            />
          </div>

          {/* LOCATION UPLOAD & GPS (Inline grid) */}
          <div className="grid grid-cols-2 gap-3">
            {/* GPS COORDINATES */}
            <div className="space-y-1">
              <label
                htmlFor="gps-location-input"
                className="font-bold text-sm text-slate-400 block"
              >
                {isAr ? "إحداثيات الموقع (GPS) *" : "GPS Coordinates *"}
              </label>
              <div className="relative flex gap-2">
                <input
                  id="gps-location-input"
                  type="text"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-left text-white"
                  dir="ltr"
                  placeholder="30.5012, 47.8123"
                  value={formData.gpsLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, gpsLocation: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                  title={isAr ? "اختر من الخريطة" : "Select from Map"}
                >
                  <Icons.Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LOCATION FILE UPLOAD */}
            <div className="space-y-1">
              <label className="font-bold text-xs text-slate-400 block">
                {isAr ? "رفع الموقع (ملف/صورة)" : "Upload Location"}
              </label>
              <input
                type="file"
                className="hidden"
                id="location-file-upload"
                accept="image/*,application/pdf"
                onChange={handleLocationFileUpload}
              />
              <label
                htmlFor="location-file-upload"
                className="w-full h-[32px] border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 text-xs text-indigo-400 font-bold transition-all"
              >
                {uploadingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : locationFileUrl ? (
                  <span className="text-emerald-400">
                    ✓ {isAr ? "تم الرفع" : "Uploaded"}
                  </span>
                ) : (
                  <span>{isAr ? "اختر صورة/ملف" : "Choose file"}</span>
                )}
              </label>
            </div>
          </div>

          {/* PUMP REQUIRED */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl">
            <input
              id="pump-checkbox"
              type="checkbox"
              className="w-4 h-4 rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-slate-900"
              checked={hasPump}
              onChange={(e) => setHasPump(e.target.checked)}
            />
            <div className="space-y-0.5 text-right flex-1">
              <label
                htmlFor="pump-checkbox"
                className="text-xs font-bold select-none cursor-pointer text-slate-200"
              >
                {isAr ? "طلب مضخة صب الخرسانة" : "Request Concrete Pump"}
              </label>
              <p className="text-[10px] text-slate-400 leading-tight">
                {isAr
                  ? `إضافة رسوم المضخة (${currentPumpPrice.toLocaleString()} د.ع لكل م³) تلقائياً`
                  : `Pump fee (${currentPumpPrice.toLocaleString()} IQD per m³) automatically added`}
              </p>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-1">
            <label
              htmlFor="notes-input"
              className="font-bold text-xs text-slate-400 block"
            >
              {isAr ? "الملاحظات" : "Notes / Remarks"}
            </label>
            <textarea
              id="notes-input"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold h-12 resize-none text-white"
              placeholder={
                isAr ? "أي ملاحظات إضافية..." : "Any additional notes..."
              }
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>

        {/* BUTTONS ROW */}
        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-white/5 mt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 rounded-xl font-bold text-slate-400 hover:bg-white/5 text-xs transition-colors"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            {loading
              ? isAr
                ? "جاري الحفظ..."
                : "Saving..."
              : isAr
                ? "تأكيد وإرسال الطلب"
                : "Confirm & Send Order"}
          </button>
        </div>
      </form>
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(lat, lng, resolvedAddress) => {
          setFormData((prev) => ({
            ...prev,
            gpsLocation: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            siteLocation:
              resolvedAddress && !prev.siteLocation
                ? resolvedAddress
                : prev.siteLocation,
          }));
        }}
        isAr={isAr}
      />
    </div>
  );
}
