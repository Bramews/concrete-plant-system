# 🚨 أوامر إصلاح فوري — نظام المشغل
# ⛔ ممنوع التفكير. ممنوع الاجتهاد. ممنوع الإضافة.
# 📋 نفّذ الأمر حرفياً. انسخ والصق. لا أكثر.

---

> **أنت آلة نسخ ولصق. لا تفكّر. لا تبتكر. لا تُعدّل شيئاً لم نذكره.**
> **كل أمر يقول: اقرأ الملف → ابحث عن النص القديم → استبدله بالنص الجديد → تأكد.**
> **إذا لم تجد النص القديم بالضبط = توقف واسأل. لا تخترع حلاً.**
> **لا تفتح أي ملف لم نذكره. لا تُنشئ أي ملف لم نذكره.**
> **`npm run build` بعد كل مجموعة. إذا فشل = أصلح الخطأ فقط ولا تلمس شيئاً آخر.**

---

# ═══════════════════════════════════════════
# المجموعة 1: إصلاح النصوص الإنجليزية
# ═══════════════════════════════════════════

## الأمر 1.1
**الملف:** `components/operator/OperatorSidebar.tsx`
**ابحث عن:**
```
Operations Console
```
**استبدل بـ:**
```
وحدة التحكم الصناعي
```

## الأمر 1.2
**الملف:** `components/operator/OperatorSidebar.tsx`
**ابحث عن:**
```
قمرة القيادة SCADA
```
**استبدل بـ:**
```
قمرة القيادة والمراقبة
```

## الأمر 1.3
**الملف:** `components/operator/OperatorSidebar.tsx`
**ابحث عن:**
```
SCADA v3.1
```
**استبدل بـ:**
```
نظام التحكم — الإصدار 3.1
```

## الأمر 1.4
**الملف:** `app/system/operator/layout.tsx`
**ابحث عن:**
```
CONCRETE PLANT SCADA v3.1 © نظام المشغّل
```
**استبدل بـ:**
```
نظام المحطة الخرسانية — الإصدار 3.1 © نظام المشغّل
```

## الأمر 1.5
**الملف:** `app/system/operator/layout.tsx`
**ابحث عن:**
```
PLC v2.4 — متصل
```
**استبدل بـ:**
```
وحدة التحكم v2.4 — متصل
```

## الأمر 1.6
**الملف:** `app/system/operator/production/page.tsx`
**ابحث عن:**
```
MPa | {test.age} d
```
**استبدل بـ:**
```
ميغاباسكال | {test.age} يوم
```

## الأمر 1.7
**الملف:** `app/system/operator/production/BatchForm.tsx`
**ابحث عن:**
```
{selectedOrder.volume} m³
```
**استبدل بـ:**
```
{selectedOrder.volume} م³
```

## الأمر 1.8
**الملف:** `app/system/operator/production/BatchForm.tsx`
**ابحث عن:**
```
{lang === "ar" ? "وقت وصول الخلاط" : "Mixer ETA"}
```
**استبدل بـ:**
```
وقت وصول الخلاط
```

## ⏸️ نقطة تحقق
```
شغّل: npm run build
إذا نجح = أكمل المجموعة 2
إذا فشل = أصلح الخطأ المذكور في رسالة الفشل فقط
```

---

# ═══════════════════════════════════════════
# المجموعة 2: حذف الاستيرادات الميتة
# ═══════════════════════════════════════════

## الأمر 2.1
**الملف:** `components/operator/UnifiedSiloDisplay.tsx`
**ابحث عن السطر التالي واحذفه بالكامل:**
```
import { BidiText } from "@/components/ui/BidiText";
```
**يعني: احذف هذا السطر. لا تستبدله بشيء. احذفه.**

## الأمر 2.2
**الملف:** `app/system/operator/production/BatchForm.tsx`
**ابحث عن السطر التالي واحذفه بالكامل:**
```
import "../../system-modules.css";
```
**يعني: احذف هذا السطر. لا تستبدله بشيء. احذفه.**

## ⏸️ نقطة تحقق
```
شغّل: npm run build
إذا نجح = أكمل المجموعة 3
إذا فشل = أصلح الخطأ المذكور في رسالة الفشل فقط
```

---

# ═══════════════════════════════════════════
# المجموعة 3: إصلاح صفحة التذاكر
# ═══════════════════════════════════════════

## الأمر 3.1 — نقل CSS إلى ملف خارجي
**الملف:** `app/system/operator/operator.css`
**أضف في نهاية الملف (بعد آخر سطر) هذا الكود:**
```css
/* أنماط التذاكر */
.western-nums{font-family:"Inter",sans-serif!important;font-variant-numeric:tabular-nums lining-nums!important}
.custom-scrollbar::-webkit-scrollbar{width:6px}
.custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
```

