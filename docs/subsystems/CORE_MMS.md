# 🧠 SUBSISTEMA: Core MMS (Matter Management System)

El Core MMS es la capa de inteligencia y persistencia del satélite. Su función es gestionar el ciclo de vida de la materia sin acoplarse a su significado.

## 🛰️ 1. Agnostic Bridge
El orquestador de comunicaciones. Implementa el patrón **Strategy** para desacoplar el origen de los datos.
*   **Circuit Breaker**: Si un silo (ej: GitHub) no responde en 5 segundos, el Bridge conmuta automáticamente al `LocalVault`.
*   **Resonancia**: Cada vez que el Bridge ejecuta una acción, el `SovereignContext` resuena, actualizando la memoria reactiva de la UI.

## ⚙️ 2. Workflow Engine
El motor de voluntad. Permite ejecutar secuencias de **Acciones Atómicas** definidas en JSON.
*   **Transaccionalidad**: Si un paso del flujo falla, el proceso se detiene para evitar estados de materia corruptos.
*   **Acciones Soportadas**: `VALIDATE`, `BRIDGE_EXECUTE`, `NOTIFY`, `LOG_ACTION`.

## 🔥 3. Secuencia de Ignición (Bootstrapping)
Al arrancar, el Satélite realiza una búsqueda en el Silo de:
1.  `SYSTEM_CONFIG`: Define la identidad visual y portal de inicio.
2.  `META_CLASSES`: Define los arquetipos que construyen la Forja.
3.  `VIEW_PROJECTIONS`: Define el mapa de navegación del sistema.
