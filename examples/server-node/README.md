# Server example — Enlighten-E API key

Minimal Node script for a **sandbox** server API key.

```bash
export ENLIGHTEN_API_BASE=https://api.enlightene-e.com/api/v1
export ENLIGHTEN_API_KEY=ee_test_…   # from https://www.enlighten-e.com/developers/keys (shown once)
export ENLIGHTEN_WORKSPACE_ID=…      # sandbox workspace UUID from verify response
node index.js
```

Never put this key in Expo or public JS. Mobile clients use OAuth PKCE (`examples/expo-client/`).

**License:** MIT — see `docs/external-api/LICENSE` (developer kit only; not the production application).
