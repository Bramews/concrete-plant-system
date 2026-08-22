import { redirect } from "next/navigation";

export default function LegacyInvoicesRedirect() {
  redirect("/system/accountant/invoices");
}

