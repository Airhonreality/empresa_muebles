import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/agnostic/session';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { getStrategy, getStrategyName } from '@/server/getStrategy';
import { hashPassword } from '@/lib/agnostic/auth/password';

export async function POST(req: NextRequest) {
  try {
    const activeStrategy = getStrategyName();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && activeStrategy !== 'postgres') {
      return NextResponse.json({
        error: `Bootstrap admin bloqueado: produccion requiere DATABASE_URL/Postgres activo. Estrategia actual: ${activeStrategy}`,
      }, { status: 409 });
    }

    if (isProduction && !process.env.SESSION_SECRET) {
      return NextResponse.json({
        error: 'Bootstrap admin bloqueado: SESSION_SECRET debe estar configurado antes de crear el primer admin',
      }, { status: 409 });
    }

    const { email, password } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';

    if (!normalizedEmail || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email y contrasena requeridos' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contrasena debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const strategy = getStrategy();
    const users = await strategy.read(SYSTEM_NS.USERS);

    if (Array.isArray(users) && users.length > 0) {
      return NextResponse.json({ error: 'El bootstrap ya fue completado' }, { status: 409 });
    }

    const existingLists = await strategy.read(SYSTEM_NS.USER_LISTS);
    const hasAdminList = Array.isArray(existingLists)
      && existingLists.some((list: any) => list.data?.name === 'admin');

    if (!hasAdminList) {
      await strategy.write(SYSTEM_NS.USER_LISTS, {
        id: crypto.randomUUID(),
        data: { name: 'admin', is_permanent: true },
      });
    }

    const passwordData = await hashPassword(password);
    const userRecord = await strategy.write(SYSTEM_NS.USERS, {
      id: crypto.randomUUID(),
      data: {
        email: normalizedEmail,
        ...passwordData,
        password_updated_at: new Date().toISOString(),
        type: ['admin'],
      },
    });

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = {
      id: userRecord.id,
      email: normalizedEmail,
      name: normalizedEmail,
      role: 'admin',
    };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (err: any) {
    console.error('[Auth/Bootstrap]', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}
