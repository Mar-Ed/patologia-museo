// Read-only: never prints keys, tokens, passwords or the list of users.
const { NEXT_PUBLIC_SUPABASE_URL: rawUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey, SUPABASE_SECRET_KEY: secret } = process.env;
const expectedEmail = 'museodepatologiaveterinaria@gmail.com';
try {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || !publicKey || !secret) throw new Error('configuration');
  const settings = await fetch(`${url.origin}/auth/v1/settings`, { headers: { apikey: publicKey }, signal: AbortSignal.timeout(15000) });
  const users = await fetch(`${url.origin}/auth/v1/admin/users?page=1&per_page=50`, { headers: { apikey: secret, Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(15000) });
  if (!settings.ok || !users.ok) {
    console.log(JSON.stringify({ connected: false, settingsStatus: settings.status, adminStatus: users.status }));
    process.exitCode = 1;
  } else {
    const config = await settings.json();
    const data = await users.json();
    const admin = data.users?.find(user => user.email?.toLowerCase() === expectedEmail);
    console.log(JSON.stringify({ connected: true, expectedAdminFound: Boolean(admin), adminId: admin?.id, emailConfirmed: Boolean(admin?.email_confirmed_at), publicSignupDisabled: config.disable_signup, anonymousUsersEnabled: config.external?.anonymous_users }, null, 2));
    if (!admin) process.exitCode = 1;
    const schema = await fetch(`${url.origin}/rest/v1/rpc/list_museum_comments`, {
      method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: '__configuration_check__', p_limit: 1 }), signal: AbortSignal.timeout(15000),
    });
    console.log(JSON.stringify({ commentsSchemaReady: schema.ok, schemaStatus: schema.status }));
    if (!schema.ok) process.exitCode = 1;
    const threads = await fetch(`${url.origin}/rest/v1/rpc/list_museum_comments_v2`, {
      method: 'POST', headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: '__configuration_check__', p_visitor_hash: '0'.repeat(64), p_limit: 1 }), signal: AbortSignal.timeout(15000),
    });
    const threadResult = await threads.json();
    console.log(JSON.stringify({ likesAndRepliesReady: threads.ok, threadsStatus: threads.status, ...(threads.ok ? {} : { errorCode: threadResult.code }) }));
    if (!threads.ok) process.exitCode = 1;
  }
} catch {
  console.error('Connection check failed: verify configuration or network access. No credentials were printed.');
  process.exitCode = 1;
}
