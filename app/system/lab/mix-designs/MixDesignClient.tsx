"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import { createMixDesign, approveMixDesign } from "@/app/actions/lab";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useDictionary } from "@/lib/dictionary-hooks";

interface MixDesignClientProps {
  initialMixes: {
    id: number;
    name: string;
    code: string;
    strengthClass?: string;
    status: string;
  }[];
  userRole: string;
}

export function MixDesignClient({
  initialMixes,
  userRole,
}: MixDesignClientProps) {
  const router = useRouter();
  const d = useDictionary().lab.mix_designs;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Permissions
  const canEdit = [
    "LAB_TECH",
    "LAB_ENGINEER",
    "MANAGER",
    "SYSTEM_OWNER",
  ].includes(userRole);
  const canApprove = ["LAB_ENGINEER", "MANAGER", "SYSTEM_OWNER"].includes(
    userRole,
  );

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "success" | "info";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
    action: async () => {},
  });

  const handleApprove = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: d.client.confirm_approve_title,
      description: d.client.confirm_approve_desc,
      variant: "warning",
      action: async () => {
        try {
          await approveMixDesign(id);
          toast.success(d.client.approve_success);
          router.refresh();
        } catch (error) {
          console.error(error);
          toast.error(d.client.approve_fail);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        onConfirm={async () => {
          await confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{d.client.title}</h2>
          <p className="text-muted-foreground text-sm">{d.client.subtitle}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Icons.Plus className="w-4 h-4" />
            {d.actions.create}
          </button>
        )}
      </div>

      {/* CREATE DIALOG MOCK (Inline for speed) */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-lg">{d.client.create_title}</h3>
            <form
              action={async (formData) => {
                const data = {
                  code: formData.get("code") as string,
                  name: formData.get("name") as string,
                  strengthClass: formData.get("strengthClass") as string,
                };
                try {
                  setLoading(true);
                  await createMixDesign(data);
                  setIsCreateOpen(false);
                  router.refresh();
                } catch (error) {
                  console.error(error);
                  toast.error(d.client.create_fail);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">
                    {d.client.code}
                  </label>
                  <input
                    name="code"
                    required
                    className="w-full px-3 py-2 rounded-md border bg-muted/20"
                    placeholder="e.g. C30-OPC"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">
                    {d.client.name}
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full px-3 py-2 rounded-md border bg-muted/20"
                    placeholder="Standard C30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">
                    {d.client.strength_class}
                  </label>
                  <select
                    name="strengthClass"
                    required
                    aria-label="Strength Class"
                    className="w-full px-3 py-2 rounded-md border bg-muted/20"
                  >
                    <option value="">{d.client.select_class}</option>
                    <option value="C15">C15</option>
                    <option value="C20">C20</option>
                    <option value="C25">C25</option>
                    <option value="C30">C30</option>
                    <option value="C35">C35</option>
                    <option value="C40">C40</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  {loading ? d.client.creating : d.client.create_draft}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-bold uppercase text-xs">
                {d.client.code}
              </th>
              <th className="px-4 py-3 font-bold uppercase text-xs">
                {d.client.name}
              </th>
              <th className="px-4 py-3 font-bold uppercase text-xs">
                {d.client.strength_class}
              </th>
              <th className="px-4 py-3 font-bold uppercase text-xs">
                {d.table.status}
              </th>
              <th className="px-4 py-3 font-bold uppercase text-xs text-right">
                {d.table.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialMixes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {d.client.no_mixes}
                </td>
              </tr>
            ) : (
              initialMixes.map((mix) => (
                <tr
                  key={mix.id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary">
                    {mix.code}
                  </td>
                  <td className="px-4 py-3 font-medium">{mix.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-bold text-xs">
                      {mix.strengthClass || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {mix.status === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-600 font-bold text-xs">
                        <Icons.CheckCircle className="w-3 h-3" />{" "}
                        {d.client.status_approved}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-600 font-bold text-xs">
                        <Icons.Clock className="w-3 h-3" />{" "}
                        {d.client.status_draft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      {mix.status === "DRAFT" && canApprove && (
                        <button
                          onClick={() => handleApprove(mix.id)}
                          className="text-xs font-bold text-green-600 hover:underline"
                        >
                          {d.actions.approve}
                        </button>
                      )}

                      {canEdit && (
                        <button
                          onClick={() =>
                            router.push(
                              `/system/lab/mix-designs/${mix.id}/edit`,
                            )
                          }
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {d.actions.edit}
                        </button>
                      )}

                      <button
                        onClick={() =>
                          router.push(`/system/lab/mix-designs/${mix.id}/view`)
                        }
                        className="text-xs font-bold text-muted-foreground hover:underline"
                      >
                        {d.actions.view}
                      </button>

                      <a
                        href={`/api/lab/mix-designs/${mix.id}/export`}
                        className="text-xs font-bold text-green-600 hover:underline"
                      >
                        {d.actions.export}
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
