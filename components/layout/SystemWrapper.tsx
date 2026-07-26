"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

interface SystemWrapperProps {
  children: ReactNode;
  title: string;
  links: NavLink[];
}

/**
 * SystemWrapper — Sub-module navigation strip.
 *
 * NOTE: This is NOT a full-page layout. The global <Sidebar> + <Header>
 * are already rendered by app/system/layout.tsx. This component only adds
 * a secondary tab-navigation row above the module content.
 */
export default function SystemWrapper({ children, links }: SystemWrapperProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {/* ── Module Sub-Nav ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem",
          background: "rgba(13,21,38,0.7)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          flexWrap: "wrap",
        }}
      >
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/system" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sub-nav-link${isActive ? " active" : ""}`}
            >
              {link.icon && <span>{link.icon}</span>}
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* ── Module Content ── */}
      <div className="animate-fade-in">{children}</div>
    </div>
  );
}
