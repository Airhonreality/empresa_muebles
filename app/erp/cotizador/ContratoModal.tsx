"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { MoneyInput } from "@/components/veta/money-input";
import { EntityFields } from "@/components/veta/entity-fields";
import { clienteFormFields, datosClienteParaGuardar, valoresClienteDesde } from "@/lib/forms/cliente-form-spec";
import { useRouter } from "next/navigation";
import { useCotizadorCompat } from "@/lib/data/queries/cotizador-compat";
import {
  SECCIONES_ESPECIFICACIONES,
  compilarEspecificaciones,
  compilarObjetoItems,
  tieneItemsDeLaCategoria,
  type SeccionEspecificacion,
} from "@/lib/data/contrato-items";
import { textoPlazoSemanas, sugerirFechaEntrega } from "@/lib/data/contrato-fechas";
import {
  requisitosPendientes,
  type CampoContrato,
} from "@/lib/data/contrato-validacion";
import type {
  Proyecto, Cliente, EspacioVariante, ItemVariante, ProductoCatalogo, Contrato,
  HitoPago, DatosContratoEdicion,
} from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";

export interface ContratoModalProps {
  proyecto: Proyecto;
  cliente: Cliente | undefined;
  /** t-169: catálogo de clientes para poder vincular uno desde acá. Antes este modal no tenía
   *  forma de asignar cliente: solo sabía editar uno que ya venía vinculado, así que un
   *  proyecto sin cliente quedaba sin salida y la validación bloqueaba el guardado para
   *  siempre ("no tiene cliente vinculado / elegí el cliente"), sin ninguna acción posible. */
  clientes: Cliente[];
  espacios: EspacioVariante[];
  itemsPorEspacio: Map<string, ItemVariante[]>;
  catalogo: ProductoCatalogo[];
  valorTotalCotizacion: number;
  /** t-166: contrato ya emitido de este proyecto, si existe. Su presencia cambia el modal de
   *  "alta" a "edición": precarga todos los campos y hace UPDATE en vez de INSERT. Antes esta
   *  prop no existía, y por eso reabrir el modal perdía todo lo escrito. */
  contratoExistente?: Contrato;
  hitosExistentes?: HitoPago[];
  onClose: () => void;
  onSaved: (contrato: Contrato) => void;
}

// Tipos locales para el formulario
type HitoLocal = {
  orden: number;
  tipo: 'percentage' | 'fixed';
  montoOPorcentaje: string;
  razon: string;
  fechaLimite?: string;
};

type FormContrato = {
  codigoContrato: string;
  fechaContrato: string;
  valorTotal: string;
  /**
   * t-167: fuente ÚNICA del plazo. `plazoEjecucionTexto` pasó a ser texto derivado de este
   * número. Antes el plazo era texto libre con default "4 a 5", que era (a) imposible de usar
   * para calcular la fecha máxima sin parsearlo y (b) más corto que la promesa interna de 7
   * semanas, así que un contrato generado sin editar ese campo prometía menos de lo que el
   * cronograma interno tenía previsto.
   */
  plazoSemanas: string;
  /** t-173: la fecha de entrega del contrato. Se escribe, no se calcula. */
  fechaEntregaMaxima: string;
  garantiaAnios: number;
  objetoItems: string;
  /** t-167: cómo se identifica el Anexo 1 (Propuesta impresa que se adjunta al contrato). */
  anexoPropuestaIdentificacion: string;
  /** t-170: si el contrato incluye el numeral SEXTA completo. Apagado = sin penalidad de ningún
   *  tipo: el numeral entero no se imprime. */
  aplicaClausulaPenalidad: boolean;
  aplicaPenalidadDefinitiva: boolean;
  especificaciones: Record<SeccionEspecificacion, string>;
};

