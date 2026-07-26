import { getOrders } from "@/app/actions/orders";
import { getCurrentUser } from "@/lib/auth";
import { OrderListClient } from "./OrderListClient";
import { getDictionary } from "@/lib/dictionary";
import { getCurrentLanguage } from "@/lib/locale";
import { getMixDesignById } from "@/app/actions/lab";

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ mixId?: string }>;
}) {
  const { mixId } = await searchParams;
  const user = await getCurrentUser();
  const lang = await getCurrentLanguage();
  const dict = getDictionary(lang);

  const parsedMixId = mixId ? parseInt(mixId) : undefined;
  const orders = await getOrders({
    mixDesignId: parsedMixId,
  });

  let mixData = null;
  if (parsedMixId) {
    mixData = await getMixDesignById(parsedMixId, true);
  }

  const role = (
    typeof user?.role === "string" ? user?.role : (user?.role as any)?.name
  ) as string;

  return (
    <div>
      <OrderListClient
        orders={orders}
        userRole={role}
        dict={dict}
        lang={lang}
        filteredMix={mixData}
      />
    </div>
  );
}
