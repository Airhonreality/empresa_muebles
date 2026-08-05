'use client';

import dynamic from 'next/dynamic';

const WebGLHero = dynamic(
  () => import('@/components/veta/webgl-hero').then(m => m.WebGLHero),
  { ssr: false, loading: () => null }
);

export function WebGLHeroWrapper() {
  return <WebGLHero />;
}