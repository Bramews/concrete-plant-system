import React from "react";
import { Icons } from "./Icons";

export const LoadingState = ({
  message = "Loading...",
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <Icons.Loader className="w-12 h-12 text-primary animate-spin" />
    <p className="text-muted-foreground animate-pulse font-medium">{message}</p>
  </div>
);

export const EmptyState = ({
  title = "No Data Found",
  message = "There's nothing to show here yet.",
  icon: Icon = Icons.Database,
  action,
}: {
  title?: string;
  message?: string;
  icon?: any;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-card/20 rounded-xl border border-dashed border-border/50">
    <div className="p-4 bg-muted/30 rounded-full mb-6">
      <Icon className="w-12 h-12 text-muted-foreground/60" />
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-sm mb-8">{message}</p>
    {action}
  </div>
);

export const ErrorState = ({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-xl border border-destructive/20">
    <div className="p-4 bg-destructive/10 rounded-full mb-6">
      <Icons.AlertCircle className="w-12 h-12 text-destructive" />
    </div>
    <h3 className="text-xl font-bold text-destructive mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-sm mb-8">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-destructive text-white rounded-lg font-bold hover:bg-destructive/90 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

export const LockedState = ({
  reason = "This module is locked by system sovereignty.",
}: {
  reason?: string;
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-amber-500/5 rounded-xl border border-amber-500/20">
    <div className="p-4 bg-amber-500/10 rounded-full mb-6">
      <Icons.Lock className="w-12 h-12 text-amber-500" />
    </div>
    <h3 className="text-xl font-bold text-amber-500 mb-2">Module Locked</h3>
    <p className="text-muted-foreground max-w-sm mb-4">{reason}</p>
    <div className="text-sm font-bold text-amber-500/60 uppercase font-black tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
      Read-Only Mode
    </div>
  </div>
);
