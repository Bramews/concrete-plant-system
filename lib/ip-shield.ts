/**
 * INTELLECTUAL PROPERTY SHIELD
 * طبقة حماية الملكية الفكرية للنظام
 *
 * ⚠️  هذا النظام مملوك بالكامل ومحمي قانونياً.
 * ⚠️  أي استنساخ أو تقليد أو استخدام غير مرخص يُعرّض صاحبه للمساءلة القانونية.
 * ⚠️  جميع البيانات تحمل بصمة رقمية فريدة لتتبع مصدر أي تسريب.
 *
 * PROPRIETARY & CONFIDENTIAL
 * All rights reserved. Unauthorized copying, distribution,
 * modification, public display, or public performance of
 * this software is strictly prohibited.
 */

// نظام البصمة الرقمية (Digital Fingerprinting)
export function generateSystemFingerprint(
  companyId: number,
  userId: number,
): string {
  const data = `${companyId}:${userId}:${process.env.JWT_SECRET?.slice(0, 8)}`;
  const buf = Buffer.from(data);
  return buf.toString("base64url");
}

/**
 * أضف بصمة مخفية في كل تقرير PDF/Excel مُصدَّر
 * تُستخدم لتتبع مصدر التسريب إذا ظهر المستند خارجياً
 */
export function embedDocumentFingerprint(
  companyId: number,
  userId: number,
  documentType: string,
): {
  visibleWatermark: string;
  hiddenMetadata: Record<string, string>;
} {
  const timestamp = new Date().toISOString();
  const fingerprint = generateSystemFingerprint(companyId, userId);

  return {
    // نص مرئي خفيف في زاوية التقارير
    visibleWatermark: `©${new Date().getFullYear()} — ${fingerprint.slice(0, 8)}`,
    // metadata مخفية في ملف PDF/Excel
    hiddenMetadata: {
      Creator: "Concrete Plant System — Proprietary",
      Producer: `CPS-${fingerprint}`,
      CreationDate: timestamp,
      Subject: `Company:${companyId}|User:${userId}|Type:${documentType}`,
      Keywords: `CPS_PROTECTED_DOC_${fingerprint}`,
    },
  };
}

/**
 * رأس HTTP يُضاف على كل الردود لتحديد الملكية
 */
export const OWNERSHIP_HEADERS = {
  "X-System": "CPS-Protected",
  "X-Content-Ownership": "Proprietary — All Rights Reserved",
  "X-Powered-By": "", // إخفاء التقنية المستخدمة
};
