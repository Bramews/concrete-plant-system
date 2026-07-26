import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { authorizeExport, watermarkData } from "./export-guard";

interface ExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  rtl?: boolean;
}

export const ExportUtils = {
  /**
   * Export to Excel (XLSX)
   */
  toExcel: async (
    data: any[],
    columns: { header: string; key: string }[],
    options: ExportOptions,
  ) => {
    const auth = await authorizeExport("EXCEL", data.length);
    if (auth.error) {
      alert(auth.error);
      return;
    }
    const secureData = await watermarkData(data, auth.userId!, auth.companyId!);

    const wsData = secureData.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        row[col.header] = item[col.key];
      });
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(wsData);

    // Apply RTL if needed
    if (options.rtl) {
      if (!worksheet["!views"]) worksheet["!views"] = [];
      worksheet["!views"].push({ RTL: true });
    }

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      options.sheetName || "Data",
    );
    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  },

  /**
   * Export to PDF using jsPDF
   */
  toPDF: async (
    data: any[],
    columns: { header: string; key: string }[],
    options: ExportOptions,
  ) => {
    const auth = await authorizeExport("PDF", data.length);
    if (auth.error) {
      alert(auth.error);
      return;
    }
    const secureData = await watermarkData(data, auth.userId!, auth.companyId!);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add Title
    if (options.title) {
      doc.setFontSize(18);
      doc.text(options.title, 14, 22);
    }

    const tableHeaders = [columns.map((col) => col.header)];
    const tableData = secureData.map((item) =>
      columns.map((col) => item[col.key]),
    );

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: options.title ? 30 : 20,
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`${options.filename}.pdf`);
  },

  /**
   * Common CSV Export
   */
  toCSV: async (
    data: any[],
    columns: { header: string; key: string }[],
    options: ExportOptions,
  ) => {
    const auth = await authorizeExport("CSV", data.length);
    if (auth.error) {
      alert(auth.error);
      return;
    }
    const secureData = await watermarkData(data, auth.userId!, auth.companyId!);

    const csvHeaders = columns.map((col) => `"${col.header}"`).join(",");
    const csvRows = secureData.map((item) =>
      columns.map((col) => `"${item[col.key] || ""}"`).join(","),
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    // Add BOM for Excel UTF-8 support (Arabic)
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${options.filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
