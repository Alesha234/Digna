import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/** The app's own Supabase project (its URL and publishable key come from the host's settings), or null when unset. */
export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  return client;
}

/** The signed-in person's access token, for the app's own server (the AI step), or null. */
export async function accessToken(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Supabase's and the database's words, made plain for a person. */
export function plainError(e: unknown): string {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  if (/Invalid login credentials/i.test(msg)) return "That email and password don't match an account. Check them, or create an account.";
  if (/User already registered/i.test(msg)) return "There's already an account with that email. Sign in instead.";
  if (/Email not confirmed/i.test(msg)) return "Confirm your email first: open the link Supabase sent you, then sign in.";
  if (/Password should be at least/i.test(msg)) return "Use a password of at least 6 characters.";
  if (/rate limit/i.test(msg)) return "Too many tries just now. Wait a minute and try again.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Couldn't reach Digna's server. Check your connection and try again.";
  return msg.length > 0 && msg.length < 200 ? msg : "Something went wrong. Try again.";
}
