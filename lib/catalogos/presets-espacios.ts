/**
 * Catálogo canónico de Plantillas / Presets de Espacios para el Cotizador (ZU_04).
 * Permite a los comerciales precargar espacios estándar con sus ítems, cantidades
 * y jornadas estimadas en un solo clic, acelerando la cotización en campo.
 */

export interface PresetItem {
  nombre: string;
  cantidad: string;
  precioUnitario: string; // Precio base sugerido en COP
  esReferencial?: boolean;
}

export interface PresetEspacio {
  id: string;
  codigo: string;
  nombre: string;
  tipoEspacio: string;
  descripcion: string;
  icono: string; // Emoji o tag para UI rápida
  jornadas: {
    dev: string;
    ens: string;
    inst: string;
  };
  items: PresetItem[];
}

export const PRESETS_ESPACIOS: PresetEspacio[] = [
  {
    id: 'cocina_lineal_240',
    codigo: 'COC-LIN-240',
    nombre: 'Cocina Lineal Estándar (2.40m)',
    tipoEspacio: 'cocina',
    icono: '🍳',
    descripcion: 'Configuración recta de 2.40m con mueble inferior, aéreo y torre de alacena.',
    jornadas: {
      dev: '1.5',
      ens: '3.0',
      inst: '2.0',
    },
    items: [
      { nombre: 'Mueble bajo 2 puertas con entrepaño (80cm)', cantidad: '1', precioUnitario: '420000' },
      { nombre: 'Cajonero bajo 3 gavetas con correderas cierre lento (60cm)', cantidad: '1', precioUnitario: '580000' },
      { nombre: 'Mueble bajo para fregadero / poceta (60cm)', cantidad: '1', precioUnitario: '360000' },
      { nombre: 'Alacena vertical 2 puertas (40cm x 210cm)', cantidad: '1', precioUnitario: '850000' },
      { nombre: 'Mueble aéreo 2 puertas con platero y escurridor (80cm)', cantidad: '1', precioUnitario: '460000' },
      { nombre: 'Mueble aéreo sobre campana 1 puerta abatible (60cm)', cantidad: '1', precioUnitario: '280000' },
      { nombre: 'Mueble aéreo 1 puerta con entrepaños (60cm)', cantidad: '1', precioUnitario: '340000' },
      { nombre: 'Mesón en granito natural o cuarzo (2.00m) - Referencial', cantidad: '1', precioUnitario: '1200000', esReferencial: true },
    ],
  },
  {
    id: 'cocina_tipo_l_300',
    codigo: 'COC-TIPL-300',
    nombre: 'Cocina Tipo L Moderna (3.00m x 1.80m)',
    tipoEspacio: 'cocina',
    icono: '📐',
    descripcion: 'Cocina angular en L con esquinero ciego, herrajes de extracción y torre de hornos.',
    jornadas: {
      dev: '2.0',
      ens: '4.5',
      inst: '3.0',
    },
    items: [
      { nombre: 'Torre de hornos y microondas con despensa (60cm x 210cm)', cantidad: '1', precioUnitario: '1150000' },
      { nombre: 'Mueble bajo esquinero en L con organizador (90cm x 90cm)', cantidad: '1', precioUnitario: '720000' },
      { nombre: 'Mueble bajo 2 gavetas caceroleras + 1 cubiertero (90cm)', cantidad: '1', precioUnitario: '690000' },
      { nombre: 'Mueble bajo fregadero 2 puertas (80cm)', cantidad: '1', precioUnitario: '410000' },
      { nombre: 'Botellero / condimentero extraíble (20cm)', cantidad: '1', precioUnitario: '310000' },
      { nombre: 'Mueble aéreo abatible horizontal con brazo hidráulico (90cm)', cantidad: '2', precioUnitario: '520000' },
      { nombre: 'Mueble aéreo esquinero recto (60cm x 60cm)', cantidad: '1', precioUnitario: '480000' },
      { nombre: 'Mesón en Quarzstone blanco polar con salpicadero - Referencial', cantidad: '1', precioUnitario: '2400000', esReferencial: true },
    ],
  },
  {
    id: 'closet_principal_2c',
    codigo: 'CLO-PRI-2C',
    nombre: 'Closet Principal (2 Cuerpos con Maletero)',
    tipoEspacio: 'closet',
    icono: '👔',
    descripcion: 'Armario de piso a techo (2.00m ancho x 2.40m alto) con colgador, cajonera y zapatero.',
    jornadas: {
      dev: '1.0',
      ens: '2.5',
      inst: '2.0',
    },
    items: [
      { nombre: 'Módulo colgador doble para camisas y pantalones (95cm)', cantidad: '1', precioUnitario: '540000' },
      { nombre: 'Módulo colgador largo para vestidos y abrigos (95cm)', cantidad: '1', precioUnitario: '490000' },
      { nombre: 'Cajonera interna de 4 gavetas con correderas telescópicas', cantidad: '1', precioUnitario: '460000' },
      { nombre: 'Módulo zapatero con 4 bandejas inclinadas (50cm)', cantidad: '1', precioUnitario: '380000' },
      { nombre: 'Entrepaños superiores para maletero corrido (2.00m)', cantidad: '1', precioUnitario: '320000' },
      { nombre: 'Puertas batientes con bisagras de cierre suave (4 unidades)', cantidad: '1', precioUnitario: '640000' },
    ],
  },
  {
    id: 'bano_vanitory_suspendido',
    codigo: 'BAN-VAN-090',
    nombre: 'Mueble de Baño Flotante (0.90m)',
    tipoEspacio: 'bano',
    icono: '🚿',
    descripcion: 'Vanitory suspendido antihumedad con cajón sifónico y botiquín con espejo.',
    jornadas: {
      dev: '0.5',
      ens: '1.0',
      inst: '1.0',
    },
    items: [
      { nombre: 'Mueble vanitory suspendido 2 cajones con calado para sifón (90cm)', cantidad: '1', precioUnitario: '580000' },
      { nombre: 'Marco espejo flotante con iluminación LED perimetral (90cm x 70cm)', cantidad: '1', precioUnitario: '390000' },
      { nombre: 'Lavamanos cerámico de sobreponer - Referencial', cantidad: '1', precioUnitario: '320000', esReferencial: true },
      { nombre: 'Grifería monocontrol alta negra mate - Referencial', cantidad: '1', precioUnitario: '210000', esReferencial: true },
    ],
  },
  {
    id: 'centro_entretenimiento_panel',
    codigo: 'SAL-TV-200',
    nombre: 'Centro de Entretenimiento con Panel TV',
    tipoEspacio: 'sala',
    icono: '📺',
    descripcion: 'Panel alistonado para TV hasta 75" con mueble bajo flotante y pasacables oculto.',
    jornadas: {
      dev: '1.0',
      ens: '2.0',
      inst: '1.5',
    },
    items: [
      { nombre: 'Panel alistonado decorativo con soporte pasacables (2.00m x 1.80m)', cantidad: '1', precioUnitario: '920000' },
      { nombre: 'Mueble bajo suspendido 3 puertas abatibles push-to-open (2.00m x 35cm)', cantidad: '1', precioUnitario: '680000' },
      { nombre: 'Repisa superior decorativa con luz LED cálida indirecta (1.50m)', cantidad: '1', precioUnitario: '260000' },
    ],
  },
];
