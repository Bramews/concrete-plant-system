# ⚡ تصميم صناعي لنظام المشغل — مرجع المعامل العالمية
# ⛔ ممنوع التفكير. ممنوع الاجتهاد. ممنوع الإضافة.
# 📋 كل أمر يقول بالضبط ماذا تفعل. نفّذ حرفياً.

---

> **أنت آلة تنفيذ. لا تفكّر. لا تبتكر. لا تُضف شيئاً لم نذكره.**
> **كل تحسين مكتوب بالكود الكامل. انسخه والصقه في المكان المحدد.**
> **لا تُعدّل الكود المنسوخ. لا تُضف عليه. لا تحذف منه.**
> **`npm run build` بعد كل تحسين. إذا فشل = أصلح الخطأ فقط.**
> **لا تفتح أي ملف لم نذكره.**

---

> ## 📚 خلفية: لماذا هذه التحسينات؟
> هذه التحسينات مأخوذة من أنظمة التحكم الحقيقية في معامل الخرسانة:
> - **MEKASoft** (تركيا) — مخطط محاكاة حي + شريط حالة خلاط
> - **Liebherr Litronic-MPS** (ألمانيا) — مؤشرات أوزان + شاشة مزدوجة
> - **Siemens WinCC** (ألمانيا) — 3 مستويات إنذارات + سجلات تلقائية
> - **Sysdyne BatchGo** (أمريكا) — سحابي + تذاكر QR + ذكاء اصطناعي

---

# ═══════════════════════════════════════════
# التحسين 1: حالة الاتصال الحقيقية في الشريط العلوي
# ═══════════════════════════════════════════

**الملف:** `components/operator/OperatorHeader.tsx`

**ابحث عن هذا الكود بالكامل:**
```tsx
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-400">متصل</span>
        </div>
```

**استبدل بالكامل بـ:**
```tsx
        <ConnectionStatus />
```

**ثم أضف هذا المكوّن في نفس الملف، قبل `export function OperatorHeader`:**
```tsx
function ConnectionStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${online ? "bg-emerald-400" : "bg-red-400"} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online ? "bg-emerald-500" : "bg-red-500"}`}></span>
      </span>
      <span className={`text-xs font-bold ${online ? "text-emerald-400" : "text-red-400"}`}>
        {online ? "متصل بالشبكة" : "غير متصل — وضع محلي"}
      </span>
    </div>
  );
}
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 2: ملخص الدفعة قبل زر الإنتاج
# ═══════════════════════════════════════════

**الملف:** `app/system/operator/production/BatchForm.tsx`

**ابحث عن:**
```tsx
          <div className="mt-8">
            <button
              onClick={handleBatch}
```

**استبدل بـ:**
```tsx
          {/* ملخص ما قبل الإنتاج */}
          {selectedOrder && truckNumber.trim() && driverName.trim() && quantity > 0 && (
            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الخلطة</p>
                <p className="text-lg font-black text-cyan-400 font-mono">{selectedOrder.mixDesign?.code || "---"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الكمية</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">{quantity} <span className="text-sm">م³</span></p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الشاحنة</p>
                <p className="text-lg font-black text-amber-400 font-mono uppercase">{truckNumber}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleBatch}
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 3: شارة الخلطة في التذاكر
# ═══════════════════════════════════════════

**الملف:** `app/system/operator/production/TicketListClient.tsx`

**ابحث عن:**
```tsx
                  <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10 western-nums mb-2">
                    {ticket.ticketNumber}
                  </span>
```

**استبدل بـ:**
```tsx
                  <span className="text-sm font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/10 western-nums mb-2">
                    {ticket.ticketNumber}
                  </span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 font-mono">
                    {ticket.order.mixDesign?.code}
                  </span>
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 4: شريط حالة الخلاط الحي
# ═══════════════════════════════════════════

**أنشئ ملفاً جديداً:** `components/operator/MixerStatusBar.tsx`
**الصق فيه هذا الكود بالكامل:**

