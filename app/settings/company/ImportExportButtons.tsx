"use client";

import { useState } from "react";
import {
  exportSettingsAction,
  previewImportAction,
  applyImportAction,
} from "@/app/actions/settings";
import { toast } from "@/lib/toast";

export function ImportExportButtons() {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [jsonContent, setJsonContent] = useState<string>("");

  const handleExport = async () => {
    try {
      const data = await exportSettingsAction();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      toast.success("تم تصدير الإعدادات بنجاح!");
    } catch (e) {
      toast.error("فشل التصدير: " + String(e));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      setJsonContent(content);
      try {
        const parsed = JSON.parse(content);
        const res = await previewImportAction(parsed);
        setPreview(res);
        setImporting(true);
      } catch (err: unknown) {
        toast.error("ملف غير صالح: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!jsonContent) return;
    try {
      const parsed = JSON.parse(jsonContent);
      await applyImportAction(parsed);
      toast.success("تم استيراد الإعدادات بنجاح!");
      setImporting(false);
      setPreview(null);
      setJsonContent("");
    } catch (err: unknown) {
      toast.error("فشل الاستيراد: " + (err as Error).message);
    }
  };

  return (
    <div className="flex gap-4 items-center mb-8 bg-gray-50 p-4 rounded border">
      <div className="flex-1">
        <h3 className="font-bold text-gray-700">Settings I/O</h3>
        <p className="text-sm font-bold text-gray-500">
          Secure Backup & Restore
        </p>
      </div>

      <button
        onClick={handleExport}
        className="px-4 py-2 bg-white border rounded hover:bg-gray-50 text-sm font-medium"
      >
        📥 Export JSON
      </button>

      <div className="relative">
        <input
          type="file"
          accept="application/json"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Import settings"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
          📤 Import JSON
        </button>
      </div>

      {importing && preview && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setImporting(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Import Preview</h3>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-2 font-mono bg-gray-100 p-2 rounded">
                <div>Total Keys: {preview.total}</div>
                <div className="text-green-600">Valid: {preview.valid}</div>
                <div className="text-red-600">
                  Locked (Skipped): {preview.locked}
                </div>
              </div>
              <table className="w-full text-left text-sm font-bold">
                <thead>
                  <tr className="border-b">
                    <th>Key</th>
                    <th>Old</th>
                    <th>New</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changes.map((c: any) => (
                    <tr
                      key={c.key}
                      className={c.status === "LOCKED" ? "opacity-50" : ""}
                    >
                      <td className="py-1">{c.key}</td>
                      <td className="truncate max-w-[50px]">{c.oldValue}</td>
                      <td className="truncate max-w-[50px]">{c.newValue}</td>
                      <td>{c.status === "LOCKED" ? "🔒" : "✅"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setImporting(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
