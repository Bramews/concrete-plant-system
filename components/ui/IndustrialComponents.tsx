"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function AppCard({
  title,
  subtitle,
  children,
  className,
  headerAction,
}: AppCardProps) {
  return (
    <div className={cn("app-card bg-card", className)}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm font-bold text-muted-foreground font-latin font-bold uppercase tracking-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

// StatusBadge
type StatusType =
  | "active"
  | "read-only"
  | "locked"
  | "pending"
  | "success"
  | "warning"
  | "error";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles: Record<StatusType, string> = {
    active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    "read-only": "bg-amber-500/10 border-amber-500/20 text-amber-600",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    locked: "bg-rose-500/10 border-rose-500/20 text-rose-600",
    error: "bg-rose-500/10 border-rose-500/20 text-rose-600",
    pending: "bg-slate-500/10 border-slate-500/20 text-slate-600",
  };

  return (
    <span
      className={cn(
        "status-badge px-3 py-1 font-black text-sm font-bold md:text-sm leading-relaxed whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      {label || status}
    </span>
  );
}

// ActionButton
interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function ActionButton({
  variant = "primary",
  size = "md",
  isLoading,
  className,
  children,
  ...props
}: ActionButtonProps) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger:
      "bg-destructive text-white font-bold rounded-[var(--radius)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50",
    ghost:
      "bg-transparent hover:bg-muted text-foreground font-bold rounded-[var(--radius)] transition-all active:scale-95 disabled:opacity-50",
  };

  const sizes = {
    xs: "px-3 py-1 text-sm font-bold",
    sm: "px-4 py-1.5 text-sm font-bold",
    md: "px-6 py-2.5 text-base font-bold",
    lg: "px-8 py-3 text-lg font-bold",
  };

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        "relative flex items-center justify-center gap-2",
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : null}
      {children}
    </button>
  );
}
