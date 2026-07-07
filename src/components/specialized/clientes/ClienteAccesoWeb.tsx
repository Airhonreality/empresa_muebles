'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';

interface ClienteAccesoWebProps {
  cliente_id: string;
  cliente_nombre?: string;
  on_acceso_created?: (credenciales: { email: string; temporal_password: string }) => void;
}

interface CredencialesTemporales {
  email: string;
  temporal_password: string;
  createdAt: Date;
}

export default function ClienteAccesoWeb({
  cliente_id,
  cliente_nombre = 'Cliente',
  on_acceso_created,
}: ClienteAccesoWebProps) {
  const [existe_acceso, setExisteAcceso] = useState(false);
  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);
  const [credenciales, setCredenciales] = useState<CredencialesTemporales | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if web access already exists on mount
  useEffect(() => {
    checkWebAccess();
  }, [cliente_id]);

  const checkWebAccess = async () => {
    try {
      setChecking(true);
      setError('');

      const res = await fetch(`/api/auth/check-cliente-access?cliente_id=${cliente_id}`);
      const data = await res.json();

      if (data.existe) {
        setExisteAcceso(true);
      } else {
        setExisteAcceso(false);
      }
    } catch (err: any) {
      console.error('Error checking web access:', err);
      // Assume no access if check fails (API might not exist yet)
      setExisteAcceso(false);
    } finally {
      setChecking(false);
    }
  };

  const generateTemporaryPassword = (length: number = 12): string => {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  const handleCrearAcceso = async () => {
    try {
      setCreating(true);
      setError('');

      // Generate temporary password and email
      const tempPassword = generateTemporaryPassword();
      const email = `cliente.${cliente_id.substring(0, 8).toLowerCase()}@veta.local`;

      // Call register endpoint with invite
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: tempPassword,
          name: cliente_nombre,
          invite: cliente_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          // Email already exists
          setExisteAcceso(true);
          throw new Error('Este cliente ya tiene acceso web creado');
        }
        throw new Error(data.error || 'Error al crear acceso web');
      }

      // Success
      const credenciales = { email, temporal_password: tempPassword };
      setCredenciales({ ...credenciales, createdAt: new Date() });
      setExisteAcceso(true);

      if (on_acceso_created) {
        on_acceso_created(credenciales);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear acceso web');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (checking) {
    return <div className="text-gray-600 text-sm">Verificando acceso...</div>;
  }

  // If access exists and no new credentials shown
  if (existe_acceso && !credenciales) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <Check size={20} />
          <span className="font-semibold">Acceso web activo</span>
        </div>
        <p className="text-green-700 text-sm mt-2">
          Este cliente ya tiene acceso a la plataforma web.
        </p>
      </div>
    );
  }

  // If credentials were just created - show ONE time only
  if (credenciales) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
        <h3 className="font-bold text-amber-900 mb-4 text-lg">
          ✓ Acceso Web Creado
        </h3>

        <p className="text-amber-900 text-sm mb-4">
          Las siguientes credenciales fueron generadas. GUÁRDALAS AHORA — no se mostrarán de nuevo:
        </p>

        <div className="bg-white rounded border border-amber-300 p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Correo:
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-amber-50 px-3 py-2 rounded text-sm font-mono border border-amber-200">
                {credenciales.email}
              </code>
              <button
                onClick={() => copyToClipboard(credenciales.email)}
                className="p-2 hover:bg-amber-100 rounded transition"
                title="Copiar correo"
              >
                <Copy size={16} className="text-amber-700" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Contraseña Temporal:
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-amber-50 px-3 py-2 rounded text-sm font-mono border border-amber-200">
                {credenciales.temporal_password}
              </code>
              <button
                onClick={() => copyToClipboard(credenciales.temporal_password)}
                className="p-2 hover:bg-amber-100 rounded transition"
                title="Copiar contraseña"
              >
                <Copy size={16} className="text-amber-700" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              URL de Acceso:
            </label>
            <code className="block bg-amber-50 px-3 py-2 rounded text-sm font-mono border border-amber-200">
              /cuenta
            </code>
          </div>
        </div>

        {copied && (
          <p className="text-sm text-green-700 font-semibold mb-3">
            ✓ Copiado al portapapeles
          </p>
        )}

        <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-900">
          <p className="font-semibold mb-1">Importante:</p>
          <ul className="list-disc list-inside space-y-1 text-orange-800">
            <li>El cliente debe cambiar la contraseña en su primer acceso</li>
            <li>Estas credenciales NO se pueden recuperar desde aquí</li>
            <li>Comunica estas credenciales al cliente de forma segura</li>
          </ul>
        </div>
      </div>
    );
  }

  // No access yet - show button to create
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">Acceso Web del Cliente</h4>
          <p className="text-gray-600 text-sm mt-1">
            Genera credenciales de acceso para que el cliente vea sus proyectos
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={handleCrearAcceso}
        disabled={creating}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
      >
        {creating ? 'Creando acceso...' : 'Crear Acceso Web'}
      </button>
    </div>
  );
}
