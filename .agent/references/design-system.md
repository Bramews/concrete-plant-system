# 📐 مرجع نظام التصميم (Design System Reference)

> يُقرأ فقط عند العمل على واجهات أو تصميم. لا يُقرأ في كل جلسة.

## الخطوط

| المستوى       | الخط           | الحجم      | الوزن    |
| ------------- | -------------- | ---------- | -------- |
| عناوين رئيسية | Cairo/Tajawal  | 24-32px    | 700-800  |
| عناوين أقسام  | Cairo/Tajawal  | 18-22px    | 600-700  |
| نصوص أساسية   | Cairo/Tajawal  | 14-16px    | 400-500  |
| جداول         | Cairo/Tajawal  | 13-14px    | 400      |
| توضيحية       | Cairo/Tajawal  | 12-13px    | 500 bold |
| كود/أرقام     | JetBrains Mono | حسب السياق | 400-500  |

**Typography Tokens في tailwind.config.ts:**
`.text-display` `.text-page-title` `.text-section-title` `.text-card-title` `.text-body` `.text-table` `.text-caption` `.text-helper`
⛔ ممنوع: `text-xs` · `text-[10px]` · `font-light` · أي كلاس عشوائي للخطوط
✅ font-display: swap · ClearType & optimizeLegibility مقفل في globals.css — ممنوع العبث به

## الألوان

⛔ ممنوع: ألوان مسطحة خام (أحمر/أزرق/أخضر صلب)
✅ المطلوب: HSL مع تدرجات · `text-muted-foreground` (Slate 300) للنصوص الثانوية

| الحالة   | التطبيق                    |
| -------- | -------------------------- |
| Default  | لون أساسي 100%             |
| Hover    | +10% سطوع أو تدرج خفيف     |
| Active   | scale(0.97) + لون أعمق 15% |
| Disabled | شفافية 40% + not-allowed   |
| Focus    | focus ring 2px offset      |
| Error    | لون خطأ + خلفية خفيفة      |
| Loading  | skeleton أو spinner متناسق |

## الحركات

✅ transition: 150-300ms ease-in-out · translateY(-2px) hover · opacity entrance · scale(0.97) active · skeleton loading
⛔ ممنوع: animations > 500ms · rotate/flip عشوائي · حركة بلا غرض

## الأيقونات

**الأولوية:** Lucide → Heroicons → Phosphor → Tabler (كلها مجانية)
⛔ ممنوع emoji/unicode خام
✅ حدد: اسم + مكتبة + حجم (16/20/24px) + لون · scaleX(-1) للسهام بـ RTL

## المسافات (8px Grid)

xs:4px · sm:8px · md:16px · lg:24px · xl:32px · 2xl:48px

## الزوايا (Border Radius)

أزرار صغيرة:6-8px · أزرار كبيرة/كروت:10-12px · كروت رئيسية:12-16px · Modal:16-20px · Pills:9999px

## RTL و Bidi

⛔ ممنوع dir="ltr" على div/span/p — يكسر Flex/Grid
✅ استخدم `<BidiText>` لعزل نصوص لاتينية/أرقام/تواريخ
✅ dir="ltr" مسموح فقط على: `<input>` أرقام/تواريخ · `<pre>` للـ Logs

## فلسفة التصميم

- كل واجهة تتنفس وتتحرك — تبدو كـ SaaS عالمي
- ابتعد عن الألوان المسطحة — استخدم تدرجات وعمق بصري
- واجهة جافة أو باردة = رفض فوري
