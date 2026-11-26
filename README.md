# Enlighten-E developer kit

MIT-licensed OpenAPI, docs, and sample clients for the Enlighten-E external API.

This repository publishes **developer kit materials only**. It does not include the production Wagtail/Django application or the React portal.

## Live API

| Item | URL |
| --- | --- |
| API base (production today) | `https://api.enlighten-e.com/api/v1` |
| OpenAPI | https://api.enlighten-e.com/api/v1/openapi.yaml |
| Developers hub | https://www.enlighten-e.com/developers/ |
| Quickstart | https://www.enlighten-e.com/developers/quickstart/ |
| Authentication | https://www.enlighten-e.com/developers/authentication/ |
| Guides | https://www.enlighten-e.com/developers/guides/ |
| API Reference | https://www.enlighten-e.com/developers/reference/ |
| Examples | https://www.enlighten-e.com/developers/examples/ |
| Get an API key | https://www.enlighten-e.com/developers/keys/ |

A future host spelling (`api.enlightene-e.com`) is documented in the kit; DNS is not cut over yet. Use the live base above.

## Contents

- `docs/external-api/` — OpenAPI, Developers notes, MIT `LICENSE`, license scope
- `examples/expo-client/` — Expo PKCE sample (no server API keys in the mobile build)
- `examples/server-node/` — minimal Node sample using `ENLIGHTEN_API_KEY`

## License

MIT for this kit only. See [`docs/external-api/LICENSE`](docs/external-api/LICENSE) and [`docs/external-api/LICENSE_DECISION.md`](docs/external-api/LICENSE_DECISION.md).
