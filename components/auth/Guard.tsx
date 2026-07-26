import { hasPermission } from "@/lib/auth/rbac";
import { cookies } from "next/headers";

// We need a way to get current user ID in server components.
// usually getUser() helper.
import { getUser } from "@/lib/auth/session";

interface GuardProps {
  permission: string; // "resource.action"
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function Guard({
  permission,
  children,
  fallback = null,
}: GuardProps) {
  const user = await getUser();

  if (!user) return fallback;

  const [resource, action] = permission.split(".");
  const granted = await hasPermission(user.id, resource, action);

  if (granted) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
