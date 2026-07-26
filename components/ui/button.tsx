import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] shadow-[var(--elevation-sm)]",
      secondary:
        "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-paper)] border border-[var(--color-border-main)]",
      outline:
        "border-2 border-[var(--color-border-main)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]",
      ghost:
        "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm font-bold",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-lg font-bold",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
