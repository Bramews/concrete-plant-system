"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/Icons";

const TABS = [
  {
    name: "My Profile",
    href: "/system/settings/profile",
    icon: "User",
    role: "ALL",
  },
  {
    name: "Company Settings",
    href: "/system/settings/company",
    icon: "Factory",
    role: "ADMIN",
  },
  {
    name: "System Control",
    href: "/system/settings/system",
    icon: "Shield",
    role: "OWNER",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Icons.Settings className="w-8 h-8 text-primary" />
          SETTINGS
        </h1>
        <p className="text-muted-foreground">
          System configuration and preferences
        </p>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = Icons[tab.icon as keyof typeof Icons];
          // Note: In real app, we'd hide non-permitted tabs.
          // For now we render all but page access is protected by server.
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>

      <div className="min-h-[500px]">{children}</div>
    </div>
  );
}
