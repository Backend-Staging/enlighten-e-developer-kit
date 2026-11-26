# Public developer section

| Surface | URL |
| --- | --- |
| Developers hub | https://www.enlighten-e.com/developers/ |
| Quickstart | https://www.enlighten-e.com/developers/quickstart/ |
| Authentication | https://www.enlighten-e.com/developers/authentication/ |
| Guides | https://www.enlighten-e.com/developers/guides/ |
| API Reference | https://www.enlighten-e.com/developers/reference/ |
| Examples | https://www.enlighten-e.com/developers/examples/ |
| Get an API key | https://www.enlighten-e.com/developers/keys/ |
| API base (docs / intentional spelling) | https://api.enlightene-e.com/api/v1 — **no DNS yet**; remains a documented future host |
| Live API (production today) | https://api.enlighten-e.com/api/v1 — FE `VITE_API_URL`, OpenAPI, keys form |
| OpenAPI | https://api.enlighten-e.com/api/v1/openapi.yaml |

Backend `production.py` already accepts `api.enlightene-e.com` in `ALLOWED_HOSTS` / CSRF defaults alongside `api.enlighten-e.com`. Do not remount or break the live host; cut over DNS only when intentionally ready.

## Auth credentials

| Credential | Where it belongs | Routes |
| --- | --- | --- |
| Server API key `ee_test_` / `ee_live_` | Confidential server only | Staff paths + `/me` (machine identity) |
| OAuth client-credentials | Confidential server | Same as server key |
| OAuth PKCE user token | Native / Expo | `/me`, staff or client paths per membership / WorkspaceClient |
| Portal session | Browser SPA | `/me` parity |

Client person routes require a user token and an **active** `WorkspaceClient` link. Server keys never grant client-person access.

## License

**MIT** for the developer kit only (`docs/external-api/`, `examples/expo-client/`, `examples/server-node/`, OpenAPI). See `LICENSE` and `LICENSE_DECISION.md`. Public kit: https://github.com/Backend-Staging/enlighten-e-developer-kit. Production Wagtail/backend repo visibility is unchanged.
