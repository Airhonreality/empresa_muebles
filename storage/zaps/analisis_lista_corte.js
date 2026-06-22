/**
 * Zap: analisis_lista_corte
 * 
 * Este script se ejecuta en el sandbox del servidor de Agnostic (/api/engine).
 * Analiza numéricamente la lista de corte importada de OpenCutList/Excel y detecta anomalías.
 */

// activeRecord que disparó la acción (ej. ordenes_trabajo o desarrollo_diseno)
const record = payload.record;
const context = payload.context;

api.notify.success("Iniciando validación de lista de corte...");

// Lógica de detección de piezas pequeñas (medidas en mm, mínimo 65mm = 6.5cm)
const MEDIDA_MINIMA_MM = 65; 
let piezasAnomalas = [];

// Ejemplo de análisis de JSON o datos importados
// const listaCorte = JSON.parse(record.lista_corte_raw || '[]');
const listaCorte = [
  // Mock para pruebas iniciales
  { id: 1, componente: "Lateral Izquierdo", largo: 700, ancho: 350 },
  { id: 2, componente: "Frentera Cajón Chica", largo: 120, ancho: 60 }, // Anómalo: ancho 60 < 65
  { id: 3, componente: "Zócalo Refuerzo", largo: 600, ancho: 80 }
];

for (const pieza of listaCorte) {
  const largo = Number(pieza.largo);
  const ancho = Number(pieza.ancho);
  
  if (largo < MEDIDA_MINIMA_MM || ancho < MEDIDA_MINIMA_MM) {
    piezasAnomalas.push(`${pieza.componente} (${largo}x${ancho}mm)`);
  }
}

if (piezasAnomalas.length > 0) {
  api.notify.error(`¡Alerta de Calidad! Se detectaron piezas menores a 6.5cm: ${piezasAnomalas.join(', ')}`);
  // Opcional: Actualizar el estado de la orden marcando falla técnica
  // await api.saveItem(context, { id: record.id, data: { estado_tecnico: 'Falla_Validacion' } });
} else {
  api.notify.success("¡Validación exitosa! Todas las piezas cumplen con las medidas mínimas para maquinado.");
  // Opcional: Actualizar el estado del diseño a listo para maquinado
  // await api.saveItem(context, { id: record.id, data: { estado_tecnico: 'Aprobado_Maquinado' } });
}
