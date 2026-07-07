'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type PortfolioPublicoRecord = {
  proyecto_id?: string;
  titulo?: string;
  slug?: string;
  descripcion_comercial?: string;
  cliente_iniciales?: string;
  barrio?: string;
  categoria_espacio?: string;
  materiales_destacados?: string;
  publicado?: boolean;
  destacado?: boolean;
  orden?: number;
  fecha_publicacion?: string;
};

type ImagenPortfolioRecord = {
  portfolio_id?: string;
  imagen_url?: string;
  descripcion?: string;
  orden?: number;
};

const normalizeRecords = <T,>(payload: unknown): RecordItem<T>[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { records?: unknown[] })?.records)
      ? (payload as { records: unknown[] }).records
      : [];

  return source.map((item) => {
    const record = item as RecordItem<T>;
    return { ...record, ...(record.data || {}), id: record.id };
  });
};

async function readRecords(namespace: string) {
  const res = await fetch(`/api/vault?namespace=${encodeURIComponent(namespace)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return normalizeRecords(body.records ?? body.data ?? []);
}

const categorias = ['cocinas', 'cavas_bares', 'dormitorios_closets', 'consolas_recibidores', 'otros'];
const categoriasLabels: Record<string, string> = {
  cocinas: 'Cocinas',
  cavas_bares: 'Cavas & Bares',
  dormitorios_closets: 'Dormitorios & Closets',
  consolas_recibidores: 'Consolas & Recibidores',
  otros: 'Otros'
};

export default function VetaPortfolio() {
  const [portfolios, setPortfolios] = useState<RecordItem<PortfolioPublicoRecord>[]>([]);
  const [imagenes, setImagenes] = useState<RecordItem<ImagenPortfolioRecord>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<RecordItem<PortfolioPublicoRecord> | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [portData, imgData] = await Promise.all([
          readRecords('portfolio_publico'),
          readRecords('imagenes_portfolio')
        ]);
        const publishedPort = (portData as RecordItem<PortfolioPublicoRecord>[]).filter(p => p.publicado === true);
        setPortfolios(publishedPort.sort((a, b) => {
          if (a.destacado !== b.destacado) return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0);
          return (a.orden ?? 0) - (b.orden ?? 0);
        }));
        setImagenes(imgData as RecordItem<ImagenPortfolioRecord>[]);
      } catch (err) {
        console.error('Error loading portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredPortfolios = useMemo(() => {
    if (!selectedCategory) return portfolios;
    return portfolios.filter(p => p.categoria_espacio === selectedCategory);
  }, [portfolios, selectedCategory]);

  const portfolioImages = useMemo(() => {
    if (!selectedPortfolio) return [];
    return imagenes
      .filter(img => img.portfolio_id === selectedPortfolio.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }, [selectedPortfolio, imagenes]);

  const currentImage = portfolioImages[currentImageIdx];

  const handlePrevImage = () => {
    setCurrentImageIdx(prev => (prev === 0 ? portfolioImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx(prev => (prev === portfolioImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Futura BT, sans-serif' }}>
            Portafolio
          </h1>
          <p className="text-lg text-slate-600">Proyectos realizados con materiales de calidad</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              Todos
            </Button>
            {categorias.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {categoriasLabels[cat]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-16 text-slate-500">Cargando portafolio...</div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Sin proyectos en esta categoría</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map(portfolio => {
                const mainImage = imagenes.find(img => img.portfolio_id === portfolio.id);
                return (
                  <div
                    key={portfolio.id}
                    onClick={() => {
                      setSelectedPortfolio(portfolio);
                      setCurrentImageIdx(0);
                    }}
                    className="group cursor-pointer"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden bg-slate-100">
                        {mainImage?.imagen_url ? (
                          <img
                            src={mainImage.imagen_url}
                            alt={portfolio.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {portfolio.titulo}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">
                          Proyecto {portfolio.cliente_iniciales} — {portfolio.barrio}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedPortfolio(portfolio);
                            setCurrentImageIdx(0);
                          }}
                        >
                          Ver más
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal - Ver más */}
      <Dialog open={!!selectedPortfolio} onOpenChange={() => setSelectedPortfolio(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPortfolio && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPortfolio.titulo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Galería */}
                {portfolioImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="aspect-video bg-slate-100 overflow-hidden rounded-lg">
                      {currentImage?.imagen_url && (
                        <img
                          src={currentImage.imagen_url}
                          alt={currentImage.descripcion || 'Imagen del proyecto'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {portfolioImages.length > 1 && (
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{currentImageIdx + 1} de {portfolioImages.length}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handlePrevImage}>
                            ←
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleNextImage}>
                            →
                          </Button>
                        </div>
                      </div>
                    )}
                    {currentImage?.descripcion && (
                      <p className="text-sm text-slate-600">{currentImage.descripcion}</p>
                    )}
                  </div>
                )}

                {/* Descripción */}
                {selectedPortfolio.descripcion_comercial && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                    <div
                      className="text-slate-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: selectedPortfolio.descripcion_comercial
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                )}

                {/* Materiales */}
                {selectedPortfolio.materiales_destacados && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Materiales Utilizados</h3>
                    <ul className="space-y-2">
                      {selectedPortfolio.materiales_destacados
                        .split('\n')
                        .filter(m => m.trim())
                        .map((material, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-slate-700">{material.trim()}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Info */}
                <div className="border-t pt-4 flex justify-between text-sm text-slate-600">
                  <span>Proyecto {selectedPortfolio.cliente_iniciales}</span>
                  <span>{selectedPortfolio.barrio}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
