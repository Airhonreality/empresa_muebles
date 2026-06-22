import { DeployProvider } from '../deployer';

export const netlifyProvider: DeployProvider = {
  async validate(credentials) {
    const { token, siteId } = credentials;
    if (!token || !siteId) return false;
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  },

  async injectEnv(credentials, variables) {
    const { token, siteId } = credentials;
    const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 1. Get Account ID from Site Info
    const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, { headers: authH });
    if (!siteRes.ok) return { saved: 0, failed: variables.length, errors: ['No se pudo verificar el sitio en Netlify. Revisa tu Token y Site ID.'] };
    const site = await siteRes.json();
    const accountId = site.account_slug || site.account_name || site.account_id;

    const errors: string[] = [];
    let saved = 0;

    for (const v of variables) {
      // 2. Prepare payload WITHOUT scopes (Free tier compatible)
      const payload = {
        key: v.key,
        values: [{ value: v.value, context: 'all' }]
      };

      // 3. Try to update existing variable first
      let res = await fetch(`https://api.netlify.com/api/v1/accounts/${accountId}/env/${v.key}?site_id=${siteId}`, {
        method: 'PUT',
        headers: authH,
        body: JSON.stringify(payload)
      });

      if (res.status === 404 || res.status === 422 || !res.ok) {
        // 4. If it doesn't exist, try creating it
        res = await fetch(`https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${siteId}`, {
          method: 'POST',
          headers: authH,
          body: JSON.stringify([payload]) // POST requires an array
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        errors.push(`Netlify API Error (${v.key}): ${errBody.message || res.statusText}`);
      } else {
        saved++;
      }
    }

    return { saved, failed: variables.length - saved, errors };
  },

  async redeploy(credentials) {
    const { token, siteId } = credentials;
    // Netlify: POST /api/v1/sites/{site_id}/builds (triggers a deployment/build)
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/builds`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText })) as any;
      throw new Error(err.message ?? res.statusText);
    }

    const build = await res.json() as { id: string; deploy_id?: string; error?: string };
    return {
      id: build.deploy_id ?? build.id,
      url: null,
      readyState: 'BUILDING'
    };
  }
};
