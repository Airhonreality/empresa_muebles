interface Props { visual?: { variant?: string; spacing?: number } }

export function AgnosticDivider({ visual }: Props) {
  const variant = visual?.variant || 'line';
  const spacing = visual?.spacing ?? 4;
  if (variant === 'space') return <div style={{ height: `${spacing * 0.25}rem` }} />;
  if (variant === 'dots') return (
    <div className="flex justify-center gap-2 py-4">
      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />)}
    </div>
  );
  return <hr className="border-border my-4" />;
}
