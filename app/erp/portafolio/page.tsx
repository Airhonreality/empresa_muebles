'use client'
// P-27: gestión central de portafolio (disenio_P27_gestion_portafolio.md, aprobado 2026-08-15).
// Contraparte administrativa de disenio_F03 (que solo cubre las rutas públicas). Lista TODAS
// las entradas (publicadas y sin publicar) — la grilla pública filtra publicado=true. No crea
// ni edita contenido (título/fotos/descripción): eso sigue en
// /erp/proyectos/[proyectoId]/portafolio, esta pantalla solo gestiona visibilidad y orden.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type Portafolio } from '@/lib/data'

const CATEGORIAS_ESPACIO = [
  'cocina',
  'closet',
  'centro_entretenimiento',
  'estudio_home_office',
  'cava_bar',
  'consola_recibidor',
  'pisos_madera',
] as const

function etiquetaCategoria(categoria: string): string {
  return categoria.replace(/_/g, ' ')
}

function FilaPortafolioAdmin({
  entrada,
  nombreProyecto,
  onTogglePublicar,
  onToggleDestacado,
  onChangeOrden,
  onEditarContenido,
}: {
  entrada: Portafolio
  nombreProyecto: string
  onTogglePublicar: () => void
  onToggleDestacado: () => void
  onChangeOrden: (nuevoOrden: number) => void
  onEditarContenido: () => void
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
    <tr className="border-b border-border-subtle">
      <td className="py-3 pr-4">
        <div className="h-14 w-20 overflow-hidden rounded-sm bg-bg-paper">
          {imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenUrl} alt={entrada.titulo} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">Sin foto</div>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <p className="font-medium text-text-primary">{entrada.titulo}</p>
        <p className="text-xs text-text-muted">{nombreProyecto}</p>
      </td>
      <td className="py-3 pr-4 text-sm text-text-muted">{etiquetaCategoria(entrada.categoriaEspacio)}</td>
      <td className="py-3 pr-4">
        <Badge tone={entrada.publicado ? 'info' : 'neutral'}>{entrada.publicado ? 'Publicado' : 'Sin publicar'}</Badge>
      </td>
      <td className="py-3 pr-4">
        {entrada.destacado && <Badge tone="warning">Destacado</Badge>}
      </td>
      <td className="py-3 pr-4">
        <input
          type="number"
          value={ordenInput}
          onChange={(e) => setOrdenInput(e.target.value)}
          onBlur={commitOrden}
          className="w-16 rounded-sm border border-border-default bg-bg-raised px-2 py-1 text-sm"
          aria-label={`Orden de ${entrada.titulo}`}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={onEditarContenido}>
            Editar contenido
          </Button>
          <Button variant="secondary" size="md" onClick={onTogglePublicar}>
            {entrada.publicado ? 'Despublicar' : 'Publicar'}
          </Button>
          <Button variant="ghost" size="md" onClick={onToggleDestacado}>
            {entrada.destacado ? 'Quitar destacado' : 'Destacar'}
          </Button>
        </div>
      </td>
    </tr>
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

  const entradasFiltradas = useMemo(() => {
    let resultado = entradas
    if (filtroCategoria) resultado = resultado.filter((e) => e.categoriaEspacio === filtroCategoria)
    if (filtroPublicado === 'publicado') resultado = resultado.filter((e) => e.publicado)
    if (filtroPublicado === 'sin_publicar') resultado = resultado.filter((e) => !e.publicado)
    return resultado
      .slice()
      .sort((a, b) => (a.destacado === b.destacado ? a.orden - b.orden : a.destacado ? -1 : 1))
  }, [entradas, filtroCategoria, filtroPublicado])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-heading">Gestión de portafolio</h1>
        <p className="text-sm text-text-muted mt-1">
          Publicar, destacar y ordenar los proyectos que aparecen en el portafolio público. Para editar título, fotos
          o descripción, usá &quot;Editar contenido&quot; (te lleva al proyecto en el ERP).
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-sm border border-border-default bg-bg-raised px-3 py-2 text-sm"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_ESPACIO.map((cat) => (
            <option key={cat} value={cat}>
              {etiquetaCategoria(cat)}
            </option>
          ))}
        </select>
        <select
          value={filtroPublicado}
          onChange={(e) => setFiltroPublicado(e.target.value as '' | 'publicado' | 'sin_publicar')}
          className="rounded-sm border border-border-default bg-bg-raised px-3 py-2 text-sm"
          aria-label="Filtrar por estado de publicación"
        >
          <option value="">Publicados y sin publicar</option>
          <option value="publicado">Solo publicados</option>
          <option value="sin_publicar">Solo sin publicar</option>
        </select>
      </div>

      {entradasFiltradas.length === 0 ? (
        <div className="rounded-sm border border-border-subtle bg-bg-raised py-16 text-center text-text-muted">
          No hay entradas de portafolio con estos filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-subtle">
          <table className="w-full text-left">
            <thead className="bg-bg-paper text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="py-2 pl-4 pr-4 font-medium">Foto</th>
                <th className="py-2 pr-4 font-medium">Proyecto</th>
                <th className="py-2 pr-4 font-medium">Categoría</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Destacado</th>
                <th className="py-2 pr-4 font-medium">Orden</th>
                <th className="py-2 pr-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {entradasFiltradas.map((entrada) => (
                <FilaPortafolioAdmin
                  key={entrada.id}
                  entrada={entrada}
                  nombreProyecto={proyectoNombreMap.get(entrada.proyectoId) ?? 'Proyecto no encontrado'}
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
                  onEditarContenido={() => router.push(`/erp/proyectos/${entrada.proyectoId}/portafolio`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
