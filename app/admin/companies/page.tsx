import { getAllCompanies } from "@/app/actions/admin-saas";
import { deleteCompany } from "@/app/actions/companies";
import { getDeletedEntities } from "@/app/actions/recycle-bin";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionary";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { CompaniesClient } from "./CompaniesClient";
import { redirect } from "next/navigation";

export default async function CompaniesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  let companies: any[] = [];
  try {
    companies = await getAllCompanies();
  } catch (e: any) {
    if (e.message === "UNAUTHENTICATED" || e.message === "FORBIDDEN") {
      redirect("/api/auth/session-cleanup");
    }
  }

  let deletedCompanies: any[] = [];
  let deletedUsers: any[] = [];
  try {
    const deletedRes = await getDeletedEntities();
    deletedCompanies = deletedRes.companies || [];
    deletedUsers = deletedRes.users || [];
  } catch (e: any) {
    if (e.message === "UNAUTHENTICATED" || e.message === "FORBIDDEN") {
      redirect("/api/auth/session-cleanup");
    }
  }

  return (
    <div className="space-y-6 animate-slow-fade" dir="rtl">
      {/* Header logic and grid moved to CompaniesClient for better state management with the modal */}
      <CompaniesClient
        initialCompanies={companies}
        deletedCompanies={deletedCompanies}
        deletedUsers={deletedUsers}
        dict={dict}
      />
    </div>
  );
}
