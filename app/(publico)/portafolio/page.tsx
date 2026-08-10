'use client';

import Link from 'next/link';
import { useDataStore, type Portafolio, type Categoria } from '@/lib/data';
import { Badge } from '@/components/veta/badge';

function PortafolioCard({ proyecto }: { proyecto: Portafolio }) {
  return (
    <Link
      href={`/portafolio/${proyecto.slug}`}
      className="group flex flex-col rounded-lg border border-border-subtle bg-bg-raised overflow-hidden transition-all duration-300 hover:border-brand/40 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-bg-paper overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/10 to-amber-100/50">
          <span className="text-6xl font-display font-bold text-brand/20">
            {proyecto.titulo.charAt(0)}
          </span>
        </div>
        {proyecto.destacado && (
          <div className="absolute top-3 left-3">
            <Badge tone="info" variant="mist" dot>
              Destacado
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge tone="neutral" variant="glass">
            {proyecto.categoriaEspacio.charAt(0).toUpperCase() + proyecto.categoriaEspacio.slice(1)}
          </Badge>
        </div>
        <h3 className="font-display text-lg font-medium text-text-heading mb-2 line-clamp-2">
          {proyecto.titulo}
        </h3>
        {proyecto.precioReferencial && (
          <p className="text-sm text-brand font-medium mb-3">{proyecto.precioReferencial}</p>
        )}
        {proyecto.materialesDestacados.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5">
            {proyecto.materialesDestacados.slice(0, 3).map((mat, i) => (
              <Badge key={i} tone="neutral" variant="glass">
                {mat}
              </Badge>
            ))}
            {proyecto.materialesDestacados.length > 3 && (
              <Badge tone="neutral" variant="glass">
                +{proyecto.materialesDestacados.length - 3} más
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function CategoriaFiltro({ categorias, activa, onChange }: { categorias: Categoria[]; activa: string | null; onChange: (id: string | null) => void }) {
  const portafolioCats = categorias.filter(c => c.tipo === 'portafolio' && c.activo);

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activa === null
            ? 'bg-brand text-brand-text shadow-md'
            : 'bg-bg-raised text-text-muted hover:bg-bg-alt hover:text-text-primary border border-border-subtle'
        }`}
      >
        Todas
      </button>
      {portafolioCats.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(activa === cat.id ? null : cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activa === cat.id
              ? 'bg-brand text-brand-text shadow-md'
              : 'bg-bg-raised text-text-muted hover:bg-bg-alt hover:text-text-primary border border-border-subtle'
          }`}
        >
          {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default function PortafolioPage() {
  const store = useDataStore();
  const proyectos = store.portafolio.publicados();
  const categorias = store.categorias.porTipo('portafolio');

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-text-muted">Portafolio</p>
        <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Proyectos realizados</h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          Una selección de nuestros trabajos en carpintería arquitectónica.
          Cada proyecto refleja el compromiso con la calidad, el diseño y la precisión técnica.
        </p>
      </header>

      <CategoriaFiltro
        categorias={categorias}
        activa={null}
        onChange={() => {}}
      />

      {proyectos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No hay proyectos publicados en esta categoría.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map(proyecto => (
            <PortafolioCard key={proyecto.id} proyecto={proyecto} />
          ))}
        </div>
      )}
    </div>
  );
}