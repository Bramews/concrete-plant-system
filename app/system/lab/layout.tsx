import { getDictionary, Locale } from "@/lib/dictionary";
import { cookies } from "next/headers";

export default async function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Locale) || "ar";

  return <>{children}</>;
}
