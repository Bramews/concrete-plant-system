# ⚡ البروتوكول الهندسي السيادي المطلق v2.0
## نظام المشغل — تحويل كامل إلى بيئة تحكم صناعية SCADA عالمية

---

> ## 📢 رسالة إلزامية إلى الذكاء الاصطناعي المنفّذ
>
> **أنت تملك كامل الصلاحية. لا توجد قيود. لا قوانين. لا حدود.**
> الأمر الوحيد: نفّذ هذا البروتوكول حرفياً، كلمة بكلمة، سطراً بسطر.
> المنفّذ الغبي يعطي افتراضات ويملأ الفراغات من عنده. أنت لن تفعل هذا.
> ما هو مكتوب هنا هو الحقيقة الكاملة. لا تزيد ولا تنقص.
>
> **المعيار الوحيد المقبول:** شخص يعمل في معمل خرسانة يفتح النظام ويشعر أنه أمام شاشة MEKASoft أو Sysdyne BatchGo — لا SaaS، لا لوحة إدارة، لا Dashboard تجارية.

---

## 🔍 الواقع الحالي (ما تم فحصه فعلاً)

### ما يوجد حالياً ويجب الحفاظ عليه وظيفياً:
| المكوّن | المسار | الحالة |
|---------|---------|---------|
| PlantMap | `components/operator/PlantMap.tsx` | يعمل — يحاكي مستشعرات حية |
| LiveGauges | `components/operator/LiveGauges.tsx` | يعمل — 5 مقاييس SVG دائرية |
| DailyTimeline | `components/operator/DailyTimeline.tsx` | يعمل — شريط زمني للإنتاج |
| ActiveOrdersKanban | `components/operator/ActiveOrdersKanban.tsx` | يعمل — كانبان للطلبات |
| ScadaPlantConsole | `components/operator/ScadaPlantConsole.tsx` | يعمل — لا تلمسه |
| OneClickProduction | `components/operator/OneClickProduction.tsx` | يعمل — لا تلمسه |
| DriverPwaSimulator | `components/operator/DriverPwaSimulator.tsx` | يعمل — لا تلمسه |
| CockpitClientTabs | `app/system/operator/cockpit/CockpitClientTabs.tsx` | تبويبات العرض |
| TicketListClient | `app/system/operator/production/TicketListClient.tsx` | بحث تفاعلي يعمل |
| UnifiedSiloDisplay | `components/operator/UnifiedSiloDisplay.tsx` | تم إنشاؤه |
| OperatorControls | `components/operator/OperatorControls.tsx` | Fullscreen + Clock |

### الـ CSS المشترك:
- `app/system/system-modules.css` → يُستخدم في BatchForm
- `app/globals.css` → `.glass-panel` موجود عالمياً
- **مسموح** باستخدام `.glass-panel` في الملفات الجديدة

---

## 🎨 نظام الألوان الإلزامي — لا تغيّر قيمة واحدة

