import React from "react";

interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  glow?: boolean;
}

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary/80 shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]",
  secondary:
    "bg-cyan-500 text-white hover:bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
  ghost:
    "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-white/20",
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = "primary",
  glow = true,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`
        px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
        active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]}
        ${!glow ? "shadow-none hover:shadow-none" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
