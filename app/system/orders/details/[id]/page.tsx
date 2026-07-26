import { getOrderById } from "@/app/actions/orders";
import { getCurrentUser } from "@/lib/auth";
import { OrderDetailsClient } from "./OrderDetailsClient";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }
  const user = await getCurrentUser();
  const order = await getOrderById(numericId);

  if (!order) notFound();

  const role = (
    typeof user?.role === "string" ? user?.role : (user?.role as any)?.name
  ) as string;

  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "ar") || "en";

  return (
    <div>
      <OrderDetailsClient order={order} userRole={role} lang={lang} />
    </div>
  );
}
