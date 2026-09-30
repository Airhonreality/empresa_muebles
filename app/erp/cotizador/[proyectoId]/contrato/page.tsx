'use client'

import { useParams } from 'next/navigation'
import { CotizadorCompatProvider, useCotizadorCompat } from '@/lib/data/queries/cotizador-compat'
import { Button } from '@/components/veta/button'
import { textoPlazoSemanas } from '@/lib/data/contrato-fechas'
import { ordinalesClausulas, type ClaveClausula } from '@/lib/data/contrato-clausulas'

// Plantilla del contrato de fabricación e instalación (t-163, 2026-09-14).
// Adaptada de la plantilla del sistema legacy (`legacy-agnostic-backup:
// src/server/scripts/exportar_contrato_pdf.js`), que coincide con el PDF de
// cliente proporcionado por Javier ("Contrato de fabricacion e instalación -
// Alberts Jamit Enríquez Chenas VF.pdf"). Cambio de marca: "Veta de Oro" → "Veta
// Dorada". Mecanismo elegido por el Supervisor: página imprimible + window.print()
// (mismo patrón que la propuesta pública), NO PDF binario.
//
// Principio axiomático (t-162): este documento NO recalcula el total. El cotizador
// es quien suma (materiales + MO + costos + imprevistos − descuento + ajuste + IVA)
// y el contrato absorbe ese valor final como dato de entrada. Los montos de los
// hitos se derivan del valorTotal absorbido y del porcentaje/monto fijo de cada
// hito persistido (tabla hitos_pago), nunca sumando materiales/mo por separado.

function numeroALetras(num: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const especiales: Record<number, string> = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
    25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve',
  }
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  function traducirSeccion(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cien'
    let res = ''
    const c = Math.floor(n / 100)
    const d = Math.floor((n % 100) / 10)
    const u = n % 10
    const du = n % 100
    if (c > 0) res += centenas[c] + ' '
    if (du > 0) {
      if (du < 10) {
        res += unidades[du]
      } else if (especiales[du]) {
        res += especiales[du]
      } else {
        res += decenas[d]
        if (u > 0) res += ' y ' + unidades[u]
      }
    }
    return res.trim()
  }

  if (num === 0) return 'cero pesos m/cte'
  const entero = Math.floor(num)
  let letras = ''
  const millones = Math.floor(entero / 1000000)
  const miles = Math.floor((entero % 1000000) / 1000)
  const unidadesResto = entero % 1000
  if (millones > 0) {
    letras += millones === 1 ? 'un millón ' : traducirSeccion(millones) + ' millones '
  }
  if (miles > 0) {
    letras += miles === 1 ? 'mil ' : traducirSeccion(miles) + ' mil '
  }
  if (unidadesResto > 0) letras += traducirSeccion(unidadesResto) + ' '
  return (letras.trim() + ' pesos m/cte').toUpperCase()
}

function fmtCOP(v: number): string {
  return '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP'
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function fechaLarga(iso: string | null): { dia: string; mes: string; anio: string } | null {
  if (!iso) return null
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (!year || !month || !day) return null
  return { dia: day, mes: MESES[parseInt(month, 10) - 1] ?? month, anio: year }
}

/** 'AAAA-MM-DD' → '15 de octubre de 2026', para la fecha de entrega del contrato. */
function fechaTexto(iso: string): string {
  const f = fechaLarga(iso)
  return f ? `${f.dia} de ${f.mes} de ${f.anio}` : iso
}

export default function ContratoPrintPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  return (
    <CotizadorCompatProvider proyectoId={proyectoId}>
      <ContratoPrintInner proyectoId={proyectoId} />
    </CotizadorCompatProvider>
  )
}

