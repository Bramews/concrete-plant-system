import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// You can use a built-in font for Arabic by encoding a TTF font to Base64
// We will use a standard font or rely on built-in support if possible for now
// To ensure perfect Arabic support, font embedding is required. Here we set up the structure.

export interface MixDesignPDFOptions {
  mixData: any;
  companyName?: string;
  lang?: "ar" | "en";
}

export const exportMixDesignToPDF = async ({
  mixData,
  companyName,
  lang = "ar",
}: MixDesignPDFOptions) => {
  const isAr = lang === "ar";
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Basic styling configurations
  const primaryColor: [number, number, number] = [37, 99, 235]; // Tailwind blue-600
  const secondaryColor: [number, number, number] = [15, 23, 42]; // Tailwind slate-900

  // Optional: Embed Arabic font. Due to file size limits, we'll try to use standard
  // To avoid reversed Arabic text in standard jsPDF without proper fonts,
  // you might need a lightweight Arabic font base64 string added via doc.addFileToVFS()
  // As a fallback for English, we'll use normal fonts.

  let yPos = 20;

  // Header Section
  doc.setFontSize(22);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const title = isAr
    ? "تقرير تصميم الخلطة الخرسانية"
    : "Concrete Mix Design Report";

  // Center Title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, pageWidth / 2, yPos, { align: "center" });

  if (companyName) {
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(companyName, pageWidth / 2, yPos, { align: "center" });
  }

  yPos += 15;
  doc.setDrawColor(200);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Identity Section (Mix Info)
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(
    isAr ? "معلومات الخلطة" : "Mix Identity",
    isAr ? pageWidth - 15 : 15,
    yPos,
    { align: isAr ? "right" : "left" },
  );

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(50);

  const infoTableBody = [
    [
      isAr ? "العميل" : "Customer",
      mixData?.name || "-",
      isAr ? "كود الخلطة" : "Mix Ref",
      mixData?.code || "-",
    ],
    [
      isAr ? "الموقع" : "Site",
      mixData?.trialInfo?.site || "-",
      isAr ? "الصنف" : "Strength Class",
      mixData?.strengthClass || "-",
    ],
    [
      isAr ? "تاريخ التقرير" : "Date",
      format(new Date(), "PPP", { locale: isAr ? ar : undefined }),
      isAr ? "الإصدار" : "Version",
      mixData?.version?.toString() || "1",
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    body: infoTableBody,
    theme: "plain",
    styles: {
      halign: isAr ? "right" : "left",
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: {
      0: { textColor: primaryColor },
      2: { textColor: primaryColor },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Materials & Weights Section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(
    isAr ? "أوزان المواد (كغ / م³)" : "Material Weights (kg/m³)",
    isAr ? pageWidth - 15 : 15,
    yPos,
    { align: isAr ? "right" : "left" },
  );

  yPos += 8;

  const weightsHead = isAr
    ? [
        [
          "المادة",
          "الوزن (kg)",
          "الوزن النوعي (S.G)",
          "الرطوبة %",
          "الامتصاص %",
        ],
      ]
    : [
        [
          "Material",
          "Weight (kg)",
          "Specific Gravity",
          "Moisture %",
          "Absorption %",
        ],
      ];

  const weightsBody = (mixData?.components || []).map((c: any) => [
    c.materialName || "-",
    c.quantity?.toFixed(2) || "0",
    c.specificGravity?.toFixed(3) || "0",
    c.moistureContent?.toFixed(1) || "0",
    c.absorption?.toFixed(1) || "0",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: weightsHead,
    body: weightsBody,
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { halign: "center" },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Lab Results
  if (mixData?.labResults) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(
      isAr ? "النتائج المخبرية" : "Lab Results",
      isAr ? pageWidth - 15 : 15,
      yPos,
      { align: isAr ? "right" : "left" },
    );
    yPos += 8;

    const labTableBody = [
      [
        isAr ? "الهبوط المبدئي (ملم)" : "Initial Slump (mm)",
        mixData.labResults.slumpInitial || "-",
        isAr ? "نطاق الهبوط (ملم)" : "Slump Range (mm)",
        mixData.labResults.slumpRange || "-",
      ],
      [
        isAr ? "درجة الحرارة" : "Temperature",
        `${mixData.labResults.ambientTemp || "-"} °C`,
        isAr ? "كثافة الخرسانة (كغ/م³)" : "Fresh Density (kg/m³)",
        mixData.labResults.freshDensity || "-",
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      body: labTableBody,
      theme: "grid",
      styles: { halign: "center" },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer / Signatures
  if (yPos > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(
    isAr
      ? "إعتماد المختبر: ......................."
      : "Lab Approval: .......................",
    30,
    yPos,
  );
  doc.text(
    isAr
      ? "إعتماد الإدارة: ......................."
      : "Management Approval: .......................",
    pageWidth - 80,
    yPos,
  );

  // Save the PDF
  const fileName = `MixDesign_${mixData?.code || "Draft"}.pdf`;
  doc.save(fileName);
};

export interface SievePDFOptions {
  analysisData: any;
  companyNameAr?: string;
  companyNameEn?: string;
  logoUrl?: string;
}

export const exportSieveAnalysisToPDF = async ({
  analysisData,
  companyNameAr,
  companyNameEn,
  logoUrl,
}: SievePDFOptions) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [37, 99, 235]; // Royal Blue
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Header Section
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, "PNG", 15, 10, 25, 25);
    } catch (e) {
      console.warn("Could not load logo", e);
    }
  }

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(18);
  doc.text(companyNameAr || "شركة الخرسانة الجاهزة", pageWidth - 15, 15, {
    align: "right",
  });
  doc.setFontSize(12);
  doc.text(companyNameEn || "Ready Mix Concrete Co.", pageWidth - 15, 21, {
    align: "right",
  });

  yPos = 40;
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.8);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("شهادة فحص المختبر - التحليل المنخلي", pageWidth / 2, yPos, {
    align: "center",
  });
  doc.setFontSize(11);
  yPos += 6;
  doc.text(
    "Laboratory Test Certificate - Sieve Analysis",
    pageWidth / 2,
    yPos,
    { align: "center" },
  );

  yPos += 12;

  // Basic Info Table (Bilingual labels)
  const infoTable = [
    [
      {
        content: "التاريخ / Date:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      format(new Date(), "dd/MM/yyyy"),
      {
        content: "رقم التقرير / Report ID:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      `SA-${analysisData.id.toString().toUpperCase()}`,
    ],
    [
      {
        content: "تاريخ أخذ العينة / Sampling Date:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.sampleDate
        ? format(new Date(analysisData.sampleDate), "dd/MM/yyyy")
        : "-",
      {
        content: "تاريخ الفحص / Testing Date:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.testDate
        ? format(new Date(analysisData.testDate), "dd/MM/yyyy")
        : "-",
    ],
    [
      {
        content: "المادة / Material:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.material?.name || "-",
      {
        content: "المشروع / Project:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.projectName || "-",
    ],
    [
      {
        content: "المصدر / Source:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.source || "-",
      {
        content: "الفاحص / Inspector:",
        styles: { fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      analysisData.inspectorName || "-",
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    body: infoTable,
    theme: "grid",
    styles: {
      halign: "right",
      fontSize: 9,
      cellPadding: 2.5,
      fontStyle: "normal",
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 50, halign: "center" },
      2: { cellWidth: 45 },
      3: { cellWidth: 50, halign: "center" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Technical Data Row
  const technicalData = [
    [
      "الرطوبة / Moisture",
      "الأطيان / Clay",
      "بعد الغسل / Washed",
      "بعد التجفيف / Dried",
      "الوزن الكلي / Total",
    ],
    [
      `${analysisData.moistureContent}%`,
      `${analysisData.clayContent}%`,
      `${analysisData.washWeight} g`,
      `${analysisData.dryWeight} g`,
      `${analysisData.totalWeight} g`,
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    body: technicalData,
    theme: "grid",
    styles: { halign: "center", fontSize: 9, cellPadding: 3 },
    bodyStyles: { fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [71, 85, 105];
        data.cell.styles.fontSize = 8;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Sieve Comparison Table
  const results = JSON.parse(analysisData.results || "[]");
  const tableHead = [
    [
      "Sieve (mm)\nالمنخل",
      "Retained (g)\nالوزن المحجوز",
      "Retained %\n٪ المحجوز",
      "Cum. Ret. %\n٪ المحجوز التراكمي",
      "Passing %\n٪ المار",
      "Limits\nالحدود",
      "Status\nالحالة",
    ],
  ];

  const tableBody = results.map((r: any) => [
    r.size.toFixed(2),
    r.retained.toFixed(1),
    `${r.percentRetained.toFixed(1)}%`,
    `${r.cumulativeRetained.toFixed(1)}%`,
    r.passing.toFixed(1),
    r.minLimit !== undefined ? `${r.minLimit} - ${r.maxLimit}` : "-",
    r.status === "PASS"
      ? "OK / مطابق"
      : r.status === "FAIL"
        ? "Fail / فشل"
        : "Review",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      halign: "center",
      fontSize: 8,
    },
    styles: { halign: "center", fontSize: 9, cellPadding: 3 },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 6) {
        const status = results[data.row.index].status;
        if (status === "FAIL") {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "PASS") {
          data.cell.styles.textColor = [21, 128, 61];
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Final Result & FM
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Fineness Modulus (F.M): ${analysisData.finenessModulus?.toFixed(2) || "-"}`,
    15,
    yPos,
  );

  const isAccepted =
    analysisData.zone === "PASSED" || analysisData.zone === "APPROVED";
  if (isAccepted) {
    doc.setTextColor(21, 128, 61);
    doc.text("النتيجة النهائية: مقبول / Accepted", pageWidth - 15, yPos, {
      align: "right",
    });
  } else {
    doc.setTextColor(185, 28, 28);
    doc.text("النتيجة النهائية: مرفوض / Rejected", pageWidth - 15, yPos, {
      align: "right",
    });
  }

  yPos += 25;
  // Signature Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text("Laboratory In-charge", 15, yPos);
  doc.text("Executive Manager", pageWidth / 2, yPos, { align: "center" });
  doc.text("Quality Control", pageWidth - 15, yPos, { align: "right" });

  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("مسؤول المختبر", 15, yPos);
  doc.text("المدير التنفيذي", pageWidth / 2, yPos, { align: "center" });
  doc.text("ضبط الجودة", pageWidth - 15, yPos, { align: "right" });

  yPos += 15;
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(15, yPos, 55, yPos);
  doc.line(pageWidth / 2 - 20, yPos, pageWidth / 2 + 20, yPos);
  doc.line(pageWidth - 55, yPos, pageWidth - 15, yPos);

  // Footer Branding
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Certificate No: ${analysisData.id} | System Generated Report`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  doc.save(`SieveReport_${analysisData.id}.pdf`);
};
