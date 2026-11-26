# Open-source license decision — developer materials

**Status: CHOSEN — MIT (2026-11-25, America/New_York).**

## Decision

| Field | Value |
| --- | --- |
| License | **MIT** |
| Decision date | 2026-11-25 (America/New_York) |
| Scope | Developer kit materials only |
| License file | `docs/external-api/LICENSE` |

### In scope (MIT)

- `docs/external-api/` (including OpenAPI / this decision record)
- `examples/expo-client/`
- `examples/server-node/`

### Out of scope (unchanged)

- Production Wagtail / Django backend repository visibility and licensing
- Frontend application repository licensing
- The remainder of the monorepo

Do **not** treat a root `LICENSE` (none today) or this kit MIT as relicensing the production application. Publish or link the kit materials under MIT; leave production repos private unless intentionally opened.

## Public “View source”

Point Developers “View source” / kit pages at `docs/external-api/LICENSE` (and this decision record for scope). The kit may be described as MIT-licensed developer materials; do not claim the whole production monorepo is open source.

## Published kit repository

Public source (anonymous): https://github.com/Backend-Staging/enlighten-e-developer-kit

Production application repositories remain private.
