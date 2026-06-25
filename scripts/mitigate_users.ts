import { getStrategy } from '../src/server/getStrategy';
import { randomUUID } from 'crypto';

async function run() {
  const strategy = getStrategy();
  
  // 1. Obtener todos los registros actuales
  console.log('--- PASO 1: LEYENDO REGISTROS BASURA ---');
  const records = await strategy.read('usuarios_equipo');
  console.log(`Encontrados ${records.length} registros para eliminar.`);

  // 2. Eliminar cada uno
  for (const r of records) {
    await strategy.remove('usuarios_equipo', r.id);
  }
  console.log('--- PURGA COMPLETADA ---');

  // 3. Crear SSOT real
  console.log('--- PASO 2: INYECTANDO SSOT ---');
  
  const ssot = [
    {
      nombre: "Víctor Hugo García González",
      email: "victor@vetadorada.com",
      rol: "Administrador",
      estado: "Activo",
      descripcion_semantica: "Agente Directivo. Rol Estratégico. Condición de Estado: Salario base 2.5M COP (div. quincenas)."
    },
    {
      nombre: "Harold Fernando León",
      email: "harold@vetadorada.com",
      rol: "Taller / Producción",
      estado: "Activo",
      descripcion_semantica: "Agente Directivo. Rol Estratégico. Condición de Estado: Salario base 2.0M COP (div. quincenas)."
    },
    {
      nombre: "Airhon Javier García",
      email: "airhon@vetadorada.com",
      rol: "Administrador",
      estado: "Activo",
      descripcion_semantica: "Agente Directivo. Rol Estratégico. Condición de Estado: Salario base 2.5M COP (div. quincenas)."
    },
    {
      nombre: "Juan Sebastián Moreno Fontecha",
      email: "sebastian@vetadorada.com",
      rol: "Finanzas",
      estado: "Activo",
      descripcion_semantica: "Agente Administrativo. Rol: Contador. Condición de Estado: Honorarios 400K COP (mensual, pago quincenal)."
    },
    {
      nombre: "Daniel Jaraba",
      email: "daniel@vetadorada.com",
      rol: "Taller / Producción",
      estado: "Activo",
      descripcion_semantica: "Agente Operativo. Rol: Oficial de Taller. Fuerza productiva primaria (TGS). Condición de Estado: Pago por día laborado 80K COP."
    }
  ];

  for (const user of ssot) {
    await strategy.write('usuarios_equipo', {
      id: randomUUID(),
      context: 'usuarios_equipo',
      data: user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  console.log(`--- INYECCIÓN COMPLETADA (${ssot.length} usuarios reales) ---`);
}

run().catch(console.error);
