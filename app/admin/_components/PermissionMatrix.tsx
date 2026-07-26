"use client";

import { useState } from "react";
import {
  RolePermissionMatrix,
  togglePermission,
} from "@/app/actions/permissions";
import { Icons } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function PermissionMatrix({
  matrix,
  roles,
  permissions,
  dict,
}: {
  matrix: RolePermissionMatrix;
  roles: string[];
  permissions: string[];
  dict: any;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (
    role: string,
    perm: string,
    currentGranted: boolean,
    source: string,
  ) => {
    // If source is DEFAULT and currently granted, we effectively can't "revoke" it with current logic
    // unless we implement explicit deny. For now, we only toggle DB overrides.
    // If it's DEFAULT (Green), clicking it essentially does nothing or adds a redundant DB entry?
    // Actually, if I grant it explicitly, it becomes DB (Green).
    // If I revoke DB, it falls back to DEFAULT (Green) or NONE (Red).

    const newGranted = !currentGranted;

    // Optimistic UI could be complex here due to the fallback logic.
    setLoading(`${role}-${perm}`);

    try {
      // If it's currently DEFAULT, we are adding a DB entry (Redundant Grant? Or meaningless?)
      // Wait, if it's already Granted (Default), why Grant again?
      // Maybe the user wants to ensure it stays granted providing specific audit trail?

      // If it's NONE, we Grant (DB).
      // If it's DB, we Revoke (becomes DEFAULT or NONE).

      // Just toggle the "DB" presence essentially.
      // But the UI shows "Granted/Denied".

      // Let's rely on the Server Action to handle the DB op.
      // We pass the INTENDED state.
      // If currently Granted, we want to Revoke.
      // If currently Denied, we want to Grant.

      const result = await togglePermission(role as any, perm, !currentGranted);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم تحديث الصلاحية بنجاح");
        router.refresh(); // Refresh to get updated Matrix from server logic
      }
    } catch (e) {
      console.error(e);
      toast.error("فشل تحديث الصلاحية");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm text-left rtl:text-right">
        <thead className="text-sm font-bold text-slate-400 uppercase bg-slate-900/50">
          <tr>
            <th className="px-6 py-4 sticky left-0 bg-slate-900 z-10">
              {dict.admin.permissions.legend.permission_col || "Permission"}
            </th>
            {roles.map((role) => (
              <th key={role} className="px-6 py-4 text-center">
                {dict.common.roles[role] || role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {permissions.map((perm) => (
            <tr key={perm} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-mono text-sm font-bold text-cyan-300 sticky left-0 bg-slate-950 z-10">
                {dict.admin.permissions.actions?.[perm] || perm}
              </td>
              {roles.map((role) => {
                const state = matrix[role as keyof RolePermissionMatrix]?.[
                  perm
                ] || { granted: false, source: "NONE" };
                const isUpdating = loading === `${role}-${perm}`;

                return (
                  <td key={`${role}-${perm}`} className="px-6 py-4 text-center">
                    <button
                      onClick={() =>
                        handleToggle(role, perm, state.granted, state.source)
                      }
                      disabled={isUpdating}
                      className={`
                        relative w-8 h-8 rounded flex items-center justify-center transition-all
                        ${
                          state.granted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700"
                        }
                        ${isUpdating ? "opacity-50 cursor-wait" : ""}
                      `}
                      title={`Source: ${state.source}`}
                    >
                      {isUpdating ? (
                        <Icons.Loader className="w-4 h-4 animate-spin" />
                      ) : state.granted ? (
                        <Icons.Check className="w-4 h-4" />
                      ) : (
                        <Icons.X className="w-3 h-3" />
                      )}

                      {/* Source Dot */}
                      {state.source === "DB" && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-slate-950"
                          title="Database Override"
                        ></span>
                      )}
                      {state.source === "DEFAULT" && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border-2 border-slate-950"
                          title="System Default"
                        ></span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
