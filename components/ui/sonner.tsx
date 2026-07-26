"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group font-sans"
      position="bottom-left"
      dir="ltr"
      expand={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-950/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl data-[type=success]:!bg-gradient-to-br data-[type=success]:!from-emerald-600 data-[type=success]:!to-teal-800 data-[type=success]:!text-white data-[type=success]:!border-emerald-500/50 data-[type=success]:!shadow-[0_0_30px_rgba(16,185,129,0.5)]",
          description:
            "group-[.toast]:text-muted-foreground data-[type=success]:!text-emerald-100 font-medium",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
