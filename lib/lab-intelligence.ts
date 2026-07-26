/**
 * LAB INTELLIGENCE ENGINE
 * يحلل نتائج المختبر ويتوقع أداء النماذج الخرسانية
 */

export type CubeTestRecord = {
  id: number;
  age: number; // 7 أو 28
  mpa: number | null;
  result: string | null;
  orderId: number;
  companyId: number | null;
  sampleDate: Date;
};

export type MixDesignRecord = {
  id: number;
  name: string;
  grade: string | null; // مثل C25 أو C30
  strengthClass: string | null;
};

/**
 * الخوارزمية: إذا كانت قيمة 7 أيام أقل من 65% من المستهدف فالخطر مرتفع
 * المعادلة المعروفة: قوة 28 يوم ≈ قوة 7 أيام / 0.65
 */
export function predict28DayStrength(sevenDayMpa: number): {
  predicted: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
} {
  const predicted = sevenDayMpa / 0.65;
  const confidence =
    sevenDayMpa > 20 ? "HIGH" : sevenDayMpa > 10 ? "MEDIUM" : "LOW";
  return { predicted: Math.round(predicted * 10) / 10, confidence };
}

/**
 * استخراج الرقم المستهدف من grade
 * مثلاً: "C30" → 30, "C25" → 25
 */
export function parseTargetMpa(grade: string | null): number {
  if (!grade) return 25; // افتراضي
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0]) : 25;
}

/**
 * تحليل مجموعة نتائج وإرجاع الحالة العامة
 */
export function analyzeTestBatch(
  tests: CubeTestRecord[],
  targetMpa: number,
): {
  status: "DANGER" | "WARNING" | "OK" | "UNKNOWN";
  message: string;
  details: string;
  failCount: number;
  passCount: number;
  avgMpa: number;
} {
  const validTests = tests.filter((t) => t.mpa !== null && t.mpa > 0);
  if (validTests.length === 0) {
    return {
      status: "UNKNOWN",
      message: "لا توجد بيانات كافية",
      details: "",
      failCount: 0,
      passCount: 0,
      avgMpa: 0,
    };
  }

  const avgMpa =
    validTests.reduce((sum, t) => sum + (t.mpa || 0), 0) / validTests.length;
  const failCount = tests.filter((t) => t.result === "FAIL").length;
  const passCount = tests.filter((t) => t.result === "PASS").length;

  let status: "DANGER" | "WARNING" | "OK" | "UNKNOWN";
  let message: string;
  let details: string;

  if (avgMpa < targetMpa * 0.75) {
    status = "DANGER";
    message = `⚠️ خطر: المتوسط ${avgMpa.toFixed(1)} MPa أقل من 75% من المستهدف ${targetMpa} MPa`;
    details = `فشل ${failCount} من ${validTests.length} نماذج. راجع الخلطة فوراً.`;
  } else if (avgMpa < targetMpa * 0.9) {
    status = "WARNING";
    message = `تحذير: المتوسط ${avgMpa.toFixed(1)} MPa أقل من المستهدف ${targetMpa} MPa`;
    details = `${failCount} نموذج فاشل. تابع النتائج عن كثب.`;
  } else {
    status = "OK";
    message = `✅ المتوسط ${avgMpa.toFixed(1)} MPa — ضمن المعدل المقبول`;
    details = `${passCount} نموذج ناجح من أصل ${validTests.length}.`;
  }

  return { status, message, details, failCount, passCount, avgMpa };
}

/**
 * اقتراح تعديل الخلطة بناءً على النتائج
 * القاعدة البسيطة: كل نقص 5 MPa = زيادة 5% اسمنت
 */
export function suggestMixAdjustment(
  avgMpa: number,
  targetMpa: number,
  currentCementKg: number,
): {
  shouldAdjust: boolean;
  suggestion: string;
  newCementKg: number | null;
} {
  const deficit = targetMpa - avgMpa;

  if (deficit <= 0) {
    return {
      shouldAdjust: false,
      suggestion: "الخلطة ممتازة. لا تعديل مطلوب.",
      newCementKg: null,
    };
  }

  const increasePercent = Math.ceil((deficit / targetMpa) * 100);
  const cappedIncrease = Math.min(increasePercent, 20); // لا تتجاوز 20%
  const newCementKg = Math.round(currentCementKg * (1 + cappedIncrease / 100));

  const suggestion = `يُقترح زيادة كمية الاسمنت بنسبة ${cappedIncrease}% (من ${currentCementKg} إلى ${newCementKg} كغ/م³) لتعويض النقص ${deficit.toFixed(1)} MPa.`;

  return { shouldAdjust: true, suggestion, newCementKg };
}
