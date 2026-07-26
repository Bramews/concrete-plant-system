import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemLogs, getAllTenants } from "@/app/actions/admin-sovereignty";
import { getDictionary } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { LogsViewer } from "../_components/LogsViewer";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "SYSTEM_OWNER") redirect("/");

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as any) || "en";
  const dict = getDictionary(lang);

  const resolvedParams = await searchParams;
  const companyId = resolvedParams.companyId
    ? parseInt(resolvedParams.companyId as string)
    : undefined;
  const userId = resolvedParams.userId
    ? parseInt(resolvedParams.userId as string)
    : undefined;
  const search = resolvedParams.search as string;

  // Parallel Fetch
  const [logs, companies] = await Promise.all([
    getSystemLogs({ companyId, userId, search }),
    getAllTenants(),
  ]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {dict.admin.logs.title}
        </h1>
      </div>

      <LogsViewer logs={logs} companies={companies} dict={dict} />
    </div>
  );
}
