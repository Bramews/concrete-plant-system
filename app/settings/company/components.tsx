"use client";

import { useState } from "react";
import { updateCompanySettingAction } from "@/app/actions/companies";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function SettingInput({
  label,
  settingKey,
  initialValue,
  locked = false,
  type = "text",
}: {
  label: string;
  settingKey: string;
  initialValue: string;
  locked?: boolean;
  type?: "text" | "color" | "select";
}) {
  const [value, setValue] = useState(initialValue);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setMessage("Saving...");
    try {
      await updateCompanySettingAction(settingKey, value);
      setMessage("✅ Saved");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("❌ Error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-700 text-sm">{label}</label>
        {locked && (
          <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
            🔒 Locked by System
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          disabled={locked}
          type={type}
          className={`flex-1 border rounded px-3 py-2 text-sm ${locked ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
          aria-label={`Edit ${label}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {!locked && (
          <ConfirmButton
            onConfirm={handleSave}
            message={`Are you sure you want to update ${label}?`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            Save
          </ConfirmButton>
        )}
      </div>
      {message && (
        <p className="text-sm font-bold text-blue-600 mt-1">{message}</p>
      )}
    </div>
  );
}
