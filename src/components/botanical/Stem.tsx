"use client";

import { useRef, type ReactNode } from "react";

import { useScrollProgress } from "@/lib/motion/useScrollProgress";

interface StemProps {
  children: ReactNode;
  className?: string;
}

/**
 * A branching narrative: one continuous stem runs down the page margin and
 * every chapter inside it branches from it (`SectionHeader` places a
 * `.branch-node` on it). The stem grows with the reader's progress through
 * the story; it is simply drawn in full when motion is reduced. Visible from
 * the md breakpoint; on phones the chapters stack.
 */
export function Stem({ children, className = "" }: StemProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(ref, { mode: "anchor", anchor: 0.7 });
  return (
    <div ref={ref} className={`stem ${className}`}>
      {children}
    </div>
  );
}