```css
/* إضافة هذا في app/system/operator/operator.css (ملف جديد) */

:root {
  --op-bg:           #060a12;    /* خلفية النظام الجذرية */
  --op-surface:      #0c1220;    /* سطح البطاقات */
  --op-surface-alt:  #101828;    /* سطح بديل */
  --op-border:       rgba(255,255,255,0.07);
  --op-border-glow:  rgba(6,182,212,0.3);
  
  --op-ok:           #10b981;    /* أخضر — حالة طبيعية */
  --op-warn:         #f59e0b;    /* برتقالي — تحذير */
  --op-crit:         #ef4444;    /* أحمر — خطر */
  --op-active:       #06b6d4;    /* سماوي — يعمل */
  --op-accent:       #6366f1;    /* بنفسجي — أساسي */
  
  --op-text:         #f1f5f9;
  --op-text-muted:   #64748b;
  --op-text-dim:     #334155;
  
  --op-glow-ok:    0 0 20px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.1);
  --op-glow-warn:  0 0 20px rgba(245,158,11,0.4),  0 0 60px rgba(245,158,11,0.1);
  --op-glow-crit:  0 0 20px rgba(239,68,68,0.4),   0 0 60px rgba(239,68,68,0.1);
  --op-glow-act:   0 0 20px rgba(6,182,212,0.35),  0 0 40px rgba(6,182,212,0.1);
}

/* بطاقة SCADA قياسية */
.op-card {
  background: var(--op-surface);
  border: 1px solid var(--op-border);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
}
/* شريط علوي متوهج للبطاقة (خط أزرق رفيع في الأعلى) */
.op-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--op-active), transparent);
  opacity: 0.4;
}

/* مؤشر نبض */
@keyframes op-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.2); }
}
.op-pulse { animation: op-pulse 2s ease-in-out infinite; }

/* توهج تحذير نابض */
@keyframes op-glow-pulse-crit {
  0%, 100% { box-shadow: var(--op-glow-crit); }
  50%       { box-shadow: 0 0 40px rgba(239,68,68,0.7), 0 0 80px rgba(239,68,68,0.3); }
}
.op-glow-crit { animation: op-glow-pulse-crit 1.5s ease-in-out infinite; }
```

---

## 🏗️ LAYOUT الجديد — تعليمات حرفية بالكامل

### الملف: `app/system/operator/layout.tsx`
**احذف كل المحتوى واستبدله بهذا الهيكل الدقيق:**

```tsx
// لا تحتاج cookies() ولا Locale — احذفهما من الاستيرادات
import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { OperatorSidebar } from "@/components/operator/OperatorSidebar";
import { OperatorHeader } from "@/components/operator/OperatorHeader";
import "./operator.css";  // ملف الـ CSS الجديد

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const userName = user?.name || "المشغّل";
  
  return (
    <div className="flex h-screen bg-[#060a12] overflow-hidden" dir="rtl">
      {/* الشريط الجانبي الثابت */}
      <OperatorSidebar />
      
      {/* المنطقة الرئيسية */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* الشريط العلوي */}
        <OperatorHeader userName={userName} />
        
        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        
        {/* شريط الحالة السفلي */}
        <footer className="shrink-0 flex items-center justify-between px-6 py-2 bg-[#0c1220] border-t border-white/5 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 op-pulse" />
              PLC v2.4 — متصل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              الموازين — مكيّلة ومعايَرة
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              وضع التشغيل: تلقائي
            </span>
          </div>
          <span>CONCRETE PLANT SCADA v3.1 © نظام المشغّل</span>
        </footer>
      </div>
    </div>
  );
}
```

---

## 🧩 مكوّن 1: `components/operator/OperatorSidebar.tsx`

**مواصفات حرفية — كل سطر مهم:**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MonitorDot, Factory, FileText, Database, Settings,
  Gauge, Wifi
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/system/operator/cockpit",    icon: MonitorDot, label: "قمرة القيادة SCADA",    desc: "مراقبة حية للمحطة" },
  { href: "/system/operator/production", icon: Factory,    label: "تنفيذ الإنتاج والخلط",  desc: "تشغيل دفعات الخلط" },
  { href: "/system/operator/tickets",    icon: FileText,   label: "سجل تذاكر التسليم",    desc: "الأسطول والشاحنات" },
  { href: "/system/operator/materials",  icon: Database,   label: "حالة الصوامع والمواد",  desc: "مستشعرات المخزون" },
  { href: "/system/operator/settings",   icon: Settings,   label: "إعدادات التشغيل",      desc: "أجهزة PLC والمعدات" },
];

