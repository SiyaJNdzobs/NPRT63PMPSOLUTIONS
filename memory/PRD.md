# E-RANK — Product Requirements Document

## Original Problem Statement
Dark-mode taxi rank operations platform for South African minibus taxi ranks. Roles: Admin, Owner, Marshal, Driver, Passenger. Manages public route/rank info, role-based sign-in (role selected before login), taxi assignments, live queue operations, fare snapshots, revenue, SOS, QR-based queue join, geo-check, and long-distance passenger capture. Web app only (React + FastAPI + MongoDB).

## Architecture
- **Frontend:** React (CRA + craco, `@`→src alias), Tailwind + shadcn/ui, dark-mode only. React Query polling (3s) for near-realtime queue/status sync.
- **Backend:** FastAPI. Files: `core.py` (Mongo, JWT bearer auth, phone/fare helpers, role guards), `seed.py` (idempotent seed of all provided data), `emailer.py` (Emergent Resend + guardrail gate), `server.py` (all routers).
- **DB:** MongoDB, uuid `id` fields (no raw ObjectId returned).
- **Auth:** JWT bearer tokens in localStorage. Admin = email+password; Owner/Marshal/Driver/Passenger = username(full name)+PIN. First-login `must_change` forces PIN/password change (set on insert only).

## User Choices (confirmed)
- Admin: email+password; others: username+PIN.
- SOS email via Emergent-managed Resend.
- Marshal & Driver: only contact number editable (no email); Owner & Passenger edit email + number.
- Excel export: real .xlsx (openpyxl).
- Seed data provided by user (5 admins, 5 ranks, 5 owners, 5 marshals, 15 drivers, 15 taxis, routes, 1 passenger, 1 rank update).

## Implemented (2026-06)
- Public landing: branding, search (ranks/routes/taxis), route/fare table, rank list, active rank updates.
- Role-selection sign-in (roles + form on one page), passenger self-register, first-login change flow, session persistence, +27 phone normalization.
- Admin: overview stats; CRUD ranks/routes/owners/marshals; view drivers/taxis/queue/operations/SOS; driver delete blocked.
- Owner: own taxis/drivers, add taxi (mandatory driver), replace driver (blocked while in queue), revenue view + .xlsx export, profile edit.
- Marshal: rank-scoped queue board, manual add by registration, fare update, rank updates post/delete, QR generate/download/print/regenerate, geo-check toggle, profile edit.
- Driver: live status/position, QR join (wrong-rank block, dup block, 20m geo-check when enabled), DEPART (fare snapshot → revenue; long-distance passenger capture required), SOS email to owner, profile edit.
- Passenger: safe taxi lookup + verified badge + public share link; public `/t/:registration` share page.
- Success/error result modal pattern + sonner toasts.

## Verification
- Backend: 41/41 pytest passing (auth, roles, queue, depart, revenue export, SOS, business rules).
- Frontend: compiled successfully; smoke tests on all dashboards passed.

## Backlog / Next
- P1: WebSocket realtime (currently 3s polling).
- P2: brute-force lockout on login; split server.py into per-role routers; per-rank configurable geo radius.
- P2: admin edit (not just create/delete) for master data; owner-side driver history.

## Test Credentials
See `/app/memory/test_credentials.md` (some seeded PINs changed during testing — noted there).
