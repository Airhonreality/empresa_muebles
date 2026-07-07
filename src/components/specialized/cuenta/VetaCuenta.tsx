'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSystemStore } from '@/lib/agnostic/store';

interface ProyectoCliente {
  id: string;
  nombre_proyecto: string;
  estado: string;
  dias_entrega_estimados?: number;
  barrio?: string;
}

interface PedidoResumen {
  id: string;
  numero: string;
  estado: string;
  total: number;
  subtotal: number;
  fecha: string;
  items_resumen: Array<{ nombre: string; cantidad: number; precio_unitario: number }>;
  direccion_entrega: string;
  barrio: string;
}

// Estado mappings: Spanish user-friendly labels
const ESTADO_LABELS: Record<string, string> = {
  'activa': 'Propuesta Activa',
  'enviada': 'Propuesta Enviada',
  'en_contrato': 'En Contrato',
  'pre_produccion': 'Preparando tu proyecto',
  'produccion': 'En fabricación',
  'entregado': 'Entregado',
  'perdida': 'Propuesta No Ganada',
  'cancelada': 'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  'activa': 'bg-blue-100 text-blue-800',
  'enviada': 'bg-yellow-100 text-yellow-800',
  'en_contrato': 'bg-purple-100 text-purple-800',
  'pre_produccion': 'bg-orange-100 text-orange-800',
  'produccion': 'bg-indigo-100 text-indigo-800',
  'entregado': 'bg-green-100 text-green-800',
  'perdida': 'bg-red-100 text-red-800',
  'cancelada': 'bg-gray-100 text-gray-800',
};

const PEDIDO_ESTADO_LABELS: Record<string, string> = {
  'iniciado': 'Iniciado',
  'pendiente_pago': 'Pendiente de pago',
  'pagado': 'Pagado',
  'en_preparacion': 'En preparación',
  'enviado': 'Enviado',
  'entregado': 'Entregado',
  'cancelado': 'Cancelado',
};

const PEDIDO_ESTADO_COLORS: Record<string, string> = {
  'iniciado': 'bg-gray-100 text-gray-800',
  'pendiente_pago': 'bg-yellow-100 text-yellow-800',
  'pagado': 'bg-green-100 text-green-800',
  'en_preparacion': 'bg-orange-100 text-orange-800',
  'enviado': 'bg-blue-100 text-blue-800',
  'entregado': 'bg-emerald-100 text-emerald-800',
  'cancelado': 'bg-red-100 text-red-800',
};

