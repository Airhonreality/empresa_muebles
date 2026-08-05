import type { ReactNode } from "react";

type Tone = "neutral" | "danger" | "warning" | "info";

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

/* Primitiva Badge de estado (A4 #6). Tonos semánticos del corpus (consolidado §3).
   Success se representa con icono+texto+neutro (CC-DD-07 LOCKED), nunca verde literal. */
export function Badge({ tone = "neutral", dot = false, children }: BadgeProps) {
  const toneMap: Record<Tone, string> = {
    neutral: "bg-status-draft-bg text-status-draft-label",
    danger: "bg-error-fill text-error-text",
    warning: "bg-warning-fill text-warning-text",
    info: "bg-info-fill text-info-text",
  };
  const dotMap: Record<Tone, string> = {
    neutral: "bg-stone-400",
    danger: "bg-error-stroke",
    warning: "bg-warning-stroke",
    info: "bg-info-stroke",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${toneMap[tone]}`}
    >
      {dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotMap[tone]}`} />}
      {children}
    </span>
  );
}