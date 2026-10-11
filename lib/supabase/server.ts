import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return { url, key };
}

export async function sessionClient() {
  const store = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: values => {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes them. */ }
      },
    },
  });
}

export function publicClient() {
  const { url, key } = supabaseConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function serviceClient() {
  const { url } = supabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Supabase server key is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function adminSession() {
  const client = await sessionClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const { data: allowed, error: permissionError } = await client.rpc("is_museum_admin");
  return !permissionError && allowed === true ? { client, user } : null;
}
