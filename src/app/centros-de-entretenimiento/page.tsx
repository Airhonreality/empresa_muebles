import type { Metadata } from 'next';
import VetaEspacioDetail from '@/components/specialized/VetaEspacioDetail';

export const metadata: Metadata = { title: 'Centros de entretenimiento a medida | Veta Dorada', description: 'Centros de entretenimiento y muebles para salas diseñados a medida en Bogotá.' };

export default function EntretenimientoPage() {
  return <VetaEspacioDetail eyebrow="Centros de entretenimiento" title="Tecnología integrada, ambiente en calma." description="Diseñamos muebles para salas que organizan pantallas, equipos, objetos y almacenamiento sin perder la ligereza visual del espacio." portfolioCategory="centros_entretenimiento" benefits={['Medidas y proporciones ajustadas al muro y a la pantalla.', 'Canalización y organización visual para equipos y conexiones.', 'Combinación de nichos, puertas, cajones y superficies de apoyo.', 'Diseño pensado para convivir con el resto del ambiente.']} processNote="Fabricamos cada componente según la propuesta aprobada y cuidamos la integración durante la instalación." />;
}
