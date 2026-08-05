interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  tone?: "neutral" | "brand" | "danger";
}

/* Primitiva StatCard / KPI con diseño de número (A4 + consolidado CC-DD-23).
   El número salta al valor (motion, en PoC render estático). */
export function StatCard({ label, value, unit, tone = "neutral" }: StatCardProps) {
  const valueColors: Record<string, string> = {
    neutral: "text-text-heading",
    brand: "text-brand",
    danger: "text-error-text",
  };
  const accentBorders: Record<string, string> = {
    neutral: "border-border-subtle",
    brand: "border-gold-200",
    danger: "border-error-stroke/20",
  };
  return (
    <div
      className={`flex flex-col gap-1 rounded-md border bg-bg-raised p-4 shadow-xs ${accentBorders[tone]}`}
    >
      <span className="text-sm text-text-muted">{label}</span>
      <span className={`font-display text-kpi font-semibold leading-none ${valueColors[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-base font-normal text-text-muted">{unit}</span>}
      </span>
    </div>
  );
}