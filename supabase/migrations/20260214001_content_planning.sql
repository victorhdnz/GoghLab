-- Planejamento de conteúdo (perfil + calendário de vídeos)

-- 1) Perfil de conteúdo por usuário (informações fixas usadas pela IA)
create table if not exists public.content_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text,
  niche text,
  audience text,
  tone_of_voice text,
  goals text,
  platforms text[], -- ex.: {'instagram','tiktok','youtube'}
  frequency_per_week integer,
  extra_preferences jsonb, -- espaço para futuras configs (ex.: duração preferida, formatos etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_profiles_user_unique unique (user_id)
);

comment on table public.content_profiles is
  'Perfil de conteúdo do cliente: informações fixas usadas pela IA para gerar roteiros e legendas.';

comment on column public.content_profiles.user_id is 'Usuário dono deste perfil de conteúdo (mesmo id de profiles/auth.users).';
comment on column public.content_profiles.business_name is 'Nome da empresa ou projeto do cliente.';
comment on column public.content_profiles.niche is 'Nicho principal (psicologia, marketing, advocacia, etc.).';
comment on column public.content_profiles.audience is 'Descrição resumida do público-alvo.';
comment on column public.content_profiles.tone_of_voice is 'Tom de voz desejado (formal, descontraído, engraçado, técnico, etc.).';
comment on column public.content_profiles.goals is 'Objetivos principais dos conteúdos (atrair clientes, autoridade, educação, etc.).';
comment on column public.content_profiles.platforms is 'Redes onde o cliente posta (instagram, tiktok, youtube, etc.).';
comment on column public.content_profiles.frequency_per_week is 'Frequência desejada de vídeos por semana.';
comment on column public.content_profiles.extra_preferences is 'JSON com preferências adicionais de roteiro e conteúdo.';

-- 2) Itens do calendário de conteúdo (cada vídeo/post planejado)
create table if not exists public.content_calendar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  time time with time zone,
  platform text, -- ex.: instagram_reels, tiktok, youtube_shorts
  topic text, -- tema/título do vídeo
  status text not null default 'planned', -- planned, generated, recorded, published
  script text, -- roteiro do vídeo
  caption text, -- legenda da postagem
  hashtags text, -- hashtags em texto (ex.: '#psicologia #ansiedade')
  cover_prompt text, -- prompt para capa/thumbnail, se usado
  meta jsonb, -- espaço para infos extras (ex.: duração sugerida, ideias de hook, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_calendar_items is
  'Calendário de conteúdo: cada registro representa um vídeo/post planejado para uma data específica.';

comment on column public.content_calendar_items.user_id is 'Usuário dono deste item de calendário (mesmo id de profiles/auth.users).';
comment on column public.content_calendar_items.date is 'Data planejada para o vídeo/post.';
comment on column public.content_calendar_items.time is 'Horário planejado (opcional).';
comment on column public.content_calendar_items.platform is 'Plataforma/canal (instagram, tiktok, youtube, etc.).';
comment on column public.content_calendar_items.topic is 'Tema ou título do vídeo.';
comment on column public.content_calendar_items.status is 'Status do item: planned, generated, recorded, published.';
comment on column public.content_calendar_items.script is 'Roteiro gerado/ajustado para o vídeo.';
comment on column public.content_calendar_items.caption is 'Legenda do post (para Instagram/TikTok/YouTube etc.).';
comment on column public.content_calendar_items.hashtags is 'Lista de hashtags recomendadas, em texto.';
comment on column public.content_calendar_items.cover_prompt is 'Prompt para gerar capa/thumbnail do vídeo.';

-- 3) Atualização automática de updated_at
create or replace function public.set_current_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_profiles_set_updated_at on public.content_profiles;
create trigger content_profiles_set_updated_at
before update on public.content_profiles
for each row
execute procedure public.set_current_timestamp();

drop trigger if exists content_calendar_items_set_updated_at on public.content_calendar_items;
create trigger content_calendar_items_set_updated_at
before update on public.content_calendar_items
for each row
execute procedure public.set_current_timestamp();

-- 4) RLS: habilitar e permitir que cada usuário gerencie apenas seus registros;
-- admins/editores (função is_admin_or_editor()) podem ver tudo.
alter table public.content_profiles enable row level security;
alter table public.content_calendar_items enable row level security;

-- Perfis: dono pode CRUD do próprio perfil
drop policy if exists content_profiles_owner_policy on public.content_profiles;
create policy content_profiles_owner_policy
on public.content_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Perfis: admin/editor pode ver e editar todos
drop policy if exists content_profiles_admin_policy on public.content_profiles;
create policy content_profiles_admin_policy
on public.content_profiles
for all
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

-- Calendário: dono pode CRUD apenas dos próprios itens
drop policy if exists content_calendar_owner_policy on public.content_calendar_items;
create policy content_calendar_owner_policy
on public.content_calendar_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Calendário: admin/editor pode ver e editar todos
drop policy if exists content_calendar_admin_policy on public.content_calendar_items;
create policy content_calendar_admin_policy
on public.content_calendar_items
for all
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

