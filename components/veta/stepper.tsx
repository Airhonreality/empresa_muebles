import type { ReactNode } from "react";

export interface StepDef {
  id: string;
  label: string;
  state: "done" | "active" | "pending" | "blocked";
}

interface StepperProps {
  steps: StepDef[];
}

/* Primitiva Stepper vertical (A4 #33). Estados: done/active/pending/blocked.
   La barra de conexión solo se muestra bajo pasos done (galería de pasos). */
export function Stepper({ steps }: StepperProps) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepMarker state={s.state} />
              {!isLast && (
                <div
                  aria-hidden
                  className={`mb-1 mt-1 w-px flex-1 ${
                    s.state === "done"
                      ? "bg-gold-400"
                      : s.state === "active"
                        ? "bg-gold-200"
                        : "bg-border-subtle"
                  }`}
                />
              )}
            </div>
            <div className="pb-2 pt-0.5">
              <span
                className={`text-sm ${
                  s.state === "active"
                    ? "font-semibold text-text-heading"
                    : s.state === "pending"
                      ? "text-text-muted"
                      : s.state === "blocked"
                        ? "text-error-text"
                        : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
              {s.state === "active" && (
                <span className="ml-2 inline-flex rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-medium text-gold-700">
                  Actual
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepMarker({ state }: { state: StepDef["state"] }) {
  const marker: Record<StepDef["state"], ReactNode> = {
    done: (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-600 text-[10px] font-bold text-white shadow-xs">
        ✓
      </span>
    ),
    active: (
      <span
        className="h-6 w-6 rounded-full border-2 border-gold-600 bg-gold-200 shadow-[0_0_0_4px_rgba(139,105,20,0.12)] animate-pulse-subtle"
        aria-hidden
      />
    ),
    pending: (
      <span className="h-6 w-6 rounded-full border border-border-default bg-bg-raised" aria-hidden />
    ),
    blocked: (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error-fill text-[10px] font-bold text-error-text">
        !
      </span>
    ),
  };
  return marker[state];
}