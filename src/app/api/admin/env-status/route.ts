import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    auth: {
      SESSION_SECRET: !!process.env.SESSION_SECRET,
    },
    github: {
      GITHUB_TOKEN:  !!process.env.GITHUB_TOKEN,
      GITHUB_REPO:   !!process.env.GITHUB_REPO,
      GITHUB_BRANCH: !!process.env.GITHUB_BRANCH,
    },
    r2: {
      CF_ACCOUNT_ID:           !!process.env.CF_ACCOUNT_ID,
      CF_R2_BUCKET:            !!process.env.CF_R2_BUCKET,
      CF_R2_ACCESS_KEY_ID:     !!process.env.CF_R2_ACCESS_KEY_ID,
      CF_R2_SECRET_ACCESS_KEY: !!process.env.CF_R2_SECRET_ACCESS_KEY,
      CF_R2_PUBLIC_URL:        !!process.env.CF_R2_PUBLIC_URL,
    },
    supabase: {
      SUPABASE_URL:              !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
