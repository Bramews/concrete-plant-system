import { redirect } from "next/navigation";

export default function SafetyRoot() {
  redirect("/system/safety/reports");
}
