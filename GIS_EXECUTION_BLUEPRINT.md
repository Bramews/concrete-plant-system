# 🏗️ المخطط التنفيذي الهندسي للخرائط والموقع الجغرافي (GIS Execution Blueprint)

> [!IMPORTANT]
> يحدد هذا المستند خطة البناء البرمجية والمواصفات التشغيلية الدقيقة لتطوير منظومة الخرائط والتتبع الجغرافي لمشروع ERP المحطة الخرسانية كمنصة SaaS متعددة الشركات (Multi-Tenant). يُمنع أي تعديل أو كتابة للأكواد خارج إطار هذا المخطط المعتمد.

---

## 🔍 1. تحليل الحالة الراهنة (Current State Analysis)

يقدم الجدول التالي توصيفاً لكافة ملفات الخرائط والشبكة الحالية وقرار التعامل المعماري مع كل منها:

| اسم الملف الحالي                   | المسؤولية التقنية                           | الحالة الحالية | القرار المعماري | التفسير الهندسي للقرار                                                    |
| :--------------------------------- | :------------------------------------------ | :------------: | :-------------: | :------------------------------------------------------------------------ |
| `lib/map/config.ts`                | تعريف خيارات الخرائط ومزودي البلاطات        |    **Keep**    |   **Modify**    | دمج إعدادات الخوادم الجديدة وبوابة الـ API المحلية.                       |
| `lib/map/MapEngine.ts`             | منطق الخرائط والتحريك والتحويل (Leaflet)    |    **Keep**    |   **Modify**    | تعديلها لتستهلك واجهة `IMapProvider` وتجريد الاعتماد المباشر على Leaflet. |
| `lib/map/LocationEngine.ts`        | إدارة تسلسل الموقع الجغرافي للمتصفح والـ IP |    **Keep**    |    **Split**    | تفكيكها إلى `GeoService` وإسناد الجلب الخارجي للـ Gateway.                |
| `lib/map/SearchEngine.ts`          | الاستعلام عن العناوين والتحويل العكسي       |    **Keep**    |    **Split**    | إحالة الطلبات الشبكية لبوابات `/api/gis/*` وفصل الكاش.                    |
| `lib/map/StorageEngine.ts`         | حفظ الإحداثيات والزووم في LocalStorage      |    **Keep**    |    **Keep**     | الإبقاء عليها كطبقة تخزين خفيفة للعميل مع ضبط التوافق.                    |
| `lib/map/NavigationEngine.ts`      | توليد روابط الملاحة لتطبيقات الهواتف        |    **Keep**    |    **Keep**     | بقاء المنطق كما هو لحياديته وسهولة نقله للموبايل.                         |
| `components/ui/MapPickerModal.tsx` | نافذة عرض الخريطة للمستخدم (Pure UI)        |    **Keep**    |   **Modify**    | تعديلها لتتصل بـ `IMapProvider` وتجريد واجهة الاستدعاء.                   |
| `app/api/map/tiles/route.ts`       | بروكسي تحميل بلاطات خرائط جوجل محلياً       |    **Keep**    |    **Keep**     | حماية البلاطات والتخزين المؤقت بالسيرفر.                                  |
| `security.ts`                      | رؤوس الأمان للمشروع بأكمله                  |    **Keep**    |   **Modify**    | تعديلها لدعم سياسات الأمان السياقية (Contextual CSP) لكل مسار.            |

---

## 📊 2. مخطط العلاقات البرمجية (Dependency Graph)

يمنع التصميم الجديد وجود أي علاقات دائرية (Circular Dependencies). يوضح المخطط مسار استدعاء البيانات:

```
┌────────────────────────────────────────────────────────┐
│               UI (MapPickerModal.tsx)                  │
└──────────────────────────┬─────────────────────────────┘
                           │ (يحظر الاستدعاء المباشر للمزود أو الشبكة)
                           ▼
┌────────────────────────────────────────────────────────┐
│            IMapProvider / BaseMapProvider              │
└──────────────────────────┬─────────────────────────────┘
                           ├─────────────────────────────┐
                           ▼                             ▼
┌───────────────────────────────────┐     ┌───────────────────────────────────┐
│         OSMMapProvider            │     │        GoogleMapProvider          │
└──────────────────┬────────────────┘     └─────────────────┬─────────────────┘
                   │                                        │
                   └──────────────────┬─────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────┐
│           IGeocodingProvider / GeoService              │
└──────────────────────────┬─────────────────────────────┘
                           │ (استعلام عبر بوابات العميل المحلية)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Geo API Gateway (/api/gis/*)              │
└──────────────────────────┬─────────────────────────────┘
                           │ (Server to Server - CORS bypassed)
                           ▼
┌────────────────────────────────────────────────────────┐
│                خوادم الخدمات الخارجية                   │
└────────────────────────────────────────────────────────┘
```

---

## 🚚 3. مصفوفة الترحيل والتوافق (Migration Matrix)

