import { DeployProvider } from '../deployer';

export const vercelProvider: DeployProvider = {
  async validate(credentials) {
    const { token, projectId, teamId } = credentials;
    if (!token || !projectId) return false;
    const teamQ = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}${teamQ}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  },

  async injectEnv(credentials, variables) {
    const { token, projectId, teamId } = credentials;
    const teamQ = teamId ? `&teamId=${teamId}` : '';
    const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const results = await Promise.allSettled(
      variables.map(async v => {
        const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?upsert=true${teamQ}`, {
          method: 'POST',
          headers: authH,
          body: JSON.stringify({
            key: v.key,
            value: v.value,
            type: v.sensitive !== false ? 'encrypted' : 'plain',
            target: ['production', 'preview', 'development'],
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(body.error?.message ?? res.statusText);
        }
        return res;
      })
    );

    const saved = results.filter(r => r.status === 'fulfilled').length;
    const errors: string[] = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        errors.push(`${variables[i].key}: ${(results[i] as PromiseRejectedResult).reason}`);
      }
    }

    return { saved, failed: variables.length - saved, errors };
  },

  async redeploy(credentials) {
    const { token, projectId, teamId } = credentials;
    const gitProvider = process.env.VERCEL_GIT_PROVIDER;
    const gitRepoId   = process.env.VERCEL_GIT_REPO_ID;
    const gitRef      = process.env.VERCEL_GIT_COMMIT_REF;

    if (!gitProvider || !gitRepoId || !gitRef) {
      return null;
    }

    const teamQ = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`https://api.vercel.com/v13/deployments${teamQ}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectId,
        target: 'production',
        gitSource: {
          type: gitProvider,
          repoId: gitRepoId,
          ref: gitRef,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? res.statusText);
    }

    const deploy = await res.json() as { id: string; url?: string; readyState?: string };
    return {
      id: deploy.id,
      url: deploy.url ? `https://${deploy.url}` : null,
      readyState: deploy.readyState ?? 'QUEUED',
    };
  }
};
