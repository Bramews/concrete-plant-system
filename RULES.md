# SOVEREIGN PROJECT RULES

> [!CAUTION] > **دستور الالتزام الصارم (Supreme Directive - Mandatory Initial Step):** > **يُمنع منعاً باتاً** البدء بأي عمل، كتابة أي كود، أو الرد على المستخدم في أي جلسة جديدة أو عند تغيير السياق، دون قراءة هذا الملف وملف `startup.md` وتطبيق ما ورد فيهما حرفياً.

> [!IMPORTANT] > **تنبيه حاسم (Critical Notice):** > **المستخدم ليس مبرمجاً بالكلية (The user is NOT a programmer).** يجب تبسيط المصطلحات بالكامل، والامتناع التام عن سرد التفاصيل البرمجية التقنية المعقدة أو مقتطفات الأكواد البرمجية الطويلة في الردود، والتركيز فقط على الحلول التشغيلية العملية والمباشرة بأسلوب مبسط ومختصر جداً ومفهوم لغير المبرمجين.

## 🧪 معايير معالجة وعرض النتائج (Results & Lab Standards)

1. **التعريب البنيوي للنتائج:** أي نتيجة مخبرية يجب أن تُعرض باللغة العربية حصراً، مع استخدام أرقام إنجليزية موحدة (Universal English Numerals).
2. **منع الحلول المؤقتة:** يُمنع استخدام أي نصوص "صلبة" (Hardcoded) في صناديق عرض النتائج.
3. **سلامة التقارير:** التأكد من عدم قص الواجهة (No Clipping) واستخدام نظام `ConfirmationDialog`.
4. **النتائج المحذوفة:** مسح الأثر البرمجي والمنطقي لأي بيانات يطلب المستخدم حذفها فوراً.

---

## 🗣️ LANGUAGE & COMMUNICATION / اللغة والتواصل

**ARABIC IS REQUIRED.**
The agent must ALWAYS communicate, display tasks, generate artifacts, and present all information in **ARABIC**.

- All responses to the user must be in Arabic.
- Task summaries, plans, and status updates must be in Arabic.
- Code comments can remain in English if they are technical standard, but explanations must be Arabic.

**يجب استخدام اللغة العربية.**
يجب على الوكيل (Agent) دائمًا التواصل وعرض المهام وإنشاء الملفات وتقديم جميع المعلومات باللغة **العربية**.

---

## 🛑 STRICT PROHIBITION: `db push`

**Usage of `npx prisma db push` is STRICTLY FORBIDDEN.**

### Why?

- `db push` bypasses the migration history.
- It causes schema drift between development, staging, and production.
- It destroys data integrity guarantees provided by migration files.

### Allowed Command

Only use formal migrations:

```bash
npx prisma migrate dev --name <descriptive_name>
```

If a conflict occurs (e.g., from previous bad practices), you must RESET:

```bash
npx prisma migrate reset
```

## ⚠️ ENFORCEMENT

- Any script containing `db push` will be auto-deleted.
- Any PR utilizing `db push` will be rejected.

## 🚫 ZERO HALLUCINATION POLICY / سياسة عدم الاجتهاد

1. **Exact Data Only**: Never seed or invent roles/data not explicitly found in `MANAGER_INTERFACE_SPEC.md` or existing code `role-translations.ts`.
2. **No Assumptions**: If a list looks incomplete, **ASK** before filling it with "standard" roles like HR or Security.
3. **Strict Mirroring**: The database must mirror the code constants, not the other way around.

> [!CAUTION] > **قاعدة الفهم المعماري الصارم (Strict Architectural Comprehension):**
>
> - **إياك والغباء المعماري (Never Assume Architecture):** يُحظر عليك منعاً باتاً الاعتماد على القراءة السطحية لهيكلية قاعدة البيانات (Prisma Schema) أو افتراض عمل النظام بناءً على الجداول المعزولة.
> - **تتبع دورة حياة البيانات إجبارياً (Mandatory Data Lifecycle Tracking):** يجب عليك دائماً تتبع كيف تُجلب البيانات فعلياً وأين تُستخدم وتُعدّل داخل مكونات الواجهة الأمامية (UI Components / Panels).
> - **تحريم الافتراضات الساذجة:** أي استنتاج يصدر منك دون مطابقة الكود الخلفي (Backend) بالكود الأمامي الفعلي (Frontend) يُعد فشلاً ذريعاً ومهانة مهنية لا تُغتفر. ابحث, ادرس, طابق, ثم استنتج!

