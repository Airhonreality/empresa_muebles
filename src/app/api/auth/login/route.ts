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
    const authUser = await authStrategy.authenticate({ email, password });

    if (!authUser) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (authUser.metadata?.needs_password_rehash === true) {
      const existing = Array.isArray(users) ? users.find((u: any) => u.id === authUser.id) : null;
      if (existing?.data) {
        const normalizedData = await normalizeUserPasswordData({ ...existing.data, password });
        await strategy.write(SYSTEM_NS.USERS, { id: authUser.id, data: normalizedData });
      }
    }

    // Extract cliente_id from full user record
    const userRecord = Array.isArray(users) ? users.find((u: any) => u.id === authUser.id) : null;
    const cliente_id = userRecord?.data?.cliente_id as string | undefined;

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = { id: authUser.id, email: authUser.email, name: authUser.name, role: authUser.role, cliente_id };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (err: any) {
    console.error('[Auth/Login]', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}
