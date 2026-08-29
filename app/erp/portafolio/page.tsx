'use client'
// P-27: gestión central de portafolio (disenio_P27_gestion_portafolio.md, aprobado 2026-08-15).
// Contraparte administrativa de disenio_F03 (que solo cubre las rutas públicas). Lista TODAS
// las entradas (publicadas y sin publicar) — la grilla pública filtra publicado=true. No crea
// ni edita contenido (título/fotos/descripción): eso sigue en
// /erp/proyectos/[proyectoId]/portafolio, esta pantalla solo gestiona visibilidad y orden.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button, LinkButton } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { useDataStore, type Portafolio } from '@/lib/data'
import { TIPOS_ESPACIO, labelTipoEspacio } from '@/lib/catalogos/tipos-espacio'
import { useSmartSearch } from '@/lib/hooks/useSmartSearch'

function etiquetaCategoria(categoria: string): string {
  return labelTipoEspacio(categoria) ?? categoria.replace(/_/g, ' ')
}

function generarIdHumano(nombre: string, idOriginal: string) {
  // Ej: Ciro -> CIR, UUID f47a... -> F47A = CIR-F47A
  const prefijo = nombre.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
  const sufijo = idOriginal.substring(0, 4).toUpperCase()
  return `${prefijo}-${sufijo}`
}