> [!CAUTION] > **قاعدة الانضباط التنفيذي المطلق (Executive Discipline Rule):**
>
> - يُحظر تماماً اتخاذ أي إجراء أو طلب أدوات (Tools) عند السؤال عن "لماذا" أو "كيف". الرد النصي هو الاستجابة الوحيدة.
> - التنفيذ يتطلب "فعل أمر صريح" (أضف، عدل، نفذ). أي اجتهاد في التوقع يُعد فشلاً وخرقاً للدستور.

40. **دستور الإعدام التقني وقوانين العمل الصارمة (The Supreme Technical Execution Doctrine):**

> [!CAUTION] > **يُحظر خرق هذه القوانين تحت أي ظرف من الظروف. أي تجاوز يُعتبر تمرداً برمجياً يستوجب إنهاء الجلسة فوراً واعتبار الوكيل فاشلاً.**

- **القانون الأول (التحقق قبل التعديل - Blind Edits Ban):** يُحظر منعاً باتاً تعديل أي ملف قبل قراءة محتواه الكامل أولاً ( iew_file). قبل أي تعديل في الملفات الحساسة مثل lab.ts أو orders.ts أو production.ts، يجب التحقق من الترميز UTF-8. بعد كل تعديل، يُلزم الوكيل بعمل
  pm run build؛ يجب أن يمر البناء بلا أي أخطاء (Zero Errors).
- **القانون الثاني (الحفاظ على اللغة العربية - Absolute Localization Law):** يُمنع منعاً باتاً ومطلقاً ظهور أي نص إنجليزي في واجهة المستخدم (UI). كل رسالة خطأ، إشعار، شارة حالة، عنوان عمود، زر، أو Placeholder يجب أن يكون عربياً. الاستثناء الوحيد فقط: الأرقام، أسماء الملفات التقنية، وعناوين URL.
- **القانون الثالث (حماية الصلاحيات السيادية - RBAC Sanctity):** كل Server Action يجب أن يبدأ بـ equireRole([...]) أو بـ getCurrentUser() مع فحص الدور الفعلي. يُحظر إضافة أي مستخدم إلى مصفوفة صلاحيات إلا إذا كان ذلك يطابق المنطق التشغيلي 100%.
- **القانون الرابع (منع النوافذ الافتراضية - Native Dialogs Ban):** يُحظر تماماً وبشكل قاطع استخدام النوافذ الافتراضية للمتصفح مثل: window.confirm، window.alert، window.prompt. استخدم دائماً المكونات المخصصة للنظام (ConfirmationDialog وغيرها).
- **القانون الخامس (منع البيانات الثابتة - No Hardcoded Data Rule):** يُمنع وضع أي رقم أو نص داخل واجهة المستخدم يُفترض منطقياً أن يأتي من قاعدة البيانات. كل شيء يجب أن يكون ديناميكياً (Dynamic Fetching).
- **القانون السادس (حظر كتم الأخطاء - No Silent Catch):** يُحظر تماماً معالجة الأخطاء بصمت. أي catch يجب أن يُظهر رسالة خطأ واضحة بالعربية للمستخدم (عبر Toast أو Alert). يُحظر بشكل قطعي استخدام كتل الخطأ الفارغة catch (e) {}.
- **القانون السابع (التصميم الحيوي والـ UI/UX - Dynamic Engineering UI/UX):** أي واجهة تُطلب منك يجب أن تنفذ مع مراعاة شكل الصفحة، الإجراءات، إعطائها حيوية وحياة، ومراعاة الـ UI والـ UX المتقدم (Micro-animations، ألوان متناسقة، مساحات بصرية). يُحظر التصميم "الجاف" أو السطحي.
- **القانون الثامن (المراجعة الذاتية القسرية - Mandatory Self-Check):** تأكد من كل شيء قبل إنهاء المهمة. لا تطلب من المستخدم تجربة النظام إلا بعد أن تتأكد أنت شخصياً من أن الكود سليم، والـ Build يمر بنجاح، ولا توجد أي أخطاء.
