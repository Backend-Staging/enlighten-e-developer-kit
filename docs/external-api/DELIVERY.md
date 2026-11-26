# Phase 10 delivery report — External API

**Date:** 2026-11-25 (America/New_York)  
**Production deploy:** not performed (separate release action).

## Branches / tips

| Repo | Branch | Notes |
| --- | --- | --- |
| Monorepo | `platform/phase-10-external-api` | Cut from `platform/phase-9-votel-retirement` (`5cfc28f`); packages + external API committed on this branch |
| Public base | `https://api.enlightene-e.com/api/v1` | Intentional spelling; no DNS/prod cutover in this phase |

## API test results (automated)

```bash
cd backend/enlighten-e_app
env -u DATABASE_URL USE_SQLITE=True .venv/bin/python manage.py test \
  external_api booking.services --settings=enlighten_e.settings.dev
```

Result (this agent run):

```
Ran 15 tests in ~42s … OK (skipped=1)
```

Skipped: PostgreSQL-only last-slot parallel race when present. Sequential capacity covered by `BookingDomainTests.test_capacity_last_slot`. Prefer PostgreSQL in CI when available (`USE_SQLITE` unset + `DATABASE_URL`).

Also available: `enlighten_e.settings.test_sqlite` for isolated SQLite runs.

## Migrations

- `workspaces/0003_phase10_external_api` — `WorkspaceClient`
- `booking/0002_phase10_external_api` — nullable `submission`, `workspace_client` on `Appointment`
- `crm/0006` + `0007_phase10_external_api` — inquiry source/client fields; nullable funnel submission
- `external_api/0001_phase10_external_api` — `ConnectedApp`, `ApiIdempotencyRecord`
- Install `django-oauth-toolkit` and run its migrations (`oauth2_provider`)

## Wagtail setup

1. Staff → **Connected apps** snippet (`external_api.wagtail_hooks`).
2. Select workspace, name, scopes, client type:
   - Public + authorization-code → native PKCE
   - Confidential + client-credentials → machine
3. Register redirect URIs for PKCE apps.
4. **Revoke** sets status, clears tokens, audits `connected_app.revoked`.

## Auth model (implemented)

- Public base: `https://api.enlightene-e.com/api/v1`
- Path selects workspace + profile: `/workspaces/{id}/staff|client/...`
- Conflicting `X-Enlighten-Profile` / `X-Workspace` → `400` before record access
- `GET /me`: person profiles scoped to connected-app workspace; machine tokens return `identity_type: service`
- Client links: only `status=active` grants client-record access; email alone never attaches historical CRM
- OAuth endpoints: `/api/o/` (django-oauth-toolkit); portal session routes unchanged

## Endpoint coverage

See `docs/external-api-coverage.md`. Implemented under `/api/v1`:

- Identity: `GET /me`, staff/client capabilities, staff invite client
- CRM: staff contacts/inquiries/pipelines; client inquiries list/create
- Booking: staff calendars/appointments create/reschedule/cancel; client availability/appointments create/reschedule/cancel
- Extended thin wraps: metrics, payments status, conversations, documents, agents, workflows
- Client invoices: placeholder list only

## Booking journey — verification matrix

| Step | Verified how |
| --- | --- |
| Client registers / active `WorkspaceClient` | API tests + invite endpoint |
| Client submits inquiry; staff sees it in CRM API | **API tests** (`InquiryWorkflowTests`) |
| Client books; receives appointment `public_id` | **API tests** |
| Staff reschedule via external staff API | **API tests** |
| Client retrieves same id with new time | **API tests** |
| Second client / Business B cannot see it | **API tests** (`IsolationTests`) |
| Idempotent retry → one appointment | **API tests** |
| Failed reschedule preserves original | **API tests** + domain unit |
| Last-slot capacity | Domain test (`test_capacity_last_slot`) |

### Explicit statement

- **Dashboard browser E2E (human click-through):** not executed in this agent run.
- **API-only automated tests:** `external_api.tests` + booking domain helpers (green on SQLite above).
- **External client + staff dashboard together:** API covers client book → staff API reschedule → client fetch. Shared `reschedule_appointment` / `cancel_appointment` / `create_appointment_for_client` in `booking/services.py`.

## Entitlement / permission rules (resolved)

| Endpoint / action | Entitlement | Permission |
| --- | --- | --- |
| `POST .../client/crm/inquiries` | **`inbox`** (not funnels alone) | active client link |
| Staff CRM contacts | `contacts` | `records.view` |
| Staff CRM inquiries | `inbox` | `records.view` |
| Staff calendars | `calendars` | view/edit |
| Appointments (staff/client) | `booking` | staff: view/edit; client: own |
| Metrics counts | per-metric entitlement | `records.view`; no revenue for booking-only |
| Staff invite client | — | `members.manage` |
| Payments status | — | `workspace.manage` (masked) |

Package upgrades: next authorized request sees new entitlements; upgrade never expands app scopes or staff roles.

## CORS / hosts

- Production helpers include `api.enlightene-e.com` in CSRF trusted origins / `ALLOWED_HOSTS`.
- Existing Wagtail `/admin/`, `/cms/`, `/api/v2`, portal session routes unchanged.

## Docs / samples

- Coverage table: `docs/external-api-coverage.md`
- OpenAPI (implemented routes): `docs/external-api/openapi.yaml`
- Expo sample: `examples/expo-client/` (sign-in → `/me` → profile/capabilities → inquiry → availability → book → refresh)
- This report: `docs/external-api/DELIVERY.md`

## Outstanding gaps

- Full payment checkout ownership path for customer invoices (placeholder list only)
- Conversations / documents / agents / workflows remain thin wraps
- Browser dashboard E2E of reschedule not automated here
- DNS / production cutover for `api.enlightene-e.com` out of scope
- Prefer PostgreSQL for true parallel last-slot race coverage in CI
