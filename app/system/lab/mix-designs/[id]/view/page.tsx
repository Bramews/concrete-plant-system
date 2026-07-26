import dynamic from "next/dynamic";
const MixDesignManager = dynamic(
  () => import("@/components/lab/MixDesignManager"),
  { loading: () => <p>Loading Mix Design Manager...</p> },
);
import {
  getMixDesignById,
  getMaterials,
  createMixDesignRevision,
  approveMixDesign,
  getMixDesignHistory,
} from "@/app/actions/lab";
import { getLabSettings } from "@/app/actions/lab-settings";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export default async function ViewMixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mixId = parseInt(id, 10);
  if (isNaN(mixId)) {
    notFound();
  }
  const mix = await getMixDesignById(mixId, true);
  if (!mix) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [materials, settingsRes, history] = await Promise.all([
    getMaterials(),
    getLabSettings(),
    getMixDesignHistory(mixId),
  ]);

  const { getCurrentLanguage } = await import("@/lib/locale");
  const lang = await getCurrentLanguage();

  async function handleCreateRevision(
    note: string,
    newName?: string,
    newCode?: string,
  ) {
    "use server";
    const newMix = await createMixDesignRevision(mixId, note, newName, newCode);
    redirect(`/system/lab/mix-designs/${newMix.id}/edit`);
  }

  // Define a dummy handleSave as ReadOnly ignores saving anyway but required by component props.
  async function dummySave() {
    "use server";
    return true;
  }

  async function handleDuplicate(data: any) {
    "use server";
    const { createMixDesign } = await import("@/app/actions/lab");
    const newMix = await createMixDesign(data);
    redirect(`/system/lab/mix-designs/${newMix.id}/edit`);
  }

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {mix.status === "APPROVED" && (
        <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 border-b border-white/5 text-sm font-bold flex items-center justify-between">
          <span>
            هذه الخلطة معتمدة ولا يمكن تعديل بياناتها الأصلية ( للقراءة فقط )
          </span>
          <span className="opacity-70 text-xs">
            الاعتماد بواسطة: {mix.approvedBy?.name || mix.approverName || "—"}{" "}
            في{" "}
            {mix.approvedAt
              ? format(new Date(mix.approvedAt), "yyyy-MM-dd")
              : "-"}
          </span>
        </div>
      )}

      {/* Header section w/ Export button */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Link
            href="/system/lab/mix-designs"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-white">
            {mix.name}{" "}
            <span className="text-indigo-400 text-sm">v{mix.version}</span>
          </h1>
        </div>

        <a
          href={`/api/lab/mix-designs/${mix.id}/export-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Icons.Printer className="w-4 h-4" />
          {"تصدير / طباعة (PDF)"}
        </a>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <MixDesignManager
          initialData={mix as any}
          materials={materials}
          settings={settingsRes.success ? settingsRes.data : {}}
          onSave={dummySave}
          onCreateRevision={handleCreateRevision}
          onDuplicate={handleDuplicate}
          isReadOnly={true} // Forces the UI to show the 'Create Revision' flow if APPROVED
          lang={lang}
          history={history}
        />
      </div>
    </div>
  );
}
