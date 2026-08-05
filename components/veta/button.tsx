import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  children?: ReactNode;
}

/* Primitiva Button (A4 #1). Regla B1-CV-01 (consolidado §2): no hay tamaño sm
   interactivo; mínimo md 40px con hit area expandida a >=48px. Solo md/lg. */
export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm  font-medium transition-colors duration-fast cursor-pointer select-none focus-visible:shadow-ring-focus disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes: Record<string, string> = {
    md: "min-h-[44px] h-11 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  };
  const variants: Record<string, string> = {
    primary: "bg-btn-primary-bg text-btn-primary-text hover:bg-gold-700",
    secondary:
      "bg-bg-raised text-text-primary border border-border-default hover:border-border-strong",
    ghost: "text-text-muted hover:text-text-primary",
    destructive: "bg-btn-danger-bg text-btn-danger-text hover:opacity-90",
    icon: "bg-bg-raised text-text-muted border border-border-subtle hover:text-text-primary",
  };
  return (
    <button
      type="button"
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}