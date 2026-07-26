import { redirect } from "next/navigation";

export default function AccountantRoot() {
  redirect("/system/accountant/invoices");
}
