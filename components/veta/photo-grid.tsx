interface PhotoGridProps {
  fotos: { url: string; alt: string }[];
}

/* Primitiva PhotoGrid (D-01, diseno_web_publica_diamante.md).
   Grid asimétrico de fotos secundarias — nunca un grid uniforme de cards tipo e-commerce.
   La primera foto ocupa el doble de alto (ancla visual), el resto se acomoda en una columna
   angosta al lado — mismo patrón que la galería de vetadeoro.co/portafolio. */
export function PhotoGrid({ fotos }: PhotoGridProps) {
  if (fotos.length === 0) return null;
  const [principal, ...resto] = fotos;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="row-span-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={principal.url}
          alt={principal.alt}
          className="h-full w-full rounded-sm object-cover"
        />
      </div>
      <div className="grid grid-rows-2 gap-3">
        {resto.slice(0, 2).map((foto, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={foto.url}
            alt={foto.alt}
            className="h-full w-full rounded-sm object-cover"
          />
        ))}
      </div>
    </div>
  );
}
