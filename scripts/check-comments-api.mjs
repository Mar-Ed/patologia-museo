import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { readModule, loadContentModules } from "./content-modules.mjs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// No live credentials, Auth requests, email or remote writes are used by this test.
const env = { NODE_ENV: "development", SUPABASE_SECRET_KEY: "isolated-test-secret" };
const { getPathologyIndex } = readModule("lib/pathology-index.ts", { "server-only": {} });
const expectedIndex = loadContentModules().content.getPathologyRecords().map(({ slug, name }) => ({ slug, name }));
assert.equal(JSON.stringify(getPathologyIndex()), JSON.stringify(expectedIndex));
const security = readModule("lib/comments/security.ts", { "server-only": {}, "@/lib/site-config": { SITE_URL: "https://museum.example" } }, {
  process: { env }, URL, URLSearchParams, Buffer, AbortSignal,
  fetch: async () => { throw new Error("Security validation must not call an external service"); },
});
const origin = "http://localhost:3000";
const req = (path, body, headers = {}) => new NextRequest(`${origin}${path}`, body === undefined ? undefined : { method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
assert.throws(() => security.checkOrigin(req("/", {}, { origin: "https://attacker.example" })), /no está permitida/);
assert.throws(() => security.checkOrigin(req("/", {}, { origin: "null" })), /no está permitida/);
security.checkOrigin(req("/", {}));
await assert.rejects(security.readBody(req("/", { huge: "x".repeat(16001) })), /demasiado largo/);
await assert.rejects(security.readBody(new Request(`${origin}/`, { method: "POST", headers: { "content-type": "application/json" }, body: "{" })), /formato válido/);
await assert.rejects(security.readBody(req("/", [])), /formato válido/);
assert.throws(() => security.field({ body: "\0hello" }, "body", 1, 100), /longitud/);
assert.equal(security.validEmail("bad@@example.com"), false);
assert.equal(security.validEmail("valid@example.com"), true);
const cookieResponse = security.json({});
security.issueVisitor(cookieResponse);
const cookie = cookieResponse.headers.get("set-cookie").split(";")[0];
assert.ok(cookieResponse.headers.get("set-cookie").includes("HttpOnly"));
assert.ok(security.visitorId(req("/", {}, { cookie })));
assert.equal(security.visitorId(req("/", {}, { cookie: cookie.replace(/.$/, "z") })), null);
assert.equal(security.networkId(req("/", {}, { "x-vercel-forwarded-for": "1.2.3.4" })), security.networkId(req("/", {}, { "x-vercel-forwarded-for": "9.9.9.9" }))); // untrusted host ignores spoofed IP
const formModule = readModule("components/comment-form.tsx");
const threadModule = readModule("components/comment-thread.tsx", { "@/components/comment-form": formModule });
const { PathologyComments } = readModule("components/pathology-comments.tsx", { "@/components/comment-form": formModule, "@/components/comment-thread": threadModule });
const formMarkup = renderToStaticMarkup(React.createElement(PathologyComments, { slug: "test-pathology" }));
assert.ok(formMarkup.includes('id="comment-body"'));
assert.ok(formMarkup.includes('id="comment-name"'));
assert.ok(!formMarkup.includes("disponible pronto"));

const calls = [];
let rpcError = null, allowed = true, authenticated = true, limited = false, loginError = null, missingV2 = false;
const client = {
  rpc: async (name, args) => { calls.push({ name, args }); return { data: name === "is_museum_admin" ? allowed : name === "consume_museum_auth_limit" ? !limited : name === "set_museum_comment_like" ? { liked: args.p_liked, like_count: args.p_liked ? 1 : 0 } : [], error: missingV2 && name.endsWith('_v2') ? { code: 'PGRST202' } : rpcError }; },
  auth: {
    signInWithPassword: async args => { calls.push({ name: "signIn", args }); return { error: loginError }; },
    signOut: async args => { calls.push({ name: "signOut", args }); return { error: null }; },
    resetPasswordForEmail: async (...args) => { calls.push({ name: "recovery", args }); return { error: null }; },
    updateUser: async args => { calls.push({ name: "password", args }); return { error: null }; },
  },
};
const imports = {
  "@/lib/comments/security": security,
  "@/lib/pathology-index": { getPathologyIndex: () => [{ slug: "test-pathology", name: "Test" }] },
  "@/lib/supabase/server": { publicClient: () => client, serviceClient: () => client, sessionClient: async () => client, adminSession: async () => authenticated ? { client, user: { id: "admin" } } : null },
};
const comments = readModule("app/api/comments/route.ts", imports, { URLSearchParams, process: { env } });
const data = { slug: "test-pathology", name: "Visitor", body: "A legitimate test comment", email: "visitor@example.com", requestId: "bc411f7e-4609-4ce4-a3d2-5bfa52d27763", consent: true, website: "" };
const post = (payload, headers = { cookie }) => comments.POST(req("/api/comments", payload, headers));
assert.equal((await post({ ...data, slug: "missing" })).status, 404);
assert.equal((await post({ ...data, body: "short" })).status, 400);
assert.equal((await post({ ...data, consent: false })).status, 400);
assert.equal((await post({ ...data, website: "spam" })).status, 400);
assert.equal((await post(data, {})).status, 400);
assert.equal((await post(data, { cookie, origin: "https://attacker.example" })).status, 403);
calls.length = 0;
assert.equal((await post({ ...data, status: "approved", admin_reply: "forged" })).status, 201);
const insert = calls.find(call => call.name === "submit_museum_comment_v2");
assert.equal(insert.args.p_body, data.body);
assert.equal("p_status" in insert.args, false);
assert.equal("admin_reply" in insert.args, false);
assert.equal(insert.args.p_parent_id, null);
assert.equal((await post({ ...data, parentId: "forged" })).status, 400);
assert.equal((await post({ ...data, parentId: data.requestId })).status, 201);
assert.equal(calls.at(-1).args.p_parent_id, data.requestId);
rpcError = { message: "PARENT_NOT_PUBLISHED" };
assert.equal((await post({ ...data, parentId: data.requestId })).status, 409);
assert.match(insert.args.p_visitor_hash, /^[a-f0-9]{64}$/);
rpcError = { message: "RATE_LIMITED" };
assert.equal((await post(data)).status, 429);
rpcError = { message: "REQUEST_CONFLICT" };
assert.equal((await post(data)).status, 409);
rpcError = { message: "sensitive database diagnostic" };
const unavailable = await post(data);
assert.equal(unavailable.status, 503);
assert.ok(!(await unavailable.text()).includes("sensitive"));
rpcError = null;
assert.equal((await comments.GET(req("/api/comments?slug=test-pathology&beforeId=bad"))).status, 400);
const listing = await comments.GET(req("/api/comments?slug=test-pathology"));
assert.equal(listing.status, 200);
assert.equal(listing.headers.get("cache-control"), "private, no-store");
assert.equal((await listing.json()).featuresAvailable, true);
assert.equal((await comments.GET(req("/api/comments?slug=test-pathology&parentId=bad"))).status, 400);
const likes = readModule("app/api/comments/like/route.ts", imports);
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: true }))).status, 400);
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: true }, { cookie, origin: 'https://attacker.example' }))).status, 403);
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: 'yes' }, { cookie }))).status, 400);
rpcError = { message: "NOT_PUBLISHED" };
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: true }, { cookie }))).status, 404);
rpcError = { message: "RATE_LIMITED" };
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: true }, { cookie }))).status, 429);
rpcError = null;
const likedResponse = await likes.POST(req('/api/comments/like', { id: data.requestId, liked: true, visitorHash: 'forged' }, { cookie }));
assert.equal(likedResponse.status, 200);
assert.deepEqual(await likedResponse.json(), { liked: true, like_count: 1 });
assert.match(calls.at(-1).args.p_visitor_hash, /^[a-f0-9]{64}$/);
assert.equal((await likes.POST(req('/api/comments/like', { id: data.requestId, liked: false }, { cookie }))).status, 200);
missingV2 = true;
const legacyList = await comments.GET(req('/api/comments?slug=test-pathology'));
assert.equal(legacyList.status, 200);
assert.equal((await legacyList.json()).featuresAvailable, false);
assert.equal((await post(data)).status, 201); // Existing root comments work until SQL is applied.
assert.equal((await post({ ...data, parentId: data.requestId })).status, 503); // Replies must never silently become roots.
missingV2 = false;
const blogMarkup = renderToStaticMarkup(React.createElement(threadModule.CommentThread, { comment: { id: data.requestId, author_name: 'Lector', body: '<script>test</script>', published_at: '2026-10-11T12:00:00Z', like_count: 2, liked: true, reply_count: 1 }, slug: 'test-pathology', enabled: true }));
assert.ok(blogMarkup.includes('aria-pressed="true"'));
assert.ok(blogMarkup.includes('Responder'));
assert.ok(blogMarkup.includes('Ver 1 respuesta'));
assert.ok(blogMarkup.includes('&lt;script&gt;test&lt;/script&gt;'));

