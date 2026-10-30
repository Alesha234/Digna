/**
 * session-helpers.ts
 *
 * Returns the current Supabase session user without exposing service-role credentials.
 *
 * - Uses only the anon/auth session (getUser / getSession access_token).
 * - Never returns, logs, or forwards refresh_token or service-role keys.
 * - Never throws; returns null on any error.
 *
 * Callers must use require-user to block unauthenticated
 * dashboard / card / funding / history / scan / settings actions,
 * and rely on RLS for owner scope.
 */

type SupabaseClientLike = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string | null } | null };
    }>;
    getSession: () => Promise<{
      data: { session: { access_token: string } | null };
    }>;
  };
};

export async function getSessionUser(
  client: SupabaseClientLike
): Promise<{ id: string; email: string | null } | null> {
  try {
    const result: {
      data: { user: { id: string; email?: string | null } | null };
    } = await client.auth.getUser();
    const user: { id: string; email?: string | null } | null =
      result.data.user;
    if (user === null || typeof user.id !== "string" || user.id.length === 0) {
      return null;
    }
    return {
      id: user.id,
      email: typeof user.email === "string" ? user.email : null,
    };
  } catch {
    return null;
  }
}

export async function getSessionAccessToken(
  client: SupabaseClientLike
): Promise<string | null> {
  try {
    const result: {
      data: { session: { access_token: string } | null };
    } = await client.auth.getSession();
    const token: string | undefined = result.data.session?.access_token;
    if (typeof token !== "string" || token.length === 0) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}
