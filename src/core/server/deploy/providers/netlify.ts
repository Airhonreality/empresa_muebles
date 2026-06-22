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

    // Netlify REST API format for environment variables:
    // POST /api/v1/sites/{site_id}/envvars
    // Body: Array of { key, values: [ { value, context: 'all' } ] }
    const body = variables.map(v => ({
      key: v.key,
      values: [
        {
          value: v.value,
          context: 'all'
        }
      ]
    }));

    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/envvars`, {
      method: 'POST',
      headers: authH,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as any;
      const errMsg = errBody.message ?? res.statusText;
      return {
        saved: 0,
        failed: variables.length,
        errors: [`Netlify API Error: ${errMsg}`]
      };
    }

    return { saved: variables.length, failed: 0, errors: [] };
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
