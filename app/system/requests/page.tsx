import { redirect } from "next/navigation";

export default function RequestsRoot() {
  redirect("/system/requests/internal");
}
