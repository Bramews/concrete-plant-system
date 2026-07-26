"use server";

import { getSieveAnalysisById } from "@/app/actions/lab";
import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SieveReportClient } from "./SieveReportClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SieveReportPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }
  const analysis = await getSieveAnalysisById(numericId);

  if (!analysis) {
    notFound();
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Locale) || "ar";
  const dict = getDictionary(lang);

  return (
    <SieveReportClient
      analysis={analysis}
      dict={dict.lab}
      lang={lang}
      config={analysis.company?.labReportConfig}
    />
  );
}
