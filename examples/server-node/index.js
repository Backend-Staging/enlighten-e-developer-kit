/**
 * Minimal server-side example: sandbox API key → GET /me → staff contacts.
 *
 * Never run this pattern inside Expo / browser bundles. Server keys stay on the server.
 *
 * Env:
 *   ENLIGHTEN_API_BASE  default https://api.enlightene-e.com/api/v1
 *   ENLIGHTEN_API_KEY   ee_test_… from /developers/keys (shown once)
 *   ENLIGHTEN_WORKSPACE_ID  sandbox workspace public UUID (from verify response or hint)
 */
const API_BASE = (process.env.ENLIGHTEN_API_BASE || 'https://api.enlightene-e.com/api/v1').replace(/\/$/, '');
const API_KEY = process.env.ENLIGHTEN_API_KEY || '';
const WORKSPACE_ID = process.env.ENLIGHTEN_WORKSPACE_ID || '';

if (!API_KEY.startsWith('ee_test_') && !API_KEY.startsWith('ee_live_')) {
  console.error('Set ENLIGHTEN_API_KEY to a server key from /developers/keys (shown once).');
  process.exit(1);
}

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

const me = await api('/me');
console.log('me:', JSON.stringify(me, null, 2));

const workspaceId = WORKSPACE_ID || me.server_api_key?.workspace_id;
if (!workspaceId) {
  console.log('Set ENLIGHTEN_WORKSPACE_ID to list sandbox contacts.');
  process.exit(0);
}

const contacts = await api(`/workspaces/${workspaceId}/staff/crm/contacts`);
console.log('contacts status ok; count=', (contacts.results || contacts).length ?? contacts);
