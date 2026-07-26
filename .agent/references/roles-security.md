# 🔐 مرجع الصلاحيات والأمان (Security & Roles Reference)

> يُقرأ فقط عند العمل على الصلاحيات أو الأمان أو Server Actions. لا يُقرأ في كل جلسة.

## سيادة مالك النظام (SYSTEM_OWNER)

- ⛔ ممنوع تعديل أي شيء يخص مالك النظام (`ahmed@concrete.com` / `SYSTEM_OWNER`) بدون أمر صريح
- ✅ كل ميزة/صلاحية متاحة لمالك النظام بشكل كامل وغير مقيد
- ⛔ ممنوع إفشاء تفاصيل الصلاحيات السيادية لمستخدم عادي

## فصل الأنظمة

- ⛔ MANAGER ممنوع من مسارات `app/system/sales/*`
- ✅ مسارات المبيعات مقصورة على: SALES · SALES_REP · SALES_MANAGER
- كل نظام مستقل ومقيد بصلاحياته — ممنوع التداخل

## Server Actions

- كل Action يبدأ بـ `requireRole([...])` أو `getCurrentUser()` مع فحص الدور
- كل `requireRole` داخل try-catch — ممنوع خارجه (Zero Crash Policy)
- عند فشل المصادقة: يُرجع `{ success: false, error: "NOT_AUTHENTICATED" }` → redirect إلى `/api/auth/session-cleanup`
- توقع الحالة الأسوأ: جلسة منتهية + قاعدة بيانات فارغة = الواجهة تبقى متماسكة

## دورة الطلبيات

- موافقة المدير → SUBMITTED (لا فاتورة)
- موافقة المختبر → LAB_APPROVED + فاتورة تلقائية
- التسعير: `(سعر خرسانة + بامب + كادر + بنود إضافية JSON) * حجم الطلبية`
- حساب المبلغ داخل Prisma Transaction واحدة

## حماية الإعدادات

- ⛔ ممنوع تعديل package.json أو ملفات التكوين بدون فحص Diff دقيق
- ⛔ ممنوع إعادة تفعيل scripts ألغاها المستخدم (مثل predev/prebuild)
