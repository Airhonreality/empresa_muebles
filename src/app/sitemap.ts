import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

const SITE_URL = 'https://vetadeoro.co'
const STORAGE_DB = path.join(process.cwd(), 'storage', 'db')

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(STORAGE_DB, filename)
  if (!fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as T[]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/colecciones`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/portafolio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/agendar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const products = readJsonFile<{ id: string; data?: { slug?: string; descripcion?: string; publicado_web?: boolean } }>('productos_catalogo.json')
    .filter(r => r.data?.publicado_web === true && r.data?.slug)

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${SITE_URL}/colecciones/${encodeURIComponent(p.data!.slug!)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const portfolioItems = readJsonFile<{ id: string; data?: { slug?: string; publicado?: boolean } }>('portfolio_publico.json')
    .filter(r => r.data?.publicado === true && r.data?.slug)

  const portfolioRoutes: MetadataRoute.Sitemap = portfolioItems.map(p => ({
    url: `${SITE_URL}/portafolio/${encodeURIComponent(p.data!.slug!)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...productRoutes, ...portfolioRoutes]
}
