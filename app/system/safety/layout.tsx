import { ReactNode } from "react";
import SystemWrapper from "@/components/layout/SystemWrapper";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";

export default async function SafetyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];

  const links = [
    {
      href: "/system/safety/reports",
      label: "تقارير الحوادث",
    },
    {
      href: "/system/safety/compliance",
      label: "الالتزام",
    },
  ];

  return (
    <SystemWrapper title={"نظام السلامة"} links={links}>
      {children}
    </SystemWrapper>
  );
}