const admin = readModule("app/api/admin/[action]/route.ts", imports);
const adminPost = (action, body, headers) => admin.POST(req(`/api/admin/${action}`, body, headers), { params: Promise.resolve({ action }) });
authenticated = false;
assert.equal((await adminPost("moderate", {})).status, 401);
assert.equal((await admin.GET(req("/api/admin/comments"), { params: Promise.resolve({ action: "comments" }) })).status, 401);
authenticated = true;
assert.equal((await adminPost("moderate", {}, { origin: "https://attacker.example" })).status, 403);
assert.equal((await adminPost("moderate", { id: data.requestId, action: "approve", version: null })).status, 400);
rpcError = { code: "40001" };
assert.equal((await adminPost("moderate", { id: data.requestId, action: "approve", version: 1 })).status, 409);
rpcError = null;
assert.equal((await adminPost("moderate", { id: data.requestId, action: "reply", version: 1, reply: "<script>alert(1)</script>" })).status, 200);
limited = true; calls.length = 0;
assert.equal((await adminPost("login", { email: "admin@example.com", password: "test-password" })).status, 429);
assert.equal(calls.some(call => call.name === "signIn"), false);
limited = false; allowed = false;
assert.equal((await adminPost("login", { email: "other@example.com", password: "test-password" })).status, 401);
assert.equal(calls.at(-1).name, "signOut");
allowed = true; loginError = { message: "bad password" };
const invalidLogin = await adminPost("login", { email: "admin@example.com", password: "wrong" });
assert.equal(invalidLogin.status, 401);
assert.ok(!(await invalidLogin.text()).includes("bad password"));
loginError = null;
assert.equal((await adminPost("login", { email: "admin@example.com", password: "test-password" })).status, 200);
assert.equal((await adminPost("recovery", { email: "unknown@example.com", redirectTo: "https://attacker.example" })).status, 200);
assert.equal(calls.findLast(call => call.name === "recovery").args[1].redirectTo, `${origin}/auth/callback`);
assert.equal((await adminPost("password", { password: "long-new-password", confirm: "different-password" })).status, 400);
assert.equal((await adminPost("password", { password: "long-new-password", confirm: "long-new-password" })).status, 200);
assert.equal(calls.at(-1).args.scope, "global");
assert.equal((await adminPost("logout", {})).status, 200);
assert.equal(calls.at(-1).args.scope, "global");
console.log("Comments: native form, submission without external verification, honeypot, origin, validation, cookies, rate limits, authorization, recovery and moderation checks passed.");
