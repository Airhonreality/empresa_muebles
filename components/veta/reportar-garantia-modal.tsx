'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { Modal } from './modal';
import { ArbolProyectoSelector } from './arbol-proyecto-selector';
import type { Modulo, Proyecto } from '@/lib/data';
import { useDataStore } from '@/lib/data';

interface ReportarGarantiaModalProps {
  clienteId: string;
  proyectoId?: string;
  proyectos?: Proyecto[];
  modulos?: Modulo[];
  onSuccess?: () => void;
}

/**
 * Modal para reportar garantía (P-20 / F-07).
 * Reutilizable desde ProyectoDetalleCliente o desde la página de garantía.
 * 
 * Reglas:
 * - R1: Solo proyectos en estado 'entregado' pueden reportar
 * - R2: dentro_garantia_contractual calculado automáticamente
 * - R3: Módulos filtrados a 'en_instalacion' o 'aprobado'
 * - R4: Máx 5 fotos, JPG/PNG ≤10MB
 */
export function ReportarGarantiaModal({
  clienteId,
  proyectoId,
  proyectos,
  modulos: modulosProp,
  onSuccess,
}: ReportarGarantiaModalProps) {
  const store = useDataStore();
  const storeVersion = store.getVersion();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(proyectoId ?? null);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener proyectos elegibles (entregados) del cliente
  const proyectosElegibles = useMemo(() => {
    if (proyectos) {
      return proyectos.filter((p) => p.estado === 'entregado' && p.clienteId === clienteId);
    }
    if (proyectoId) {
      const proj = store.proyectos.obtenerPorId(proyectoId);
      return proj && proj.estado === 'entregado' && proj.clienteId === clienteId ? [proj] : [];
    }
    return store.proyectos.listar().filter((p) => p.estado === 'entregado' && p.clienteId === clienteId);
    // storeVersion: fuerza recomputar cuando el store muta (M-07); no se lee en el cuerpo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, proyectoId, clienteId, store, storeVersion]);

  // Obtener módulos del proyecto seleccionado
  const modulos = useMemo(() => {
    if (modulosProp && selectedProyectoId === proyectoId) {
      return modulosProp;
    }
    if (selectedProyectoId) {
      return store.modulos.porProyecto(selectedProyectoId);
    }
    return [];
    // storeVersion: fuerza recomputar cuando el store muta (M-07); no se lee en el cuerpo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulosProp, selectedProyectoId, proyectoId, store, storeVersion]);

  // Módulos elegibles para garantía (R3)
  const modulosGarantia = useMemo(
    () => modulos.filter((m) => m.estado === 'en_instalacion' || m.estado === 'aprobado'),
    [modulos]
  );

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setSelectedProyectoId(proyectoId ?? null);
    setSelectedModuloId(null);
    setDescripcion('');
    setFotos([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedProyectoId || !selectedModuloId || !descripcion.trim()) {
      setError('Seleccioná un proyecto, módulo y describí el problema');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // R4: Validar fotos (máx 5, JPG/PNG ≤10MB)
      if (fotos.length > 5) {
        setError('Máximo 5 fotos permitidas');
        setIsSubmitting(false);
        return;
      }

      for (const file of fotos) {
        if (!file.type.match(/image\/(jpeg|png)/)) {
          setError('Solo se permiten imágenes JPG o PNG');
          setIsSubmitting(false);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Cada foto debe ser menor a 10MB');
          setIsSubmitting(false);
          return;
        }
      }

      // Subir fotos a R2 (TODO: Implementar cuando R2 esté configurado)
      // Por ahora guardamos URLs vacías
      const fotosUrls: string[] = [];

      // Crear caso de garantía
      const nuevoCaso = await store.casosGarantia.reportar({
        proyectoId: selectedProyectoId,
        moduloId: selectedModuloId,
        clienteId,
        descripcion: descripcion.trim(),
        fotos: fotosUrls,
      });

      if (nuevoCaso) {
        onSuccess?.();
        handleClose();
      } else {
        setError('Error al crear el reporte de garantía');
      }
    } catch {
      setError('Error al enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validar en tiempo real
      if (fotos.length + newFiles.length > 5) {
        setError('Máximo 5 fotos permitidas');
        return;
      }
      for (const file of newFiles) {
        if (!file.type.match(/image\/(jpeg|png)/)) {
          setError('Solo se permiten imágenes JPG o PNG');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Cada foto debe ser menor a 10MB');
          return;
        }
      }
      setFotos([...fotos, ...newFiles]);
      setError(null);
    }
  };

  const removeFoto = (index: number) => {
    const newFotos = [...fotos];
    newFotos.splice(index, 1);
    setFotos(newFotos);
  };

  const canSubmit = selectedProyectoId && selectedModuloId && descripcion.trim() && !isSubmitting;
  const showProyectoSelector = !proyectoId && proyectosElegibles.length > 1;

  // Contenido del modal
  const modalContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded border border-red-500 bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Selector de proyecto (solo si hay múltiples proyectos) */}
        {showProyectoSelector && (
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Proyecto *
            </label>
            <select
              value={selectedProyectoId ?? ''}
              onChange={(e) => {
                setSelectedProyectoId(e.target.value || null);
                setSelectedModuloId(null); // Reset modulo when project changes
              }}
              className="w-full rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm"
            >
              <option value="">Seleccionar proyecto...</option>
              {proyectosElegibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreProyecto}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selector de módulo */}
        {selectedProyectoId && (
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Módulo afectado *
            </label>
            <div className="rounded border border-border-subtle bg-bg-raised p-3 max-h-64 overflow-y-auto">
              {modulosGarantia.length > 0 ? (
                <ArbolProyectoSelector
                  modulos={modulos}
                  onSelect={setSelectedModuloId}
                  selectedId={selectedModuloId}
                />
              ) : (
                <p className="text-sm text-text-muted">No hay módulos elegibles para garantía en este proyecto.</p>
              )}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Descripción del problema *
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describí el problema con el mayor detalle posible..."
            className="w-full rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm"
            rows={4}
          />
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Fotos (opcional, máx 5, JPG/PNG ≤10MB)
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleFileChange}
              className="text-sm"
            />
            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fotos.map((file, index) => (
                  <div key={index} className="relative w-20 h-20">
                    {/* unoptimized: blob URL local, no pasa por el optimizador de Next */}
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Foto ${index + 1}`}
                      fill
                      unoptimized
                      className="rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFoto(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted">
              {fotos.length}/5 fotos seleccionadas
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </div>
    </div>
  );

  // Determinar si hay módulos elegibles
  const hasElegibleModulos = proyectoId
    ? modulosGarantia.length > 0
    : proyectosElegibles.some((p) => {
        const mods = store.modulos.porProyecto(p.id);
        return mods.some((m) => m.estado === 'en_instalacion' || m.estado === 'aprobado');
      });

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={handleOpen}
        disabled={!hasElegibleModulos}
      >
        Reportar garantía
      </Button>

      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Reportar garantía"
      >
        {modalContent}
      </Modal>
    </>
  );
}
