type ProviderName = 'vercel' | 'netlify' | 'github';

type EnvLike = Record<string, string | undefined>;

function readValue(keys: string[], env: EnvLike): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 12000): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveProviderOwnerEmail(provider: ProviderName, env: EnvLike = process.env): Promise<string | null> {
  if (provider === 'vercel') {
    const token = readValue(['VERCEL_ACCESS_TOKEN'], env);
    if (!token) return null;
    const user = await fetchJson('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const email = typeof user?.email === 'string' ? user.email.trim() : '';
    return email || null;
  }

  if (provider === 'netlify') {
    const token = readValue(['NETLIFY_AUTH_TOKEN'], env);
    const siteId = readValue(['NETLIFY_SITE_ID'], env);
    if (!token || !siteId) return null;
    const site = await fetchJson(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const email = typeof site?.notification_email === 'string' ? site.notification_email.trim() : '';
    return email || null;
  }

  if (provider === 'github') {
    const token = readValue(['GITHUB_TOKEN'], env);
    if (!token) return null;
    const user = await fetchJson('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const email = typeof user?.email === 'string' ? user.email.trim() : '';
    return email || null;
  }

  return null;
}

export async function inferOwnerEmailAssignments(env: EnvLike = process.env): Promise<Array<{ key: string; value: string }>> {
  const assignments: Array<{ key: string; value: string }> = [];
  const checks: Array<{ provider: ProviderName; emailKey: string; requiredKeys: string[] }> = [
    { provider: 'vercel', emailKey: 'VERCEL_ACCOUNT_EMAIL', requiredKeys: ['VERCEL_ACCESS_TOKEN', 'VERCEL_PROJECT_ID'] },
    { provider: 'netlify', emailKey: 'NETLIFY_ACCOUNT_EMAIL', requiredKeys: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'] },
    { provider: 'github', emailKey: 'GITHUB_ACCOUNT_EMAIL', requiredKeys: ['GITHUB_TOKEN', 'GITHUB_REPO'] },
  ];

  for (const check of checks) {
    const hasRequired = check.requiredKeys.every(key => !!readValue([key], env));
    if (!hasRequired) continue;

    const email = await resolveProviderOwnerEmail(check.provider, env);
    if (email && email !== readValue([check.emailKey], env)) {
      assignments.push({ key: check.emailKey, value: email });
      env[check.emailKey] = email;
    }
  }

  return assignments;
}