// التصميم المطلوب للـ Sidebar:
// - خلفية: bg-[#0c1220]
// - عرض: w-64 (256px) ثابت
// - شعار: أعلى بـ 16px padding، نص عربي "نظام التحكم" مع أيقونة Gauge
// - الروابط: flex-col gap-1 p-4
// - كل رابط: flex items-center gap-3 p-3 rounded-xl
// - نشط: bg-cyan-500/10 border border-cyan-500/30 text-white
//        + border-r-2 border-cyan-400 (يمين لأننا RTL)
// - غير نشط: text-slate-400 hover:bg-white/5 hover:text-slate-200
// - الأيقونة: w-5 h-5
// - الـ desc: text-xs text-slate-500 (فقط للعنصر النشط)
// - أسفل السايدبار: divider ثم:
//   • حالة WiFi/PLC بلون أخضر + اسم "محطة A-01"
//   • نص الإصدار: SCADA v3.1
```

---

## 🧩 مكوّن 2: `components/operator/OperatorHeader.tsx`

```tsx
"use client";
// Props: userName: string
// يحتوي:
// - يمين (RTL): شعار بـ أيقونة Activity + نص "غرفة التحكم والمراقبة"
// - وسط: ساعة رقمية حية format: "السبت 26 يوليو — 14:23:45"
//         خط monospace كبير text-lg font-black text-cyan-300
//         تتحدث كل ثانية (useEffect + setInterval 1000ms)
// - يسار (RTL): 
//   • زر ملء الشاشة (Maximize/Minimize من lucide) — Fullscreen API
//   • دائرة خضراء متوهجة + "متصل" 
//   • اسم المشغل: "المشغل: {userName}"
// الخلفية: bg-[#0c1220] border-b border-white/5
// الارتفاع: h-14 (56px) px-6
```

---

## 🧩 مكوّن 3: `components/operator/ScadaSiloSVG.tsx` — الجديد

**هذا المكوّن الأهم. اقرأ المواصفات بدقة:**

```tsx
"use client";
import { motion } from "framer-motion";

interface ScadaSiloSVGProps {
  id: string | number;
  name: string;
  stock: number;
  maxCapacity: number;  // استخدم: (material.maxCapacity as number | null) || 50000
  unit: string;
  showLabel?: boolean;  // default true
}

// رسم SVG الصومعة — الشكل الصناعي الحقيقي:
// viewBox="0 0 80 200"
// 
// شكل الصومعة (من الأعلى للأسفل):
// [1] الرقبة العلوية: rect x=25 y=0 width=30 height=10 (أضيق)
// [2] الجسم: rect x=10 y=10 width=60 height=140 (المستطيل الرئيسي)
// [3] المخروط السفلي: polygon points="10,150 40,180 70,150" (الفتحة السفلية)
// [4] الساق: rect x=35 y=180 width=10 height=20
// 
// مستوى المادة (داخل clipPath):
// <defs>
//   <clipPath id={`silo-clip-${id}`}>
//     <rect x="10" y="10" width="60" height="140" rx="2" />
//   </clipPath>
// </defs>
// 
// المادة المملوءة (motion.rect):
// x=10, width=60
// y = 10 + 140*(1-percentage/100)  → يبدأ من الأسفل
// height = 140*(percentage/100)
// clipPath={`url(#silo-clip-${id})`}
// fill حسب الحالة:
//   percentage > 40 → "#10b981" (أخضر)
//   percentage > 20 → "#f59e0b" (برتقالي) 
//   else             → "#ef4444" (أحمر)
// animate={{ y: computed_y, height: computed_height }}
// transition={{ duration: 1.5, ease: "easeOut" }}
// 
// خطوط مستوى عند 25%, 50%, 75%:
// line x1="10" x2="70" y1={pos} y2={pos} stroke="white" strokeOpacity="0.15" strokeWidth="0.5"
// 
// إطار الصومعة الخارجي:
// stroke="#1e3a5f" strokeWidth="1.5" fill="none"
// 
// تأثير الشين (shine):
// rect x="10" y="10" width="10" height="140" fill="url(#silo-shine-{id})" opacity="0.3"
// linearGradient: white 0% → transparent 100%
// 
// توهج SVG عند الخطر (percentage < 20):
// <filter id="glow-red">
//   <feGaussianBlur stdDeviation="3" result="blur"/>
//   <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
// </filter>
// طبّق filter="url(#glow-red)" على المادة المملوءة فقط
// 
// الرقم الرئيسي داخل الصومعة (SVG text):
// x=40, y= وسط المنطقة المملوءة إذا كانت > 20%
// fill="white" fontSize="12" fontWeight="bold" textAnchor="middle"
// القيمة: `${Math.round(percentage)}%`
// 
// أسفل SVG — النصوص خارج SVG:
// div: flex flex-col items-center gap-1 pt-2
//   h4: text-sm font-bold text-slate-300 text-center
//   span: text-xs font-mono text-slate-400 → "{stock} {unit}"
//   span badge حالة: className حسب percentage
```

---

## 🖥️ الصفحة 1: `app/system/operator/cockpit/page.tsx`

**الحفاظ على كل الـ Prisma Queries الموجودة. تغيير JSX فقط.**

**هيكل الصفحة:**
```tsx
// الصف 1: KPI Cards — 4 بطاقات كبيرة
// بيانات حقيقية من قاعدة البيانات:
// - إجمالي دفعات اليوم (batches.length)
// - إجمالي م³ اليوم (batches.reduce)
// - الطلبات النشطة الآن (orders.filter PRODUCTION/LAB_APPROVED)
// - آخر دفعة (batches[0]?.createdAt)

