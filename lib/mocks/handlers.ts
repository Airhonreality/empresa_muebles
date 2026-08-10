import { http, HttpResponse } from 'msw';
import productos from './data/productos.json';
import proyectos from './data/proyectos.json';
import testimonios from './data/testimonios.json';

export const handlers = [
  // Productos
  http.get('/api/publico/productos', () => {
    return HttpResponse.json(productos);
  }),
  
  // Productos por categoría
  http.get('/api/publico/productos/:categoria', ({ params }: { params: { categoria: string } }) => {
    const { categoria } = params;
    const productosFiltrados = productos.filter(
      (producto) => producto.categoria_comercial === categoria
    );
    return HttpResponse.json(productosFiltrados);
  }),
  
  // Portafolio
  http.get('/api/publico/portafolio', () => {
    return HttpResponse.json(proyectos);
  }),
  
  // Portafolio por categoría
  http.get('/api/publico/portafolio/:categoria', ({ params }: { params: { categoria: string } }) => {
    const { categoria } = params;
    const proyectosFiltrados = proyectos.filter(
      (proyecto) => proyecto.categoria_comercial === categoria
    );
    return HttpResponse.json(proyectosFiltrados);
  }),
  
  // Testimonios
  http.get('/api/publico/testimonios', () => {
    return HttpResponse.json(testimonios);
  }),
  
  // Leads (Agendar)
  http.post('/api/publico/leads', async ({ request }: { request: Request }) => {
    const data = await request.json();
    console.log('Lead recibido:', data);
    return HttpResponse.json({ success: true });
  }),
];