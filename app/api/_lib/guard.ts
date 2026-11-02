import { createClient } from "@supabase/supabase-js";

/**
 * What every Meta call on Digna's server checks first (Nov 2, 2026): a signed-in person, and a daily limit per person
 * and for the whole site, so nobody can run up the owner's Meta bill. Kept in memory, like the AI route's limits.
 */
export const fail = (status: number, error: string) => Response.json({ error }, { status });

export function metaKey(): string | null {
  return process.env.MUSE_SPARK_API_KEY || process.env.META_API_KEY || null;
}

/** The signed-in person behind a request's Bearer token, or null. */
export async function signedInUser(req: Request): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!url || !anon || !token) return null;
  const { data, error } = await createClient(url, anon).auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id };
}

const buckets = new Map<string, { used: Map<string, { day: string; n: number }>; site: { day: string; n: number } }>();

/** Counts one use against a person's and the site's daily limits; null when allowed (with a way to give it back), else the refusal. */
export function dailyGate(bucket: string, userId: string, perPerson: number, perSite: number): { refusal: Response } | { giveBack: () => void } {
  const b = buckets.get(bucket) ?? { used: new Map(), site: { day: "", n: 0 } };
  buckets.set(bucket, b);
  const day = new Date().toISOString().slice(0, 10);
  const before = b.used.get(userId);
  const n = before && before.day === day ? before.n : 0;
  if (n >= perPerson) return { refusal: fail(429, `That's today's ${perPerson} for you. Try again tomorrow.`) };
  if (b.site.day !== day) Object.assign(b.site, { day, n: 0 });
  if (b.site.n >= perSite) return { refusal: fail(429, "Digna's AI is resting for today: lots of people asked. Try again tomorrow.") };
  b.used.set(userId, { day, n: n + 1 });
  b.site.n += 1;
  return {
    giveBack: () => {
      const now = b.used.get(userId);
      if (now && now.day === day && now.n > 0) now.n -= 1;
      if (b.site.day === day && b.site.n > 0) b.site.n -= 1;
    },
  };
}