export function ContratoModal({ proyecto, cliente, clientes, espacios, itemsPorEspacio, catalogo, valorTotalCotizacion, contratoExistente, hitosExistentes, onClose, onSaved }: ContratoModalProps) {
  const router = useRouter();
  // t-166: escribe por el MISMO layer que lee la pantalla (snapshot de TanStack). Antes usaba
  // `useDataStore()` —el store global drizzle— y por eso la edición del cliente tardaba hasta
  // el siguiente ciclo de long-poll en verse en pantalla.
  const { store } = useCotizadorCompat();
  const productMap = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);
  const { guard: guardGuardarContrato, isPending: guardandoContrato } = usePendingGuard();

  const esEdicion = !!contratoExistente;

  // Objeto y especificaciones derivados de los ítems cotizados. Se calculan una vez por montaje
  // y quedan disponibles para el botón "Recompilar" (t-166): si el usuario edita el texto a
  // mano y después toca la cotización, recompilar es una decisión suya, no automática — pisar
  // lo que escribió sin avisar sería peor que dejarlo congelado.
  const objetoDerivado = useMemo(
    () => compilarObjetoItems(espacios, itemsPorEspacio, productMap),
    [espacios, itemsPorEspacio, productMap],
  );
  const seccionesVisibles = useMemo(
    () => SECCIONES_ESPECIFICACIONES.filter((s) => tieneItemsDeLaCategoria(espacios, itemsPorEspacio, productMap, s)),
    [espacios, itemsPorEspacio, productMap],
  );
  const especificacionesDerivadas = useMemo(
    () => ({
      Estructura: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Estructura'),
      Herrajes: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Herrajes'),
      Mesones: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Mesones'),
      Desmonte: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Desmonte'),
    }),
    [espacios, itemsPorEspacio, productMap],
  );

  // Estado del formulario de datos del contratante — editable in situ (persistido al guardar).
  const [clienteForm, setClienteForm] = useState(() => valoresClienteDesde(cliente));
  const setClienteCampo = (campo: keyof typeof clienteForm, valor: string) => {
    setClienteForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // t-169: Elección de cliente. Arranca con el que ya venía vinculado al proyecto; al cambiarlo
  // se recarga el formulario del contratante con sus datos. Si el proyecto no tenía ninguno, el
  // selector arranca en "Sin cliente" y el nombre escrito a mano se crea al guardar.
  const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState(cliente?.id ?? "");
  const clienteSeleccionado = useMemo(
    () =>
      clientes.find((c) => c.id === clienteIdSeleccionado) ??
      (cliente && clienteIdSeleccionado === cliente.id ? cliente : undefined),
    [clientes, clienteIdSeleccionado, cliente],
  );
  const seleccionarCliente = useCallback(
    (id: string) => {
      setClienteIdSeleccionado(id);
      setClienteForm(valoresClienteDesde(clientes.find((x) => x.id === id)));
    },
    [clientes],
  );

  // t-166: si el contrato ya existe, TODOS los campos se siembran desde lo persistido. Es el
  // arreglo del bug reportado: antes cada `useState` nacía en sus defaults y reabrir el modal
  // mostraba plazo/garantía/especificaciones/hitos/valor en blanco.
  const [form, setForm] = useState<FormContrato>(() => ({
    codigoContrato: contratoExistente?.codigoContrato
      ?? `CTR-${new Date().getFullYear()}-${String(proyecto.id).slice(-4).toUpperCase()}`,
    fechaContrato: contratoExistente?.fechaContrato ?? new Date().toISOString().slice(0, 10),
    valorTotal: contratoExistente?.valorTotal ?? valorTotalCotizacion.toString(),
    // t-167: si el contrato viejo no tiene el número, se deriva de los días estimados del
    // proyecto; si tampoco hay, la promesa canónica del arnés (7 semanas). NUNCA el "4 a 5"
    // que tenía antes el default.
    plazoSemanas: String(
      contratoExistente?.plazoSemanas
      ?? (proyecto.diasEntregaEstimados
        ? Math.max(1, Math.ceil(proyecto.diasEntregaEstimados / 7))
        : 7),
    ),
    // t-175: si el contrato todavía no tiene fecha de entrega, se siembra con la sugerida
    // (fecha de firma + plazo en semanas hábiles de lunes a viernes). Un contrato ya guardado
    // respeta su fecha: no se recalcula, porque un contrato no cambia de fecha porque se abra
    // el modal.
    fechaEntregaMaxima: contratoExistente?.fechaEntregaMaxima
      ?? sugerirFechaEntrega(
        contratoExistente?.fechaContrato ?? new Date().toISOString().slice(0, 10),
        Number(
          contratoExistente?.plazoSemanas
          ?? (proyecto.diasEntregaEstimados ? Math.max(1, Math.ceil(proyecto.diasEntregaEstimados / 7)) : 7),
        ),
      )
      ?? '',
    garantiaAnios: contratoExistente?.garantiaAnios ?? proyecto.garantiaAnios ?? 2,
    objetoItems: contratoExistente?.objetoItems ?? objetoDerivado,
    // t-168: `||` y no `??`. `core.ts` guarda este campo con `.trim() || null`, pero una fila
    // que llegó con cadena vacía (guardado por otra vía, o editada a mano en la base) hacía que
    // `??` NO reemplazara: el campo se veía vacío y el botón quedaba deshabilitado para siempre.
    anexoPropuestaIdentificacion:
      contratoExistente?.anexoPropuestaIdentificacion?.trim()
      || `Propuesta de Diseño y Presupuesto «${proyecto.nombreProyecto}» — versión 1 — fechada el ${contratoExistente?.fechaContrato ?? new Date().toISOString().slice(0, 10)} — ___ páginas`,
    // t-170: por defecto la cláusula se pacta (encendida). Un `false` guardado apagado a
    // propósito se respeta: es una decisión del Supervisor, no un default perdido.
    aplicaClausulaPenalidad: contratoExistente?.aplicaClausulaPenalidad ?? true,
    aplicaPenalidadDefinitiva: contratoExistente?.aplicaPenalidadDefinitiva ?? true,
    especificaciones: {
      Estructura: contratoExistente?.especificacionesEstructura ?? especificacionesDerivadas.Estructura,
      Herrajes: contratoExistente?.especificacionesHerrajes ?? especificacionesDerivadas.Herrajes,
      Mesones: contratoExistente?.especificacionesMesones ?? especificacionesDerivadas.Mesones,
      Desmonte: contratoExistente?.especificacionesDesmonte ?? especificacionesDerivadas.Desmonte,
    },
  }));

  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // t-167: un contrato firmado tiene su fecha de entrega YA impresa y ya suscrita. Permitir
  // editar plazo, fecha de entrega o fecha de firma después de eso movería en silencio una
  // fecha contractual.
  // Se bloquea acá y no en la base: es la última línea, no la única.
  const contratoFirmado = contratoExistente?.estado === 'firmado';

  // t-173: la fecha de entrega se ESCRIBE, no se calcula. Se sacó el cálculo por días hábiles
  // porque dependía de un calendario oficial de feriados por año, y si ese año no estaba
  // cargado el contrato salía sin fecha — sin fecha no hay mora que aplicar. Acá no hay nada
  // que calcular: la persona que emite el contrato sabe hasta cuándo se entrega.
  // ── t-175: la fecha de entrega se sugiere sola, y se respeta si la persona la cambió ──────
  //
  // `tocarFecha` es la memoria de "esto lo escribió un humano, no el cálculo". Sin ella, cada
  // cambio de plazo pisaría una fecha elegida a mano; con ella, el cálculo solo rellena huecos.
  const [tocarFecha, setTocarFecha] = useState(
    Boolean(contratoExistente?.fechaEntregaMaxima),
  );

  /** Lo que el cálculo propondría AHORA, con los valores actuales del formulario. */
  const sugerencia = sugerirFechaEntrega(form.fechaContrato, parseInt(form.plazoSemanas, 10));

  /**
   * Cambia el plazo y, si la fecha no la escribió a mano, la recalcula.
   *
   * Se aplica en el onChange del input y NO en un useEffect: un efecto se dispararía también al
   * abrir el modal, al imprimir o al cambiar cualquier otro campo, y la fecha de entrega se
   * movería sola. Un contrato no cambia de fecha porque alguien abra la pantalla.
   */
  const setPlazo = useCallback((valor: string) => {
    setForm((prev) => ({
      ...prev,
      plazoSemanas: valor,
      fechaEntregaMaxima: tocarFecha
        ? prev.fechaEntregaMaxima
        : sugerirFechaEntrega(prev.fechaContrato, parseInt(valor, 10)) ?? '',
    }));
  }, [tocarFecha]);

  const plazoSemanasNum = parseInt(form.plazoSemanas, 10);

  // Hitos: los ya persistidos si hay contrato (default 50/25/25 solo en el alta).
  const [hitos, setHitos] = useState<HitoLocal[]>(() => {
    const existentes = (hitosExistentes ?? []).slice().sort((a, b) => a.orden - b.orden);
    if (existentes.length > 0) {
      return existentes.map((h, i) => ({
        orden: i + 1,
        tipo: h.tipo,
        montoOPorcentaje: h.montoOPorcentaje,
        razon: h.razon ?? '',
        fechaLimite: '',
      }));
    }
    return [
      { orden: 1, tipo: 'percentage', montoOPorcentaje: '50', razon: 'Anticipo al firmar contrato', fechaLimite: '' },
      { orden: 2, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Al iniciar instalación', fechaLimite: '' },
      { orden: 3, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Contra entrega y acta de satisfacción', fechaLimite: '' },
    ];
  });

  // Manejar cambios en hitos
  const handleHitoChange = useCallback((index: number, field: keyof HitoLocal, value: string) => {
    setHitos((prev) => {
      const nuevo = [...prev];
      nuevo[index] = { ...nuevo[index], [field]: value };

      // Autocálculo del último hito (P-05): si el último es porcentaje y aún vale 0,
      // se rellena con el restante para cerrar la suma a 100% (5×16% + 6º = 20% restante).
      const lastIdx = nuevo.length - 1;
      if (lastIdx !== index && nuevo[lastIdx].tipo === 'percentage') {
        const sumOtros = nuevo.slice(0, lastIdx).reduce(
          (sum, h) => sum + (h.tipo === 'percentage' ? parseFloat(h.montoOPorcentaje) || 0 : 0),
          0
        );
        const restante = 100 - sumOtros;
        if (restante >= 0 && (parseFloat(nuevo[lastIdx].montoOPorcentaje) || 0) === 0) {
          nuevo[lastIdx] = { ...nuevo[lastIdx], montoOPorcentaje: restante.toFixed(2) };
        }
      }

      return nuevo;
    });
  }, []);

  // Añadir hito
  const addHito = useCallback(() => {
    const nuevoOrden = hitos.length + 1;
    setHitos((prev) => [...prev, { orden: nuevoOrden, tipo: 'percentage', montoOPorcentaje: '0', razon: '', fechaLimite: '' }]);
  }, [hitos.length]);

  // Eliminar hito
  const removeHito = useCallback((index: number) => {
    setHitos((prev) => {
      const nuevo = prev.filter((_, i) => i !== index);
      return nuevo.map((h, i) => ({ ...h, orden: i + 1 }));
    });
  }, []);

  // Calcular suma de hitos
  const sumaHitos = useMemo(() => {
    return hitos.reduce((sum, h) => sum + parseFloat(h.montoOPorcentaje) || 0, 0);
  }, [hitos]);

  // Validar que suma = valorTotal (para hitos de porcentaje)
  const todosPorcentaje = useMemo(() => hitos.every((h) => h.tipo === 'percentage'), [hitos]);
  // t-168: la regla "la suma tiene que dar 100%" ya no vive acá — vive en
  // `requisitosPendientes`, junto con el resto, y llega acá por `errorDe('hitos')`. Dejarla
  // en los dos lados era justamente la forma de que se desincronicen.

  /** t-166: vuelve a derivar objeto y especificaciones desde los ítems cotizados ahora.
   *  Explicito y a pedido, no automático: si el usuario escribió a mano y después tocó la
   *  cotización, recompilar sin avisar le borraría su texto. */
  const recompilarDesdeItems = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      objetoItems: objetoDerivado,
      especificaciones: { ...especificacionesDerivadas },
    }));
  }, [objetoDerivado, especificacionesDerivadas]);

  const construirDatos = useCallback((): DatosContratoEdicion => {
    const esp = form.especificaciones;
    return {
      fechaContrato: form.fechaContrato,
      valorTotal: form.valorTotal,
      // t-167: se persiste el número y el texto derivado, no al revés. Así el archivo nunca
      // puede quedar con un "4 a 5" que contradiga el plazo numérico que se acaba de medir.
      plazoSemanas: Number.isInteger(plazoSemanasNum) ? plazoSemanasNum : null,
      plazoEjecucionTexto: textoPlazoSemanas(plazoSemanasNum) ?? undefined,
      fechaEntregaMaxima: form.fechaEntregaMaxima || null,
      // t-173: la holgura ya no calcula nada. La columna no se toca: se reenvía lo que había.
      holguraDias: contratoExistente?.holguraDias ?? 8,
      garantiaAnios: form.garantiaAnios,
      objetoItems: form.objetoItems.trim() || null,
      // El texto de "Suministra Veta / Suministra el Contratante" ya no se edita ni se imprime
      // (salía vacío: la plantilla eran tres títulos sin contenido y la lista de ítems ya está
      // en el numeral PRIMERO). La columna no se toca — se reenvía lo que había, para no borrar
      // en silencio un contrato ya emitido.
      alcanceSuministros: contratoExistente?.alcanceSuministros ?? null,
      aplicaClausulaPenalidad: form.aplicaClausulaPenalidad,
      aplicaPenalidadDefinitiva: form.aplicaPenalidadDefinitiva,
      anexoPropuestaIdentificacion: form.anexoPropuestaIdentificacion.trim() || null,
      especificacionesEstructura: esp.Estructura.trim() || null,
      especificacionesHerrajes: esp.Herrajes.trim() || null,
      especificacionesMesones: esp.Mesones.trim() || null,
      especificacionesDesmonte: esp.Desmonte.trim() || null,
      contratanteDomicilio: clienteForm.domicilio.trim() || null,
      hitos: hitos.map((h) => ({ tipo: h.tipo, monto: h.montoOPorcentaje, razon: h.razon })),
    };
  }, [form, hitos, clienteForm.domicilio, plazoSemanasNum, contratoExistente]);

  /**
   * t-166: alta O edición, y con el error a la vista.
   *
   * Antes esto no distinguía los dos casos y hacía siempre INSERT: como `codigo_contrato` es
   * UNIQUE y determinista por proyecto, la segunda emisión moría con un 23505 que nadie veía
   * — `handleSave` no tenía try/catch ni estado de error, así que el modal se quedaba abierto
   * sin hacer absolutamente nada. Ahora el error se muestra y nada se cierra a medias.
   *
   * t-167: `destino` decide a dónde va el usuario después de guardar. `pestana` es la pestaña
   * que el handler YA abrió de forma síncrona: abrirla después del `await` la bloquearía el
   * navegador, y sin ventana previa no hay forma honesta de mostrar un PDF en otra pestaña.
   */
  const guardar = useCallback(
    async (destino: 'cerrar' | 'contrato' | 'propuesta', pestana: Window | null) => {
      setErrorGuardado(null);
      try {
        // t-169: antes esto solo actualizaba un cliente que YA venía vinculado
        // (`if (cliente)`). Con un proyecto sin cliente la rama no se ejecutaba nunca: los
        // campos del contratante eran inertes y, como la validación exigía `tieneCliente`, el
        // botón quedaba deshabilitado para siempre. Ahora, sin cliente previo, se crea uno con
        // lo escrito y se vincula al proyecto, que es lo que hacía falta para poder cerrar.
        const datosCliente = datosClienteParaGuardar(clienteForm);
        if (datosCliente.nombre) {
          if (clienteSeleccionado) {
            await store.clientes.actualizar(clienteSeleccionado.id, datosCliente);
          } else {
            const nuevo = await store.clientes.crear(datosCliente);
            await store.proyectos.vincularCliente(proyecto.id, nuevo.id);
          }
        }

        const datos = construirDatos();
        const guardado = contratoExistente
          ? await store.contratos.actualizar(contratoExistente.id, datos)
          : await store.contratos.crear({
              proyectoId: proyecto.id,
              codigoContrato: form.codigoContrato,
              ...datos,
            });

        if (!guardado) {
          setErrorGuardado(
            'No se pudo guardar el contrato: el registro ya no existe. Cerrá y abrí el modal de nuevo.',
          );
          pestana?.close();
          return;
        }
        onSaved(guardado);
        onClose();
        if (destino === 'contrato') {
          // La página de impresión lee el contrato recién guardado; mismo origen, misma pestaña.
          router.push(`/erp/cotizador/${proyecto.id}/contrato`);
        } else if (destino === 'propuesta' && pestana) {
          pestana.location.href = `/propuesta/${proyecto.id}`;
        }
      } catch (e) {
        pestana?.close();
        setErrorGuardado(
          e instanceof Error
            ? `No se pudo guardar el contrato: ${e.message}`
            : 'No se pudo guardar el contrato. Intentá de nuevo.',
        );
      }
    },
    [clienteSeleccionado, clienteForm, store, contratoExistente, construirDatos, form.codigoContrato, proyecto.id, onSaved, onClose, router],
  );

  const handleGuardarBorrador = useCallback(
    () => guardGuardarContrato(() => guardar('cerrar', null)),
    [guardGuardarContrato, guardar],
  );
  const handleGenerar = useCallback(
    () => guardGuardarContrato(() => guardar('contrato', null)),
    [guardGuardarContrato, guardar],
  );

  /**
   * t-167: "Imprimir propuesta" abre la pestaña ANTES de guardar a propósito. Una pestaña que
   * se abre después de un `await` la bloquea el navegador como popup y el usuario no ve nada,
   * sin error visible. Abriéndola vacía y apuntabándola al final no hay ese problema.
   */
  const handleImprimirPropuesta = useCallback(() => {
    const pestana = window.open('about:blank', '_blank');
    if (!pestana) {
      setErrorGuardado(
        'El navegador bloqueó la pestaña nueva. Permití las ventanas emergentes para este sitio o usá "Ver contrato" y abrí la Propuesta desde ahí.',
      );
      return;
    }
    void guardGuardarContrato(() => guardar('propuesta', pestana));
  }, [guardGuardarContrato, guardar]);

  // t-168: la validación ya no es un booleano. `esValido` era una cadena de && que no decía
  // qué fallaba, y su única retroalimentación era un párrafo genérico (que además no existía
  // antes de t-166: el botón se deshabilitaba en silencio). Ahora la MISMA regla devuelve la
  // lista de requisitos incumplidos, y de ahí salen dos cosas que no pueden desincronizarse
  // entre sí porque salen del mismo cálculo: el mensaje inline de cada campo y la lista que
  // se muestra junto al botón.
  //
  // t-175: esto ya NO lleva useMemo, y es a propósito. El memo traía su propia lista de
  // dependencias escrita a mano, y esa lista es una segunda copia de las entradas de la regla:
  // se le olvidó `fechaEntregaMaxima`, así que al escribir la fecha el memo no se recalculaba y
  // el botón se quedaba bloqueado con "falta la fecha" para siempre, aunque la fecha estuviera
  // ahí. No hay forma de que un useMemo se queje por una dependencia que le falte. `requisitosPendientes`
  // es una función pura y barata sobre un objeto chico: calcularla en cada render cuesta nada y
  // elimina la clase entera de bug, que es mantener de a mano la lista de lo que hay que mirar.
  const pendientes = requisitosPendientes({
    tieneCliente: Boolean(clienteSeleccionado),
    nombreCliente: clienteForm.nombre,
    valorTotal: form.valorTotal,
    cantidadHitos: hitos.length,
    todosPorcentaje,
    sumaHitos,
    plazoSemanas: form.plazoSemanas,
    fechaEntregaMaxima: form.fechaEntregaMaxima,
    anexoPropuestaIdentificacion: form.anexoPropuestaIdentificacion,
  });

  const esValido = pendientes.length === 0;

  /** El mensaje exacto que bloquea un campo, o undefined si ese campo no está bloqueando. */
  const errorDe = (campo: CampoContrato) => pendientes.find((r) => r.campo === campo)?.mensaje;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg border border-border-subtle bg-bg-raised shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 id="modal-title" className="text-lg font-semibold text-text-heading">
            {esEdicion ? 'Editar Contrato' : 'Generar Contrato'}
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">
            ×
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Sección 1: Contratante */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">1. Datos del Contratante</h3>
            {/* t-169: selector de cliente. Sin esto, un proyecto sin cliente vinculado no tenía
                ninguna salida desde este modal. */}
            <div className="flex flex-col gap-2 mb-4">
              <label htmlFor="contrato-cliente" className="text-sm font-medium text-text-muted">
                Cliente vinculado
              </label>
              <select
                id="contrato-cliente"
                value={clienteIdSeleccionado}
                onChange={(e) => seleccionarCliente(e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
              >
                <option value="">Sin cliente — se creará con los datos de abajo</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errorDe("cliente") && (
                <p role="alert" className="text-sm text-error-stroke">
                  {errorDe("cliente")}
                </p>
              )}
            </div>
            <EntityFields
              className="grid grid-cols-2 gap-4"
              fields={clienteFormFields}
              values={clienteForm}
              onChange={(campo, valor) => setClienteCampo(campo, valor)}
            />
          </section>

          {/* Sección 2: Plazos */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">2. Plazos y Garantía</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* t-167: el plazo pasó de texto libre a número. La fecha máxima se calcula con
                  este número, y el texto "N (N) semanas hábiles" se deriva de él al guardar. */}
              <InputField
                label="Plazo de ejecución (semanas hábiles) *"
                value={form.plazoSemanas}
                onChange={(e) => setPlazo(e.target.value)}
                type="number"
                min={1}
                disabled={contratoFirmado}
                error={errorDe('plazoSemanas')}
              />
              {/* t-175: la fecha se CALCULA sola (firma + plazo, lunes a viernes) y se puede
                  cambiar a mano. `tocarFecha` marca que la persona la tocó, para que un cambio de
                  plazo después no le pise la fecha que ella eligió. */}
              <InputField
                label="Fecha de entrega *"
                type="date"
                value={form.fechaEntregaMaxima}
                onChange={(e) => { setTocarFecha(true); setForm({ ...form, fechaEntregaMaxima: e.target.value }) }}
                disabled={contratoFirmado}
                error={errorDe('fechaEntregaMaxima')}
              />
              <InputField label="Garantía (años)" value={form.garantiaAnios.toString()} onChange={(e) => setForm({ ...form, garantiaAnios: parseInt(e.target.value) || 2 })} type="number" min={0} />
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              {sugerencia
                ? `Se sugirió sola: ${plazoSemanasNum} semanas hábiles desde la firma, contando lunes a viernes y sin descontar festivos, así que puede quedar 1 o 2 días antes de la real. Si necesitás otra fecha, cambiala acá.`
                : 'Poné el plazo de ejecución y la fecha de entrega se sugiere sola. Sin días festivos: podés corregirla a mano.'}
            </p>
            {contratoFirmado && (
              <p className="text-[11px] text-text-muted mt-2">
                El contrato está firmado: plazo y fecha de entrega ya están comprometidos y no se
                editan acá. Un cambio después de la firma necesita un otrosí, no un overwrite.
              </p>
            )}
          </section>

          {/* Sección 3: Especificaciones — solo mostrar secciones con items cotizados.
              t-166: el gate pasa a `seccionesVisibles` (derivado una sola vez) en vez de
              llamar a `tieneItemsDeLaCategoria` en cada render. */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">3. Especificaciones Técnicas</h3>
            <div className="space-y-3">
              {seccionesVisibles.includes('Estructura') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Estructura</label>
                  <textarea
                    value={form.especificaciones.Estructura}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Estructura: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Estructura en roble macizo 18mm, uniones con espiga..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Herrajes') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Herrajes</label>
                  <textarea
                    value={form.especificaciones.Herrajes}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Herrajes: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Bisagras Blum de cierre suave..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Mesones') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Mesones</label>
                  <textarea
                    value={form.especificaciones.Mesones}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Mesones: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Mesón en granito negro absoluto..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Desmonte') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Desmonte</label>
                  <textarea
                    value={form.especificaciones.Desmonte}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Desmonte: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Condiciones de desmonte si aplica"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Sección 4: Objeto */}
          <section className="border-b border-border-subtle pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-heading">4. Objeto del Contrato</h3>
              {/* t-166: el objeto se deriva de los ítems al abrir el modal, pero después queda
                  congelado. Si el usuario edita la lista de ítems, recompilar es decisión suya. */}
              <Button variant="ghost" size="sm" onClick={recompilarDesdeItems}>
                Recompilar desde los ítems
              </Button>
            </div>
            <textarea
              value={form.objetoItems}
              onChange={(e) => setForm({ ...form, objetoItems: e.target.value })}
              className="w-full min-h-[100px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
              placeholder="Descripción de los espacios y elementos incluidos"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Una línea por ítem cotizado, con marca, acabado y ficha técnica. Recompilar descarta
              las ediciones manuales de este texto.
            </p>
          </section>

          {/* Sección 5: Anexo 1 — t-167. */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">5. Anexo 1 (Propuesta)</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">
                  Identificación del Anexo 1 (Propuesta) *
                </label>
                <InputField
                  label="Identificación del Anexo 1 (Propuesta) *"
                  value={form.anexoPropuestaIdentificacion}
                  onChange={(e) => setForm({ ...form, anexoPropuestaIdentificacion: e.target.value })}
                  error={errorDe('anexoPropuestaIdentificacion')}
                  placeholder="Propuesta de Diseño y Presupuesto «nombre» — versión 1 — fechada el 2026-01-01 — N páginas"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  No es un enlace: es cómo se identifica en papel el PDF impreso que se anexa
                  al contrato, tal como dice la cláusula PRIMERA.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 6: numeral de penalidad completo (t-170). */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">6. Cláusula de penalidad</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.aplicaClausulaPenalidad}
                onChange={(e) => setForm({ ...form, aplicaClausulaPenalidad: e.target.checked })}
                // mismo criterio que el plazo: en un contrato ya firmado la cláusula quedó
                // pactada, y apagarla acá cambiaría en silencio un documento ya suscrito.
                disabled={contratoFirmado}
                className="mt-0.5 h-4 w-4 rounded border-border-subtle cursor-pointer accent-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span>
                <span className="block text-sm font-medium text-text-heading">
                  Incluir el numeral SEXTA — penalidad del 5 % (todo o nada)
                </span>
                <span className="block text-[11px] text-text-muted mt-1">
                  Encendida, el contrato imprime el numeral SEXTA completo: retención de hasta el
                  5 % del último hito por mora en la entrega, retención de hasta el 5 % si lo
                  entregado no corresponde a los diseños o a los materiales pactados, derecho del
                  Contratista a suspender por mora del cliente, e intereses moratorios. Apagada, el
                  numeral no se imprime: no hay retención de mora ni interés moratorio. Es una sola
                  decisión, no partes: no existe la cláusula a medias. La penalidad del 10 % por
                  incumplimiento definitivo es un interruptor aparte, más abajo.
                </span>
              </span>
            </label>
            {contratoFirmado && (
              <p className="text-[11px] text-text-muted mt-2">
                El contrato está firmado: el numeral SEXTA ya salió con esta cláusula y no se apaga
                acá. Quitarla después de la firma requiere un otrosí.
              </p>
            )}

            {/* t-176: interruptor APARTE. Apagar el 5 % no puede apagar el 10 %: este es el
                numeral que permite cobrarle al Contratante cuando no paga el anticipo, y el otro
                existe para quitarle al cliente nuestra exposición por mora. Juntas en un solo
                interruptor, apagar el 5 % borraría la cláusula que nos protege a nosotros. */}
            <label className="flex items-start gap-3 cursor-pointer mt-5 pt-5 border-t border-border-subtle">
              <input
                type="checkbox"
                checked={form.aplicaPenalidadDefinitiva}
                onChange={(e) => setForm({ ...form, aplicaPenalidadDefinitiva: e.target.checked })}
                disabled={contratoFirmado}
                className="mt-0.5 h-4 w-4 rounded border-border-subtle cursor-pointer accent-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span>
                <span className="block text-sm font-medium text-text-heading">
                  Incluir el numeral SÉPTIMA — penalidad del 10 % por incumplimiento definitivo
                </span>
                <span className="block text-[11px] text-text-muted mt-1">
                  Es una cláusula distinta de la anterior y va en su propio interruptor. Cubre el
                  incumplimiento grave y definitivo, el abandono injustificado de obra y la falta
                  de pago del anticipo, y es recíproca: la paga la parte que incumple, sea el
                  Contratista o el Contratante. No se acumula con la retención del 5 %: un mismo
                  hecho se cobra por una sola vía. Apagada, el numeral no se imprime.
                </span>
              </span>
            </label>
          </section>

          {/* Sección 7: Valor y Hitos */}
          <section>
            <h3 className="text-sm font-semibold text-text-heading mb-3">7. Valor y Plan de Pagos</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Valor Total (COP)</label>
                <MoneyInput
                  value={form.valorTotal}
                  onChange={(v) => setForm({ ...form, valorTotal: v })}
                  error={errorDe('valorTotal')}
                  className="w-full"
                />
              </div>

              {/* Hitos */}
              <div className="border border-border-subtle rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-heading">Hitos de Pago</span>
                  <Button variant="ghost" size="md" onClick={addHito}>
                    + Añadir hito
                  </Button>
                </div>
                <div className="space-y-2">
                  {hitos.map((hito, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border-subtle rounded-md">
                      <span className="font-mono text-sm w-6">{hito.orden}.</span>
                      <select
                        value={hito.tipo}
                        onChange={(e) => handleHitoChange(index, 'tipo', e.target.value)}
                        className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm"
                      >
                        <option value="percentage">% del total</option>
                        <option value="fixed">Monto fijo</option>
                      </select>
                      <input
                        type="number"
                        value={hito.montoOPorcentaje}
                        onChange={(e) => handleHitoChange(index, 'montoOPorcentaje', e.target.value)}
                        className="w-24 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm font-mono"
                        step={0.01}
                        min={0}
                      />
                      <input
                        type="text"
                        value={hito.razon}
                        onChange={(e) => handleHitoChange(index, 'razon', e.target.value)}
                        placeholder="Razón"
                        className="flex-1 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm"
                      />
                      <Button variant="ghost" size="md" onClick={() => removeHito(index)} aria-label="Eliminar hito" className="text-text-muted hover:text-red-500">
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                {errorDe('hitos') && (
                  <p role="alert" className="text-xs text-error-text mt-2">
                    {errorDe('hitos')}
                  </p>
                )}
                {todosPorcentaje && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Suma de hitos</span>
                      <span className="font-mono text-text-heading">{sumaHitos.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-bg-alt rounded-full h-1 mt-1">
                      <div
                        className="bg-brand h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(sumaHitos, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">
                      El último hito por porcentaje se autocálcula para cerrar la suma a 100%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle">
          {/* t-166: antes un fallo de escritura (típicamente el 23505 del UNIQUE) no se veía
              en ninguna parte — `handleSave` no tenía try/catch, así que el modal se quedaba
              abierto sin explicar nada. Ahora el error se muestra y el modal sigue editable. */}
          {errorGuardado && (
            <p role="alert" className="mb-3 rounded-sm border border-error-stroke bg-error-fill px-3 py-2 text-sm text-error-text">
              {errorGuardado}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <Button variant="ghost" size="md" onClick={onClose} disabled={guardandoContrato}>
              Cancelar
            </Button>
            <Button variant="secondary" size="md" onClick={handleGuardarBorrador} disabled={!esValido || guardandoContrato} loading={guardandoContrato}>
              {esEdicion ? 'Guardar cambios' : 'Guardar Borrador'}
            </Button>
            {/* t-167: los dos botones de impresión que pidió el cliente. Antes había uno solo
                ("Generar Contrato") y la Propuesta había que buscarla a mano en otra pantalla,
                con la consecuencia de que el contrato se firmaba sin el anexo que lo acompaña. */}
            <Button
              variant="secondary"
              size="md"
              onClick={handleImprimirPropuesta}
              disabled={!esValido || guardandoContrato}
              loading={guardandoContrato}
            >
              Imprimir propuesta
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerar}
              disabled={!esValido || guardandoContrato}
              loading={guardandoContrato}
            >
              {esEdicion ? 'Ver contrato' : 'Imprimir contrato'}
            </Button>
          </div>
          {/* t-168: la regla del proyecto es que NINGÚN botón queda bloqueado sin decir por
              qué. Este bloque lista los requisitos incumplidos con el nombre del campo y el
              motivo; los 4 botones de arriba comparten la misma `pendientes`, así que la lista
              nunca puede contradecir el estado real del botón. Antes era un párrafo que
              enumeraba las 6 categorías sin decir cuál faltaba, y antes de t-166 no había
              nada: el botón muerto no explicaba nada. */}
          {!esValido && (
            <div
              role="alert"
              className="mt-3 rounded-sm border border-error-stroke bg-error-fill px-3 py-2"
            >
              <p className="text-sm font-medium text-error-text">
                Falta{pendientes.length === 1 ? '' : 'n'} {pendientes.length}{' '}
                {pendientes.length === 1 ? 'dato' : 'datos'} para poder imprimir el contrato:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-error-text">
                {pendientes.map((r) => (
                  <li key={r.campo}>{r.mensaje}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
