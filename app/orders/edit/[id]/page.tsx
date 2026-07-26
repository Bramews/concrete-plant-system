import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { dictionary, Locale } from "@/lib/dictionary";
import { redirect } from "next/navigation";
import OrderForm from "../../OrderForm";

export default async function EditOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    redirect("/orders");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  const t = dictionary[lang];

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) redirect("/orders");
  if (order.status !== "DRAFT" && order.status !== "REJECTED") {
    redirect("/orders");
  }

  const customers = await prisma.customer.findMany();
  const projects = await prisma.project.findMany();
  const mixes = await prisma.mixDesign.findMany();

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 className="page-title">
        {"تعديل الطلب"} #{order.orderNumber}
      </h1>
      <OrderForm
        initialData={order}
        customers={customers}
        projects={projects}
        mixes={mixes}
        lang={lang}
        translations={t}
      />
    </div>
  );
}