للترحيل الآمن دون التسبب في انهيار أي جزء من المشروع:

```
[النظام القديم (LocationEngine/SearchEngine)]
                   ↓
     [المرحلة 1: بناء البوابات /api/gis/*]
                   ↓
  [المرحلة 2: واجهات التجريد IMapProvider & Interfaces]
                   ↓
  [المرحلة 3: تعديل المودال UI وتوجيهه للواجهات الجديدة]
                   ↓
     [المرحلة 4: بناء طبقة التوافق التراجعي]
                   ↓
     [المرحلة 5: حذف الملفات القديمة المعزولة]
```

- **طبقة التوافق التراجعي (Compatibility Layer):** يتم الإبقاء على الواجهات القديمة لـ `LocationEngine` و `SearchEngine` ولكن يتم تغيير تنفيذها داخلياً لتعيد توجيه الطلبات للواجهات الجديدة، وذلك لضمان عمل كافة صفحات النظام المستوردة لها دون أي خطأ كود (Zero-Regression) حتى اكتمال الترحيل.

---

## 📡 4. عقود وبوابات الـ API الجغرافية (API Gateway Contract)

تمر جميع اتصالات العميل عبر الخادم المحلي للنظام:

### 1. البحث الجغرافي (`GET /api/gis/search`)

- **المدخلات (Query Params):**
  - `q`: نص استعلام البحث (مثال: `Basra`).
  - `limit`: الحد الأقصى للنتائج (الافتراضي `5`).
- **التحقق والصلاحيات (Auth & Limit):**
  - تفعيل `Rate Limiter` بـ 30 طلب بالدقيقة لكل مستخدم.
  - التحقق من وجود `session_token` صالح وصلاحية المستأجر (Tenant Active).
- **مخرجات النجاح (200 OK):**
  ```json
  [
    {
      "displayName": "البصرة, العراق",
      "lat": 30.50178,
      "lng": 47.81814
    }
  ]
  ```
- **مخرجات الفشل (400 Bad Request / 429 Too Many Requests):**
  ```json
  {
    "error": "TOO_MANY_REQUESTS",
    "message": "تجاوزت الحد المسموح به من الطلبات."
  }
  ```

---

## 🗄️ 5. تأثير قاعدة البيانات (Database Schema Impact)

يتم إضافة الجداول والفهارس التالية في ملف Prisma لتتبع الأسطول والمواقع وعزل تعدد الشركات:

```prisma
// جداول تتبع الأسطول والمواقع الجغرافية
model TrackingDevice {
  id           String            @id @default(uuid())
  deviceId     String            @unique // المعرف الفريد للجهاز (الهاتف أو الجهاز المثبت)
  companyId    Int               // مستأجر النظام (SaaS Multi-Tenant ID)
  name         String            // اسم السائق أو نوع الشاحنة
  vehicleType  String            // MIXER_TRUCK | PUMP_TRUCK | SALES_CAR
  sessions     TrackingSession[]
  createdAt    DateTime          @default(now())

  @@index([companyId])
}

model TrackingSession {
  id         String             @id @default(uuid())
  deviceId   String
  device     TrackingDevice     @relation(fields: [deviceId], references: [deviceId], onDelete: Cascade)
  status     String             @default("ACTIVE") // ACTIVE | COMPLETED
  locations  LocationHistory[]
  createdAt  DateTime           @default(now())
}

model LocationHistory {
  id         String          @id @default(uuid())
  sessionId  String
  session    TrackingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  lat        Float
  lng        Float
  speed      Float?          // السرعة الفعلية كم/ساعة
  heading    Float?          // اتجاه الحركة بالدرجات
  accuracy   Float?          // دقة الـ GPS بالمتر
  createdAt  DateTime        @default(now())

  @@index([sessionId])
}
```

---

## 🔒 6. مصفوفة الأمان السياقية (Contextual Security Matrix)

يتم تطبيق سياسات الأمان المخصصة بناءً على نوع الطلب والمسار لحماية النظام مع الحفاظ على عمل الخرائط:

| المسار / نوع الطلب                         | سياسة CSP المعتمدة                                                                           | سياسة Permissions-Policy                   | الأفعال المتاحة (Methods) |
| :----------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------------- | :-----------------------: |
| **صفحات التتبع وتحديد الموقع**             | `default-src 'self'; connect-src 'self'; img-src 'self' data: blob: https://*.cartocdn.com;` | `geolocation=('self')`                     |           `GET`           |
| **بوابة الـ API الجغرافية (`/api/gis/*`)** | `default-src 'self'; connect-src 'self';`                                                    | `geolocation=()`                           |       `GET`, `POST`       |
| **بقية صفحات النظام (إدارة ومحاسبة)**      | `default-src 'self'; connect-src 'self';`                                                    | `camera=(), microphone=(), geolocation=()` |       `GET`, `POST`       |

---

## 🧭 7. واجهات تجريد المزودين (Provider Abstraction Interfaces)

