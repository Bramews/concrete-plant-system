# 🔌 مرجع ربط APIs والخدمات الخارجية (API Integration Reference)

> يُقرأ فقط عند ربط خدمات خارجية أو APIs. لا يُقرأ في كل جلسة.

## القاعدة المطلقة

⛔ ممنوع أي API مدفوع بدون إذن صريح
⛔ ممنوع إرسال بيانات حساسة (passwords, API keys, user data) لأي جهة خارجية

## APIs المجانية المعتمدة

| الخدمة           | الغرض   | الرابط                          |
| ---------------- | ------- | ------------------------------- |
| Open-Meteo       | طقس     | api.open-meteo.com (بلا key)    |
| RestCountries    | دول     | restcountries.com/v3.1          |
| ExchangeRate-API | عملات   | exchangerate-api.com (1500/شهر) |
| Nominatim        | خرائط   | nominatim.openstreetmap.org     |
| DiceBear         | أفاتار  | api.dicebear.com                |
| QR Server        | QR Code | api.qrserver.com                |
| Google Fonts     | خطوط    | fonts.googleapis.com            |

## قواعد الربط الإلزامية

1. تحقق من المجانية قبل أي كود
2. اقرأ التوثيق أولاً
3. كل fetch داخل try-catch + AbortController (8s timeout)
4. Cache النتائج لتجنب طلبات زائدة
5. احترم Rate Limits
6. ترجم كل خطأ API للعربية
7. تحقق من البيانات الخارجية قبل الاستخدام

## القالب الإلزامي

```typescript
async function fetchExternalData(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, data: await res.json() };
  } catch (e) {
    clearTimeout(timeout);
    return {
      success: false,
      error: e.name === "AbortError" ? "انتهت مدة الاتصال" : "فشل الاتصال",
    };
  }
}
```
