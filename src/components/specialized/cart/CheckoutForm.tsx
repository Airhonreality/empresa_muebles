'use client';

import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useAuth } from '@/context/AuthContext';
import { COP } from '@/components/specialized/cotizador/utils';
import { Loader2 } from 'lucide-react';

export function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();

  const [nombre, setNombre] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrio, setBarrio] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!items.length) {
      setError('El carrito está vacío');
      setLoading(false);
      return;
    }

    try {
      const body = {
        items: items.map(i => ({
          tipo: i.tipo,
          ref_id: i.ref_id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          imagen_url: i.imagen_url,
        })),
        customer: {
          nombre,
          email,
          telefono,
          direccion_entrega: direccion,
          barrio,
        },
        cliente_id: (user as any)?.cliente_id || '',
        user_id: user?.id || '',
      };

      const res = await fetch('/api/integrations/wompi/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      clearCart();

      const { checkout } = data;
      const params = new URLSearchParams({
        'public-key': checkout.public_key,
        'reference': checkout.reference,
        'amount-in-cents': String(checkout.amount_in_cents),
        'currency': checkout.currency,
        'signature:integrity': checkout.signature,
        'redirect-url': checkout.redirect_url,
      });

      const wompiUrl = `https://sandbox.wompi.co/v1/checkout?${params.toString()}`;
      window.location.href = wompiUrl;
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-checkout-form>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nombre completo *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-400"
          required
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-400"
          required
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-400"
          placeholder="300 123 4567"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Dirección de entrega *
        </label>
        <input
          type="text"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-400"
          required
          placeholder="Cra 1 # 2-3"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Barrio
        </label>
        <input
          type="text"
          value={barrio}
          onChange={e => setBarrio(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-400"
          placeholder="Barrio"
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-semibold text-gray-800">
          Total: {COP(subtotal)}
        </span>
      </div>

      <button
        type="submit"
        disabled={loading || !items.length}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando...
          </span>
        ) : (
          'Pagar con Wompi'
        )}
      </button>
    </form>
  );
}
