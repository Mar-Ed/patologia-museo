import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Real PostgreSQL execution in memory. Never connects to the user's project.
const db = new PGlite();
const admin = '7ab992c2-b243-4fae-bb22-1776ccc8927a';
const other = randomUUID();
const session = randomUUID();
const otherSession = randomUUID();
const visitor = '1'.repeat(64), network = '2'.repeat(64);
let checks = 0;
async function as(role, user, sessionId, sql, params = []) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: user, session_id: sessionId })]);
  try { return await db.query(sql, params); } finally { await db.exec('reset role'); }
}
async function denied(operation, message) { await assert.rejects(operation, message); checks++; }
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create table auth.sessions (id uuid primary key, user_id uuid references auth.users(id));
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
  `);
  await db.query('insert into auth.users values ($1,$2,now()),($3,$4,now())', [admin, 'museodepatologiaveterinaria@gmail.com', other, 'other@example.com']);
  await db.query('insert into auth.sessions values ($1,$2),($3,$4)', [session, admin, otherSession, other]);
  const migration = await readFile(new URL('../supabase/migrations/202610100001_museum_comments.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // A repeated setup must not destroy content or replace the admin.
  const threadsMigration = await readFile(new URL('../supabase/migrations/202610110002_comment_threads.sql', import.meta.url), 'utf8');
  await db.exec(threadsMigration);
  await db.exec(threadsMigration);
  await denied(() => db.query('insert into museum_private.admin_account values(false,$1)', [other]), 'Second admin must fail');

  const requestId = randomUUID();
  const input = [requestId, visitor, network, 'milagritos', 'Estudiante', 'Una pregunta de prueba sobre el caso.', 'private@example.com'];
  const submit = (args = input, role = 'service_role') => as(role, null, null, 'select public.submit_museum_comment($1,$2,$3,$4,$5,$6,$7) as result', args);
  await denied(() => submit(input, 'anon'), 'Guest direct submission must fail');
  await denied(() => submit(input, 'authenticated'), 'Authenticated direct submission must fail');
  assert.equal((await submit()).rows[0].result.accepted, true); checks++;
  assert.equal((await submit()).rows[0].result.duplicate, true); checks++;
  await denied(() => submit([...input.slice(0,5), 'Contenido distinto con la misma clave.', input[6]]), 'Changed idempotent body must fail');
  await denied(() => submit([randomUUID(), ...input.slice(1)]), 'Rate limit must reject a second comment');
  assert.equal((await db.query('select count(*)::int as count from public.museum_comments')).rows[0].count, 1); checks++;

  const list = () => as('anon', null, null, 'select * from public.list_museum_comments($1)', ['milagritos']);
  assert.equal((await list()).rows.length, 0); checks++;
  await denied(() => as('anon', null, null, 'select * from public.museum_comments'), 'Anon table read must fail');
  await denied(() => as('service_role', null, null, 'select * from public.museum_comments'), 'Submission key must not read the table directly');
  assert.equal((await as('authenticated', other, otherSession, 'select * from public.museum_comments')).rows.length, 0); checks++;
  const comment = (await as('authenticated', admin, session, 'select * from public.museum_comments')).rows[0];
  assert.equal(comment.email, 'private@example.com'); checks++;
  const moderate = (action, version, reply = null, reason = null, user = admin, sid = session) => as('authenticated', user, sid,
    'select * from public.moderate_museum_comment($1,$2,$3,$4,$5)', [comment.id, action, version, reply, reason]);
  await denied(() => moderate('approve', 1, null, null, other, otherSession), 'Other user must not approve');
  await denied(() => as('authenticated', admin, session, "update public.museum_comments set status='approved'"), 'Admin direct update must fail');
  await denied(() => as('anon', null, null, 'select * from public.list_museum_comments($1,100)', ['milagritos']), 'Unbounded pagination must fail');
  await denied(() => moderate('reply', 1, 'Todavia pendiente'), 'Cannot reply publicly to pending');
  await moderate('approve', 1); checks++;
  let visible = (await list()).rows;
  assert.equal(visible.length, 1);
  assert.deepEqual(Object.keys(visible[0]).sort(), ['id','author_name','body','published_at','admin_reply','reply_updated_at'].sort()); checks++;
  await denied(() => moderate('reply', 1, 'Version anterior'), 'Stale version must fail');
  await moderate('reply', 2, 'Respuesta del museo.');
  assert.equal((await list()).rows[0].admin_reply, 'Respuesta del museo.'); checks++;
  await moderate('reopen', 3);
  assert.equal((await list()).rows.length, 0); checks++;
  await moderate('reject', 4, null, 'Motivo privado');
  assert.equal((await list()).rows.length, 0); checks++;
  await denied(() => moderate('approve', 5), 'Rejected must be reopened before approval');
  await moderate('reopen', 5);
  await moderate('approve', 6); checks++;
  const replyVisitor = '3'.repeat(64);
  const thread = (parent = null, who = visitor) => as('service_role', null, null, 'select * from public.list_museum_comments_v2($1,$2,$3)', ['milagritos', who, parent]);
  const replyRequest = randomUUID();
  const replyInput = [replyRequest, replyVisitor, network, 'milagritos', 'Otro lector', 'Una respuesta a la pregunta original.', 'reply-private@example.com', comment.id];
  const submitReply = (args = replyInput, role = 'service_role') => as(role, null, null, 'select public.submit_museum_comment_v2($1,$2,$3,$4,$5,$6,$7,$8)', args);
  await denied(() => submitReply(replyInput, 'anon'), 'Reply RPC must require the server');
  await denied(() => submitReply([...replyInput.slice(0,3), 'wrong-slug', ...replyInput.slice(4)]), 'Cross-pathology replies must fail');
  await submitReply();
  await submitReply(); // exact retries must not duplicate replies
  assert.equal((await db.query('select count(*)::int as n from public.museum_comments where parent_id=$1', [comment.id])).rows[0].n, 1); checks++;
  assert.equal((await thread(comment.id)).rows.length, 0); checks++;
  const reply = (await db.query('select * from public.museum_comments where parent_id=$1', [comment.id])).rows[0];
  await denied(() => submitReply([...replyInput.slice(0,7), null]), 'Cannot retry a reply as a root comment');
  const like = (id = comment.id, desired = true, who = visitor, role = 'service_role') => as(role, null, null, 'select public.set_museum_comment_like($1,$2,$3,$4) as result', [id, who, network, desired]);
  await denied(() => like(comment.id,true,visitor,'anon'), 'Guests cannot set a forged visitor hash');
  await denied(() => like(reply.id), 'Pending replies cannot be liked');
  assert.equal((await like()).rows[0].result.like_count, 1); checks++;
  assert.equal((await like()).rows[0].result.like_count, 1); checks++;
  assert.equal((await thread()).rows[0].liked, true); checks++;
  assert.equal((await thread(null, replyVisitor)).rows[0].liked, false); checks++;
  assert.equal((await like(comment.id,false)).rows[0].result.like_count, 0); checks++;
  assert.equal((await like(comment.id,false)).rows[0].result.like_count, 0); checks++;
  await as('authenticated', admin, session, "select * from public.moderate_museum_comment($1,'approve',1)", [reply.id]);
  const publishedReplies = (await thread(comment.id)).rows;
  assert.equal(publishedReplies.length, 1); checks++;
  assert.deepEqual(Object.keys(publishedReplies[0]).sort(), ['id','author_name','body','published_at','admin_reply','reply_updated_at','parent_id','like_count','liked','reply_count'].sort()); checks++;
  assert.equal((await thread()).rows[0].reply_count, 1); checks++;
  assert.equal((await list()).rows.length, 1); checks++; // legacy list never flattens replies
  await denied(() => submitReply([randomUUID(), '4'.repeat(64), ...replyInput.slice(2,7), reply.id]), 'Reply nesting must remain bounded');
  await denied(() => as('anon', null, null, 'select * from museum_private.comment_likes'), 'Visitor hashes must remain private');
  await denied(() => as('anon', null, null, 'select * from public.list_museum_comments_v2($1,$2)', ['milagritos', visitor]), 'Personalized reads must require server');
  await moderate('reopen', 7);
  assert.equal((await thread(comment.id)).rows.length, 0); checks++;
  await denied(() => like(reply.id), 'Replies to hidden parents cannot be liked');
  await denied(() => submitReply([randomUUID(), '4'.repeat(64), ...replyInput.slice(2)]), 'Cannot reply to hidden parents');
  await as('authenticated', admin, session, "select * from public.moderate_museum_comment($1,'reopen',2)", [reply.id]);
  await denied(() => as('authenticated', admin, session, "select * from public.moderate_museum_comment($1,'approve',3)", [reply.id]), 'Cannot publish reply while parent is hidden');
  await moderate('approve', 8);
  await db.query('delete from auth.sessions where id=$1', [session]);
  assert.equal((await as('authenticated', admin, session, 'select * from public.museum_comments')).rows.length, 0); checks++;
  await denied(() => moderate('reopen', 9), 'Logged-out JWT cannot moderate');
  await denied(() => as('anon', null, null, "select public.consume_museum_auth_limit('login',$1,$2)", [network, visitor]), 'Guests cannot call rate limiter');
  console.log(`Database permissions and moderation: ${checks} checks passed (isolated PostgreSQL).`);
} catch (error) {
  console.error(`Database check failed: ${error.message} (${error.code ?? 'assertion'})`);
  process.exitCode = 1;
} finally {
  await db.close();
}