function TarjetaEspacioAdmin({
  entrada,
  onTogglePublicar,
  onToggleDestacado,
  onChangeOrden,
}: {
  entrada: Portafolio
  onTogglePublicar: () => void
  onToggleDestacado: () => void
  onChangeOrden: (nuevoOrden: number) => void
}) {
  const [ordenInput, setOrdenInput] = useState(String(entrada.orden))
  const imagenUrl = entrada.imagenPortafolioUrl || entrada.galeriaPortafolioUrl[0]

  const commitOrden = () => {
    const valor = parseInt(ordenInput, 10)
    if (!isNaN(valor) && valor !== entrada.orden) {
      onChangeOrden(valor)
    } else {
      setOrdenInput(String(entrada.orden))
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border-subtle bg-bg-paper shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-bg-alt">
        {imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenUrl} alt={entrada.titulo} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">Sin foto</div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <Badge tone={entrada.publicado ? 'info' : 'neutral'}>{entrada.publicado ? 'Publicado' : 'Borrador'}</Badge>
          {entrada.destacado && <Badge tone="warning">Destacado</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="font-semibold text-text-primary text-sm line-clamp-1 mb-0.5" title={entrada.titulo}>{entrada.titulo}</p>
        <p className="text-xs text-brand font-medium mb-3">{etiquetaCategoria(entrada.categoriaEspacio)}</p>
        
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Ord:</span>
            <input
              type="number"
              value={ordenInput}
              onChange={(e) => setOrdenInput(e.target.value)}
              onBlur={commitOrden}
              className="w-12 rounded-sm border border-border-default bg-bg-raised px-1 py-1 text-xs text-center outline-none focus:border-brand"
              aria-label={`Orden de ${entrada.titulo}`}
            />
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="md" onClick={onToggleDestacado} title={entrada.destacado ? 'Quitar destacado' : 'Destacar'}>
              ⭐
            </Button>
            <Button variant={entrada.publicado ? "secondary" : "primary"} size="md" onClick={onTogglePublicar}>
              {entrada.publicado ? 'Ocultar' : 'Publicar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PortafolioAdminPage() {
  const store = useDataStore()
  const router = useRouter()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entradas = useMemo(() => store.portafolio.listar(), [store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = useMemo(() => store.proyectos.listar(), [store, version])

  const proyectoNombreMap = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach((p) => map.set(p.id, p.nombreProyecto))
    return map
  }, [proyectos])

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroPublicado, setFiltroPublicado] = useState<'' | 'publicado' | 'sin_publicar'>('')

  const { query: busqueda, setQuery: setBusqueda, resultado: entradasBuscadas } = useSmartSearch({
    items: entradas,
    getCampos: (e) => [
      e.titulo,
      proyectoNombreMap.get(e.proyectoId) ?? '',
      etiquetaCategoria(e.categoriaEspacio),
      e.descripcionComercial ?? '',
    ],
    contexto: 'portafolio',
    fuzzy: true,
    limite: 500,
  })

  const entradasFiltradas = useMemo(() => {
    let resultado = entradasBuscadas
    if (filtroCategoria) resultado = resultado.filter((e) => e.categoriaEspacio === filtroCategoria)
    if (filtroPublicado === 'publicado') resultado = resultado.filter((e) => e.publicado)
    if (filtroPublicado === 'sin_publicar') resultado = resultado.filter((e) => !e.publicado)
    return resultado
      .slice()
      .sort((a, b) => (a.destacado === b.destacado ? a.orden - b.orden : a.destacado ? -1 : 1))
  }, [entradasBuscadas, filtroCategoria, filtroPublicado])

  // F-03 (2026-08-28): Agrupar entradas por proyecto para la vista de Árbol
  const proyectosConPortafolio = useMemo(() => {
    const mapa = new Map<string, { proyectoNombre: string; proyectoIdHumano: string; espacios: Portafolio[] }>()
    
    entradasFiltradas.forEach((entrada) => {
      const pId = entrada.proyectoId
      if (!mapa.has(pId)) {
        const nombre = proyectoNombreMap.get(pId) ?? 'Proyecto Desconocido'
        const idHumano = generarIdHumano(nombre, pId)
        mapa.set(pId, { proyectoNombre: nombre, proyectoIdHumano: idHumano, espacios: [] })
      }
      mapa.get(pId)!.espacios.push(entrada)
    })

    // Convertir a array y ordenar alfabéticamente por nombre de proyecto
    return Array.from(mapa.entries()).sort((a, b) => a[1].proyectoNombre.localeCompare(b[1].proyectoNombre))
  }, [entradasFiltradas, proyectoNombreMap])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Gestión de portafolio</h1>
          <p className="text-sm text-text-muted mt-1">
            Administra la visibilidad de los espacios de cada proyecto. Para editar las fotos de un espacio, entra a su Mesa de Trabajo.
          </p>
          <div className="mt-3 rounded-sm border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 text-sm">
            <span className="font-semibold text-brand-primary">💡 Regla de Nomenclatura Pública (High-Ticket):</span>
            <p className="mt-1 text-text-muted">
              Para proteger la privacidad del cliente y mantener el estatus de marca, usa el formato:{' '}
              <code className="rounded bg-bg-paper px-1 py-0.5 text-text-primary">[Espacio] [Inicial]. — [Barrio]</code>.
            </p>
            <p className="mt-1 text-text-muted">
              Ejemplo correcto: <strong className="text-text-primary">Cocina G. — Rosales</strong> (No usar nombres completos).
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/erp/portafolio/galeria" variant="secondary">
            Galería por categoría
          </LinkButton>
          <LinkButton href="/erp/portafolio/atributos-tecnicos" variant="secondary">
            Validación técnica
          </LinkButton>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <Busqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por título, proyecto o categoría..."
          label="Buscar en portafolio"
          className="w-full sm:w-72"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-sm border border-border-default bg-bg-raised px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {TIPOS_ESPACIO.map((t) => (
            <option key={t.codigo} value={t.codigo}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={filtroPublicado}
          onChange={(e) => setFiltroPublicado(e.target.value as '' | 'publicado' | 'sin_publicar')}
          className="rounded-sm border border-border-default bg-bg-raised px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="Filtrar por estado de publicación"
        >
          <option value="">Publicados y sin publicar</option>
          <option value="publicado">Solo publicados</option>
          <option value="sin_publicar">Solo sin publicar</option>
        </select>
      </div>

      {entradasFiltradas.length === 0 ? (
        <div className="rounded-sm border border-border-subtle bg-bg-raised py-16 text-center text-text-muted">
          No hay espacios de portafolio que coincidan con estos filtros.
        </div>
      ) : (
        <div className="space-y-6">
          {proyectosConPortafolio.map(([pId, datos]) => (
            <section key={pId} className="rounded-xl border border-border-subtle bg-bg-raised overflow-hidden shadow-sm">
              <header className="flex items-center justify-between border-b border-border-subtle bg-bg-alt px-5 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-semibold text-text-heading">{datos.proyectoNombre}</h2>
                    <span className="rounded-md bg-brand/10 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-brand">
                      {datos.proyectoIdHumano}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{datos.espacios.length} espacio(s) en portafolio</p>
                </div>
                <Button variant="secondary" size="md" onClick={() => router.push(`/erp/proyectos/${pId}/portafolio`)}>
                  Gestionar Fotos en Mesa de Trabajo
                </Button>
              </header>
              <div className="p-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {datos.espacios.map((entrada) => (
                    <TarjetaEspacioAdmin
                      key={entrada.id}
                      entrada={entrada}
                      onTogglePublicar={() => {
                        if (entrada.publicado) {
                          void store.portafolio.despublicar(entrada.id)
                        } else {
                          void store.portafolio.publicar(entrada.id)
                        }
                      }}
                      onToggleDestacado={() => {
                        void store.portafolio.actualizar(entrada.id, { destacado: !entrada.destacado })
                      }}
                      onChangeOrden={(nuevoOrden) => {
                        void store.portafolio.actualizar(entrada.id, { orden: nuevoOrden })
                      }}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
