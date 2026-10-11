-- Ejecutar completo en Supabase > SQL Editor > New query > Run.
-- No contiene contrasenas ni claves API. No borra tablas ni comentarios.
-- Cuenta unica verificada durante la configuracion del proyecto.
begin;

create schema if not exists museum_private;
revoke all on schema museum_private from public, anon, authenticated;

create table if not exists museum_private.admin_account (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict
);

do $$
begin
  if not exists (
    select 1 from auth.users
    where id = '7ab992c2-b243-4fae-bb22-1776ccc8927a'::uuid
      and lower(email) = 'museodepatologiaveterinaria@gmail.com'
      and email_confirmed_at is not null
  ) then
    raise exception 'No se encontro la cuenta administradora confirmada. Comprueba que estas en el proyecto correcto.';
  end if;
  if exists (select 1 from museum_private.admin_account where user_id <> '7ab992c2-b243-4fae-bb22-1776ccc8927a'::uuid) then
    raise exception 'Ya hay otro administrador configurado. No se ha modificado.';
  end if;
  insert into museum_private.admin_account (singleton, user_id)
  values (true, '7ab992c2-b243-4fae-bb22-1776ccc8927a')
  on conflict (singleton) do nothing;
end $$;

create table if not exists public.museum_comments (
  id uuid primary key default gen_random_uuid(),
  pathology_slug text not null check (char_length(pathology_slug) between 1 and 250 and pathology_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  author_name text not null check (char_length(btrim(author_name)) between 2 and 60),
  body text not null check (char_length(btrim(body)) between 10 and 2000),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reply text check (admin_reply is null or char_length(btrim(admin_reply)) between 1 and 2000),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  moderated_at timestamptz,
  reply_updated_at timestamptz,
  version integer not null default 1 check (version > 0),
  constraint museum_comment_publication check ((status = 'approved') = (published_at is not null))
);
create index if not exists museum_comments_public_idx on public.museum_comments (pathology_slug, published_at desc, id desc) where status = 'approved';
create index if not exists museum_comments_moderation_idx on public.museum_comments (status, created_at, id);

create table if not exists museum_private.rate_events (
  scope text not null,
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz not null default now()
);
create index if not exists museum_rate_events_lookup_idx on museum_private.rate_events (scope, key_hash, occurred_at);
create index if not exists museum_rate_events_cleanup_idx on museum_private.rate_events (occurred_at);

create table if not exists museum_private.comment_requests (
  request_id uuid primary key,
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  payload_hash text not null,
  comment_id uuid not null references public.museum_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists museum_comment_requests_cleanup_idx on museum_private.comment_requests (created_at);

revoke all on all tables in schema museum_private from public, anon, authenticated, service_role;
revoke all on public.museum_comments from public, anon, authenticated, service_role;
alter table public.museum_comments enable row level security;

-- La cuenta y la sesion deben seguir existiendo; un JWT antiguo tras logout
-- no habilita la lectura privada ni la moderacion.
create or replace function public.is_museum_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from museum_private.admin_account a
    join auth.sessions s on s.user_id = a.user_id
    where a.user_id = (select auth.uid())
      and s.id::text = (select auth.jwt()->>'session_id')
  );
$$;
revoke all on function public.is_museum_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_museum_admin() to authenticated;

drop policy if exists museum_admin_read on public.museum_comments;
create policy museum_admin_read on public.museum_comments for select to authenticated
using ((select public.is_museum_admin()));
grant select on public.museum_comments to authenticated;

-- Proyeccion publica: ni email, ni pendientes, ni motivos de rechazo.
create or replace function public.list_museum_comments(
  p_slug text, p_limit integer default 11,
  p_before_at timestamptz default null, p_before_id uuid default null
)
returns table (id uuid, author_name text, body text, published_at timestamptz, admin_reply text, reply_updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 20
    or ((p_before_at is null) <> (p_before_id is null)) then
    raise exception using errcode = '22023', message = 'INVALID_PAGINATION';
  end if;
  return query select c.id, c.author_name, c.body, c.published_at, c.admin_reply, c.reply_updated_at
    from public.museum_comments c
    where c.pathology_slug = p_slug and c.status = 'approved'
      and (p_before_at is null or (c.published_at, c.id) < (p_before_at, p_before_id))
    order by c.published_at desc, c.id desc limit p_limit;
end $$;
revoke all on function public.list_museum_comments(text, integer, timestamptz, uuid) from public, anon, authenticated, service_role;
grant execute on function public.list_museum_comments(text, integer, timestamptz, uuid) to anon, authenticated;

-- Contador compartido y atomico. Solo se invoca desde el servidor.
create or replace function museum_private.consume_limit(p_scope text, p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
declare v_count bigint;
begin
  if p_scope is null or char_length(p_scope) not between 1 and 80
    or p_key is null or p_key !~ '^[a-f0-9]{64}$'
    or p_limit is null or p_limit not between 1 and 1000
    or p_seconds is null or p_seconds not between 1 and 86400 then
    raise exception using errcode = '22023', message = 'INVALID_LIMIT';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_scope || ':' || p_key, 0));
  delete from museum_private.rate_events where occurred_at < now() - interval '2 days';
  select count(*) into v_count from museum_private.rate_events
    where scope = p_scope and key_hash = p_key and occurred_at > now() - pg_catalog.make_interval(secs => p_seconds);
  if v_count >= p_limit then return false; end if;
  insert into museum_private.rate_events(scope, key_hash) values(p_scope, p_key);
  return true;
end $$;
revoke all on function museum_private.consume_limit(text, text, integer, integer) from public, anon, authenticated, service_role;

create or replace function public.consume_museum_auth_limit(p_kind text, p_network_hash text, p_account_hash text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
begin
  if p_kind is null or p_kind not in ('login', 'recovery') then
    raise exception using errcode = '22023', message = 'INVALID_LIMIT_KIND';
  end if;
  if not museum_private.consume_limit('auth:' || p_kind || ':network', p_network_hash, 30, 900) then return false; end if;
  return museum_private.consume_limit('auth:' || p_kind || ':account', p_account_hash, 5, 900);
end $$;
revoke all on function public.consume_museum_auth_limit(text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.consume_museum_auth_limit(text, text, text) to service_role;

create or replace function public.submit_museum_comment(
  p_request_id uuid, p_visitor_hash text, p_network_hash text,
  p_slug text, p_name text, p_body text, p_email text default null
)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare v_previous museum_private.comment_requests%rowtype; v_hash text; v_id uuid;
begin
  if p_request_id is null or p_visitor_hash is null or p_network_hash is null
    or p_visitor_hash !~ '^[a-f0-9]{64}$' or p_network_hash !~ '^[a-f0-9]{64}$'
    or p_slug is null or p_name is null or p_body is null then
    raise exception using errcode = '22023', message = 'INVALID_SUBMISSION';
  end if;
  p_name := btrim(p_name); p_body := btrim(p_body); p_email := nullif(lower(btrim(p_email)), '');
  v_hash := encode(sha256(convert_to(jsonb_build_array(p_slug, p_name, p_body, p_email)::text, 'UTF8')), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text, 1));
  delete from museum_private.comment_requests where created_at < now() - interval '2 days';
  select * into v_previous from museum_private.comment_requests where request_id = p_request_id;
  if found then
    if v_previous.payload_hash <> v_hash or v_previous.visitor_hash <> p_visitor_hash then
      raise exception using errcode = '23505', message = 'REQUEST_CONFLICT';
    end if;
    return jsonb_build_object('accepted', true, 'duplicate', true);
  end if;
  if not museum_private.consume_limit('comment:global', repeat('0',64), 500, 86400)
    or not museum_private.consume_limit('comment:network', p_network_hash, 100, 86400)
    or not museum_private.consume_limit('comment:visitor:daily', p_visitor_hash, 10, 86400)
    or not museum_private.consume_limit('comment:visitor:minute', p_visitor_hash, 1, 60) then
    raise exception using errcode = 'P0001', message = 'RATE_LIMITED';
  end if;
  insert into public.museum_comments(pathology_slug, author_name, body, email, status)
    values (p_slug, p_name, p_body, p_email, 'pending') returning id into v_id;
  insert into museum_private.comment_requests(request_id, visitor_hash, payload_hash, comment_id)
    values(p_request_id, p_visitor_hash, v_hash, v_id);
  return jsonb_build_object('accepted', true, 'duplicate', false);
end $$;
revoke all on function public.submit_museum_comment(uuid, text, text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.submit_museum_comment(uuid, text, text, text, text, text, text) to service_role;

create or replace function public.moderate_museum_comment(
  p_id uuid, p_action text, p_version integer,
  p_reply text default null, p_reason text default null
)
returns public.museum_comments language plpgsql volatile security definer set search_path = ''
as $$
declare v_comment public.museum_comments%rowtype;
begin
  if not public.is_museum_admin() then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;
  select * into v_comment from public.museum_comments where id = p_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'NOT_FOUND'; end if;
  if p_version is null or v_comment.version <> p_version then
    raise exception using errcode = '40001', message = 'VERSION_CONFLICT';
  end if;
  if p_action = 'approve' and v_comment.status = 'pending' then
    update public.museum_comments set status = 'approved', published_at = now(), moderated_at = now(), rejection_reason = null where id = p_id;
  elsif p_action = 'reject' and v_comment.status = 'pending' then
    update public.museum_comments set status = 'rejected', moderated_at = now(), rejection_reason = nullif(btrim(p_reason), '') where id = p_id;
  elsif p_action = 'reopen' and v_comment.status in ('approved', 'rejected') then
    update public.museum_comments set status = 'pending', published_at = null, moderated_at = now(), rejection_reason = null where id = p_id;
  elsif p_action = 'reply' and v_comment.status = 'approved' then
    update public.museum_comments set admin_reply = nullif(btrim(p_reply), ''), reply_updated_at = now() where id = p_id;
  else
    raise exception using errcode = '22023', message = 'INVALID_TRANSITION';
  end if;
  update public.museum_comments set updated_at = now(), version = version + 1 where id = p_id returning * into v_comment;
  return v_comment;
end $$;
revoke all on function public.moderate_museum_comment(uuid, text, integer, text, text) from public, anon, authenticated, service_role;
grant execute on function public.moderate_museum_comment(uuid, text, integer, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
