# 🎣 الفصل العاشر: إدارة الحالة، الـ Hooks، والـ APIs

## 1. الـ Hooks ومشاركة الحالة (State Sharing)
بما أن النظام يتطلب أداءً عالياً ولا يحتمل الـ "Prop Drilling" العميق في واجهة المشغل، هناك عدة أساليب متبعة:

### أ. Local State (`useState`)
تُستخدم بكثرة داخل كل مكون (مثال: `BatchForm` يدير حالة الحقول الخاصة به). هذا يمنع إعادة تصيير الشاشة بالكامل (Global Re-render) عند طباعة حرف واحد في حقل اسم السائق.

### ب. React Context API
يُفترض استخدامه لمشاركة حالة الـ PLC (الإنذارات العامة، حالة الاتصال بالشبكة، وتحديثات الموازين) بين `LiveGauges` و `ProcessFlow` و `MixerStatusBar` دون الحاجة لاستدعاء الخادم بشكل متكرر (لتجنب اختناق الشبكة - Network Bottleneck).

### ج. Polling vs WebSockets
حالياً في النسخة الحالية بعض المكونات تستخدم `useEffect` مع `setInterval` لعمل محاكاة (Simulation). 
**القرار المعماري القادم:** يجب تحويلها بالكامل إلى WebSockets (أو Server-Sent Events - SSE) لأن الـ Polling بفاصل زمني قصير جداً سيؤدي لإرهاق خادم Next.js ويستهلك الذاكرة.

## 2. مسارات البيانات (Data Fetching in Next.js)
النظام يعتمد بنسبة 90% على **Server Components**.
مثال من `app/system/operator/production/page.tsx`:
- يتم جلب `recentOrders` مباشرة من Prisma داخل الـ Server Component.
- تُمرر هذه المصفوفة كـ `props` إلى المكون العميل (Client Component) الذي هو `BatchForm`.
**السبب:** تقليل الـ JavaScript الذي يُرسل للمتصفح، وزيادة الأمان (بقاء كود الـ DB في الخادم)، وسرعة التحميل الأولى (First Contentful Paint).

## 3. العمليات الآمنة (Server Actions)
أي ضغطة زر خطيرة (مثل "بدء الإنتاج" أو "اعتماد خلطة") لا تستدعي API عبر `fetch`، بل تستخدم **Next.js Server Actions**.
- **الميزة:**
  - `Type-Safety` كامل من الزر حتى قاعدة البيانات.
  - لا حاجة لإنشاء مسار `api/batch/create` وصيانة ملفين منفصلين.
  - إمكانية قراءة الـ Cookies ومعرفة الـ `userId` و `companyId` بشكل موثوق غير قابل للاختراق.
- **التطبيق في `BatchForm`:** دالة `handleBatch` تستدعي Action للتحقق، وإذا نجحت، تستخدم `revalidatePath` لتحديث واجهة المستخدم (تحديث المخزون وقائمة الطلبات) بطلب شبكي واحد.

## 4. الـ Middlewares والحماية
ملف `middleware.ts` في جذر المشروع هو الجدار الناري الأول:
- يتحقق من الـ Session Token (عبر NextAuth.js أو Custom JWT).
- يقرأ الـ Role الخاص بالمستخدم.
- إذا حاول مستخدم عادي الدخول إلى `/system/operator` يتم تحويله فوراً (Redirect) لحماية الواجهات الصناعية.
