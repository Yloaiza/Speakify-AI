-- Pega esto en Supabase > SQL Editor > New query > Run

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  language text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_idx
  on public.messages (session_id, created_at);

-- Seguridad: activamos RLS sin politicas publicas.
-- El backend usa la service_role key (que ignora RLS), el navegador no puede leer la tabla.
alter table public.messages enable row level security;
