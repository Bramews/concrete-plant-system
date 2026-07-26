"use client";

import { useState } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export default function ClientUserSettingRow({
  label,
  settingKey,
  meta,
}: {
  label: string;
  settingKey: string;
  meta: { value: string; locked: boolean; source: string };
}) {
  const [value, setValue] = useState(meta.value || "");
  const [message, setMessage] = useState("");

  async function handleSave() {
    setMessage("Saving...");
    try {
      // updateUserPreferences expects an object with theme and/or language
      // For now, we'll assume settingKey is one of those fields
      await updateUserPreferences({ [settingKey]: value });
      setMessage("✅ Saved");
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      setMessage("❌ Error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-700 text-sm">{label}</label>
        {meta.locked && (
          <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            🔒 Locked by {meta.source}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          disabled={meta.locked}
          className={`flex-1 border rounded px-3 py-2 text-sm ${meta.locked ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Not set"
        />
        {!meta.locked && (
          <ConfirmButton
            onConfirm={handleSave}
            message={`Update ${label}?`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
          >
            Save
          </ConfirmButton>
        )}
      </div>
      {message && (
        <p className="text-sm font-bold text-indigo-600 mt-1">{message}</p>
      )}
    </div>
  );
}
