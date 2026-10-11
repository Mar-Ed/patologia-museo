-- Ejecutar DESPUES de 202610100001_museum_comments.sql.
-- Conserva los comentarios existentes. Agrega respuestas y Me gusta.
begin;
alter table public.museum_comments add column if not exists parent_id uuid references public.museum_comments(id) on delete restrict;
create index if not exists museum_comment_parent_idx on public.museum_comments(parent_id, published_at desc, id desc) where status = 'approved';
create table if not exists museum_private.comment_likes (
  comment_id uuid not null references public.museum_comments(id) on delete cascade,
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  primary key (comment_id, visitor_hash)
);
revoke all on museum_private.comment_likes from public, anon, authenticated, service_role;

create or replace function museum_private.validate_comment_parent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is not null then
    if new.parent_id = new.id or not exists (
      select 1 from public.museum_comments p where p.id = new.parent_id
      and p.parent_id is null and p.pathology_slug = new.pathology_slug
    ) then raise exception using errcode = '22023', message = 'INVALID_PARENT'; end if;
    if new.status = 'approved' and (tg_op = 'INSERT' or old.status <> 'approved')
      and not exists (select 1 from public.museum_comments p where p.id = new.parent_id and p.status = 'approved') then
      raise exception using errcode = '22023', message = 'PARENT_NOT_PUBLISHED';
    end if;
  end if;
  return new;
end $$;
revoke all on function museum_private.validate_comment_parent() from public, anon, authenticated, service_role;
drop trigger if exists museum_validate_comment_parent on public.museum_comments;
create trigger museum_validate_comment_parent before insert or update of parent_id, pathology_slug, status on public.museum_comments
for each row execute function museum_private.validate_comment_parent();

