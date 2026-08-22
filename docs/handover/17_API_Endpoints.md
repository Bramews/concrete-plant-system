# 17. مسارات الاتصال والواجهات البرمجية (API Endpoints & Server Actions)

نظامنا يعتمد بشكل أساسي على ميزة **Next.js Server Actions** بدلاً من الـ REST APIs التقليدية (أقل كتابة للأكواد، Type-Safe، وأكثر أماناً من خلال إخفاء مسار ה-Endpoint). لكن هنالك API Routes للتعامل مع الأنظمة الخارجية.

## 1. نموذج الـ Server Actions (The Primary Backend)
معظم الأزرار في الواجهة تستدعي دوال TypeScript موجودة في مجلد `app/actions` وتنتهي بتوجيه `"use server"`.

### أهم ה-Actions:
- **`createBatchAction(orderId, truckNum, driverName, volume)`**
  - **الطبقة (Layer):** هي دالة خلفية كاملة (Controller + Service).
  - **التحقق (Validation):** 
    1. تتحقق من الـ Session Auth لمعرفة الـ `companyId`.
    2. تفحص إذا كان الـ `Order` موجوداً وفي حالة `LAB_APPROVED` أو `PRODUCTION`.
    3. تفحص سعة الخلاط (لا يجوز للـ volume أن يكون > maxCapacity).
  - **العملية (Execution):** 
    - تحسب كميات المواد المطلوبة.
    - تقارنها بالمخزون.
    - تستدعي دالة من `plcService` لكتابة الأوامر לـ PLC.
  - **الأمان:** مغلفة بـ Idempotency Key مستخرج من ה-UI لمنع التكرار (Double execution).

- **`approveMixDesign(mixId)`**
  - تتحقق أن دور المستخدم هو `LAB_MANAGER` (Authorization).
  - تغير `status` إلى `APPROVED` وتُفعل `isFrozen = true`.

## 2. مسارات الـ API التقليدية (`app/api/...`)
نستخدمها عندما نحتاج للتواصل مع أنظمة لا تفهم React (تطبيقات الجوال، ה-PLC إذا كان يعتمد HTTP، أنظمة ה-ERP الخارجية).

- **`POST /api/webhooks/stripe`:** 
  - مسار مخصص لاستقبال تأكيدات الدفع من بوابات الدفع. لا يتطلب Auth Token بل يعتمد على Webhook Signature للتأكد أن الطلب قادم فعلاً من Stripe.
  
- **`GET /api/external/tickets/:id`:**
  - واجهة عامة (Public) أو محمية بـ API Key للعملاء الخارجيين.
  - يمكن לنظام العميل (مثلاً SAP الخاص به) قراءة التذكرة بمجرد خروج الشاحنة لتحديث مشروعه آلياً.

- **`POST /api/plc/fault` (مستقبلي):**
  - إذا كان لدينا Edge Server محلي في المصنع ويتواصل مع Next.js السحابي، سيرسل هذا المسار ضربات قلب (Heartbeats) أو يبلغ عن أعطال لحظية.

## 3. التعامل مع البيانات (Data Fetching in React)
كيف تقرأ واجهة المشغل بياناتها دون تحميل زائد؟
- **Server Components:** `page.tsx` الخاص بالإنتاج يستدعي `prisma.order.findMany(...)` مباشرة (بدون `fetch`). هذا يعني أن الـ HTML يُرسل للمتصفح جاهزاً.
- **Client Components & Polling:** المكون الحي مثل `LiveGauges` يحتاج بيانات كل ثانية. يستخدم `fetch('/api/plc/status')` داخل `useEffect`، أو الأفضل إنشاء اتصال `WebSocket` أو `Server-Sent Events (SSE)` لجلب البث الحي من الـ PLC بدون عمل Request/Response Overhead.

## 4. الحماية والتخويل (Validation & Authorization)
- **Zod Validation:** كل مدخلات المستخدم تُمرر عبر مكتبة Zod قبل تنفيذ أي شيء.
  ```typescript
  const BatchSchema = z.object({
    volume: z.number().min(0.5).max(12),
    truckNumber: z.string().min(1),
  });
  ```
  إذا فشل ה-Schema، الـ Action يُرجع `{ error: "Validation Failed" }` بدلاً من تحطيم قاعدة البيانات.
- **Role Guards:** في بداية כל Action يُكتب `requireRole(["OPERATOR", "SYSTEM_OWNER"])`. إذا كان المستخدم `ACCOUNTANT` يُطرد فوراً.
