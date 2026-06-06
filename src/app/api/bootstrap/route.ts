import { NextResponse } from 'next/server';

// Silo selection was removed. Forks use storage/ directly.
export function GET()  { return NextResponse.json({ removed: true }, { status: 410 }); }
export function POST() { return NextResponse.json({ removed: true }, { status: 410 }); }
