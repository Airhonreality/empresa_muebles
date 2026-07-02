import { getStrategy } from '../src/server/getStrategy';

async function test() {
  console.log('⚡ INICIANDO TEST PIPELINE DE ZAP ACTIVAR PRODUCCIÓN...');
  const strategy = getStrategy();
  
  // 1. Consultar proyectos
  const proyectos = await strategy.read('proyectos');
  const contratos = await strategy.read('contratos');
  
  console.log(`\n📊 Encontrados ${proyectos.length} proyectos y ${contratos.length} contratos en la base de datos.`);
  
  // Buscar un proyecto que tenga un contrato asociado
  let targetProyecto = null;
  let targetContrato = null;
  
  for (const p of proyectos) {
    const c = contratos.find((ct: any) => ct.data?.proyecto_id === p.id || ct.proyecto_id === p.id);
    if (c) {
      targetProyecto = p;
      targetContrato = c;
      break;
    }
  }
  
  if (!targetProyecto || !targetContrato) {
    console.error('❌ Error: No se encontró ningún proyecto con contrato asociado para realizar el test.');
    process.exit(1);
  }
  
  const pData = targetProyecto.data ?? targetProyecto;
  const cData = targetContrato.data ?? targetContrato;
  
  console.log(`\n🎯 Proyecto seleccionado para la prueba:`);
  console.log(`   - ID: ${targetProyecto.id}`);
  console.log(`   - Nombre: ${pData.nombre_proyecto || 'Sin Nombre'}`);
  console.log(`   - Estado Inicial Proyecto: ${pData.estado}`);
  console.log(`   - Estado Inicial Contrato: ${cData.estado}`);
  
  // 2. Ejecutar el Zap vía API Local
  console.log('\n📡 Enviando POST a http://localhost:3001/api/engine...');
  
  try {
    const res = await fetch('http://localhost:3001/api/engine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        zap: 'zap_activar_produccion',
        payload: {
          record: {
            id: targetProyecto.id,
            dias_entrega_estimados: pData.dias_entrega_estimados || 30
          }
        }
      })
    });
    
    const body = await res.json();
    console.log(`\n📥 Respuesta del Servidor (Status ${res.status}):`);
    console.log(JSON.stringify(body, null, 2));
    
    if (body.success) {
      console.log('\n✅ ¡Zap ejecutado exitosamente en el Sandbox!');
      
      // 3. Verificar cambios en la Base de Datos
      const updatedProyectos = await strategy.read('proyectos');
      const updatedContratos = await strategy.read('contratos');
      const updatedOrders = await strategy.read('ordenes_trabajo');
      
      const pUp = updatedProyectos.find((p: any) => p.id === targetProyecto.id);
      const cUp = updatedContratos.find((c: any) => c.id === targetContrato.id);
      const otUp = updatedOrders.find((o: any) => o.data?.proyecto_id === targetProyecto.id || o.proyecto_id === targetProyecto.id);
      
      const pUpData = pUp?.data ?? pUp;
      const cUpData = cUp?.data ?? cUp;
      const otUpData = otUp?.data ?? otUp;
      
      console.log('\n🔍 Verificación de homeostasis en base de datos:');
      console.log(`   - Nuevo Estado Proyecto: ${pUpData?.estado} (Esperado: produccion)`);
      console.log(`   - Nuevo Estado Contrato: ${cUpData?.estado} (Esperado: firmado)`);
      console.log(`   - Orden de Trabajo Creada: ${otUpData ? 'SÍ' : 'NO'}`);
      if (otUpData) {
        console.log(`     * Código OT: ${otUpData.codigo_orden}`);
        console.log(`     * Estado OT: ${otUpData.estado} (Esperado: pendiente)`);
        console.log(`     * Fecha Entrega: ${otUpData.fecha_entrega}`);
      }
      
      if (pUpData?.estado === 'produccion' && cUpData?.estado === 'firmado' && otUpData) {
        console.log('\n🏆 ¡TEST COMPLETADO CON ÉXITO! Todos los estados y registros secundarios se sincronizaron perfectamente.');
      } else {
        console.log('\n⚠️ ADVERTENCIA: Algunos estados no coinciden con lo esperado.');
      }
    } else {
      console.error('\n❌ Error en la ejecución del Zap.');
    }
  } catch (err: any) {
    console.error(`\n❌ Error de red / conexión: ${err.message}`);
  }
}

test().catch(console.error);
