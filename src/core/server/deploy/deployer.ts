import { vercelProvider } from './providers/vercel';
import { netlifyProvider } from './providers/netlify';

export interface VercelCredentials {
  token: string;
  projectId: string;
  teamId?: string;
}

export interface NetlifyCredentials {
  token: string;
  siteId: string;
}

export type DeployCredentials = VercelCredentials | NetlifyCredentials;

export interface DeployProvider {
  validate(credentials: any): Promise<boolean>;
  injectEnv(credentials: any, variables: Array<{ key: string; value: string; sensitive?: boolean }>): Promise<{ saved: number; failed: number; errors: string[] }>;
  redeploy(credentials: any): Promise<{ id: string; url: string | null; readyState: string } | null>;
}

export function getDeployer(provider: string): DeployProvider {
  if (provider === 'vercel') {
    return vercelProvider;
  }
  if (provider === 'netlify') {
    return netlifyProvider;
  }
  throw new Error(`Proveedor de despliegue no soportado: ${provider}`);
}

export function getActiveProvider(): { provider: 'vercel' | 'netlify'; credentials: DeployCredentials } | null {
  if (process.env.NETLIFY_AUTH_TOKEN && process.env.NETLIFY_SITE_ID) {
    return {
      provider: 'netlify',
      credentials: {
        token: process.env.NETLIFY_AUTH_TOKEN,
        siteId: process.env.NETLIFY_SITE_ID,
      },
    };
  }
  if (process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID) {
    return {
      provider: 'vercel',
      credentials: {
        token: process.env.VERCEL_ACCESS_TOKEN,
        projectId: process.env.VERCEL_PROJECT_ID,
        teamId: process.env.VERCEL_TEAM_ID,
      },
    };
  }
  return null;
}
