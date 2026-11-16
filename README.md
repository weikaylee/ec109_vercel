# Caltech Dining Choices — Vercel edition

Standard Next.js App Router app for Vercel with Supabase Auth (email verification codes) and PostgreSQL. This replaces the earlier Cloudflare D1/ChatGPT authentication implementation. The existing hosted Sites version is not changed by this ZIP.

## Deploy

1. Create a Supabase project. Run `supabase/schema.sql` in its SQL editor once.
2. Enable the Email authentication provider and email signups. In Authentication → Email Templates → Magic Link, include the one-time code using `{{ .Token }}` (see `supabase/email-template.html`). This app verifies an email code, not a callback link.
3. Configure a production SMTP provider in Supabase so ordinary student email addresses can receive codes. Supabase's default mail service is for limited testing. Keep Auth's rate limits enabled. Set the Supabase Site URL to your final Vercel origin.
4. Push the extracted project to your Git repository and import it in Vercel. Framework: **Next.js**. Node: **22.x or 24.x**. Install: `npm ci`. Build: `npm run build`. Leave the output-directory override unset.
5. Add these environment variables in Vercel (and `.env.local` locally):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your project's HTTPS URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, or legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key; never expose in browser code |
| `PARTICIPANT_ID_SECRET` | Permanent random secret of at least 32 characters; generate with `openssl rand -hex 32` |
| `ADMIN_EMAILS` | Comma-separated email addresses, e.g. `alice@caltech.edu,bob@caltech.edu` |
| `ALLOWED_EMAIL_DOMAIN` | Optional: `caltech.edu`; leave empty to allow any verified email |

6. Redeploy after setting/changing environment variables. Sign in at `/login` with an allowlisted admin email, then open `/results`.

All keys in this app are server-only. None needs a `NEXT_PUBLIC_` prefix. Use a separate Supabase project for preview/testing if you do not want preview submissions in the production database.

## One response per verified email

- Participants receive an email code. The server verifies the authenticated user with Supabase, rather than trusting client IDs, browser storage, or forwarded identity headers.
- An HMAC-SHA256 of the normalized verified email is used only in a separate participant ledger. A random anonymous UUID identifies the response and appears in exports. Plain emails are retained by Supabase Auth, not in response payloads.
- The PostgreSQL submission function locks the participant row, inserts the response, and marks the account as submitted in one transaction. Concurrent requests and retry submissions cannot create a second response.
- The same verified email maps to the same ledger entry across browsers, devices, and account recreation. **Do not rotate `PARTICIPANT_ID_SECRET` after collecting data**, because it defines that mapping.
- Admin deletion is soft deletion: responses are excluded from reports and exports, but the participant submission lock remains.
- This enforces one response per verified email, not one per human who controls multiple email addresses. Restricting `ALLOWED_EMAIL_DOMAIN` to `caltech.edu` reduces that risk, but is not student enrollment verification. Admin addresses are exempt from the optional domain restriction.

## Multiple admins

Set `ADMIN_EMAILS` to any number of comma-separated verified addresses. Comparisons are case-insensitive with whitespace trimmed. Missing/empty configuration grants nobody admin access. Each admin signs in with their own email code; no shared admin password is used. Update the Vercel variable and redeploy to add/remove admins. Every results/export/delete request rechecks the server-side allowlist. Visitors cannot promote themselves through profile metadata or request parameters.

The tables have Row Level Security enabled and no public policies. Anonymous/authenticated database roles cannot read or modify them or execute submission functions. Only the Vercel server's service-role key can access them; route authorization still checks each user before access.

## What the statistics mean

For each response and each shown comparison, compute:

`longest_accepted_extra_wait = max(0, all accepted increasing-meal waits minus 2)`

Example: choosing the increasing-wait meal at total waits 2, 4, and 7 minutes, then choosing the fixed 2-minute meal at all higher waits, contributes **5 extra minutes**, not 7, and not the mean of the chosen rows.

Mean, median, **5th percentile**, and 95th percentile operate on these per-comparison maximum observed extra waits. Every comparison contributes one observation. The same calculation powers all groups, houses, class years, and summary CSV rows. Unique student counts are shown separately from meal-pair counts: a student can contribute up to four observations overall. Within a particular comparison group, a student contributes at most one.

Percentiles use linear interpolation: sort values ascending; position = `(n − 1) × p`. Thus percentiles can fall between offered waits. Empty groups display `—`; a single observation has identical mean, median, p05, and p95. No positive wait accepted means 0. Nonmonotonic choices are retained and flagged. Accepting 30 extra minutes is right-censored: the actual threshold may be higher, and the maximum-acceptance share is displayed.

Verified fixture: `[0,2,5,8,12,15,20,25,30]` → mean **13**, median **12**, p05 **0.8**, p95 **28** minutes.

Ranks are ordinal positions, not preference intensity. Rank gap bands retain the earlier names, with this limitation described in the dashboard. Version-1 ratings/15-minute data is kept separate from version-2 ranks/30-minute data when present.

## Survey behavior

Seven unique ranks, 1 = favorite. Exclusions compact the remaining ranks. Fourth/fifth eligible meals become Middle A/B; unavailable or identical-meal comparisons are skipped. All-excluded responses proceed to demographics. Randomized comparison order is saved. Waits: 2, 4, 7, 10, 14, 17, 22, 27, 32 minutes, against a fixed 2-minute wait.

## Local development and tests

```sh
npm ci
cp .env.example .env.local
# Fill .env.local with your Supabase values, then:
npm run dev
npm test
npm run typecheck
npm run build
```

Tests include exact wait-statistic fixtures, grouping, empty/single-observation cases, nonmonotonic choices, ranking/exclusion cases, multiple-admin policy, actual PostgreSQL schema/functions in PGlite, duplicate/wrong-ID rejection, deletion lock retention, database permissions, and actual API route authorization with mocked authentication.

The production Next.js build and these automated tests were run. Real email delivery, Supabase-hosted sign-in, and your Vercel deployment require your credentials and must be verified after setup. Smoke-test with a test participant: submit, sign out, sign in on another browser, verify submission is blocked; confirm a non-admin cannot view results/delete, and two allowlisted admins can.

## Existing data

The prior hosted Site's database is not included or automatically migrated. Export existing results before retiring it. Original anonymous records cannot be matched reliably to verified email addresses, so duplicate prevention cannot be applied retroactively to them. The new database starts empty.

## Sources

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/frameworks/full-stack/nextjs
