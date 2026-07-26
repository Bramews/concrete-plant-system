import React from "react";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "pink" | "cyan" | "purple" | "emerald";
  noPadding?: boolean;
}

const glowStyles = {
  pink: "border-pink-500/20 hover:border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.05)] hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]",
  cyan: "border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]",
  purple:
    "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]",
  emerald:
    "border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
};

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className = "",
  glowColor = "cyan",
  noPadding = false,
}) => {
  return (
    <div
      className={`
      relative overflow-hidden group
      bg-[rgba(2,6,23,0.4)] backdrop-blur-xl
      border rounded-2xl transition-all duration-500
      ${glowStyles[glowColor]}
      ${noPadding ? "" : "p-6"}
      ${className}
    `}
    >
      {/* Dynamic Background Glow */}
      <div
        className={`
        absolute -inset-2 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-700 pointer-events-none
        bg-gradient-to-br from-transparent via-white/10 to-transparent
      `}
      ></div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
