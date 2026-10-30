import { getSessionUser } from "@/modules/security/session-helpers";

type SupabaseClientLike = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>;
  };
};

type SessionHelperClient = Parameters<typeof getSessionUser>[0];

export async function requireUser(client: SupabaseClientLike): Promise<{ id: string; email: string | null }> {
  let user: { id: string; email: string | null } | null;
  try {
    user = await getSessionUser(client as unknown as SessionHelperClient);
  } catch {
    throw new Error("Please sign in to continue.");
  }
  if (user === null) {
    throw new Error("Please sign in to continue.");
  }
  return { id: user.id, email: user.email };
}

export async function requireUserId(client: SupabaseClientLike): Promise<string> {
  const user = await requireUser(client);
  return user.id;
}