function ContratoPrintInner({ proyectoId }: { proyectoId: string }) {
  const { store, cargando } = useCotizadorCompat()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
  const contrato = store.contratos.porProyecto(proyectoId)
  const hitosList = contrato ? store.hitos.porContrato(contrato.id) : []

  if (cargando) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-text-muted">Cargando contrato…</p>
  }

  if (!contrato || !proyecto) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-text-muted">Contrato no generado para este proyecto.</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            ← Volver
          </Button>
        </div>
      </div>
    )
  }

  const totalNeto = parseNum(contrato.valorTotal)

  // t-166: el objeto se renderiza como elementos React, NO con dangerouslySetInnerHTML.
  // Antes se concatenaba HTML a mano y se inyectaba sin escapar: el texto se arma con
  // descripciones de catálogo y `nombrePersonalizado` de los ítems, ambos controlados por
  // el usuario, así que un `<img onerror=...>` en un nombre de ítem se ejecutaba en el
  // navegador de quien abría el contrato. React escapa por defecto y el <ul> sale igual.
  const objetoItems = (contrato.objetoItems ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Tabla de pagos: cada hito persistido con su % o monto fijo; el monto COP se deriva
  // del valorTotal absorbido de la cotización (t-162) — nunca se suma material por acá.
  const filas = hitosList
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((h) => {
      const pct = h.tipo === 'percentage' ? parseNum(h.montoOPorcentaje) : null
      const monto = h.tipo === 'percentage' ? Math.round((totalNeto * (pct ?? 0)) / 100) : parseNum(h.montoOPorcentaje)
      return {
        etiqueta: h.razon || (h.tipo === 'percentage' ? `${pct}%` : 'Pago'),
        etiquetaCorta: '',
        descripcion: h.razon || '',
        porcentaje: pct !== null ? `${pct}%` : '—',
        montoCop: fmtCOP(monto),
      }
    })
  if (filas.length === 0) {
    filas.push({
      etiqueta: 'Primer Anticipo (Firma y Planificación)',
      etiquetaCorta: '',
      descripcion: 'Indispensable para realizar compra de tableros e iniciar fabricación en taller.',
      porcentaje: '50%',
      montoCop: fmtCOP(Math.round(totalNeto * 0.5)),
    })
    filas.push({
      etiqueta: 'Segundo Pago (Ingreso y Montaje)',
      etiquetaCorta: '',
      descripcion: 'Al momento del ingreso del mobiliario al domicilio de obra e inicio de instalación en sitio.',
      porcentaje: '25%',
      montoCop: fmtCOP(Math.round(totalNeto * 0.25)),
    })
    filas.push({
      etiqueta: 'Pago Final (Finalización de Obra)',
      etiquetaCorta: '',
      descripcion: 'Al concluir la instalación principal del mobiliario dejándolo en condiciones operativas y funcionales.',
      porcentaje: '25%',
      montoCop: fmtCOP(totalNeto - Math.round(totalNeto * 0.5) - Math.round(totalNeto * 0.25)),
    })
  }

  const hayEspecificaciones = !!(contrato.especificacionesEstructura || contrato.especificacionesHerrajes || contrato.especificacionesMesones || contrato.especificacionesDesmonte)

  // t-173: la fecha de entrega se LEE, no se calcula. Se sacó el cálculo por días hábiles con
  // calendario de feriados: dependía de un año cargado a mano y, si faltaba, el contrato salía
  // sin fecha. Ahora es un campo que se escribe en el modal y se imprime tal cual.
  const fechaEntrega = fechaLarga(contrato.fechaEntregaMaxima)
    ? fechaTexto(contrato.fechaEntregaMaxima as string)
    : null
  const fechaFirma = fechaLarga(contrato.fechaContrato)

  // El texto del plazo sale del número. Si el número no está (contrato viejo), se cae al texto
  // guardado, y si tampoco está, se dice "el plazo acordado en la Propuesta" en vez de inventar
  // un rango que nadie pactó.
  const plazoTexto = textoPlazoSemanas(contrato.plazoSemanas)
    ?? contrato.plazoEjecucionTexto
    ?? 'plazo acordado en la Propuesta que constituye el Anexo 1'

  // t-170: el ordinal de cada cláusula y de cada referencia cruzada sale de acá. Con la
  // penalidad apagada, GARANTIA pasa a ser el numeral SEXTA y así sucesivamente, sin huecos: si
  // los ordinales estuvieran escritos en el texto, apagar la penalidad dejaría un salto visible
  // (QUINTA y después SÉPTIMA) en un documento que el cliente firma. `ord` devuelve cadena
  // vacía solo si se referencia una cláusula que no se está imprimiendo, que hoy no ocurre:
  // las únicas referencias a la penalidad viven dentro de la propia penalidad y de DÉCIMA,
  // que ya vienen condicionadas.
  const ordinales = ordinalesClausulas({
    penalidad: contrato.aplicaClausulaPenalidad,
    penalidadDefinitiva: contrato.aplicaPenalidadDefinitiva,
  })
  const ord = (clave: ClaveClausula) => ordinales[clave] ?? ''

  return (
    <>
      {/* Barra de acciones — oculta al imprimir */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border-subtle bg-bg-paper/95 px-6 py-3 print:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="md" onClick={() => window.history.back()}>← Volver</Button>
          <span className="text-text-muted text-xs">
            {proyecto.nombreProyecto} · {contrato.codigoContrato}
          </span>
        </div>
        <Button variant="primary" size="md" onClick={() => window.print()}>
          Descargar PDF
        </Button>
      </div>

      <div className="contract-print">
        <div className="header-brand">
          <h1>Veta Dorada</h1>
          <p className="subtitle">Estética y Confort</p>
        </div>

        <div className="contract-title">
          Contrato de Fabricación e Instalación de Mobiliario a Medida
          <br />
          <span className="ref">Código de Referencia: {contrato.codigoContrato}</span>
        </div>

        {fechaFirma && (
          <div className="meta-date">
            Bogotá D.C., {fechaFirma.dia} de {fechaFirma.mes} de {fechaFirma.anio}
          </div>
        )}

        <div className="section-title">1. Partes Contratantes</div>

        <table className="parties-table">
          <tbody>
            <tr>
              <td className="col-title">EL CONTRATANTE:</td>
              <td>
                <strong>{cliente?.nombre ?? ''}</strong><br />
                Identificación: {cliente?.documento ?? ''}<br />
                Domicilio de Obra: {contrato.contratanteDomicilio || cliente?.domicilio || ''}<br />
                Correo: {cliente?.email ?? ''}<br />
                Teléfono: {cliente?.telefono ?? ''}
              </td>
            </tr>
            <tr style={{ height: 15 }}><td /><td /></tr>
            <tr>
              <td className="col-title">EL CONTRATISTA:</td>
              <td>
                <strong>Hermanos García González S.A.S</strong><br />
                NIT: 901421357-9<br />
                Domicilio Principal: Cra 72a 71a 57, Bogotá D.C., Colombia<br />
                Representante Legal: Airhon Javier García Rozo<br />
                C.C. No. 123.350.6023<br />
                Correo: Vetadeoro.co@gmail.com | Teléfono: 302 5922101
              </td>
            </tr>
          </tbody>
        </table>

        <div className="section-title">2. Consideraciones Generales</div>
        <p>
          Las partes contratantes obran de estricta buena fe, con plena capacidad legal y técnica para la ejecución satisfactoria del proyecto descrito en este contrato, basándose en la Propuesta de Diseño y Presupuesto que se identifica en el numeral {ord('OBJETO')} de este documento y que hace parte integral y vinculante de él.
        </p>

        <div className="section-title">3. Cláusulas del Contrato</div>

        <div className="clausula-header">{ord('OBJETO')}. OBJETO DEL CONTRATO Y ANEXOS</div>
        <p>
          El Contratista se obliga a realizar la fabricación e instalación del siguiente mobiliario a medida de acuerdo con los requerimientos técnicos coordinados y validados:
        </p>

        {/* Se conserva el <div> envolvente del markup original: no tiene estilos propios,
            pero cambiar la estructura del documento firmado no es algo que deba hacer
            un fix de seguridad sin poder mirarlo impreso. */}
        <div>
          {objetoItems.length > 0 ? (
            <ul>
              {objetoItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Fabricación e instalación de mobiliario a medida de acuerdo con la propuesta aprobada.</p>
          )}
        </div>

        <p className="italic-note">
          Las especificaciones exactas de dimensiones, modulaciones, colores y herrajes corresponden a las descritas y renderizadas en la Propuesta de Diseño aprobada por el Contratante.
        </p>

        {/* t-167: el Anexo 1 se identifica por contenido —propuesta impresa, versión, fecha y
            número de páginas— y no por URL. Un enlace a la propuesta online se rompe, y el
            reclamo más frecuente era justo ese: "me enviaron el contrato sin el anexo". */}
        {/* t-171: acá NO se cita el plazo de entrega de la Propuesta. El plazo contractual lo
            fija el numeral PLAZOS de este mismo contrato, y si además la Propuesta "formara
            parte" con un plazo propio, el documento tendría dos plazos y el que se contradiga
            queda anulado sin que nadie pueda saber cuál. La Propuesta se anexa por su
            contenido (ítems, renders, precios), que es lo que no está pactado en otro lado. */}
        <p>
          <strong>Anexo 1 — Propuesta de Diseño y Presupuesto:</strong> {contrato.anexoPropuestaIdentificacion || 'Propuesta de Diseño y Presupuesto del proyecto ' + proyecto.nombreProyecto}. Dicha propuesta se anexa al presente contrato. Su contenido, sus render y sus precios forman parte integral de este contrato.
        </p>
        <div className="clausula-header">{ord('ALCANCE')}. ALCANCE</div>
        <p>
          El alcance de este contrato queda limitado a los ítems cotizados y descritos en el numeral{' '}
          {ord('OBJETO')} y en el Anexo 1. Todo suministro no listado en dichos lugares se considera
          excluido y solo podrá entregarse mediante el procedimiento de adicionales del numeral{' '}
          {ord('ADICIONALES')}.
        </p>
        <p>
          <strong>Exclusiones y Suministros del Cliente:</strong> Se excluyen del alcance de este contrato todo tipo de obras civiles, plomería, instalaciones de gas, conexiones eléctricas y pintura de muros ajenos al mobiliario en sí.
          <em> Importante:</em> Los electrodomésticos o complementos especiales suministrados por el Contratante deberán contar con sus respectivas fichas técnicas oficiales entregadas al Contratista antes del inicio de la fabricación. Cualquier reproceso, ajuste o retraso derivado de medidas erróneas, omisión de fichas técnicas o entrega tardía de estos elementos por parte del Contratante generará un cobro adicional por concepto de mano de obra y materiales de modificación, y suspenderá los plazos pactados.
        </p>

        {hayEspecificaciones && (
          <div className="tech-specs">
            <div className="tech-specs-title">Especificaciones Técnicas Acordadas</div>
            <div className="tech-grid">
              {contrato.especificacionesEstructura && (
                <div className="tech-item"><strong>Estructura y Material:</strong> {contrato.especificacionesEstructura}</div>
              )}
              {contrato.especificacionesHerrajes && (
                <div className="tech-item"><strong>Herrajes y Bisagras:</strong> {contrato.especificacionesHerrajes}</div>
              )}
              {contrato.especificacionesMesones && (
                <div className="tech-item"><strong>Mesones / Superficies:</strong> {contrato.especificacionesMesones}</div>
              )}
              {contrato.especificacionesDesmonte && (
                <div className="tech-item"><strong>Desmonte / Disposición:</strong> {contrato.especificacionesDesmonte}</div>
              )}
            </div>
          </div>
        )}

        <div className="clausula-header">{ord('PLAZOS')}. PLAZOS Y FECHA DE ENTREGA</div>
        <p>
          El plazo de ejecución pactado es de <strong>{plazoTexto}</strong>{fechaFirma ? `, contados desde la firma de este documento, el ${fechaFirma.dia} de ${fechaFirma.mes} de ${fechaFirma.anio}` : ''}.
          {fechaEntrega
            ? <> La entrega se realiza el <strong>{fechaEntrega}</strong>.</>
            : null}
        </p>
        {fechaEntrega && (
          <div className="fecha-entrega-box">
            <div className="fecha-entrega-row">
              <span>Fecha de entrega comprometida:</span>
              <strong className="font-mono">{fechaEntrega}</strong>
            </div>
            <p className="fecha-entrega-nota">
              El plazo corre desde la fecha en que el Contratante realiza el primer anticipo de este
              contrato. Si ese anticipo se paga después de la firma, la fecha de entrega se corre por
              el mismo número de días de retraso. El comprobante de pago acredita la fecha real de
              inicio.
            </p>
          </div>
        )}
        <p>
          <strong>Anticipo tardío:</strong> el contrato no obliga al Contratista a financiar la
          producción con recursos propios antes de recibir el primer anticipo.
        </p>

        <div className="clausula-header">{ord('ENTREGA')}. ENTREGA Y AJUSTES</div>
        <p>
          La entrega del mobiliario se realiza en el domicilio de obra dentro del plazo pactado en
          el numeral {ord('PLAZOS')}. Hay una sola entrega, y ocurre en la fecha comprometida.
        </p>
        <p>
          <strong>Ajustes menores y reservas:</strong> desde la entrega, el Contratante tiene{' '}
          <strong>10 días hábiles</strong> para ejecutar los remates finales, correr las pruebas de
          funcionamiento y revisar los ajustes menores del mobiliario. Dentro de esos mismos 10 días
          hábiles puede presentar por escrito sus reservas u observaciones. Vencido el término sin
          reservas, la entrega se entiende aceptada. El uso u ocupación del mobiliario se
          entenderá como aceptación de lo no reservado, pero no como renuncia a lo expresamente
          reservado.
        </p>
        <p>
          <strong>Retrasos imputables al Contratante:</strong> la no firma del Acta de Entrega, la
          no entrega de las fichas técnicas de los suministros a su cargo, o la falta de acceso
          al domicilio de obra, no generan derecho a retención, penalidad ni suspensión de plazo
          por parte del Contratista.
        </p>

        <div className="clausula-header">{ord('ADICIONALES')}. MANEJO DE ADICIONALES</div>
        <p>
          Cualquier modificación sobre los diseños aprobados, cambio de color/textura posterior al inicio de producción, o trabajo extra no contemplado en la Propuesta que constituye el Anexo 1, deberá ser solicitado y aprobado formalmente por escrito (correo electrónico o servicio de mensajería instantánea de datos). Sin este acuerdo que exprese el nuevo precio y el impacto sobre los tiempos de entrega, el Contratista no estará obligado a ejecutar dichos cambios.
        </p>

        {/* t-170: el switch del modal gobierna la cláusula COMPLETA, no una parte. Apagado,
            el numeral SEXTA no se imprime: no hay retención del 5 % por mora, ni por
            incumplimiento de la Propuesta, ni mora del Contratante, ni intereses moratorios.
            Encendido, sale entero. Media cláusula pegada al interruptor es exactamente el
            estado que no debe existir: "lo apagamos un momentico" y quedó la mora pactada sin
            penalidad. */}
        {contrato.aplicaClausulaPenalidad && (
          <>
            <div className="clausula-header">{ord('PENALIDAD')}. MORA, RETENCIÓN Y SUSPENSIONES</div>
            <p>
              <strong>Mora del Contratista:</strong> si la entrega no se produce en la fecha máxima
              comprometida del numeral {ord('PLAZOS')} y el retraso es imputable al Contratista —es decir,
              no se configura ninguna de las causales de exoneración del numeral {ord('SITIO_Y_FUERZA_MAYOR')}—, el
              Contratante podrá retener del último hito de pago el <strong>0,5 % semanal</strong> de
              su valor, con un <strong>tope máximo del 5 %</strong> de ese mismo hito. La retención
              se aplica únicamente sobre el último hito, se contabiliza por semanas hábiles
              completas de retraso y no se acumula con penalidades de otra naturaleza.
            </p>
            <p>
              <strong>Entrega que no cumple la Propuesta:</strong> si el mobiliario entregado no
              corresponde a los diseños, dimensiones, materiales o acabados aprobados en la Propuesta
              que constituye el Anexo 1 —incluida la entrega con materiales distintos de los
              pactados—, y el Contratante lo comunica por escrito dentro de los 10 días hábiles del
              numeral {ord('ENTREGA')}, podrá retener del último hito de pago el{' '}
              <strong>0,5 % semanal</strong> de su valor, con un <strong>tope máximo del 5 %</strong>{' '}
              de ese mismo hito. Es una segunda causa de retención, distinta de la mora e
              independiente de ella: no se acumulan entre sí.
            </p>
            <p>
              <strong>Mora del Contratante (simétrica):</strong> si el Contratante retrasa el pago de
              un hito, no entrega los suministros o fichas técnicas a su cargo, o no garantiza el
              acceso al domicilio de obra, el Contratista podrá suspender la ejecución, y la fecha
              máxima comprometida se correrá por el mismo número de días hábiles del retraso del
              Contratante, sin que ello genere retención ni penalidad a su favor.
            </p>
            <p>
              <strong>Intereses:</strong> las sumas que el Contratante deba pagar y que permanezcan
              vencidas generarán intereses moratorios a la tasa de usura vigente en Colombia,
              aplicada sobre el saldo insoluto.
            </p>
          </>
        )}

        {/* t-176: penalidad del 10 % por incumplimiento definitivo / abandono / falta de pago del
            anticipo. BILATERAL y en switch aparte, a propósito.

            Por qué no va dentro del switch del 5 %: el 5 % protege al Contratante de nuestra mora.
            Este 10 % es lo único que nos permite cobrarle al Contratante cuando no paga el
            anticipo. Si compartieran interruptor, apagar el 5 % —que existe justamente para
            quitarle al cliente nuestra exposición— se llevaría por delante la cláusula que nos
            protege a nosotros.

            Exclusividad con el 5 %: el texto del 5 % dice que la retención "no se acumula con
            penalidades de otra naturaleza". Un 10 % dentro del mismo numeral sería contradictorio
            consigo mismo, y un mismo hecho no puede generar 5 % + 10 % (15 %) por la misma
            novela. Por eso son cláusulas separadas y la de aquí se declara ALTERNA.

            Abandono: los 10 días hábiles para subsanar son inútiles contra un abandono —no hay
            nada que subsanar y regalar dos semanas más a quien ya se fue es regalarle plazo sin
            contraprestación—, así que el plazo corre solo contra incumplimientos subsanables y en
            el abandono la notificación queda como constancia para el registro. Esto lo tiene que
            confirmar el abogado: es la parte del texto donde más se puede discutir. */}
        {contrato.aplicaPenalidadDefinitiva && (
          <>
            <div className="clausula-header">
              {ord('PENALIDAD_DEFINITIVA')}. INCUMPLIMIENTO DEFINITIVO Y ABANDONO DE OBRA
            </div>
            <p>
              <strong>Penalidad del 10 % (recíproca):</strong> adicionalmente, en caso de
              incumplimiento grave y definitivo de las obligaciones contractuales, o de{' '}
              <strong>abandono injustificado de la obra</strong> por parte del Contratista, o de
              resolución del contrato por <strong>falta de pago del anticipo</strong> por parte del
              Contratante, la parte incumplida pagará a la otra una penalidad equivalente al{' '}
              <strong>10 % del valor total del contrato</strong>, previa notificación escrita con un
              plazo de <strong>10 días hábiles</strong> para subsanar. La notificación se hace por
              escrito y puede enviarse a cualquier medio que deje constancia de su envío y de la
              fecha.
            </p>
            <p>
              <strong>Abandono de obra:</strong> tratándose de abandono, que no es subsanable, el
              plazo de 10 días hábiles no corre y la notificación escrita queda como constancia del
              hecho para todos los efectos. En los casos de incumplimiento subsanable, el plazo se
              cuenta desde la notificación y, si no se subsana, la penalidad se hace exigible sin
              que sea necesario un trámite judicial previo.
            </p>
            {ord('PENALIDAD') && (
              <p>
                <strong>No acumulación:</strong> esta penalidad es <strong>alterna</strong> a la
                retención del numeral {ord('PENALIDAD')} y no se suma a ella. Un mismo hecho no
                puede generar las dos: el incumplimiento que definido o el abandono se cobran acá y
                por una sola vez, y la mora que sí admite corrección se cobra únicamente por la vía
                de la retención del 5 %.
              </p>
            )}
          </>
        )}

        <div className="clausula-header">{ord('GARANTIA')}. GARANTÍA DEL SERVICIO</div>
        <p>
          El Contratista otorga una garantía de calidad y estabilidad de <strong>{contrato.garantiaAnios || 2} años</strong> a partir del Acta de Entrega, la cual cubre defectos de fabricación de la estructura modular y fallos derivados directamente de la instalación física.
        </p>
        <p>
          <strong>Plazo de respuesta:</strong> el Contratista se compromete a dar respuesta escrita
          y programar la visita técnica de diagnóstico dentro de los <strong>5 días hábiles</strong>{' '}
          siguientes a la radicación del reclamo por cualquier medio. Este plazo es de{' '}
          <strong>respuesta y diagnóstico</strong>, no de solución: el tiempo final de reparación o
          reposición depende de la disponibilidad técnica y de importación de los insumos del
          fabricante. Si al momento del diagnóstico se determina que el reparo requiere un insumo
          que el Contratista no tiene, este lo informa por escrito dentro de los mismos 5 días
          hábiles, indicando el tiempo estimado.
        </p>
        <p>
          <strong>Exclusiones de Garantía:</strong> Esta garantía no cubre daños provocados por mal uso, limpieza con químicos abrasivos, humedad estructural proveniente de muros o tuberías de la edificación, exposición excesiva a la luz solar directa, plagas de insectos, accidentes o manipulación técnica realizada por terceros ajenos al Contratista.
        </p>
        <p>
          <strong>Herrajes e Iluminación:</strong> La garantía de sistemas electrónicos, iluminación LED, electrodomésticos o herrajes mecánicos de marca corresponderá estrictamente a la ofrecida de forma directa por el fabricante de dichos insumos, y se documentará en el <strong>Acta de Garantías (Anexo 3)</strong> que se firma al cierre de la obra.
        </p>
        {/* t-174: el Acta de Entrega y el Acta de Garantías se nombran acá, donde importan, y
            no en la lista de anexos. En el numeral PRIMERA parecían piezas de un inventario de
            papeles y además se añadía una frase sobre "la no existencia de estos actas al
            momento de la firma", que describe algo que no es un problema: el acta de entrega se
            firma cuando se entrega, y el acta de garantías cuando se cierra la obra. */}
        <p>
          El <strong>Acta de Entrega (Anexo 2)</strong> se suscribe en el momento de la entrega del
          mobiliario e inicia el cómputo de la garantía. El <strong>Acta de Garantías (Anexo 3)</strong>
          se suscribe al cierre de la obra y deja constancia de las garantías de fábrica de cada
          insumo instalado.
        </p>

        {/* t-174: se quitó el párrafo de desmonte. Estaba escrito en la plantilla y no salía de
            los ítems cotizados, o sea que el contrato afirmaba algo que el proyecto no
            necesariamente compraba. El cliente lo pidió fuera "por ahora".

            ⚠️ El resto de la cláusula NO es del desmonte y no se puede borrar con él: "Fuerza
            mayor y causales de exoneración" es la lista de causales por las que el Contratista NO
            incurre en mora, y la citan el numeral de penalidad y el de corresponsabilidad. Si
            este numeral desaparece, ambas referencias quedan apuntando a la nada y la cláusula del
            5 % se queda sin salida. */}
        <div className="clausula-header">{ord('SITIO_Y_FUERZA_MAYOR')}. CONDICIONES DEL SITIO Y FUERZA MAYOR</div>
        <p>
          <strong>Condiciones del sitio:</strong> el Contratante garantiza que el domicilio de obra
          cuenta con las condiciones necesarias para la instalación: espacios de acceso y maniobra
          para el tamaño del mobiliario, altura libre, puntos de energía y agua para las
          herramientas, y una superficie nivelada y limpia. La falta de estas condiciones no
          suspende el plazo, y los trabajos de adecuación que se requieran se cotizan como
          adicionales.
        </p>
        <p>
          <strong>Fuerza mayor y causales de exoneración:</strong> el Contratista no responderá por
          el incumplimiento de la fecha máxima si el retraso obedece a causas ajenas a su control
          y que no le sean imputables, entre ellas: retrasos de importadores o proveedores de
          tableros y herrajes debidamente demostrados, falta de acceso físico al inmueble en los
          horarios permitidos, suspensión de las obras de terceros, frentes de obra
          suspendidos por autoridad pública, o cualquier otro evento de fuerza mayor previsto
          por la ley.
          La mera presentación del reclamo no interrumpe el curso del plazo: el Contratista deberá
          acreditar la causal dentro de los 5 días hábiles siguientes en que ocurra, con los
          soportes que la respalden.
        </p>

        <div className="clausula-header">{ord('PAGOS')}. CONDICIONES DE PAGO</div>
        <p>
          El valor total del presente contrato asciende a la suma de <strong>{fmtCOP(totalNeto)}</strong> (<em>{numeroALetras(totalNeto)}</em>), pagaderos a la cuenta autorizada de Hermanos García González S.A.S bajo los siguientes hitos de avance:
        </p>

        {/* t-177: declaración, NO cálculo. El total de arriba YA trae el IVA si el proyecto lo
            tiene aplicado (`aplica_iva` + `porcentaje_iva`); este interruptor solo decide si el
            contrato lo dice. Con la frase, el cliente sabe que ese número es el precio final y no
            le llega una factura con un 19 % encima.
            Cuando el interruptor está apagado el contrato no menciona IVA: ese es el hueco que
            hay que decidir (ver nota del modal). */}
        {contrato.incluyeIVA && (
          <p>
            <strong>IVA incluido:</strong> el valor total pactado en este contrato{' '}
            <strong>incluye</strong> el impuesto a las ventas (IVA){' '}
            {proyecto?.porcentajeIva ? `del ${proyecto.porcentajeIva} %` : ''} ya aplicado, de modo
            que sobre esa suma no se causa IVA adicional ni queda saldo por ese concepto. El
            Contratante se obliga a pagar las sumas pactadas sin descontar, retener o compensar el
            IVA, salvo por retención en la fuente legalmente obligatoria.
          </p>
        )}

        <table className="payment-table">
          <thead>
            <tr>
              <th>Hito de Pago</th>
              <th>Porcentaje</th>
              <th style={{ textAlign: 'right' }}>Monto (COP)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td>{f.etiqueta}{f.descripcion ? `: ${f.descripcion}` : ''}</td>
                <td>{f.porcentaje}</td>
                <td className="amount">{f.montoCop}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="clausula-header">{ord('CORRESPONSABILIDAD')}. CORRESPONSABILIDAD Y SUSPENSIÓN</div>
        {contrato.aplicaClausulaPenalidad && (
          <p>
            Las causales que liberan al Contratista de la retención de mora del numeral {ord('PENALIDAD')}, y que
            deben acreditarse con soportes, son las enumeradas en el numeral {ord('SITIO_Y_FUERZA_MAYOR')}. Ninguna otra
            situación comercial, dificultad de aprovisionamiento o cambio de las condiciones operativas
            del Contratante constituye por sí sola una de ellas.
          </p>
        )}
        <p>
          <strong>Ruptura de la Buena Fe:</strong> El Contratista se reserva el derecho de suspender de forma temporal o definitiva la instalación o liquidar el contrato en el estado en que se encuentre si el Contratante ejerce hostilidad, maltrato o acoso hacia el personal de instalación, o si condiciona el pago del segundo abono o saldo final a exigencias imprevistas no pactadas.
        </p>

        <div className="clausula-header">{ord('MERITO')}. MÉRITO EJECUTIVO</div>
        <p>
          Las partes acuerdan que el presente contrato presta mérito ejecutivo de acuerdo con la legislación colombiana para la exigencia judicial del cumplimiento de todas las obligaciones de dar, hacer y pagar contenidas en él.
        </p>


        <div className="section-title">4. Medios de Pago Autorizados</div>
        <p>
          Los pagos deberán ser transferidos directamente a la cuenta corporativa oficial del contratista:
        </p>
        <p>
          <strong>Entidad Bancaria:</strong> Bancolombia<br />
          <strong>Tipo de Cuenta:</strong> Cuenta de Ahorros<br />
          <strong>Número de Cuenta:</strong> 62700003257<br />
          <strong>Titular:</strong> Hermanos García González S.A.S (NIT: 901421357-9)
        </p>

        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-title">EL CONTRATANTE</div>
            <br /><br /><br />
            Firma: ___________________________<br />
            Nombre: {cliente?.nombre ?? ''}<br />
            C.C. o NIT: {cliente?.documento ?? ''}
          </div>

          <div className="signature-box">
            <div className="signature-title">EL CONTRATISTA</div>
            <br /><br /><br />
            <span className="firma-wrap">
              <img src="/firma_representante.png" alt="Firma" className="firma-img" />
              Firma: ___________________________
            </span><br />
            Nombre: Airhon Javier García Rozo<br />
            Representante Legal - Hermanos García González S.A.S<br />
            C.C. No. 123.350.6023
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* t-170: "margin: 0" a propósito. El pie con la URL de la página y el "3/5" no lo
           pone esta app: los dibuja el navegador en el margen de la hoja, y solo caben si el
           @page tiene margen. Con margen 0 no hay caja de margen donde dibujarlos, y el mismo
           espacio se reproduce como padding de .contract-print en @media print (abajo). Por
           eso los dos van juntos: cambiar uno sin el otro deja el texto pegado al borde. */
        @page {
          size: letter;
          margin: 0;
        }
        .contract-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 20px 20px;
          font-family: Georgia, serif;
          color: #222222;
          line-height: 1.6;
          font-size: 13.5px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-brand {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #C5A059;
          padding-bottom: 20px;
        }
        .header-brand h1 {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1A1A1A;
          margin: 0;
        }
        .header-brand p.subtitle {
          font-family: Inter, sans-serif;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #C5A059;
          margin: 5px 0 0;
        }
        .contract-title {
          text-align: center;
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #111111;
        }
        .contract-title .ref {
          font-size: 12px;
          font-weight: normal;
          color: #555555;
          text-transform: none;
        }
        .meta-date {
          text-align: right;
          font-size: 12px;
          margin-bottom: 20px;
          color: #555555;
          font-style: italic;
        }
        .section-title {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 25px;
          margin-bottom: 10px;
          color: #111111;
          border-bottom: 1px solid #EAEAEA;
          padding-bottom: 4px;
        }
        .parties-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .parties-table td {
          padding: 6px 12px;
          vertical-align: top;
          font-size: 13px;
        }
        .parties-table td.col-title {
          font-weight: bold;
          width: 180px;
          color: #333333;
        }
        .contract-print p, .contract-print li {
          margin-bottom: 10px;
          text-align: justify;
        }
        .contract-print ul, .contract-print ol {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        .contract-print li {
          margin-bottom: 6px;
        }
        .clausula-header {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
          color: #111111;
        }
        .italic-note {
          font-size: 12px;
          color: #444444;
          margin-top: 10px;
          font-style: italic;
        }
        .tech-specs {
          background-color: #FAF9F6;
          border: 1px solid #EAE6DF;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 12.5px;
        }
        .tech-specs-title {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8C7343;
          margin-bottom: 8px;
        }
        .tech-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
        }
        .tech-item strong {
          color: #444444;
        }
        /* t-173: la fecha de entrega va en recuadro porque es el dato que el cliente busca con
           el dedo para compararlo contra el cronograma. */
        .fecha-entrega-box {
          background-color: #FAF9F6;
          border: 1px solid #C5A059;
          border-radius: 6px;
          padding: 14px 16px;
          margin: 14px 0;
        }
        .fecha-entrega-nota {
          font-size: 11.5px;
          color: #555555;
          margin: 8px 0 0;
          text-align: left;
        }
        .fecha-entrega-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .payment-table th, .payment-table td {
          border: 1px solid #EAEAEA;
          padding: 8px 12px;
          font-size: 12px;
        }
        .payment-table th {
          background-color: #FAFAFA;
          font-weight: bold;
          text-align: left;
        }
        .payment-table td.amount {
          font-family: Inter, sans-serif;
          font-weight: 600;
          text-align: right;
        }
        .signatures-section {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          page-break-inside: avoid;
        }
        .signature-box {
          border-top: 1px solid #222222;
          padding-top: 10px;
          font-size: 12px;
          position: relative;
        }
        .signature-title {
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .firma-wrap {
          position: relative;
          display: inline-block;
        }
        .firma-img {
          height: 75px;
          position: absolute;
          bottom: -10px;
          left: 40px;
          mix-blend-mode: multiply;
        }
        @media print {
          .contract-print {
            max-width: 100%;
            /* el margen que dejó de estar en @page */
            padding: 1.5cm 2cm;
          }
          .tech-specs {
            background-color: #FAF9F6 !important;
            border: 1px solid #EAE6DF !important;
          }
          .payment-table th {
            background-color: #FAFAFA !important;
          }
        }
      `}</style>
    </>
  )
}