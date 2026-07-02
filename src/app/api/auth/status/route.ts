import { NextResponse } from 'next/server';
import { getStrategy, getStrategyName } from '@/server/getStrategy';

export async function GET() {
  const activeStrategy = getStrategyName();
  const isProduction = process.env.NODE_ENV === 'production';
  const blockers: string[] = [];

  if (isProduction && activeStrategy !== 'postgres') {
    blockers.push(`active_strategy=${activeStrategy}; produccion requiere postgres`);
  }

  if (isProduction && !process.env.SESSION_SECRET) {
    blockers.push('SESSION_SECRET no configurado');
  }

  try {
    const strategy: any = getStrategy();
    const users = await strategy.read('users');
    const hasUsers = Array.isArray(users) && users.length > 0;
    return NextResponse.json({
      has_users: hasUsers,
      can_bootstrap_admin: !hasUsers && blockers.length === 0,
      active_strategy: activeStrategy,
      blockers,
    });
  } catch (err: any) {
    // Strategy not yet configured (fresh deploy with no env vars)
    return NextResponse.json({
      has_users: false,
      can_bootstrap_admin: false,
      active_strategy: activeStrategy,
      blockers: [...blockers, err?.message ?? 'strategy_read_failed'],
    });
  }
}