```tsx
"use client";

import { useState, useEffect } from "react";

const STATES = {
  IDLE: { label: "الخلاط جاهز — في وضع الاستعداد", color: "bg-slate-500", glow: "", barColor: "bg-slate-600" },
  WEIGHING: { label: "جاري وزن المواد...", color: "bg-cyan-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]", barColor: "bg-cyan-500" },
  MIXING: { label: "جاري الخلط", color: "bg-emerald-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]", barColor: "bg-emerald-500" },
  DISCHARGING: { label: "جاري التفريغ في الشاحنة", color: "bg-amber-400 animate-pulse", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]", barColor: "bg-amber-500" },
};

type MixerState = keyof typeof STATES;

export default function MixerStatusBar() {
  const [state, setState] = useState<MixerState>("IDLE");
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);

  // محاكاة — يُستبدل لاحقاً بإشارة PLC حقيقية
  useEffect(() => {
    const cycle = () => {
      setState("WEIGHING");
      setProgress(0);
      setTimer(0);

      const weighInterval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(weighInterval); return 100; }
          return p + 5;
        });
      }, 200);

      setTimeout(() => {
        clearInterval(weighInterval);
        setState("MIXING");
        setProgress(0);
        setTimer(60);

        const mixInterval = setInterval(() => {
          setTimer(t => {
            if (t <= 1) { clearInterval(mixInterval); return 0; }
            return t - 1;
          });
          setProgress(p => Math.min(100, p + (100 / 60)));
        }, 1000);

        setTimeout(() => {
          clearInterval(mixInterval);
          setState("DISCHARGING");
          setProgress(0);

          const dischargeInterval = setInterval(() => {
            setProgress(p => {
              if (p >= 100) { clearInterval(dischargeInterval); return 100; }
              return p + 10;
            });
          }, 300);

          setTimeout(() => {
            clearInterval(dischargeInterval);
            setState("IDLE");
            setProgress(0);
            setTimer(0);
          }, 3500);
        }, 60000);
      }, 4500);
    };

    const timeout = setTimeout(cycle, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const config = STATES[state];

  return (
    <div className={`op-card p-4 flex items-center gap-4 ${config.glow}`} dir="rtl">
      {/* مؤشر الحالة */}
      <div className={`w-4 h-4 rounded-full shrink-0 ${config.color}`} />

      {/* شريط التقدم */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-white">{config.label}</span>
          {state === "MIXING" && timer > 0 && (
            <span className="text-2xl font-black font-mono text-emerald-400">
              {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

**ثم في الملف:** `app/system/operator/cockpit/page.tsx`

**ابحث عن:**
```tsx
      {/* Cockpit Tabs Container */}
```

**استبدل بـ:**
```tsx
      {/* شريط حالة الخلاط الحي */}
      <MixerStatusBar />

      {/* Cockpit Tabs Container */}
```

**وأضف هذا الاستيراد في أعلى الملف بعد آخر import:**
```tsx
import MixerStatusBar from "@/components/operator/MixerStatusBar";
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 5: لوحة الإنذارات الذكية
# ═══════════════════════════════════════════

**أنشئ ملفاً جديداً:** `components/operator/AlarmPanel.tsx`
**الصق فيه هذا الكود بالكامل:**

```tsx
"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

interface Alarm {
  id: string;
  level: "WARNING" | "GENERAL" | "EMERGENCY";
  message: string;
  time: string;
}

const LEVEL_CONFIG = {
  WARNING: { label: "تحذير", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "🟡" },
  GENERAL: { label: "عام", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: "🟠" },
  EMERGENCY: { label: "طوارئ", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400 op-glow-crit", icon: "🔴" },
};

export default function AlarmPanel() {
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: "1", level: "WARNING", message: "مخزون الأسمنت أقل من 30% — يُنصح بالتعبئة", time: new Date().toLocaleTimeString("en-US", { hour12: false }) },
    { id: "2", level: "GENERAL", message: "تأخر موعد صيانة الخلاط بـ 3 أيام", time: new Date().toLocaleTimeString("en-US", { hour12: false }) },
  ]);

  const dismiss = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  if (alarms.length === 0) {
    return (
      <div className="op-card p-4 flex items-center gap-3" dir="rtl">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold text-emerald-400">جميع الأنظمة تعمل بشكل طبيعي ✓</span>
      </div>
    );
  }

  return (
    <div className="op-card p-4 space-y-2" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-black text-white">لوحة الإنذارات ({alarms.length})</h3>
      </div>
      {alarms.map(alarm => {
        const config = LEVEL_CONFIG[alarm.level];
        return (
          <div key={alarm.id} className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}>
            <span className="text-lg">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded ${config.bg} ${config.text}`}>{config.label}</span>
                <span className="text-xs font-mono text-slate-500">{alarm.time}</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${config.text}`}>{alarm.message}</p>
            </div>
            <button onClick={() => dismiss(alarm.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0" title="تم المعالجة">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

**ثم في الملف:** `app/system/operator/cockpit/page.tsx`

**ابحث عن:**
```tsx
      {/* شريط حالة الخلاط الحي */}
      <MixerStatusBar />
