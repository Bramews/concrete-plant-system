"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlan, updatePlan, deletePlan } from "@/app/actions/plans";
import { Icons } from "@/components/ui/Icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "@/lib/toast";

interface Feature {
  id: string;
  description: string | null;
}

interface PlanEditorProps {
  plan?: {
    id: number;
    key: string;
    name: string;
    description: string | null;
    maxUsers: number;
    maxStorage: number;
    maxOrders: number;
    maxProjects: number;
    price: number;
    features: string; // JSON string from DB
  };
  availableFeatures?: Feature[];
  isNew?: boolean;
}

export function PlanEditor({
  plan,
  availableFeatures = [],
  isNew = false,
}: PlanEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse initial features
  let initialFeatures: string[] = [];
  try {
    if (plan?.features) {
      initialFeatures = JSON.parse(plan.features);
    }
  } catch (e) {
    console.error("Failed to parse plan features", e);
  }

  const [formData, setFormData] = useState({
    key: plan?.key || "",
    name: plan?.name || "",
    description: plan?.description || "",
    maxUsers: plan?.maxUsers || 5,
    maxStorage: plan?.maxStorage || 1024,
    maxOrders: plan?.maxOrders || 100,
    maxProjects: plan?.maxProjects || 3,
    price: plan?.price || 0,
    features: initialFeatures,
  });

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

  const executeAction = async () => {
    try {
      await confirmConfig.action();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      if (isNew) {
        const res = await createPlan(formData);
        if (res.success) {
          toast.success("Plan created successfully");
          router.push("/admin/plans");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create plan");
        }
      } else {
        if (!plan) return;
        const res = await updatePlan(plan.id, formData);
        if (res.success) {
          toast.success("Plan updated successfully");
          router.push("/admin/plans");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update plan");
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!plan) return;

    setConfirmConfig({
      isOpen: true,
      title: "Delete Plan",
      description:
        "Are you sure you want to delete this plan? This active cannot be undone.",
      variant: "danger",
      action: async () => {
        startTransition(async () => {
          const res = await deletePlan(plan.id);
          if (res.success) {
            toast.success("Plan deleted successfully");
            router.push("/admin/plans");
            router.refresh();
          } else {
            toast.error(res.error || "Failed to delete plan");
          }
        });
      },
    });
  };

  const toggleFeature = (featureId: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(featureId);
      if (exists) {
        return {
          ...prev,
          features: prev.features.filter((f) => f !== featureId),
        };
      } else {
        return {
          ...prev,
          features: [...prev.features, featureId],
        };
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl mx-auto bg-slate-900/50 p-8 rounded-xl border border-white/5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">
            Basic Info
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Plan Key (Unique ID)
            </label>
            <input
              type="text"
              disabled={!isNew}
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              required
              placeholder="e.g., ENTERPRISE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
              placeholder="e.g., Enterprise Plan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Brief description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Price (SAR / Month)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-green-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">
            Limits & Quotas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Max Users (-1 unlim.)
              </label>
              <input
                type="number"
                value={formData.maxUsers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUsers: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Storage (MB)
              </label>
              <input
                type="number"
                value={formData.maxStorage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStorage: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Orders / Month
              </label>
              <input
                type="number"
                value={formData.maxOrders}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxOrders: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Projects
              </label>
              <input
                type="number"
                value={formData.maxProjects}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxProjects: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2 pt-4">
            Features
          </h3>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
            {availableFeatures.map((feat) => {
              const checked = formData.features.includes(feat.id);
              return (
                <div
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? "bg-indigo-500/10 border-indigo-500/50"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      checked
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "border-slate-600"
                    }`}
                  >
                    {checked && <Icons.Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">{feat.id}</div>
                    <div className="text-sm font-bold text-slate-500">
                      {feat.description}
                    </div>
                  </div>
                </div>
              );
            })}
            {availableFeatures.length === 0 && (
              <p className="text-slate-500 text-sm italic">
                No features defined.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-8">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isPending ? (
            <Icons.Loader className="animate-spin w-4 h-4" />
          ) : (
            <Icons.Save className="w-4 h-4" />
          )}
          {isNew ? "Create Plan" : "Save Changes"}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Icons.Trash className="w-4 h-4" />
            Delete Plan
          </button>
        )}
      </div>
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        isPending={isPending}
      />
    </form>
  );
}
