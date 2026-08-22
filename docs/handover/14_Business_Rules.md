# 14. جميع قواعد العمل (All Business Rules & Constraints)

النظام عبارة عن شبكة من القيود الصارمة (Constraints) لمنع الفساد، الخطأ البشري، والمشاكل المحاسبية. هذه القواعد مبرمجة في طبقة الـ `Services` (Backend) ولا تعتمد فقط على الـ UI.

## 1. قيود دورة حياة الطلبية (Order Lifecycle Constraints)
- **Rule_O1 (No Start without Approval):** لا يمكن إدراج الطلبية في قائمة شاشة المشغل ما لم تكن في حالة `LAB_APPROVED`.
- **Rule_O2 (Lock Mix on Production):** بمجرد صدور أول `Batch` לطلبية، يتم تجميد (Lock) كود الـ `MixDesign` الخاص بها. لا يمكن للمختبر الدخول وتعديل الخلطة بعد أن تم إنتاج جزء منها. (إذا أراد تعديلاً، يجب إلغاء الطلبية وفتح واحدة جديدة).
- **Rule_O3 (Volume Cap):** مجموع كميات الـ `Batches` المصبوبة للطلبية (`actualQuantity`) لا يمكن أن تتجاوز الكمية المطلوبة `volume` بأكثر من سعة خلاط واحد (Tolerance).
- **Rule_O4 (No Edit on Completed):** الطلبية `COMPLETED` غير قابلة للتعديل أو الإلغاء نهائياً بأي صلاحية، لأنها رُحلت للمحاسبة.

## 2. قيود الإنتاج والتشغيل (Batch Execution Constraints)
- **Rule_B1 (Max Batch Volume):** لا يقبل السيرفر أمر `Batch` إذا كان `targetVolume` > `Equipment.maxBatchVolume`.
- **Rule_B2 (Sufficient Inventory):** 
  - السيرفر يقوم بحساب كميات المواد المطلوبة قبل الإرسال (مثال: طلب 1000 كغ أسمنت). 
  - يقارنها بـ `Material.stock`. 
  - إذا كان `stock < 1000` يرفض الأمر (إلا إذا تم إيقاف الميزة من قبل الـ Admin للسماح بالإنتاج العكسي في حال أخطأ مسؤول الميزان في إدخال المواد الواردة).
- **Rule_B3 (Mixer State Lock):** لا يُرسل أمر `START` إذا كان ה-PLC يبلغ أن حالة الخلاط ليست `IDLE`.

## 3. قيود الجرد والمواد (Inventory & Materials Restrictions)
- **Rule_M1 (Append-Only Inventory):** جدول `InventoryTransaction` لا يُحذف منه أي سطر (No DELETE). تعديل الخطأ يتم عبر إضافة سطر جديد بقيمة عكسية.
- **Rule_M2 (Negative Stock Warning):** يسمح بحدوث رصيد سالب (Negative Stock) مؤقتاً لتجنب إيقاف المصنع إذا كانت الأوراق متأخرة، لكن يُطلق `SystemAlert` للمدير بوجود رصيد سالب للتحقيق.

## 4. قيود المختبر (Lab & Quality Rules)
- **Rule_L1 (Cube Test Timing):** لا يمكن تسجيل نتيجة كسر مكعب `CubeTest` لتاريخ يسبق `sampleDate` + عدد أيام `age`. (مثال: مكعب عمره 7 أيام، لا يمكن إدخال نتيجته بعد 3 أيام من الصب).
- **Rule_L2 (Standard Compliance):** إذا فشل المكعب (النتيجة < المرجو)، يجب على مهندس المختبر كتابة تبرير أو اتخاذ قرار بـ (Rejection)، وهذا يؤثر على حالة الطلب المكتمل للعميل.

## 5. قيود الفواتير (Invoicing Constraints)
- **Rule_I1 (No Ghost Tickets):** لا يمكن إنشاء تذكرة تسليم `DeliveryTicket` إلا وهي مربوطة بـ `Batch` موثق صدر من الـ PLC. (يمنع طباعة تذاكر وهمية لبيع خرسانة مسروقة).
- **Rule_I2 (Actual Costing):** הפاتورة تُحسب بناءً على حقل `actualMixData` (الوزن الفعلي) في ה-Batch، وليس على الوزن النظري للخلطة.

## 6. قواعد الأمان وتعدد الإيجار (Tenancy & Security Rules)
- **Rule_S1 (Company Isolation):** كل سطر في قاعدة البيانات يجب أن يُجلب بشرط `WHERE companyId = user.companyId`. استثناءات الـ Admin فقط مسموح بها في مسارات مخصصة.
- **Rule_S2 (Audit Everything):** أي تغيير لـ (Order Status, Material Stock, Mix Design) يُنشئ تسجيلاً إجبارياً في جدول `AuditLog` بمعلومات الـ userId والـ IP.

## 7. القيود المتزامنة (Concurrency Constraints)
- **Rule_C1 (Idempotency Key):** كما ذكر سابقاً، أمر التشغيل يرفق بـ Token/Key فريد لمنع تكرار التنفيذ إذا حدث تأخر في الشبكة (Network Retry/Double Click).
- **Rule_C2 (Pessimistic Locking):** عند تحديث رصيد المخزون، يُستخدم Transaction من Prisma لمنع قراءة الرصيد الخاطئ في حال تم تشغيل خلاطين أو سحب مادتين في نفس الـ Millisecond.
