import { type ButtonHTMLAttributes, type ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "icon" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
  /** Deshabilita el botón y muestra un spinner. Úsese con `usePendingGuard` para bloquear
   * doble-submit en acciones async (crear/guardar/enviar). */
  loading?: boolean;
}

function ButtonSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-fast cursor-pointer select-none focus-visible:shadow-ring-focus disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
const BUTTON_SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "min-h-[44px] h-11 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};
const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: "bg-btn-primary-bg text-btn-primary-text hover:bg-gold-700 hover:shadow-md",
  secondary:
    "bg-bg-raised text-text-primary border border-border-default hover:border-border-strong hover:bg-bg-alt",
  outline: "bg-transparent text-text-primary border border-border-default hover:bg-bg-alt",
  ghost: "text-text-muted hover:text-text-primary hover:bg-bg-alt",
  destructive: "bg-btn-danger-bg text-btn-danger-text hover:opacity-90 hover:shadow-md",
  icon: "bg-bg-raised text-text-muted border border-border-subtle hover:text-text-primary hover:bg-bg-alt",
};

/** Clases de Button, exportadas para LinkButton (y cualquier otro elemento no-<button> que
 * necesite el mismo look) sin duplicar el string a mano en cada call site. */
export function buttonClassName(variant: Variant = "primary", size: Size = "lg", className = ""): string {
  return `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`;
}

/* Primitiva Button (A4 #1). Regla B1-CV-01 (consolidado §2): no hay tamaño sm
   interactivo; mínimo md 40px con hit area expandida a >=48px. Solo md/lg.
   C3 PoC 3: active:scale + transition-transform para feedback táctil. */
export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClassName(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: React.AriaAttributes["aria-current"];
  children?: ReactNode;
}

// D-02/D-03 (re-auditoría 2026-08-10): un <Button> (=<button>) dentro de un <Link> (=<a>) es
// contenido interactivo anidado en contenido interactivo -- inválido en HTML5, foco/tabulación
// ambiguos para lectores de pantalla. Mismo defecto que C-05 (button en button), sin el hard
// crash de hidratación que hizo que C-05 se detectara y este no, en 11+ call sites. LinkButton
// es el reemplazo: un solo <a> con el look de Button, para "este link se ve como botón".
export function LinkButton({ variant = "primary", size = "lg", className = "", children, ...props }: LinkButtonProps) {
  return (
    <Link className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}