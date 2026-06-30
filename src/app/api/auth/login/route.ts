import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/agnostic/session';
import { getStrategy } from '@/server/getStrategy';
import { EmailPasswordStrategy } from '@/lib/agnostic/auth/EmailPasswordStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { normalizeUserPasswordData } from '@/lib/agnostic/auth/password';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const strategy: any = getStrategy();
    const users = await strategy.read(SYSTEM_NS.USERS);

    const authStrategy = new EmailPasswordStrategy(() => users);
    const user = await authStrategy.authenticate({ email, password });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (user.metadata?.needs_password_rehash === true) {
      const existing = Array.isArray(users) ? users.find((u: any) => u.id === user.id) : null;
      if (existing?.data) {
        const normalizedData = await normalizeUserPasswordData({ ...existing.data, password });
        await strategy.write(SYSTEM_NS.USERS, { id: user.id, data: normalizedData });
      }
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (err: any) {
    console.error('[Auth/Login]', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}
