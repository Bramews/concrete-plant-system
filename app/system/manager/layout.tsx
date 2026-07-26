import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

// Minimal Layout for Manager - No Sidebar
export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { canAccessSector } = await import("@/lib/permissions");
  if (!canAccessSector(user.role, "manager")) {
    redirect(
      "/access-denied?reason=Role+" +
        user.role +
        "+cannot+access+manager+sector",
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] w-full">
      {/* We remove the Sidebar and Header wrappers here to give full control to the page */}
      {/* The Operational Pulse acts as the header */}
      <main className="w-full h-full">{children}</main>
    </div>
  );
}
