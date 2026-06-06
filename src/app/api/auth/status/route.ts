import { NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';

export async function GET() {
  try {
    const strategy: any = getStrategy();
    const users = await strategy.read('users');
    return NextResponse.json({ has_users: Array.isArray(users) && users.length > 0 });
  } catch {
    // Strategy not yet configured (fresh deploy with no env vars)
    return NextResponse.json({ has_users: false });
  }
}