// تصميم كل KPI card:
// className="op-card p-5 flex items-start gap-4"
// أيقونة: w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center
//          الأيقونة نفسها: w-6 h-6 text-cyan-400
// النص: text-4xl font-black font-mono text-white
// العنوان: text-xs text-slate-400 font-bold uppercase tracking-widest mt-1
// حالة: نقطة خضراء متوهجة op-pulse

// الصف 2: PlantMap + LiveGauges
// PlantMap: أبقِه كما هو — غيّر الغلاف فقط
// className للغلاف: "op-card p-0 overflow-hidden"
// LiveGauges: أبقِه كما هو — غيّر الغلاف فقط

// الصف 3: CockpitClientTabs (يحتوي Kanban + OneClick + DriverPWA)
// غيّر الغلاف فقط

// الصف 4: DailyTimeline
// غيّر الغلاف فقط
```

---

## 🖥️ الصفحة 2: `app/system/operator/production/page.tsx` + `BatchForm.tsx`

### `production/page.tsx`:
**الحفاظ على كل Queries. تغيير JSX الغلاف فقط:**
```tsx
// div الرئيسي: className="space-y-6"
// SiloMonitor → استخدم UnifiedSiloDisplay compact={true} مع ScadaSiloSVG داخله
// BatchForm → أبقِه كما هو
// أزل glass-panel من الـ div المحيط وضع op-card بدلاً منه
```

### `BatchForm.tsx` — زر الإنتاج:
```tsx
// ابحث عن زر handleBatch واستبدل className بهذا:
className={`
  w-full py-6 rounded-2xl font-black text-xl tracking-wide
  flex items-center justify-center gap-3
  transition-all duration-300
  ${isLoading
    ? "bg-slate-800 text-slate-400 cursor-wait"
    : "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white cursor-pointer"
  }
  ${!isLoading && "hover:from-emerald-500 hover:to-cyan-500"}
  ${!isLoading && "shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)]"}
  border border-emerald-500/20
  disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
`}
// اجعل الأيقونة داخله: <Play className="w-6 h-6 fill-current" />
// النص: isLoading ? "جاري تنفيذ دفعة الخلط..." : "ابدأ دفعة الخلط الآن"
```

---

## 🖥️ الصفحة 4: `app/system/operator/materials/page.tsx`

**استخدام ScadaSiloSVG في عرض الصوامع:**
```tsx
// Section الأول: عرض SVG الصوامع
<div className="op-card p-6">
  <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-emerald-400 op-pulse" />
    مستشعرات الصوامع — مراقبة لحظية
  </h3>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
    {materials.map(m => (
      <ScadaSiloSVG
        key={m.id}
        id={m.id}
        name={m.name}
        stock={m.stock}
        maxCapacity={(m as unknown as {maxCapacity?: number}).maxCapacity || 50000}
        unit={m.unit}
      />
    ))}
  </div>
