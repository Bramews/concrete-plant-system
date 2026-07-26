import * as XLSX from "xlsx";

/**
 * Native helper to trigger file download in browser without file-saver
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export a single sieve analysis test to Excel.
 */
export function exportSingleSieveToExcel(test: any) {
  try {
    console.log("Starting exportSingleSieveToExcel for LabNo:", test.labNo);
    const data = [
      ["نظام المحطة الخرسانية - فحص التحليل المنخلي"],
      [],
      [
        "الرقم المختبري",
        test.labNo,
        "تاريخ الفحص",
        test.testDate
          ? new Date(test.testDate).toLocaleDateString("ar-u-nu-latn")
          : "-",
      ],
      ["المادة", test.material?.name || "رمل", "المجهز", test.supplier || "-"],
      ["الموقع", test.location || "-", "المصدر", test.source || "-"],
      [],
      [
        "حجم المنخل",
        "الوزن المتبقي (غم)",
        "المتبقي (%)",
        "المتبقي التراكمي (%)",
        "المار التراكمي (%)",
        "الحدود (أدنى)",
        "الحدود (أعلى)",
      ],
    ];

    // Parse results if it's a string (from Prisma)
    const results = Array.isArray(test.results)
      ? test.results
      : typeof test.results === "string"
        ? JSON.parse(test.results)
        : [];

    // Add readings
    results.forEach((r: any) => {
      data.push([
        r.size,
        r.retained?.toFixed(2) || "0.00",
        r.percentRetained?.toFixed(2) || "0.00",
        r.cumulativeRetained?.toFixed(2) || "0.00",
        r.passing?.toFixed(2) || "0.00",
        r.minLimit?.toString() || "-",
        r.maxLimit?.toString() || "-",
      ]);
    });

    data.push([]);
    data.push(["معامل النعومة (FM)", test.finenessModulus || "0.00"]);
    data.push([
      "الحالة الفنية",
      test.zone === "PASSED" ? "مطابق" : "غير مطابق",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sieve Analysis");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    triggerDownload(blob, `Sieve_Analysis_${test.labNo || Date.now()}.xlsx`);
    console.log("Single export completed successfully");
  } catch (error) {
    console.error("Error in exportSingleSieveToExcel:", error);
    alert("حدث خطأ أثناء تصدير الفحص إلى Excel. يرجى مراجعة سجلات المتصفح.");
  }
}

/**
 * Export multiple sieve tests to a single Excel file.
 */
export function exportSieveTestsToExcel(tests: any[]) {
  try {
    console.log("Starting exportSieveTestsToExcel with", tests.length, "tests");
    if (!tests || tests.length === 0) {
      console.warn("No tests to export");
      return;
    }

    const data = [
      ["أرشيف فحوصات التحليل المنخلي"],
      [],
      [
        "الرقم المختبري",
        "تاريخ الفحص",
        "المادة",
        "المجهز",
        "المصدر",
        "معامل النعومة (FM)",
        "الحالة",
      ],
    ];

    tests.forEach((test) => {
      data.push([
        test.labNo,
        test.testDate
          ? new Date(test.testDate).toLocaleDateString("ar-u-nu-latn")
          : "-",
        test.material?.name || "رمل",
        test.supplier || "-",
        test.source || "-",
        test.finenessModulus || "0.00",
        "معتمد",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Archive");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    triggerDownload(
      blob,
      `Sieve_Archive_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    console.log("Bulk export completed successfully");
  } catch (error) {
    console.error("Error in exportSieveTestsToExcel:", error);
    alert("حدث خطأ أثناء تصدير البيانات إلى Excel. يرجى مراجعة سجلات المتصفح.");
  }
}