## الأمر 3.2 — حذف حقن CSS الخطير
**الملف:** `app/system/operator/production/TicketListClient.tsx`
**ابحث عن هذا السطر واحذفه بالكامل:**
```
      <style dangerouslySetInnerHTML={{ __html: zStyles }} />
```
**يعني: احذف هذا السطر. لا تستبدله بشيء.**

## الأمر 3.3 — حذف متغير zStyles
**الملف:** `app/system/operator/production/TicketListClient.tsx`
**ابحث عن هذا الكود بالكامل واحذفه:**
```
const zStyles = `
  .z-root,.z-root *{box-sizing:border-box}
  .western-nums{font-family:"Inter",sans-serif!important;font-variant-numeric:tabular-nums lining-nums!important}
  .custom-scrollbar::-webkit-scrollbar{width:6px}
  .custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
  .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
  footer{display:none!important}
`;
```
**احذف كل هذه الأسطر. لا تستبدلها بشيء.**

## الأمر 3.4 — إصلاح div الجذر في التذاكر
**الملف:** `app/system/operator/production/TicketListClient.tsx`
**ابحث عن:**
```
      className="z-root min-h-screen bg-slate-950 text-slate-300 p-8 lg:p-12 overflow-y-auto custom-scrollbar"
```
**استبدل بـ:**
```
      className="space-y-6 custom-scrollbar"
```

## الأمر 3.5 — إصلاح حدود البطاقات المبالغ فيها
**الملف:** `app/system/operator/production/TicketListClient.tsx`
**ابحث عن كل** `rounded-[3.5rem]` **واستبدلها بـ** `rounded-2xl`
**ابحث عن كل** `rounded-[2.5rem]` **واستبدلها بـ** `rounded-xl`
**ابحث عن كل** `rounded-[5rem]` **واستبدلها بـ** `rounded-2xl`
**ابحث عن كل** `rounded-[2rem]` **واستبدلها بـ** `rounded-xl`

## ⏸️ نقطة تحقق
```
شغّل: npm run build
إذا نجح = أكمل المجموعة 4
إذا فشل = أصلح الخطأ المذكور في رسالة الفشل فقط
```

---

# ═══════════════════════════════════════════
# المجموعة 4: علامات على الملفات الميتة
# ═══════════════════════════════════════════

## الأمر 4.1
**الملف:** `app/system/operator/OperatorNav.tsx`
**ابحث عن:**
```
"use client";
```
**استبدل بـ:**
```
"use client";
// ⚠️ ملف غير مستخدم حالياً — تم استبداله بـ OperatorSidebar + OperatorHeader
```

## الأمر 4.2
**الملف:** `app/system/operator/production/ProductionFeed.tsx`
**ابحث عن:**
```
"use client";
```
**استبدل بـ:**
```
"use client";
// ⚠️ ملف غير مستخدم حالياً — يمكن دمجه مستقبلاً
```
**⚠️ انتبه: هذا الملف فقط. لا تُعدّل "use client" في أي ملف آخر.**

## الأمر 4.3
**الملف:** `app/system/operator/production/SiloMonitor.tsx`
**ابحث عن:**
```
"use client";
```
**استبدل بـ:**
```
"use client";
// ⚠️ غلاف بسيط حول UnifiedSiloDisplay — يمكن الاستغناء عنه
```
**⚠️ انتبه: هذا الملف فقط. لا تُعدّل "use client" في أي ملف آخر.**

## ⏸️ نقطة تحقق نهائية
```
شغّل: npm run build
إذا نجح بـ Exit 0 = انتهيت ✅
إذا فشل = أصلح الخطأ وأعد البناء
```

---

# ═══════════════════════════════════════════
# 🚫 قوانين ممنوع كسرها
# ═══════════════════════════════════════════

1. ⛔ لا تفتح أي ملف لم نذكره بالاسم أعلاه
2. ⛔ لا تُنشئ أي ملف جديد
3. ⛔ لا تحذف أي ملف
4. ⛔ لا تُعدّل أي كود غير النصوص المذكورة بالضبط أعلاه
5. ⛔ لا تُضف مكتبات
6. ⛔ لا تُغيّر أسماء ملفات أو مجلدات
7. ⛔ لا تلمس: `ScadaPlantConsole.tsx` · `OneClickProduction.tsx` · `DriverPwaSimulator.tsx`
8. ⛔ لا تحذف أي `requireRole` أو `getCurrentUser` أو `redirect` أو `prisma`
9. ⛔ إذا لم تجد النص القديم بالضبط = توقف واسأل المستخدم
10. ⛔ لا تدّعي النجاح بدون `npm run build` ناجح بـ Exit 0

---

# ✅ شرط النجاح الوحيد
```
npm run build → Exit Code 0 → لا أخطاء → انتهيت
```
