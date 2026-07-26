import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import OrderForm from "../OrderForm";

export default async function NewOrderPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];

  const customers = await prisma.customer.findMany();
  const projects = await prisma.project.findMany();
  const mixes = await prisma.mixDesign.findMany();

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="page-title">{t.order.form.title}</h1>
      <OrderForm
        customers={customers}
        projects={projects}
        mixes={mixes}
        lang={lang}
        translations={t}
      />
    </div>
  );
}