-- Los clientes anteriores siguen recibiendo solo comentarios principales.
create or replace function public.list_museum_comments(
  p_slug text, p_limit integer default 11, p_before_at timestamptz default null, p_before_id uuid default null
)
returns table (id uuid, author_name text, body text, published_at timestamptz, admin_reply text, reply_updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_limit is null or p_limit not between 1 and 20 or ((p_before_at is null) <> (p_before_id is null)) then
    raise exception using errcode = '22023', message = 'INVALID_PAGINATION';
  end if;
  return query select c.id,c.author_name,c.body,c.published_at,c.admin_reply,c.reply_updated_at
    from public.museum_comments c where c.pathology_slug=p_slug and c.status='approved' and c.parent_id is null
    and (p_before_at is null or (c.published_at,c.id)<(p_before_at,p_before_id))
    order by c.published_at desc,c.id desc limit p_limit;
end $$;

-- La identidad anonima procede de una cookie firmada y se calcula en Next.js.
-- Solo el servidor puede proporcionar su hash; nunca se devuelve al navegador.
create or replace function public.list_museum_comments_v2(
  p_slug text, p_visitor_hash text, p_parent_id uuid default null,
  p_limit integer default 11, p_before_at timestamptz default null, p_before_id uuid default null
)
returns table (id uuid, author_name text, body text, published_at timestamptz, admin_reply text,
  reply_updated_at timestamptz, parent_id uuid, like_count bigint, liked boolean, reply_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_limit is null or p_limit not between 1 and 20 or ((p_before_at is null) <> (p_before_id is null))
    or p_visitor_hash is null or p_visitor_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_PAGINATION';
  end if;
  return query select c.id,c.author_name,c.body,c.published_at,c.admin_reply,c.reply_updated_at,c.parent_id,
    (select count(*) from museum_private.comment_likes l where l.comment_id=c.id),
    exists(select 1 from museum_private.comment_likes l where l.comment_id=c.id and l.visitor_hash=p_visitor_hash),
    (select count(*) from public.museum_comments r where r.parent_id=c.id and r.status='approved')
    from public.museum_comments c where c.pathology_slug=p_slug and c.status='approved'
    and c.parent_id is not distinct from p_parent_id
    and (c.parent_id is null or exists(select 1 from public.museum_comments p where p.id=c.parent_id and p.status='approved'))
    and (p_before_at is null or (c.published_at,c.id)<(p_before_at,p_before_id))
    order by c.published_at desc,c.id desc limit p_limit;
end $$;
revoke all on function public.list_museum_comments_v2(text,text,uuid,integer,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.list_museum_comments_v2(text,text,uuid,integer,timestamptz,uuid) to service_role;

create or replace function public.submit_museum_comment_v2(
  p_request_id uuid,p_visitor_hash text,p_network_hash text,p_slug text,p_name text,p_body text,
  p_email text default null,p_parent_id uuid default null
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_previous museum_private.comment_requests%rowtype; v_hash text; v_id uuid;
begin
  if p_request_id is null or p_visitor_hash is null or p_network_hash is null
    or p_visitor_hash !~ '^[a-f0-9]{64}$' or p_network_hash !~ '^[a-f0-9]{64}$'
    or p_slug is null or p_name is null or p_body is null then
    raise exception using errcode='22023', message='INVALID_SUBMISSION';
  end if;
  p_name:=btrim(p_name); p_body:=btrim(p_body); p_email:=nullif(lower(btrim(p_email)),'');
  v_hash:=encode(sha256(convert_to(jsonb_build_array(p_slug,p_name,p_body,p_email,p_parent_id)::text,'UTF8')),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text,1));
  delete from museum_private.comment_requests where created_at<now()-interval '2 days';
  select * into v_previous from museum_private.comment_requests where request_id=p_request_id;
  if found then
    if v_previous.payload_hash<>v_hash or v_previous.visitor_hash<>p_visitor_hash then
      raise exception using errcode='23505', message='REQUEST_CONFLICT';
    end if;
    return jsonb_build_object('accepted',true,'duplicate',true);
  end if;
  if p_parent_id is not null then
    perform 1 from public.museum_comments where id=p_parent_id and pathology_slug=p_slug and status='approved' and parent_id is null for share;
    if not found then raise exception using errcode='22023', message='PARENT_NOT_PUBLISHED'; end if;
  end if;
  if not museum_private.consume_limit('comment:global',repeat('0',64),500,86400)
    or not museum_private.consume_limit('comment:network',p_network_hash,100,86400)
    or not museum_private.consume_limit('comment:visitor:daily',p_visitor_hash,10,86400)
    or not museum_private.consume_limit('comment:visitor:minute',p_visitor_hash,1,60) then
    raise exception using errcode='P0001',message='RATE_LIMITED';
  end if;
  insert into public.museum_comments(pathology_slug,author_name,body,email,status,parent_id)
    values(p_slug,p_name,p_body,p_email,'pending',p_parent_id) returning id into v_id;
  insert into museum_private.comment_requests(request_id,visitor_hash,payload_hash,comment_id) values(p_request_id,p_visitor_hash,v_hash,v_id);
  return jsonb_build_object('accepted',true,'duplicate',false);
end $$;
revoke all on function public.submit_museum_comment_v2(uuid,text,text,text,text,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.submit_museum_comment_v2(uuid,text,text,text,text,text,text,uuid) to service_role;

create or replace function public.set_museum_comment_like(p_id uuid,p_visitor_hash text,p_network_hash text,p_liked boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_current boolean; v_parent uuid;
begin
  if p_id is null or p_liked is null or p_visitor_hash is null or p_network_hash is null
    or p_visitor_hash !~ '^[a-f0-9]{64}$' or p_network_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='22023',message='INVALID_LIKE';
  end if;
  select c.parent_id into v_parent from public.museum_comments c where c.id=p_id and c.status='approved' for update;
  if not found then raise exception using errcode='P0002',message='NOT_PUBLISHED'; end if;
  if v_parent is not null and not exists(select 1 from public.museum_comments where id=v_parent and status='approved') then
    raise exception using errcode='P0002',message='NOT_PUBLISHED';
  end if;
  select exists(select 1 from museum_private.comment_likes where comment_id=p_id and visitor_hash=p_visitor_hash) into v_current;
  if v_current is distinct from p_liked then
    if not museum_private.consume_limit('like:visitor:minute',p_visitor_hash,30,60)
      or not museum_private.consume_limit('like:visitor:daily',p_visitor_hash,240,86400)
      or not museum_private.consume_limit('like:network:daily',p_network_hash,1000,86400) then
      raise exception using errcode='P0001',message='RATE_LIMITED';
    end if;
    if p_liked then
      insert into museum_private.comment_likes(comment_id,visitor_hash) values(p_id,p_visitor_hash) on conflict do nothing;
    else delete from museum_private.comment_likes where comment_id=p_id and visitor_hash=p_visitor_hash; end if;
  end if;
  return jsonb_build_object('liked',p_liked,'like_count',(select count(*) from museum_private.comment_likes where comment_id=p_id));
end $$;
revoke all on function public.set_museum_comment_like(uuid,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.set_museum_comment_like(uuid,text,text,boolean) to service_role;
notify pgrst,'reload schema';
commit;
