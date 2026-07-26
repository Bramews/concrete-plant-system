import React from "react";
import { cn } from "@/lib/utils";

interface BidiTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /**
   * If true, it explicitly sets dir="ltr" on a generic span instead of using <bdi>.
   * Use only when <bdi> fails (e.g., in some strict flex/grid layouts with old browsers).
   */
  forceDir?: boolean;
}

/**
 * A Typography standard component designed specifically for Arabic (RTL) interfaces.
 * It isolates English/Latin strings (like IDs, Technical Terms) to prevent them
 * from rendering backwards, overflowing awkwardly, or breaking Flexbox alignments.
 *
 * It automatically applies a readable monospace/sans font for technical data.
 */
export function BidiText({
  children,
  className,
  forceDir = false,
  ...props
}: BidiTextProps) {
  if (forceDir) {
    return (
      <span
        dir="ltr"
        className={cn("inline-block font-sans tracking-wide", className)}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <bdi
      className={cn("font-sans tracking-wide whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </bdi>
  );
}
