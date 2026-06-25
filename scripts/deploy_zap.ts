import { getStrategy } from '../src/server/getStrategy';
import { randomUUID } from 'crypto';

async function run() {
  const strategy = getStrategy();
  
  const zapCode = `
const items = payload.items || [];
if (items.length === 0) {
  api.notify.error("No hay ítems en la orden para enviar a Finanzas.");
  return;
}

const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

let semantica = "### Orden de Compra Taller\\n\\n";
semantica += "| Cantidad | Ítem | Unitario | Subtotal |\\n";
semantica += "|---|---|---|---|\\n";
items.forEach(item => {
  semantica += \`| **\${item.cantidad}** | \${item.nombre} | $\${item.precio_unitario} | $\${item.cantidad * item.precio_unitario} |\\n\`;
});
semantica += \`\\n**Total Orden:** $\${total}\`;

const obligationData = {
  descripcion: "Insumos y Herrajes de Taller (Automático)",
  tipo: "por_pagar",
  monto_total: total,
  monto_pagado: 0,
  estado: "pendiente",
  descripcion_semantica: semantica,
  fecha_vencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +3 days
};

await api.saveItem("obligaciones_pendientes", { data: obligationData });
api.notify.success(\`Orden enviada a Finanzas por $\${total}\`);
api.dispatchEvent('clear_cart', {});
  `;

  await strategy.write('scripts', {
    id: randomUUID(),
    context: 'scripts',
    data: {
      name: "zap_convertir_orden_en_obligacion",
      code: zapCode.trim()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  console.log('Zap desplegado con éxito en la base de datos.');
}

run().catch(console.error);
