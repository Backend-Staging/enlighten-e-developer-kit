# Expo sample — Enlighten-E external API

Minimal flow for a workspace-bound branded app:

1. OAuth Authorization Code + PKCE (`/api/o/authorize/`, `/api/o/token/`)
2. `GET /api/v1/me` → person + staff/client profiles **in this app’s workspace only**
3. Select workspace + profile (path `/workspaces/{id}/client|staff/...`) → capabilities
4. `POST .../client/crm/inquiries` (requires `inbox` entitlement)
5. `GET .../client/availability` → `POST .../client/appointments` (with `Idempotency-Key`)
6. After staff reschedules in the dashboard → `GET .../client/appointments` shows the same `public_id` with the new time

## Env

Copy `.env.example` to `.env` (Expo loads `EXPO_PUBLIC_*`):

| Variable | Local | Staging |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE` | `http://localhost:8000/api/v1` | `https://api.enlightene-e.com/api/v1` |
| `EXPO_PUBLIC_OAUTH_BASE` | `http://localhost:8000/api/o` | `https://api.enlightene-e.com/api/o` |
| `EXPO_PUBLIC_CLIENT_ID` | DOT public client id | same for staging app |
| `EXPO_PUBLIC_REDIRECT_URI` | Expo auth session redirect | registered redirect |
| `EXPO_PUBLIC_WORKSPACE_ID` | Workspace public UUID | staging workspace |

Do **not** put confidential client secrets in the mobile build. Use PKCE.

## Path-selected profile

Workspace and profile come from the URL:

`/workspaces/{workspace_id}/client/appointments`

Do not send `X-Enlighten-Profile` or `X-Workspace`. Conflicting headers are rejected with `400`.

## Run

```bash
cd examples/expo-client
npm install
npx expo start
```

Use the on-screen steps in `App.tsx` for sign-in → `/me` → profile → inquiry → availability → book → refresh.

**License:** MIT — see `docs/external-api/LICENSE` (developer kit only; not the production application).
