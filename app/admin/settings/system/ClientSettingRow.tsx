"use client";

import { useState } from "react";
import {
  updateSystemSettingAction,
  toggleSystemSettingLockAction,
} from "@/app/actions/settings";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";

export default function ClientSettingRow({
  setting,
}: {
  setting: { key: string; value: string; locked: boolean };
}) {
  const [val, setVal] = useState(setting.value);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await updateSystemSettingAction(setting.key, val);
      setIsEditing(false);
    } catch {
      toast.error("فشل في حفظ الإعدادات");
    }
    setLoading(false);
  }

  async function handleLock() {
    setConfirmOpen(true);
  }

  async function executeLock() {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await toggleSystemSettingLockAction(setting.key, !setting.locked);
    } catch {
      toast.error("فشل في تغيير قفل الإعداد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="p-4 font-mono text-sm text-gray-600">{setting.key}</td>
        <td className="p-4">
          {isEditing ? (
            <input
              className="border p-2 rounded w-full"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              title={`Edit value for ${setting.key}`}
              placeholder="Enter value"
              aria-label={`Edit value for ${setting.key}`}
            />
          ) : (
            <span className="font-medium text-gray-800">{setting.value}</span>
          )}
        </td>
        <td className="p-4">
          <span
            onClick={handleLock}
            className={`cursor-pointer px-2 py-1 rounded text-sm font-bold ${setting.locked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
          >
            {setting.locked ? "LOCKED 🔒" : "OPEN 🔓"}
          </span>
        </td>
        <td className="p-4">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={handleSave}
                className="text-green-600 hover:text-green-800 font-bold"
              >
                SAVE
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setVal(setting.value);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                Start
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Edit
            </button>
          )}
        </td>
      </tr>
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeLock}
        title={setting.locked ? "إلغاء قفل الإعداد" : "قفل الإعداد"}
        description={
          setting.locked
            ? "هل تريد إلغاء قفل هذا الإعداد؟"
            : "هل تريد قفل هذا الإعداد؟ لن تتمكن الشركات من تجاوزه."
        }
        variant="warning"
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </>
  );
}