export default function VetaCuenta() {
  const { user, login, logout, isLoading } = useAuth();
  const { executeZap } = useSystemStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [registEmail, setRegistEmail] = useState('');
  const [registPassword, setRegistPassword] = useState('');
  const [registName, setRegistName] = useState('');
  const [registError, setRegistError] = useState('');
  const [registLoading, setRegistLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [proyectos, setProyectos] = useState<ProyectoCliente[]>([]);
  const [proyectosLoading, setProyectosLoading] = useState(false);
  const [proyectosError, setProyectosError] = useState('');

  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [pedidosError, setPedidosError] = useState('');

  // Load proyectos when user is logged in
  useEffect(() => {
    if (user?.role === 'cliente' && (user as any).cliente_id) {
      loadProyectos();
      loadPedidos();
    }
  }, [user]);

  const loadProyectos = async () => {
    try {
      setProyectosLoading(true);
      setProyectosError('');

      const result = await executeZap('consultar_portal_cliente', {
        cliente_id: (user as any).cliente_id,
      });

      if (result?.proyectos) {
        setProyectos(result.proyectos);
      }
    } catch (err: any) {
      console.error('Error loading proyectos:', err);
      setProyectosError('Error al cargar los proyectos');
    } finally {
      setProyectosLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      setPedidosLoading(true);
      setPedidosError('');

      const result = await executeZap('consultar_pedidos_cliente', {
        cliente_id: (user as any).cliente_id,
        email: user?.email,
      });

      if (result?.pedidos) {
        setPedidos(result.pedidos);
      }
    } catch (err: any) {
      console.error('Error loading pedidos:', err);
      setPedidosError('Error al cargar los pedidos');
    } finally {
      setPedidosLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setLoginError('Email o contraseña incorrectos');
      } else {
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistError('');
    setRegistLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registEmail,
          password: registPassword,
          name: registName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrarse');
      }

      // Success - log in automatically
      setShowRegister(false);
      setRegistEmail('');
      setRegistPassword('');
      setRegistName('');
      // Login is already done by register endpoint, refresh user from /api/auth/me
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const { user: u } = await meRes.json();
        // AuthContext will update via its useEffect
      }
    } catch (err: any) {
      setRegistError(err.message || 'Error al registrarse');
    } finally {
      setRegistLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Admin/team members should see ERP link, not portal
  if (user && (user.role === 'admin' || user.role === 'equipo')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-amber-900">Bienvenido {user.name}</h1>
          <p className="text-gray-600 mb-6">Acceso restringido a administradores del sistema.</p>
          <a
            href="/app/erp/comercial"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded transition"
          >
            Ir al ERP
          </a>
          <button
            onClick={handleLogout}
            className="block w-full mt-4 text-gray-500 hover:text-gray-700 font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!user) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Cargando...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-8 text-amber-900 text-center">Mi Cuenta</h1>

          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Iniciar Sesión</h2>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {loginError}
                </div>
              )}

              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
              >
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRegister(true);
                  setLoginError('');
                }}
                className="w-full text-amber-600 hover:text-amber-700 font-semibold py-2"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Crear Cuenta</h2>

              {registError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {registError}
                </div>
              )}

              <input
                type="text"
                placeholder="Nombre completo"
                value={registName}
                onChange={(e) => setRegistName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={registEmail}
                onChange={(e) => setRegistEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="password"
                placeholder="Contraseña (mín. 8 caracteres)"
                value={registPassword}
                onChange={(e) => setRegistPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button
                type="submit"
                disabled={registLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
              >
                {registLoading ? 'Registrando...' : 'Crear Cuenta'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setRegistError('');
                }}
                className="w-full text-amber-600 hover:text-amber-700 font-semibold py-2"
              >
                Volver al iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Cliente logged in
  if (user.role === 'cliente') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">¡Bienvenido, {user.name}!</h1>
              <p className="text-gray-600 mt-2">Aquí puedes ver el estado de tus proyectos</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Mis Proyectos Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-amber-900">Mis Proyectos</h2>

            {proyectosError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {proyectosError}
              </div>
            )}

            {proyectosLoading ? (
              <p className="text-gray-600">Cargando proyectos...</p>
            ) : proyectos.length === 0 ? (
              <p className="text-gray-600">No tienes proyectos asociados en este momento.</p>
            ) : (
              <div className="space-y-4">
                {proyectos.map((proyecto) => (
                  <div
                    key={proyecto.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {proyecto.nombre_proyecto}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ESTADO_COLORS[proyecto.estado] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ESTADO_LABELS[proyecto.estado] || proyecto.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {proyecto.barrio && (
                        <p>
                          <span className="font-semibold text-gray-700">Ubicación:</span> {proyecto.barrio}
                        </p>
                      )}
                      {proyecto.dias_entrega_estimados && (
                        <p>
                          <span className="font-semibold text-gray-700">Entrega:</span>{' '}
                          {proyecto.dias_entrega_estimados} días estimados
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mis Pedidos */}
          <div className="bg-white rounded-lg shadow-lg p-8" data-pedidos-slot>
            <h2 className="text-2xl font-bold mb-6 text-amber-900">Mis Pedidos</h2>

            {pedidosError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {pedidosError}
              </div>
            )}

            {pedidosLoading ? (
              <p className="text-gray-600">Cargando pedidos...</p>
            ) : pedidos.length === 0 ? (
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg p-6 text-center">
                <p className="text-amber-900 font-semibold">No tienes pedidos aún</p>
                <p className="text-amber-700 text-sm mt-2">
                  Los pedidos que realices en la tienda aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {pedido.numero}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(pedido.fecha).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          PEDIDO_ESTADO_COLORS[pedido.estado] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {PEDIDO_ESTADO_LABELS[pedido.estado] || pedido.estado}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {pedido.items_resumen.slice(0, 3).map((item, i) => (
                        <p key={i} className="truncate">
                          {item.cantidad}x {item.nombre}
                        </p>
                      ))}
                      {pedido.items_resumen.length > 3 && (
                        <p className="text-gray-400 text-xs mt-1">
                          +{pedido.items_resumen.length - 3} items más
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {pedido.direccion_entrega}
                        {pedido.barrio ? `, ${pedido.barrio}` : ''}
                      </span>
                      <span className="text-lg font-semibold text-amber-900">
                        ${(pedido.total / 100).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
