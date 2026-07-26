import React from "react";

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "outline";
  className?: string;
  size?: "xs" | "sm" | "md";
}

const variants = {
  primary:
    "bg-primary/10 text-primary border-primary/20 shadow-[0_0_8px_rgba(255,0,255,0.2)]",
  secondary:
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
  success:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
  warning:
    "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
  error:
    "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]",
  outline: "bg-transparent text-slate-300 border-white/10",
};

const sizes = {
  xs: "px-1.5 py-0.5 text-[9px]",
  sm: "px-2 py-0.5 text-sm font-bold",
  md: "px-3 py-1 text-sm font-bold",
};

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children,
  variant = "primary",
  size = "sm",
  className = "",
}) => {
  return (
    <span
      className={`
      inline-flex items-center font-bold uppercase tracking-widest
      border rounded-full transition-all duration-300
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}
    >
      {children}
    </span>
  );
};
