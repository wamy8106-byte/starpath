# StarPath

StarPath is a Next.js application with a free daily horoscope and an optional
one-time 7-Day Personal Edge Program. Day 1 is available before payment, and a
verified Stripe webhook unlocks Days 2–7.

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm
- A Supabase project
- An OpenAI API key
- Stripe test-mode credentials and a one-time Price
- Stripe CLI for local webhook testing

Install dependencies and create local environment configuration:

```bash
npm ci
cp .env.example .env.local
```

Fill in `.env.local`, then start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env.local` is ignored by Git. Never commit credentials or service-role keys.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret/service-role key |
| `OPENAI_API_KEY` | Server-side horoscope and program generation |
| `STRIPE_SECRET_KEY` | Stripe test or live secret key |
| `STRIPE_PRICE_ID` | Existing one-time Stripe Price used by Checkout |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint |
| `NEXT_PUBLIC_APP_URL` | Application origin used in Stripe return URLs |

Use matching Stripe environments: test keys, test Price IDs, and test webhook
secrets must be used together.

## Supabase `programs` contract

The application expects `public.programs` to have this final shape after all
repository migrations are applied:

| Column | Type | Nullability/default | Purpose |
|---|---|---|---|
| `token` | `text` | primary key or unique, not null | Private program URL identifier |
| `email` | `text` | not null | Email collected when generating a program |
| `zodiac` | `text` | not null | Lowercase zodiac identifier |
| `content` | `jsonb` | not null | Program title and seven generated days |
| `is_paid` | `boolean` | not null, default `false` | Server-authoritative access state |
| `stripe_session_id` | `text` | nullable | Most recent Stripe Checkout Session |
| `created_at` | `timestamptz` | not null, default `now()` | Creation timestamp |

The migration history is deliberately split:

1. `20260621000000_create_programs.sql` creates the original program table.
2. `20260622000000_add_stripe_session_id_to_programs.sql` adds the nullable
   Stripe Checkout Session reference required by the hardened payment flow.

`stripe_session_id` is intentionally nullable:

- it is null before Checkout begins;
- it stores an open or completed Checkout Session ID;
- it is cleared when the corresponding Checkout Session expires.

No index is added for `stripe_session_id`. Current queries identify rows by the
unique `token` and use `stripe_session_id` only as an additional update guard.

## Applying Supabase migrations

Migrations in `supabase/migrations` are the canonical schema setup path. A
fresh Supabase project should apply the complete migration history in filename
order.

For a linked Supabase project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For a local Supabase stack:

```bash
supabase start
supabase migration up
```

Alternatively, copy the migration SQL into the Supabase SQL Editor and run it
in filename order against the intended project. This is a fallback for
environments where the Supabase CLI is unavailable. Review the selected
project before applying it, and do not run migrations blindly against
production.

The baseline uses `create table if not exists`, and the Phase 3 migration uses
`add column if not exists`. Neither migration drops or rewrites existing rows.

## Row Level Security

No Row Level Security policies are included because the current tracked
application does not access `programs` directly from browser code. Program
creation, retrieval, checkout, and webhook updates all run in server routes
using `SUPABASE_SECRET_KEY`.

A Supabase service-role or equivalent server secret bypasses RLS. Keep that key
server-only and never expose it through a `NEXT_PUBLIC_` variable or client
component. If browser-side database access is introduced later, define and
review explicit RLS policies before enabling it.

## Local Stripe webhook testing

Start the application, then forward test-mode events:

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired \
  --forward-to localhost:3000/api/stripe/webhook
```

Set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` value printed by that command,
then restart the development server.

## Validation

```bash
npm test
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

The repository currently has known lint debt outside the payment flow; use
scoped linting when validating isolated recovery phases.
