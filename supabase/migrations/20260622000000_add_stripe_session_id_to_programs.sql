alter table public.programs
  add column if not exists stripe_session_id text;

comment on column public.programs.stripe_session_id is
  'Most recent Stripe Checkout Session ID for this program; nullable before checkout and after expiration.';
