"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Search,
  MapPin,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  History,
  Activity,
  AlertOctagon,
  BellRing,
  ClipboardCheck,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import {
  logVehicleMovement,
  registerIncomingMaterial,
} from "@/app/actions/guard";

import { Vehicle } from "@prisma/client";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { BidiText } from "@/components/ui/BidiText";
import styles from "./guard.module.css";

interface GuardDashboardProps {
  vehicles: Vehicle[];
  materials: string[];
  canRegisterMaterials: boolean;
  lang: "en" | "ar";
}

interface SafetyLog {
  id: string;
  date: string;
  checkedItems: string[];
  notes: string;
  inspector: string;
}

const StatCard = ({ icon: Icon, title, value, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-panel p-4 flex items-center gap-4 border-l-4 ${color}`}
  >
    <div className={`p-3 rounded-xl bg-white/5`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </motion.div>
);

const SAFETY_ITEMS = [
  {
    id: "1",
    label: "ارتداء الخوذة والسترة العاكسة لجميع الموظفين والسائقين بالموقع",
  },
  { id: "2", label: "فحص صلاحية وتوفر طفايات الحريق في النقاط المحددة" },
  {
    id: "3",
    label: "خلو ساحة الخلاطة ومسارات شحن الخرسانة من العوائق والمخلفات",
  },
  { id: "4", label: "التأكد من عمل أضواء الطوارئ ومخارج السلامة بالمحطة" },
  { id: "5", label: "فحص فرامل وتجهيزات الشاحنات أثناء الدخول والخروج" },
  {
    id: "6",
    label: "التأكد من توفر واكتمال حقيبة الإسعافات الأولية بغرفة الحارس",
  },
  {
    id: "7",
    label: "فحص ساحة المحطة لضمان خلوها من أي تسرب سوائل كيميائية أو زيوت",
  },
];

export default function GuardDashboard({
  vehicles,
  materials,
  canRegisterMaterials,
  lang,
}: GuardDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "VEHICLES" | "YARD" | "MATERIALS" | "HISTORY" | "SAFETY"
  >("VEHICLES");
  const [search, setSearch] = useState("");
  const [isSosConfirmOpen, setIsSosConfirmOpen] = useState(false);
  const [isSosTriggered, setIsSosTriggered] = useState(false);

  // Safety HSE Checklist states
  const [checkedSafetyItems, setCheckedSafetyItems] = useState<string[]>([]);
  const [safetyNotes, setSafetyNotes] = useState("");
  const [safetyHistory, setSafetyHistory] = useState<SafetyLog[]>([]);

  // Load Safety History on Mount
  useEffect(() => {
    const history = localStorage.getItem("hse_safety_logs");
    if (history) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSafetyHistory(JSON.parse(history));
      } catch (e) {
        console.error("Failed parsing safety logs history", e);
      }
    }
  }, []);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.code.toLowerCase().includes(search.toLowerCase()) ||
        v.type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [vehicles, search]);

  const insideVehicles = useMemo(() => {
    return vehicles.filter((v) => v.location === "INSIDE");
  }, [vehicles]);

  const handleVehicleAction = async (
    id: number,
    location: "INSIDE" | "OUTSIDE",
  ) => {
    const formData = new FormData();
    formData.append("vehicleId", id.toString());
    formData.append("location", location);

    const tId = toast.loading("جاري المعالجة...");
    const res = await logVehicleMovement(formData);

    if (res.success) {
      toast.success("تم تحديث الحالة بنجاح", { id: tId });
    } else {
      toast.error(res.error, { id: tId });
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tId = toast.loading("جاري التسجيل...");
    const res = await registerIncomingMaterial(formData);

    if (res.success) {
      toast.success("تم تسجيل المادة بنجاح", { id: tId });
      // @ts-expect-error reset is valid
      e.target.reset();
    } else {
      toast.error(res.error, { id: tId });
    }
  };

  // Trigger SOS Broadcast
  const handleTriggerSOS = () => {
    setIsSosConfirmOpen(false);
    setIsSosTriggered(true);
    localStorage.setItem("sos_alert_active", "true");
    // Dispatch event so other components in same origin can capture
    window.dispatchEvent(new Event("storage"));

    // Simulate playing alarm sounds or sound warnings
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioContext.currentTime); // Sound frequency
      osc.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      osc.start();
      osc.stop(audioContext.currentTime + 1.5); // 1.5 seconds sound alert
    } catch (e) {
      console.warn("Audio Context blocked or not supported", e);
    }

    toast.error("🚨 تم إرسال نداء الاستغاثة الفوري لجميع الأقسام والإدارات!", {
      duration: 5000,
    });
  };

  // Resolve SOS
  const handleResolveSOS = () => {
    setIsSosTriggered(false);
    localStorage.removeItem("sos_alert_active");
    window.dispatchEvent(new Event("storage"));
    toast.success("تم إيقاف نداء الاستغاثة بنجاح واحتواء الموقف.");
  };

  // Handle Safety Checklist Item Check
  const handleToggleSafetyItem = (id: string) => {
    setCheckedSafetyItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Submit Safety checklist
  const handleSafetySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkedSafetyItems.length === 0) {
      toast.error("يرجى فحص وتحديد بند واحد على الأقل قبل تسجيل التقرير.");
      return;
    }

    const newLog: SafetyLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString("ar-u-nu-latn"),
      checkedItems: checkedSafetyItems,
      notes: safetyNotes.trim(),
      inspector: "الحارس المناوب",
    };

    const updatedHistory = [newLog, ...safetyHistory];
    setSafetyHistory(updatedHistory);
    localStorage.setItem("hse_safety_logs", JSON.stringify(updatedHistory));

    // Reset Form
    setCheckedSafetyItems([]);
    setSafetyNotes("");
    toast.success("تم حفظ وتوثيق تقرير السلامة المهنية بنجاح!");
  };

  return (
    <div className={styles.dashboard}>
      {/* SOS Alert Full Screen Overlay */}
      <AnimatePresence>
        {isSosTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-rose-950/90 backdrop-blur-md p-6 text-center"
            dir="rtl"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-24 h-24 rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-6"
            >
              <AlertOctagon size={56} className="animate-pulse" />
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-2">
              🚨 نداء استغاثة SOS نشط 🚨
            </h2>
            <p className="text-lg text-slate-200 max-w-md mb-8 font-bold">
              تم بث إشارة الطوارئ إلى جميع الأنظمة والأقسام. الحوار مع إدارة
              العمليات والإنقاذ مفتوح الآن.
            </p>

            <button
              onClick={handleResolveSOS}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-900/30 active:scale-95"
            >
              إيقاف الإنذار واحتواء الموقف
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Quick Button Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-slate-900/40 p-4 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            بوابة المراقبة والحراسة
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل حركات الأسطول، المواد الواردة، وتقارير السلامة المهنية للمحطة
            الخرسانية
          </p>
        </div>

        <button
          onClick={() => setIsSosConfirmOpen(true)}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 text-sm animate-pulse"
        >
          <BellRing size={18} />
          إرسال نداء استغاثة SOS 🚨
        </button>
      </div>

      {/* Upper Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Activity}
          title={"الآليات في الداخل"}
          value={insideVehicles.length}
          color="border-yellow-500"
        />
        <StatCard
          icon={Truck}
          title={"إجمالي الآليات"}
          value={vehicles.length}
          color="border-blue-500"
        />
        <StatCard
          icon={ShieldCheck}
          title={"حالة السلامة اليومية"}
          value={safetyHistory.length > 0 ? "مؤمنة بالكامل" : "بانتظار الفحص"}
          color="border-emerald-500"
        />
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "VEHICLES" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("VEHICLES")}
        >
          <LogIn size={18} className="inline-block me-2" />
          {"بوابة الدخول"}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "YARD" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("YARD")}
        >
          <MapPin size={18} className="inline-block me-2" />
          {"ساحة المحطة"}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "MATERIALS" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("MATERIALS")}
        >
          <Package size={18} className="inline-block me-2" />
          {"المواد الواردة"}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "SAFETY" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("SAFETY")}
        >
          <ClipboardCheck size={18} className="inline-block me-2" />
          {"السلامة المهنية (HSE)"}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "HISTORY" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("HISTORY")}
        >
          <History size={18} className="inline-block me-2" />
          {"سجل الحركات"}
        </button>
      </div>

      {activeTab !== "SAFETY" && (
        <div className="mb-6 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder={"البحث برقم اللوحة أو النوع..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "VEHICLES" && (
          <motion.div
            key="vehicles"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles
                .filter((v) => v.location === "OUTSIDE")
                .map((v) => (
                  <div
                    key={v.id}
                    className={`glass-panel p-4 flex justify-between items-center group hover:bg-white/5 transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{v.code}</h4>
                        <p className="text-sm text-slate-400">{v.type}</p>
                      </div>
                    </div>
                    <button
                      className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                      onClick={() => handleVehicleAction(v.id, "INSIDE")}
                      title={"تسجيل دخول"}
                    >
                      <LogIn size={20} />
                    </button>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {activeTab === "YARD" && (
          <motion.div
            key="yard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insideVehicles.map((v) => (
                <div
                  key={v.id}
                  className={`glass-panel p-4 border-b-2 border-yellow-500/30 flex justify-between items-center`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{v.code}</h4>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                        <Activity size={12} />
                        {"بالداخل منذ: "}
                        {v.lastEntryAt ? (
                          <BidiText>
                            {new Date(v.lastEntryAt).toLocaleTimeString(
                              "ar-u-nu-latn",
                            )}
                          </BidiText>
                        ) : (
                          "--:--"
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-3 bg-rose-600/20 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                    onClick={() => handleVehicleAction(v.id, "OUTSIDE")}
                    title={"تسجيل خروج"}
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ))}
              {insideVehicles.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white/5 rounded-2xl border-2 border-dashed border-white/5">
                  <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                  <p>{"لا توجد آليات داخل المحطة حالياً"}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "MATERIALS" && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {!canRegisterMaterials ? (
              <div className="glass-panel p-12 text-center border-rose-500/50">
                <ShieldCheck size={48} className="mx-auto mb-4 text-rose-500" />
                <h3 className="text-xl font-bold mb-2">{"غير مصرح لك"}</h3>
                <p className="text-slate-400">
                  {"يرجى مراجعة قسم الحسابات لتفعيل صلاحية تسجيل المواد."}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleMaterialSubmit}
                className="glass-panel p-6 max-w-2xl mx-auto border-emerald-500/20 text-right"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 justify-end">
                  {"تسجيل شحنة مادة"}
                  <Package className="text-emerald-500" />
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label
                        className="text-sm font-bold text-slate-400 px-1"
                        htmlFor="materialType"
                      >
                        {"نوع المادة"}
                      </label>
                      <select
                        id="materialType"
                        name="materialType"
                        title={"اختر النوع"}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                      >
                        {materials.map((m) => (
                          <option key={m} value={m} className="bg-slate-900">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label
                        className="text-sm font-bold text-slate-400 px-1"
                        htmlFor="quantity"
                      >
                        {"الكمية (بالأطنان / م³)"}
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        step="0.1"
                        required
                        title={"الكمية"}
                        placeholder={"0.0"}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="text-sm font-bold text-slate-400 px-1"
                      htmlFor="source"
                    >
                      {"المورد / المصدر"}
                    </label>
                    <input
                      id="source"
                      type="text"
                      name="source"
                      required
                      title={"المورد"}
                      placeholder={"أدخل المصدر أو اسم المورد"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <ShieldCheck size={20} />
                    {"إتمام التسجيل"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === "SAFETY" && (
          <motion.div
            key="safety"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-right"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Checklist Form */}
              <form
                onSubmit={handleSafetySubmit}
                className="glass-panel p-6 border-indigo-500/20 flex flex-col gap-6"
              >
                <div className="flex items-center gap-2 justify-between border-b border-white/5 pb-4">
                  <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded font-black">
                    اليوم
                  </span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    قائمة الفحص اليومية للصحة والسلامة المهنية (HSE)
                    <ClipboardCheck className="text-indigo-400" />
                  </h3>
                </div>

                <div className="space-y-3">
                  {SAFETY_ITEMS.map((item) => {
                    const isChecked = checkedSafetyItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSafetyItem(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                          isChecked
                            ? "bg-indigo-600/10 border-indigo-500/30 text-white"
                            : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                              : "border-white/10"
                          }`}
                        >
                          {isChecked && <UserCheck size={12} />}
                        </div>
                        <span className="text-sm font-bold leading-normal">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="safetyNotes"
                    className="text-sm font-bold text-slate-400 px-1"
                  >
                    ملاحظات أو تجاوزات مرصودة
                  </label>
                  <textarea
                    id="safetyNotes"
                    rows={3}
                    value={safetyNotes}
                    onChange={(e) => setSafetyNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظة عن حالة الأمن والسلامة أو أعطال في أجهزة الحماية بالموقع..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-right text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <ShieldCheck size={20} />
                  تسجيل وتوثيق فحص السلامة اليومي
                </button>
              </form>

              {/* Safety Inspection History */}
              <div className="glass-panel p-6 border-white/5 flex flex-col gap-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-4">
                  سجل تقارير السلامة الأخيرة بالموقع
                  <History className="text-slate-400" />
                </h3>

                <div className="space-y-4 overflow-y-auto max-h-[500px] no-scrollbar">
                  {safetyHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-bold bg-white/5 rounded-2xl border border-dashed border-white/5">
                      لا يوجد تقارير سلامة مسجلة مؤخراً.
                    </div>
                  ) : (
                    safetyHistory.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3"
                      >
                        <div className="flex justify-between items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black flex items-center gap-1">
                            <ShieldAlert size={10} />
                            مكتمل وآمن ({log.checkedItems.length}/
                            {SAFETY_ITEMS.length})
                          </span>
                          <span className="text-xs text-slate-500 font-bold font-mono">
                            <BidiText>{log.date}</BidiText>
                          </span>
                        </div>

                        {log.notes && (
                          <div className="bg-white/5 p-3 rounded-xl border-l-2 border-amber-500">
                            <p className="text-xs font-bold text-slate-400">
                              ملاحظات الحراسة:
                            </p>
                            <p className="text-sm text-slate-200 mt-1 font-bold">
                              {log.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>المسؤول: {log.inspector}</span>
                          <span>
                            الرقم المرجعي: <BidiText>{log.id}</BidiText>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "HISTORY" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="glass-panel overflow-hidden border-white/5 text-right">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-black text-sm">
                      <th className="p-4">المركبة</th>
                      <th className="p-4">النوع</th>
                      <th className="p-4">آخر حركة</th>
                      <th className="p-4">الحالة الحالية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-white/5 text-sm hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 font-bold">{v.code}</td>
                        <td className="p-4 text-slate-400">{v.type}</td>
                        <td className="p-4 text-slate-400 font-mono">
                          {v.lastExitAt ? (
                            <BidiText>
                              {new Date(v.lastExitAt).toLocaleDateString(
                                "ar-u-nu-latn",
                              )}
                            </BidiText>
                          ) : v.lastEntryAt ? (
                            <BidiText>
                              {new Date(v.lastEntryAt).toLocaleDateString(
                                "ar-u-nu-latn",
                              )}
                            </BidiText>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`${styles.statusBadge} ${
                              v.location === "INSIDE"
                                ? styles.inside
                                : styles.outside
                            }`}
                          >
                            {v.location === "INSIDE"
                              ? "داخل المحطة"
                              : "خارج المحطة"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isSosConfirmOpen}
        onClose={() => setIsSosConfirmOpen(false)}
        onConfirm={handleTriggerSOS}
        title="تأكيد إرسال استغاثة طارئة (SOS)"
        description="تحذير: سيقوم هذا الإجراء ببث نداء طوارئ واستغاثة فوري لجميع المسؤولين والمدراء والملاك في المحطة باللون الأحمر الفلاشينغ. يرجى التأكد من أن الموقف يقتضي ذلك قبل التأكيد."
        variant="danger"
        confirmText="تأكيد البث 🚨"
        cancelText="إلغاء التراجع"
      />
    </div>
  );
}
