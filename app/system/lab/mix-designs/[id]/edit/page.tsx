import {
  getMixDesignById,
  getMaterials,
  updateMixDesign,
  getMixDesignHistory,
} from "@/app/actions/lab";
import { getLabSettings } from "@/app/actions/lab-settings";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
const MixDesignManager = dynamic(
  () => import("@/components/lab/MixDesignManager"),
  { loading: () => <p>Loading Mix Design Manager...</p> },
);

export default async function EditMixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mixId = parseInt(id, 10);
  if (isNaN(mixId)) {
    notFound();
  }
  const mix = await getMixDesignById(mixId);
  if (!mix) notFound();

  // Rule: No Edit after Approve
  if (mix.status === "APPROVED") {
    redirect(`/system/lab/mix-designs/${mix.id}/view`);
  }

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role === "LAB_TECH" || user.role === "LAB_TECHNICIAN") {
    redirect("/system/lab/mix-designs");
  }

  const [materials, settingsRes, history] = await Promise.all([
    getMaterials(),
    getLabSettings(),
    getMixDesignHistory(mix.code),
  ]);

  const { getCurrentLanguage } = await import("@/lib/locale");
  const lang = await getCurrentLanguage();

  async function handleSave(data: any) {
    "use server";
    await updateMixDesign(mixId, data);
    return { success: true };
  }

  async function handleApprove() {
    "use server";
    const { approveMixDesign } = await import("@/app/actions/lab");
    await approveMixDesign(mixId);
    redirect(`/system/lab/mix-designs/${mixId}/view`);
  }

  async function handleDuplicate(data: any) {
    "use server";
    const { createMixDesign } = await import("@/app/actions/lab");
    const newMix = await createMixDesign(data);
    redirect(`/system/lab/mix-designs/${newMix.id}/edit`);
  }

  return (
    <MixDesignManager
      initialData={mix as any}
      materials={materials}
      settings={settingsRes.success ? settingsRes.data : {}}
      onSave={handleSave}
      onApprove={handleApprove}
      onDuplicate={handleDuplicate}
      lang={lang}
      history={history}
    />
  );
}
