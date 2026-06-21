create table if not exists public.programs (
  token text primary key,
  email text not null,
  zodiac text not null,
  content jsonb not null,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.programs is
  'Generated StarPath 7-day programs and their payment access state.';

comment on column public.programs.token is
  'Private token used in the program URL.';

comment on column public.programs.content is
  'Generated program title and seven day entries.';
