sequenceDiagram
    participant S as Servidor (SSR/Kernel)
    participant FS as Almacenamiento (Pasaporte)
    participant C as Cliente (AppProvider)
    participant UI as Interfaz (SystemSection)

    Note over S, FS: 1. FASE DE IGNICIÓN (Determinismo Puro)
    S->>FS: Leer storage/system_config.json
    FS-->>S: MasterPassport (Contrato Tipado)
    S->>S: Validar Pasaporte (Error fatal si incompleto)
    S->>S: Instanciar Estrategias ADN + Almacenamiento
    S->>S: initializeRegistry() -> Registro de Capacidades (Catálogo)

    Note over S, C: 2. FASE DE HIDRATACIÓN ÚNICA (Vault)
    S->>S: getVaultData() -> Carga Materia + Pasaporte + Catálogo
    S->>C: Inyectar initialData via SSR (layout.tsx)

    Note over C: 3. MONTAJE ATÓMICO (Sin Fetches)
    C->>C: hydrateMateria(initialData)
    C->>C: hydrateDNA(initialData)
    Note right of C: CERO re-fetches en useEffect<br/>CERO triple hidratación

    Note over UI: 4. PROYECCIÓN (Espejo de Verdad)
    UI->>C: find('master_passport') -> Datos de Identidad
    UI->>UI: registry.getCapabilities('strategy') -> Opciones del Catálogo
    UI->>UI: Proyectar Formulario (Configuración == Realidad)

    Note over UI, FS: 5. CRISTALIZACIÓN SOBERANA (Save)
    UI->>S: saveItem('master_passport')
    S->>FS: Sobrescribir Raíz Neutral
    S->>S: Invalidar Caché + Re-alinear Silo
