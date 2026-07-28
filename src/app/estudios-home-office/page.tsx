import type { Metadata } from 'next';
import VetaEspacioDetail from '@/components/specialized/VetaEspacioDetail';

export const metadata: Metadata = { title: 'Estudios y home office a medida | Veta Dorada', description: 'Diseño y fabricación de estudios y home office a medida para trabajar con orden y comodidad en Bogotá.' };

export default function EstudiosPage() {
  return <VetaEspacioDetail eyebrow="Estudios y home office" title="Un espacio de trabajo que sí funciona para ti." description="Creamos estudios y home office a medida para combinar concentración, almacenamiento y comodidad sin sacrificar la estética de tu hogar." portfolioCategory="estudios_home_office" benefits={['Superficies de trabajo definidas según tu equipo y rutina.', 'Almacenamiento para documentos, libros y elementos de uso diario.', 'Soluciones para cables, iluminación y tecnología.', 'Proporciones y acabados integrados al ambiente existente.']} processNote="Fabricamos la solución con las medidas del espacio y coordinamos la instalación para dejarla lista para usar." />;
}