```typescript
// 1. واجهة رسم وعرض الخرائط
export interface IMapProvider {
  init(
    container: HTMLElement,
    options: { lat: number; lng: number; zoom: number },
  ): void;
  updateMarker(lat: number, lng: number): void;
  setView(lat: number, lng: number, zoom?: number): void;
  destroy(): void;
}

// 2. واجهة تحديد وتحويل العناوين
export interface IGeocodingProvider {
  search(
    query: string,
    isAr?: boolean,
  ): Promise<{ displayName: string; lat: number; lng: number }[]>;
  reverse(
    lat: number,
    lng: number,
    isAr?: boolean,
  ): Promise<{ displayName: string; region: string }>;
}

// 3. واجهة حساب الطرق والمسافات والوقت المتوقع للوصول
export interface IRoutingProvider {
  calculateRoute(
    start: [number, number],
    end: [number, number],
  ): Promise<{ distance: number; duration: number; routeGeometry: string }>;
}

// 4. واجهة التتبع الحي للمركبات
export interface ITrackingProvider {
  sendLocationHeartbeat(
    deviceId: string,
    payload: { lat: number; lng: number; speed?: number; heading?: number },
  ): Promise<boolean>;
}
```

---

## 📡 8. بنية الأحداث الجغرافية (Event Driven GIS Architecture)

يعتمد التفاعل بين الخرائط والأنظمة على إطلاق أحداث معيارية مستقلة:

- `LocationUpdated`: يتم إطلاقه عند جلب إحداثيات جديدة للشاحنة.
- `VehicleMoved`: يُطلق عند رصد تحرك الشاحنة بمسافة تزيد عن 20 متراً لتوفير الموارد.
- `TruckArrived`: يُطلق عند تقاطع الشاحنة مع الموقع الجغرافي للمحطة (Geofencing) بمسافة أقل من 50 متراً.
- `ETAChanged`: يُطلق عند تغير مسار الشاحنة أو زيادة الاختناق المروري مما يتطلب تحديث زمن الوصول للعميل.

---

## 🛠️ 9. سيناريوهات الفشل وخطط الطوارئ (Failure Scenarios)

- **انقطاع الإنترنت المفاجئ:** يقوم العميل تلقائياً بحفظ النبضات بداخل طابور محلي (`Offline Queue`) بـ IndexedDB. بمجرد عودة إشارة الشبكة (`navigator.onLine`)، يتم إرسال الطابور مجدولاً بالتسلسل مع الحفاظ على التوقيت التاريخي للنبضات لمنع تعارض البيانات (Clock Drift).
- **تعطل خادم البحث Nominatim:** تقوم البوابة بالتحويل الفوري والتلقائي على السيرفر إلى مزود بديل مجاني أو قاعدة البيانات المحلية للنتائج المكررة (Local Cache).

---

## 🚚 10. خطة التنفيذ والرجوع والترحيل خطوة بخطوة (Execution & Rollback Roadmap)

### المرحلة الأولى: إعداد بوابات الـ API وقاعدة البيانات

- **الخطوات:**
  1. كتابة مسارات الـ API للبوابات: `/api/gis/search`, `/api/gis/reverse`.
  2. تطبيق نموذج جداول التتبع في Prisma وتشغيل الهجرة (`npx prisma migrate dev`).
- **مخاطر خطيرة:** تعطل قاعدة البيانات أو بطء الفهارس.
- **الاختبار والتحقق:** استدعاء مسار البوابات مباشرة للتحقق من إرجاع 200 OK وكتابة السجل بقاعدة البيانات.
- **خطة الرجوع (Rollback):** تراجع الهجرة الجغرافية (`npx prisma migrate resolve`).

### المرحلة الثانية: إعداد واجهات التجريد والمزودين (OSM / Google)

- **الخطوات:**
  1. إنشاء كلاسات التجريد `OSMMapProvider` و `GoogleMapProvider`.
  2. توجيه المودال `MapPickerModal.tsx` لطلب الخرائط عبر واجهة المزود.
- **الاختبار والتحقق:** اختبار تحميل الخريطة والتحريك والتأكد من عدم اهتزاز الصورة.
- **خطة الرجوع:** إعادة ربط المودال بـ `MapEngine` القديم.

### المرحلة الثالثة: دمج أمان سياسة الـ CSP السياقية والدمج الكامل

- **الخطوات:**
  1. تفعيل سياسة الأمان السياقية بملف `security.ts`.
  2. إزالة الملفات القديمة المعزولة (`LocationEngine`, `SearchEngine`) بعد توجيه طبقات التوافق التراجعي.
- **الاختبار والتحقق:** تشغيل الفحص الكامل للمتصفح والتأكد من عدم وجود أي خطأ CSP أو Permissions-Policy بالكونسول.
- **البناء النهائي:** تشغيل البناء البرمجي `npm run build` للتأكد من نجاح العملية 100%.