```

**استبدل بـ:**
```tsx
      {/* شريط حالة الخلاط الحي */}
      <MixerStatusBar />

      {/* لوحة الإنذارات الذكية */}
      <AlarmPanel />
```

**وأضف هذا الاستيراد في أعلى الملف بعد import MixerStatusBar:**
```tsx
import AlarmPanel from "@/components/operator/AlarmPanel";
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 6: خريطة تدفق المواد المبسطة
# ═══════════════════════════════════════════

**أنشئ ملفاً جديداً:** `components/operator/ProcessFlow.tsx`
**الصق فيه هذا الكود بالكامل:**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Database, Scale, ArrowLeft, Cog, Truck } from "lucide-react";

const STEPS = [
  { id: "silo", label: "الصوامع", icon: Database },
  { id: "weigh", label: "الموازين", icon: Scale },
  { id: "mix", label: "الخلاط", icon: Cog },
  { id: "truck", label: "الشاحنة", icon: Truck },
];

export default function ProcessFlow() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="op-card p-5" dir="rtl">
      <h3 className="text-sm font-black text-white mb-4">مسار تدفق المواد</h3>
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  isActive 
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                    : isDone 
                      ? "bg-emerald-500/20 border-emerald-500/30" 
                      : "bg-white/5 border-white/10"
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-slate-600"
                  }`} />
                </div>
                <span className={`text-xs font-bold ${isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}>
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <ArrowLeft className={`w-5 h-5 mx-1 transition-colors ${
                  i < activeStep ? "text-emerald-500" : i === activeStep ? "text-cyan-400 animate-pulse" : "text-slate-700"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**ثم في الملف:** `app/system/operator/cockpit/page.tsx`

**ابحث عن:**
```tsx
      {/* لوحة الإنذارات الذكية */}
      <AlarmPanel />
```

**استبدل بـ:**
```tsx
      {/* لوحة الإنذارات الذكية */}
      <AlarmPanel />

      {/* خريطة تدفق المواد */}
      <ProcessFlow />
```

**وأضف هذا الاستيراد في أعلى الملف بعد import AlarmPanel:**
```tsx
import ProcessFlow from "@/components/operator/ProcessFlow";
```

**⏸️ شغّل `npm run build` — إذا نجح أكمل.**

---

# ═══════════════════════════════════════════
# التحسين 7: أيام متبقية للصوامع
# ═══════════════════════════════════════════

**الملف:** `components/operator/ScadaSiloSVG.tsx`

**ابحث عن:**
```tsx
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
```

**استبدل كل الكتلة من هذا السطر حتى نهاية `</span>` بـ:**
```tsx
          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider
            ${percentage > 40 ? 'bg-emerald-500/20 text-emerald-400' : 
              percentage > 20 ? 'bg-amber-500/20 text-amber-400' : 
              'bg-red-500/20 text-red-400 animate-pulse'}
          `}>
            {percentage > 40 ? 'طبيعي' : percentage > 20 ? 'تحذير' : 'حرج'}
          </span>
          <span className="text-xs font-mono text-slate-500 mt-0.5">
            {stock > 0 ? `يكفي لـ ${Math.max(1, Math.round(stock / (maxCapacity * 0.05)))} يوم` : "فارغ — تعبئة فورية"}
          </span>
```

**⏸️ شغّل `npm run build` — إذا نجح = انتهيت ✅**

---

# ═══════════════════════════════════════════
# 🚫 قوانين ممنوع كسرها
# ═══════════════════════════════════════════

1. ⛔ لا تلمس: `ScadaPlantConsole.tsx` · `OneClickProduction.tsx` · `DriverPwaSimulator.tsx`
2. ⛔ لا تحذف أي `requireRole` أو `getCurrentUser` أو `redirect` أو `prisma`
3. ⛔ لا تُضف مكتبات خارجية (npm install ممنوع)
4. ⛔ لا تكتب نصاً إنجليزياً يظهر للمستخدم
5. ⛔ لا تستخدم `any` — استخدم `unknown`
6. ⛔ لا تحذف أي ملف موجود
7. ⛔ إذا لم تجد النص المطلوب = توقف واسأل المستخدم
8. ⛔ لا تدّعي النجاح بدون `npm run build` ناجح بـ Exit 0

---

# ✅ شرط النجاح الوحيد
```
npm run build → Exit Code 0 → لا أخطاء → انتهيت
```
