export function TokenList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">No records yet.</p>
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {items.map(item => (
        <span key={item} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
          {item}
        </span>
      ))}
    </div>
  )
}
