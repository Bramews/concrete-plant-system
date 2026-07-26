import { redirect } from "next/navigation";

export default function SalesRoot() {
  redirect("/system/sales/orders");
}
