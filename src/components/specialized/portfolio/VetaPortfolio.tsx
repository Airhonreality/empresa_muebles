'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VetaProjectGallery from '../shared/VetaProjectGallery';

type PublicPortfolioImage = {
  imagen_url: string;
  descripcion?: string;
};

export type PublicPortfolioEntry = {
  slug: string;
  titulo: string;
  descripcion_comercial?: string;
  zona: string;
  categoria_espacio: string;
  materiales_destacados?: string;
  destacado: boolean;
  imagenes: PublicPortfolioImage[];
};

const categorias = ['cocinas', 'cavas_bares', 'dormitorios_closets', 'consolas_recibidores', 'otros'];
const categoriasLabels: Record<string, string> = {
  cocinas: 'Cocinas',
  cavas_bares: 'Cavas & Bares',
  dormitorios_closets: 'Dormitorios & Closets',
  consolas_recibidores: 'Consolas & Recibidores',
  otros: 'Otros',
};

export default function VetaPortfolio({ entries }: { entries: PublicPortfolioEntry[] }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<PublicPortfolioEntry | null>(null);

  const filteredPortfolios = useMemo(() => {
    if (!selectedCategory) return entries;
    return entries.filter((entry) => entry.categoria_espacio === selectedCategory);
  }, [entries, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Futura BT, sans-serif' }}>Portafolio</h1>
          <p className="text-lg text-slate-600">Proyectos realizados con materiales de calidad</p>
        </div>
      </section>

      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto pb-2">
          <Button variant={selectedCategory === '' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('')}>Todos</Button>
          {categorias.map((category) => (
            <Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(category)}>
              {categoriasLabels[category]}
            </Button>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredPortfolios.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Sin proyectos en esta categoría</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((portfolio) => {
                const mainImage = portfolio.imagenes[0];
                return (
                  <button key={portfolio.slug} type="button" onClick={() => setSelectedPortfolio(portfolio)} className="group cursor-pointer text-left">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden bg-slate-100">
                        {mainImage ? <img src={mainImage.imagen_url} alt={portfolio.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{portfolio.titulo}</h3>
                        <p className="text-sm text-slate-600 mb-3">{portfolio.zona}</p>
                        <span className="inline-flex items-center text-sm text-blue-600"><span>Ver más</span><ChevronRight className="w-4 h-4 ml-1" /></span>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <VetaProjectGallery
        open={selectedPortfolio !== null}
        onOpenChange={(open) => { if (!open) setSelectedPortfolio(null); }}
        title={selectedPortfolio?.titulo ?? ''}
        description={selectedPortfolio?.descripcion_comercial}
        images={selectedPortfolio?.imagenes.map((img) => ({ url: img.imagen_url, description: img.descripcion })) ?? []}
        materials={selectedPortfolio?.materiales_destacados?.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean)}
      />
    </div>
  );
}
