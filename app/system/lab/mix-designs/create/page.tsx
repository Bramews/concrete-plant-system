import { getMaterials, createMixDesign } from "@/app/actions/lab";
import { getLabSettings } from "@/app/actions/lab-settings";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import dynamic from "next/dynamic";
const MixDesignManager = dynamic(
  () => import("@/components/lab/MixDesignManager"),
  { loading: () => <p>Loading Mix Design Manager...</p> },
);

export default async function CreateMixPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role === "LAB_TECH" || user.role === "LAB_TECHNICIAN") {
    redirect("/system/lab/mix-designs");
  }

  const [materials, settingsRes] = await Promise.all([
    getMaterials(),
    getLabSettings(),
  ]);

  const { getCurrentLanguage } = await import("@/lib/locale");
  const lang = await getCurrentLanguage();

  async function handleSave(data: Parameters<typeof createMixDesign>[0]) {
    "use server";
    await createMixDesign(data);
    return { success: true };
  }

  return (
    <div className="h-full -m-6">
      <MixDesignManager
        materials={materials}
        settings={settingsRes.success ? settingsRes.data : {}}
        onSave={handleSave}
        lang={lang}
      />
    </div>
  );
}
