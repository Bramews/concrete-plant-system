import Link from "next/link";
import { getArchivedMixDesigns } from "@/app/actions/lab";
import { Icons } from "@/components/ui/Icons";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";
import ArchivedMixTable from "./ArchivedMixTable";

export default async function ArchivedMixesPage() {
  const mixes = await getArchivedMixDesigns();
  const user = await getCurrentUser();

  const canDelete = [
    "SYSTEM_OWNER",
    "COMPANY_ADMIN",
    "MANAGER",
    "LAB_MANAGER",
  ].some((role) => user?.role === role);

  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <Icons.Archive className="w-6 h-6" />
          أرشيف الخلطات المجمدة
        </h1>
        <Link
          href="/system/lab/mix-designs"
          className="bg-white/5 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <Icons.ArrowRight className="w-4 h-4 ml-1" />
          العودة للخلطات النشطة
        </Link>
      </div>

      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
        <Icons.AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          الخلطات الموجودة هنا تعتبر ملغية وغير فعالة في النظام ولا يمكن
          استخدامها في طلبات جديدة. يمكنك النقر على الحذف النهائي للتخلص منها
          إلى الأبد، أو التراجع لإعادتها كمسودة. الحذف النهائي سيتطلب التأكد من
          عدم وجود أوردرات مرتبطة.
        </p>
      </div>

      <ArchivedMixTable
        mixes={mixes}
        dict={dict.lab.mix_designs}
        lang={lang}
        canDelete={canDelete}
      />
    </div>
  );
}
