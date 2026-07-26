# معايير كتابة الكود - نظام مصنع الخرسانة

## 📋 نظرة عامة

هذا المستند يوثق معايير كتابة الكود المعتمدة في المشروع والأخطاء الشائعة وكيفية تجنبها.

---

## 🎯 المبادئ الأساسية

### 1. إمكانية الوصول (Accessibility)

**القاعدة:** جميع عناصر النماذج والتفاعل يجب أن تكون قابلة للوصول لقارئات الشاشة.

**✅ صحيح:**

```tsx
// مع label واضح
<label htmlFor="email" className="...">البريد الإلكتروني</label>
<input id="email" name="email" type="email" />

// أو مع aria-label
<input
  type="file"
  name="logo"
  aria-label="رفع شعار الشركة"
/>

<select name="status" aria-label="حالة الطلب">
  <option value="ACTIVE">نشط</option>
</select>
```

**❌ خطأ:**

```tsx
// بدون label أو aria-label
<input type="email" name="email" />
<select name="status">
  <option>خيار</option>
</select>
```

---

### 2. TypeScript - منع require()

**القاعدة:** استخدم `import` بدلاً من `require()` في ملفات TypeScript.

**✅ صحيح:**

```typescript
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
```

**❌ خطأ:**

```typescript
const fs = require("fs");
const path = require("path");
```

---

### 3. Prisma Schema (Prisma 7)

**القاعدة:** لا تضع `url` في `schema.prisma`، استخدم `prisma.config.ts`.

**✅ صحيح:**

`schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
}
```

`prisma.config.ts`:

```typescript
import { defineConfig } from "@prisma/client/config";

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
```

**❌ خطأ:**

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // ❌ ممنوع في Prisma 7
}
```

---

### 4. Inline Styles

**القاعدة:** استخدم Tailwind CSS classes أو CSS خارجي. Inline styles مقبولة فقط للألوان الديناميكية.

**✅ مقبول (ألوان ديناميكية):**

```tsx
<div style={{ backgroundColor: company.primaryColor }} />
```

**⚠️ أفضل تجنبه:**

```tsx
<div style={{ padding: "1rem", borderRadius: "8px" }} />
```

**✅ الأفضل:**

```tsx
<div className="p-4 rounded-lg" />
```

---

## 🛡️ الأخطاء الشائعة

### 1. نسيان await في Server Actions

**❌ خطأ:**

```typescript
export async function createUser(data: FormData) {
  const result = prisma.user.create({ data }); // ❌ بدون await
  return result;
}
```

**✅ صحيح:**

```typescript
export async function createUser(data: FormData) {
  const result = await prisma.user.create({ data });
  return result;
}
```

---

### 2. عدم التحقق من الصلاحيات

**❌ خطأ:**

```typescript
export async function deleteCompany(id: number) {
  return await prisma.company.delete({ where: { id } });
}
```

**✅ صحيح:**

```typescript
export async function deleteCompany(id: number) {
  const session = await getServerSession();
  if (session?.user?.role !== "SYSTEM_OWNER") {
    return { success: false, error: "غير مصرح" };
  }

  return await prisma.company.delete({ where: { id } });
}
```

---

### 3. تسريب معلومات الـ Database في Errors

**❌ خطأ:**

```typescript
try {
  await prisma.user.create({ data });
} catch (error) {
  return { success: false, error: error.message }; // ❌ يكشف معلومات SQL
}
```

**✅ صحيح:**

```typescript
try {
  await prisma.user.create({ data });
} catch (error) {
  console.error("Database error:", error);
  return { success: false, error: "حدث خطأ أثناء الإنشاء" };
}
```

---

### 4. نسيان Suspense boundary مع useSearchParams

**❌ خطأ:**

```tsx
export default function MyPage() {
  const searchParams = useSearchParams(); // ❌ بدون Suspense
  return <div>{searchParams.get("id")}</div>;
}
```

**✅ صحيح:**

```tsx
function MyPageContent() {
  const searchParams = useSearchParams();
  return <div>{searchParams.get("id")}</div>;
}

export default function MyPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
```

---

## 🔍 كيفية الفحص

### تشغيل ESLint

```bash
npm run lint
```

### تشغيل TypeScript Type Check

```bash
npx tsc --noEmit
```

### فحص Prisma Schema

```bash
npx prisma validate
```

### بناء المشروع للتحقق النهائي

```bash
npm run build
```

---

## 📚 مراجع مفيدة

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma 7 Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🚀 نصائح للتطوير السريع

1. **استخدم ESLint auto-fix:**

   ```bash
   npm run lint -- --fix
   ```

2. **استخدم TypeScript strict mode** في `tsconfig.json`

3. **اكتب tests للـ Server Actions الحرجة**

4. **راجع الكود قبل الـ commit:**
   - تحقق من عدم وجود `console.log` غير ضرورية
   - تأكد من وجود error handling مناسب
   - تحقق من الـ accessibility

---

تم التحديث: 2026-02-01
