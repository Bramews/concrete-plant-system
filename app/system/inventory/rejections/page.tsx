import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Locale } from "@/lib/dictionary";
import { getCurrentRole } from "@/lib/auth";
import RejectionList from "./RejectionList";
import { Toaster } from "sonner";
import styles from "./rejections.module.css";

export default async function MaterialRejectionsPage() {
  const role = await getCurrentRole();

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";

  // Fetch all rejections
  const rejections = await prisma.materialRejection.findMany({
    include: { material: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container">
      <h2 className={`page-title ${styles.pageTitle}`}>{"طلبات رفض المواد"}</h2>

      <RejectionList
        rejections={rejections as any}
        userRole={role || "OPERATOR"}
        lang={lang}
      />

      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
