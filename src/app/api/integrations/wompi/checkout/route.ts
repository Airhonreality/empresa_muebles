import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'db');

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T[];
}

function writeJsonFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

interface CartItem {
  tipo: string;
  ref_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  imagen_url?: string;
}

interface CustomerData {
  nombre: string;
  email: string;
  telefono?: string;
  direccion_entrega: string;
  barrio?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: CustomerData;
  cliente_id?: string;
  user_id?: string;
}

interface ProductoCatalogo {
  id: string;
  context: string;
  data: {
    descripcion: string;
    precio_publico: number;
    precio_directo: number;
  };
}

interface PedidoWebRecord {
  id: string;
  context: string;
  data: {
    numero: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function generatePedidoNumero(existing: PedidoWebRecord[]): string {
  let maxSeq = 0;
  for (const p of existing) {
    const num = p.data?.numero || '';
    const match = num.match(/^PED-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return `PED-${String(maxSeq + 1).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    if (!body.items?.length) {
      return NextResponse.json({ ok: false, error: 'Carrito vacío' }, { status: 400 });
    }
    if (!body.customer?.nombre || !body.customer?.email || !body.customer?.direccion_entrega) {
      return NextResponse.json({ ok: false, error: 'Datos del comprador incompletos' }, { status: 400 });
    }

    const catalogo = readJsonFile<ProductoCatalogo>('productos_catalogo.json');
    const prefabricados = readJsonFile<{ id: string; context: string; data: { nombre: string; precio_publico: number; [key: string]: unknown } }>('prefabricados.json');

    let serverSubtotal = 0;
    for (const item of body.items) {
      if (!item.ref_id || !item.cantidad || item.cantidad < 1) {
        return NextResponse.json({ ok: false, error: `Item inválido: ${item.nombre}` }, { status: 400 });
      }

      let producto = catalogo.find(p => p.id === item.ref_id || p.data?.descripcion === item.nombre);
      let precioReal = 0;

      if (producto) {
        precioReal = producto.data.precio_publico || producto.data.precio_directo || 0;
      } else if (item.tipo === 'prefabricado') {
        const prefab = prefabricados.find(p => p.id === item.ref_id);
        if (!prefab) {
          return NextResponse.json({ ok: false, error: `Prefabricado no encontrado: ${item.nombre}` }, { status: 400 });
        }
        precioReal = prefab.data.precio_publico || 0;
      } else {
        return NextResponse.json({ ok: false, error: `Producto no encontrado: ${item.nombre}` }, { status: 400 });
      }

      const cantidad = Math.max(1, Math.floor(Number(item.cantidad)));
      serverSubtotal += precioReal * cantidad;
    }

    const wompiReference = crypto.randomUUID();
    const amountInCents = Math.round(serverSubtotal);
    const currency = 'COP';

    const privateKey = process.env.WOMPI_PRIVATE_KEY || '';
    const signaturePayload = `${wompiReference}~${amountInCents}~${currency}`;
    const signature = crypto.createHmac('sha256', privateKey).update(signaturePayload, 'utf8').digest('hex');

    const pedidosExistentes = readJsonFile<PedidoWebRecord>('pedidos_web.json');
    const numero = generatePedidoNumero(pedidosExistentes);

    const newPedido = {
      id: crypto.randomUUID(),
      context: 'pedidos_web',
      data: {
        numero,
        user_id: body.user_id || '',
        cliente_id: body.cliente_id || '',
        nombre: body.customer.nombre,
        email: body.customer.email,
        telefono: body.customer.telefono || '',
        direccion_entrega: body.customer.direccion_entrega,
        barrio: body.customer.barrio || '',
        items_snapshot: JSON.stringify(body.items),
        subtotal: serverSubtotal,
        total: amountInCents,
        estado: 'pendiente_pago',
        wompi_reference: wompiReference,
        wompi_transaction_id: '',
        metodo_pago: '',
        notas: '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    pedidosExistentes.push(newPedido);
    writeJsonFile('pedidos_web.json', pedidosExistentes);

    return NextResponse.json({
      ok: true,
      pedido: { numero, id: newPedido.id },
      checkout: {
        public_key: process.env.WOMPI_PUBLIC_KEY || '',
        reference: wompiReference,
        amount_in_cents: amountInCents,
        currency,
        signature,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cuenta`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
