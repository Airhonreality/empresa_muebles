// payload: { record: { id: compra_id, data: { material_id, costo_real_compra } } }
async function main() {
  const { record, context, schema } = payload;

  if (context !== 'compras_materiales' || !record || !record.data.material_id || !record.data.costo_real_compra) {
    api.notify.error('Payload inválido. Se requiere una compra de material con costo real.');
    return;
  }

  const { material_id, costo_real_compra } = record.data;

  // Asumimos que hay una relación 1 a 1 o una forma de encontrar el producto del catálogo
  // Aquí, asumimos que el `material_id` en `compras_materiales` es el mismo que el `id` en `productos_catalogo`
  const productos = await api.query('productos_catalogo');
  const productoAfectado = productos.find(p => p.id === material_id);

  if (productoAfectado) {
    await api.saveItem('productos_catalogo', {
      id: productoAfectado.id,
      data: { ...productoAfectado, precio_directo: costo_real_compra }
    });
    api.notify.success(`Catálogo actualizado: ${productoAfectado.descripcion} ahora cuesta ${costo_real_compra}.`);
  } else {
    api.notify.warn(`No se encontró un producto en el catálogo para el material ID: ${material_id}`);
  }
}

main();
