import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/agnostic/session';
import { getStrategy } from '@/server/getStrategy';
import { hashPassword } from '@/lib/agnostic/auth/password';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { EmailPasswordStrategy } from '@/lib/agnostic/auth/EmailPasswordStrategy';
import crypto from 'crypto';

// Simple in-memory rate limiter: { email -> count }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    // Reset or first attempt
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, invite } = await req.json();

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Password length check
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro. Intente más tarde.' },
        { status: 429 }
      );
    }

    const strategy: any = getStrategy();
    const users = await strategy.read(SYSTEM_NS.USERS);

    // Check if email already exists
    if (Array.isArray(users) && users.some((u: any) => u.data?.email === email)) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash password
    const { password_hash, password_algo } = await hashPassword(password);

    // Prepare user data
    const userData: Record<string, any> = {
      email,
      name,
      password_hash,
      password_algo,
      type: ['cliente'], // Hardcoded: only 'cliente' type can register via this endpoint
      password_updated_at: new Date().toISOString(),
    };

    // If invite contains a valid cliente_id, link it
    if (invite) {
      const clientes = await strategy.read('clientes');
      const clienteExists = Array.isArray(clientes) && clientes.some((c: any) => c.id === invite);
      if (clienteExists) {
        userData.cliente_id = invite;
      }
    }

    // Create new user with UUID
    const newUserId = crypto.randomUUID();
    const newUser = {
      id: newUserId,
      context: SYSTEM_NS.USERS,
      data: userData,
      updated_at: new Date().toISOString(),
    };

    // Write to storage
    const updatedUsers = Array.isArray(users) ? [...users, newUser] : [newUser];
    await strategy.write(SYSTEM_NS.USERS, updatedUsers);

    // Create session
    const authStrategy = new EmailPasswordStrategy(() => updatedUsers);
    const authUser = await authStrategy.authenticate({ email, password });

    if (!authUser) {
      return NextResponse.json(
        { error: 'Error al autenticar usuario registrado' },
        { status: 500 }
      );
    }

    const cliente_id = userData.cliente_id as string | undefined;

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = { id: authUser.id, email: authUser.email, name: authUser.name, role: authUser.role, cliente_id };
    await session.save();

    return NextResponse.json(
      { success: true, user: session.user },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Auth/Register]', err);
    return NextResponse.json(
      { error: err.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
