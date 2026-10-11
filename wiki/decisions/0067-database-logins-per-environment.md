---
type: Decision Record
title: "0067: The sites log in to the database with a limited app login; the owner login is for migrations"
description: "Production and staging connect as soul_ledger_app (read and write rows only), the production owner password lives only in the owner's password manager, and the owner login is kept for migrations."
tags: [security, infra, database]
status: stable
decision: accepted
decided_on: 2026-10-11
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T05:10:00Z }
sources:
  - id: neon-roles
    resource: https://neon.com/docs/manage/roles
    title: "Neon Docs: Manage roles"
---

# Context

Issues #8 and #9 (labelled `pre-public`) had to be closed before the repo goes public ([ADR 0032](0032-github-private-ci.md)):

- **#8:** Neon branches copy their parent's logins, so `main`, `staging` and `dev` shared one owner login and password. The password kept locally for agents also opened production.
- **#9:** the sites connected as that owner, which can drop and alter tables. The app only reads and writes rows; nothing at runtime changes the schema, and migrations run separately (`pnpm db:migrate`), never on deploy.

# Decision

| Environment | The site logs in as | Owner login (`soul_ledger_owner`) |
|---|---|---|
| Production (Neon `main`) | `soul_ledger_app` | Password reset on `main` only, kept in the owner's password manager, never on disk. Used only for production migrations. |
| Staging (Neon `staging`) | `soul_ledger_app`, with its own password | Unchanged; agents use it for staging migrations (`STAGING_DATABASE_URL`). |
| Local (Neon `dev`) | Owner | Unchanged; it's a throwaway copy and local work runs migrations there. |

- `soul_ledger_app` can `SELECT`, `INSERT`, `UPDATE` and `DELETE` rows in `public`, and nothing else.
- Staging uses the limited login too, so a missing grant (for example on a new table) breaks staging before production.
- Logins created after a branch is made don't copy to other branches, so each branch's `soul_ledger_app` is separate.

# How to set it up (or redo it)

Only the owner does this: it touches production secrets, which agents may not change ([ADR 0048](0048-unattended-run-guardrails.md)).

1. Generate a password of **letters and digits only** (symbols such as `#`, `/`, `@`, `?` or `%` break the connection URL).
2. In the Neon SQL Editor, on the right branch, run:
   ```sql
   CREATE ROLE soul_ledger_app WITH LOGIN PASSWORD '<password>';
   GRANT USAGE ON SCHEMA public TO soul_ledger_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO soul_ledger_app;
   ALTER DEFAULT PRIVILEGES FOR ROLE soul_ledger_owner IN SCHEMA public
     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO soul_ledger_app;
   ```
   Create the login with SQL, not the Console's "New role" button: Console, CLI and API roles join `neon_superuser` (with `CREATEDB`, `CREATEROLE` and more), while SQL-created roles don't[^neon-roles]. The last statement gives tables created later by migrations the same access; it only works when run as `soul_ledger_owner` (the SQL Editor's default) or a member of it.
3. In Render, set the service's `DATABASE_URL` to `postgresql://soul_ledger_app:<password>@<host>/soul_ledger?sslmode=require`.
4. To change the password later: `ALTER ROLE soul_ledger_app WITH PASSWORD '<new>';` on that branch, then update Render.
5. Check: a real lookup (`/api/lookup?q=<steam id>`) streams `profile` and `history` events. A bad URL logs `Invalid URL`; a wrong password logs `password authentication failed`.

# Consequences

- Production migrations need the owner's password manager; agents can't run them (they couldn't before either, [ADR 0048](0048-unattended-run-guardrails.md)).
- A migration that creates objects as a different role than `soul_ledger_owner` would not get the default grants; keep migrations on the owner login.

[^neon-roles]: [Neon Docs: Manage roles](https://neon.com/docs/manage/roles).
