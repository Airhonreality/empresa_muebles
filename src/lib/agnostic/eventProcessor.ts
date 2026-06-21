import { toast } from 'sonner';

type MateriaSyncFn = (context: string, item: any) => void;

/**
 * Procesa un evento emitido por el engine (Zap) en el cliente.
 * 
 * Esta es la función canónica que interpreta el vocabulario de salida
 * del engine. Todo componente que llame a /api/engine y reciba events[]
 * debe usar esta función para procesarlos.
 * 
 * @param event - Objeto evento del engine { action, ...payload }
 * @param onMateriaSync - Callback para sincronizar el store (useMateriaStore.updateItem)
 */
export async function processEvent(
  event: any,
  onMateriaSync?: MateriaSyncFn
): Promise<void> {
  switch (event.action) {

    case 'notify':
      event.type === 'success'
        ? toast.success(event.message)
        : toast.error(event.message);
      break;

    case 'materia_sync':
      onMateriaSync?.(event.context, event.item);
      break;

    case 'print_pdf': {
      let html = event.payload?.html || '';
      // Inyectar base href para resolver rutas relativas (firmas, logos, imágenes)
      if (typeof window !== 'undefined' && !html.includes('<base href=')) {
        const baseTag = `<base href="${window.location.origin}/" />`;
        html = html.replace('<head>', `<head>${baseTag}`);
      }
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
      await new Promise<void>((resolve) => {
        iframe.onload = async () => {
          iframe.onload = null; // Prevenir doble ejecución
          // 1. Esperar tipografías web
          await (iframe.contentDocument as any)?.fonts?.ready;
          // 2. Esperar todas las imágenes (firmas, logos, renders)
          const images = Array.from(iframe.contentDocument?.querySelectorAll('img') || []);
          await Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((res) => {
              img.onload = () => res();
              img.onerror = () => res();
            });
          }));
          // 3. Disparar impresión
          iframe.contentWindow!.focus();
          iframe.contentWindow!.print();
          // 4. Limpieza del DOM (500ms es pragmático — afterprint no es confiable en iframes)
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            resolve();
          }, 500);
        };
        document.body.appendChild(iframe);
        iframe.contentDocument!.open();
        iframe.contentDocument!.write(html);
        iframe.contentDocument!.close();
      });
      break;
    }

    case 'download_pdf': {
      const { template, inputs, filename = 'documento.pdf' } = event.payload || {};
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, inputs })
      });
      if (!res.ok) { toast.error('Error generando PDF'); break; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      break;
    }

    case 'download_file': {
      const { content, filename = 'archivo.txt', mimeType = 'text/plain' } = event.payload || {};
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      break;
    }

    case 'redirect':
      window.location.href = event.payload?.path || '/';
      break;

    case 'open_url':
      window.open(event.payload?.url, event.payload?.target ?? '_blank');
      break;

    case 'clipboard':
      await navigator.clipboard.writeText(event.payload?.text || '');
      toast.success('Copiado al portapapeles');
      break;
  }
}

/**
 * Procesa un array de eventos secuencialmente.
 * Convenience wrapper para el patrón común de iterar result.events.
 */
export async function processEvents(
  events: any[],
  onMateriaSync?: MateriaSyncFn
): Promise<void> {
  for (const event of events) {
    await processEvent(event, onMateriaSync);
  }
}
