import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BrandingForm from "./BrandingForm";

export default async function CompanyBrandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = parseInt(id, 10);
  if (isNaN(companyId)) {
    notFound();
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { branding: true },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          إعدادات العلامة التجارية
        </h1>
        <p className="text-slate-400">
          تخصيص واجهة تسجيل الدخول لشركة:{" "}
          <span className="text-indigo-400 font-semibold">{company.name}</span>
        </p>
      </div>

      <BrandingForm company={company} branding={company.branding} />
    </div>
  );
}