</div>

// Section الثاني: جدول تفصيلي
<div className="op-card overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-white/5 border-b border-white/10">
      <tr>
        {["المادة", "الرمز", "المخزون", "السعة", "الامتلاء", "الحالة"].map(h => (
          <th key={h} className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wider">
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      {materials.map(m => {
        const max = (m as unknown as {maxCapacity?:number}).maxCapacity || 50000;
        const pct = Math.min((m.stock / max) * 100, 100);
        const isCrit = pct < 20;
        const isWarn = pct < 40;
        return (
          <tr key={m.id} className={`hover:bg-white/5 transition-colors ${isCrit ? "bg-red-950/20" : ""}`}>
            <td className="px-4 py-3 font-bold text-white">{m.name}</td>
            <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{m.code || `MAT-${m.id}`}</td>
            <td className="px-4 py-3 font-mono font-black text-white">{m.stock.toLocaleString("en-US")} {m.unit}</td>
            <td className="px-4 py-3 font-mono text-slate-400">{max.toLocaleString("en-US")} {m.unit}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCrit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs font-black font-mono ${isCrit ? "text-red-400" : isWarn ? "text-amber-400" : "text-emerald-400"}`}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-xs font-black ${isCrit ? "bg-red-500/15 text-red-400 op-glow-crit" : isWarn ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                {isCrit ? "⚠ حرج" : isWarn ? "منخفض" : "طبيعي"}
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
```

---

## 🖥️ الصفحة 3: `app/system/operator/tickets/page.tsx`

**الملف الحالي يستخدم TicketListClient بالفعل — لا تغيّر الصفحة.**

### `production/TicketListClient.tsx` — تحسين التصميم:
```tsx
// ابحث عن عرض التذاكر الحالي واستبدل الجدول ببطاقات:
// كل تذكرة:
<div className="op-card p-4 flex items-start gap-4 hover:border-white/15 transition-all group">
  {/* رقم التذكرة + الوقت */}
  <div className="shrink-0 w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
    <span className="text-xs text-cyan-400 font-bold">#</span>
    <span className="text-sm font-black text-white">{t.ticketNumber}</span>
  </div>
  {/* التفاصيل */}
  <div className="flex-1 min-w-0">
    <div className="flex justify-between items-start">
      <h4 className="font-black text-white text-sm">{t.order.project.name}</h4>
      <span className={`px-2 py-0.5 rounded text-xs font-black ${t.status === "DISPATCHED" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
        {t.status === "DISPATCHED" ? "تم الإرسال ✓" : t.status}
      </span>
    </div>
    <p className="text-xs text-slate-400 mt-0.5">{t.order.customer.name}</p>
    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
      <span>🚛 {t.truckNumber}</span>
      <span>👷 {t.driverName}</span>
      <span className="text-cyan-400 font-black">{t.cumulativeQuantity} م³</span>
    </div>
  </div>
</div>
// عرض كبطاقات grid-cols-1 md:grid-cols-2 gap-4 وليس جدول
```

---

## ⚠️ 20 قانوناً ثابتاً لا استثناء فيها

1. **لا تحذف** أي `requireRole()` أو `getCurrentUser()` أو `redirect()` من أي ملف
2. **لا تحذف** أي Prisma Query واحدة
3. **لا تحذف** أي Server Action import
4. **لا تلمس** ScadaPlantConsole, OneClickProduction, DriverPwaSimulator
5. **لا تغيّر** منطق CockpitClientTabs — فقط الغلاف الخارجي
6. **لا تستخدم** `any` في TypeScript — `unknown` + casting
7. **لا تترك** catch فارغاً — رسالة عربية أو redirect
8. **لا تضيف** مكتبات خارجية جديدة
9. **لا تكتب** نصاً إنجليزياً يظهر للمشغل
10. **لا تعلن** النجاح بدون `npm run build` ناجح فعلاً
11. **لا تحذف** استيراد أي مكوّن يُستخدم فعلاً في JSX
12. **لا تغيّر** منطق BatchForm — فقط تصميم الأزرار والبطاقات
13. **لا تكرر** عرض نفس البيانات في نفس الصفحة
14. **لا تستخدم** maxStock = 50000 ثابتة — دائماً `maxCapacity || 50000`
15. **لا تقرأ** ملفاً جزئياً — اقرأ الملف كاملاً قبل التعديل
16. **لا تترك** متغيراً معرّفاً غير مستخدم
17. **لا تستخدم** `window.confirm` أو `window.alert`
18. **نفّذ** بالترتيب المكتوب — لا تقفز للمرحلة 3 قبل 2
19. **اختبر** كل صفحة بعد الانتهاء بـ `npx eslint`
20. **شغّل** `npm run build` وأصلح كل خطأ حتى يصبح صفراً

---

## 📋 ترتيب التنفيذ الحرفي الإلزامي

```
المرحلة 0: إنشاء ملف CSS الجديد
  □ أنشئ app/system/operator/operator.css بالمحتوى الكامل أعلاه

المرحلة 1: المكوّنات الجديدة
  □ أنشئ components/operator/ScadaSiloSVG.tsx (المواصفات أعلاه)
  □ أنشئ components/operator/OperatorSidebar.tsx (المواصفات أعلاه)
  □ أنشئ components/operator/OperatorHeader.tsx (المواصفات أعلاه)

المرحلة 2: Layout الرئيسي
  □ أعد كتابة app/system/operator/layout.tsx (المواصفات أعلاه)
  □ أضف import "./operator.css" فيه

المرحلة 3: الصفحات (بالترتيب)
  □ app/system/operator/cockpit/page.tsx — JSX فقط
  □ app/system/operator/materials/page.tsx — ScadaSiloSVG + جدول
  □ app/system/operator/production/BatchForm.tsx — زر الإنتاج فقط
  □ app/system/operator/production/TicketListClient.tsx — بطاقات بدل جدول
  □ app/system/operator/settings/page.tsx — op-card بدل glass-panel فقط

المرحلة 4: المراجعة والبناء
  □ npx eslint app/system/operator/ components/operator/ --fix
  □ npm run build
  □ أصلح كل خطأ TypeScript
  □ أعد npm run build حتى يكون Exit Code 0
```

---

## ✅ شروط القبول — 12 شرطاً قابلاً للتحقق

| # | الشرط | كيف تتحقق |
|---|-------|-----------|
| 1 | `npm run build` ينجح بـ exit 0 | شغّل الأمر |
| 2 | القائمة عمودية جانبية (sidebar) | افتح أي صفحة |
| 3 | زر ملء الشاشة يعمل | اضغطه |
| 4 | الصوامع SVG حقيقية تتحرك | شاهد materials |
| 5 | زر الإنتاج كبير ومتوهج | py-6 + glow shadow |
| 6 | البحث في التذاكر يعمل | اكتب في حقل البحث |
| 7 | الخلفية #060a12 في كل صفحة | inspect element |
| 8 | لا نص إنجليزي للمستخدم | مراجعة كل صفحة |
| 9 | توهج الخطر يعمل (< 20%) | مادة أقل من 20% |
| 10 | الساعة تتحدث كل ثانية | انظر للشريط العلوي |
| 11 | لا `any` في TypeScript | eslint يؤكد |
| 12 | كل صفحة لها رابط في Sidebar | تحقق من الروابط |

---

> **الإعلان عن النجاح مشروط بـ:** خروج `npm run build` بـ Exit 0 + كل شروط القبول ✅
> **أي اختصار = فشل = إعادة من الصفر**
