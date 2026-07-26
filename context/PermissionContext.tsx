"use client";

import { createContext, useContext, ReactNode } from "react";

interface PermissionContextType {
  permissions: string[]; // ["users.read", "orders.create"]
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
});

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  return (
    <PermissionContext.Provider value={{ permissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);

  const has = (permission: string) => {
    // Handle wildcard or specific
    // For now simple string match
    return context.permissions.includes(permission.toUpperCase()); // standardized to UPPERCASE in logic?
    // In DB we stored as "USERS.CREATE" (Upper).
    // In props we might pass "users.create".
  };

  return { has };
}

export function ClientGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { has } = usePermission();

  if (has(permission.toUpperCase())) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
