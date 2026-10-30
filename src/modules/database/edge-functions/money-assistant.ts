import { AssistantQuerySchema, DeclineExplanationSchema } from "@/modules/security/assistant-schemas";
import type { AssistantQueryInput, DeclineExplanationInput } from "@/modules/security/assistant-schemas";
import { requireUser, requireUserId } from "@/modules/security/require-user";
import { assertCardOwner, assertTransactionOwner } from "@/modules/security/ownership-guards";
import { trimAndCollapseSpaces, isValidStoreName } from "@/modules/security/text-validation";

type DeclineContext = {
  storeName: string;
  amountCents: number;
  declineReason: string;
  capCents: number;
};

type BuildPromptInput = AssistantQueryInput & DeclineContext;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string {
  try {
    const d = (globalThis as unknown as { Deno?: { env?: { get: (k: string) => string | undefined } } }).Deno?.env;
    return d?.get(name) ?? "";
  } catch {
    return "";
  }
}

function toOwnerRecord(row: { user_id?: unknown; userId?: unknown }) {
  const raw: unknown = row.user_id ?? row.userId ?? null;
  return { userId: typeof raw === "string" ? raw : "" };
}

function supabaseHeaders(token: string, apiKey: string): Record<string, string> {
  return {
    apikey: apiKey,
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}

export function buildDeclinePrompt(input: BuildPromptInput) {
  const question: string = trimAndCollapseSpaces(input.question).slice(0, 500);
  const store: string = isValidStoreName(input.storeName) ? trimAndCollapseSpaces(input.storeName) : "that store";
  const reason: string = trimAndCollapseSpaces(input.declineReason).slice(0, 200) || "unknown reason";
  const dollars: string = (input.amountCents / 100).toFixed(2);
  const capDollars: string = (input.capCents / 100).toFixed(2);
  return (
    "You are a helpful money assistant. Explain in plain words why a test-mode card payment was declined. " +
    "No real money moved. Store: " +
    store +
    ". Amount: $" +
    dollars +
    ". Card cap: $" +
    capDollars +
    ". Decline reason: " +
    reason +
    ". User question: " +
    question +
    ". Reply with a short plain-words explanation and 2 to 3 next steps."
  );
}

export function sanitizeAssistantOutput(raw: string) {
  if (typeof raw !== "string") return "";
  let out: string = raw.replace(/<script[\s\S]*?<\/script\s*>/gi, " ");
  out = out.replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, " ");
  out = out.replace(/<[^>]*>/g, " ");
  out = out.replace(/javascript\s*:/gi, " ");
  out = trimAndCollapseSpaces(out);
  if (out.length > 2000) out = out.slice(0, 2000).trim();
  return out;
}

export async function handleMoneyAssistant(req: Request) {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  const supabaseUrl: string = getEnv("SUPABASE_URL");
  const anonKey: string = getEnv("SUPABASE_ANON_KEY");
  const serviceKey: string = getEnv("SUPABASE_SERVICE_ROLE_KEY") || anonKey;
  const authHeader: string = req.headers.get("Authorization") ?? "";
  const token: string = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  async function makeClientFor(tokenValue: string) {
    return {
      auth: {
        getUser: async () => {
          if (!supabaseUrl || !tokenValue) return { data: { user: null } };
          try {
            const r = await fetch(supabaseUrl + "/auth/v1/user", {
              headers: { apikey: anonKey, Authorization: "Bearer " + tokenValue },
            });
            if (!r.ok) return { data: { user: null } };
            const j = (await r.json()) as { id?: string; email?: string | null };
            if (!j || typeof j.id !== "string") return { data: { user: null } };
            return { data: { user: { id: j.id, email: j.email ?? null } } };
          } catch {
            return { data: { user: null } };
          }
        },
      },
    };
  }

  let userId: string = "";
  try {
    const client = await makeClientFor(token);
    const user = await requireUser(client);
    userId = user.id;
    const checked: string = await requireUserId(client);
    if (checked !== userId) userId = checked;
  } catch {
    return jsonResponse({ error: "Please sign in to continue." }, 401);
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const parsed = AssistantQuerySchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return jsonResponse({ error: "Invalid request.", errors: errors }, 400);
  }
  const query: AssistantQueryInput = parsed.data;
  const transactionId: string | null = query.transactionId ?? null;
  const cardId: string | null = query.cardId ?? null;
  const question: string = trimAndCollapseSpaces(query.question);
  if (!transactionId) {
    return jsonResponse({ error: "That payment was not found." }, 400);
  }

  DeclineExplanationSchema.safeParse({
    transactionId: transactionId,
    cardId: cardId,
    question: question || "Why was this declined?",
  } as DeclineExplanationInput);

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
  }
  const dbHeaders: Record<string, string> = supabaseHeaders(serviceKey, serviceKey);

  try {
    const txnRes = await fetch(
      supabaseUrl + "/rest/v1/transactions?id=eq." + encodeURIComponent(transactionId) + "&select=id,user_id,store_name,amount_cents,decline_reason,created_at,card_id&limit=1",
      { headers: dbHeaders }
    );
    if (!txnRes.ok) return jsonResponse({ error: "That payment was not found." }, 403);
    const txnRows = (await txnRes.json()) as Array<{
      id: string;
      user_id: string;
      store_name: string | null;
      amount_cents: number | null;
      decline_reason: string | null;
      created_at: string | null;
      card_id: string | null;
    }>;
    const txn = txnRows[0] ?? null;
    if (!txn) return jsonResponse({ error: "That payment was not found." }, 403);
    try {
      assertTransactionOwner(userId, toOwnerRecord({ user_id: txn.user_id }));
    } catch {
      return jsonResponse({ error: "That payment was not found." }, 403);
    }

    let effectiveCardId: string | null = cardId ?? (typeof txn.card_id === "string" ? txn.card_id : null);
    let cardName: string = "your card";
    let capCents: number = 0;
    let spentCents: number = 0;

    if (effectiveCardId) {
      const cardRes = await fetch(
        supabaseUrl + "/rest/v1/virtual_cards?id=eq." + encodeURIComponent(effectiveCardId) + "&select=id,user_id,name,cap_cents,spent_cents,status&limit=1",
        { headers: dbHeaders }
      );
      if (!cardRes.ok) return jsonResponse({ error: "That card was not found." }, 403);
      const cardRows = (await cardRes.json()) as Array<{
        id: string;
        user_id: string;
        name: string | null;
        cap_cents: number | null;
        spent_cents: number | null;
        status: string | null;
      }>;
      const card = cardRows[0] ?? null;
      if (!card) return jsonResponse({ error: "That card was not found." }, 403);
      try {
        assertCardOwner(userId, toOwnerRecord({ user_id: card.user_id }));
      } catch {
        return jsonResponse({ error: "That card was not found." }, 403);
      }
      cardName = trimAndCollapseSpaces(card.name ?? "") || "your card";
      capCents = typeof card.cap_cents === "number" ? card.cap_cents : 0;
      spentCents = typeof card.spent_cents === "number" ? card.spent_cents : 0;
    }

    const rawStore: string = trimAndCollapseSpaces(txn.store_name ?? "");
    const storeName: string = isValidStoreName(rawStore) ? rawStore : "that store";
    const amountCents: number = typeof txn.amount_cents === "number" ? txn.amount_cents : 0;
    const declineReason: string = trimAndCollapseSpaces(txn.decline_reason ?? "") || "declined by test-mode checks";

    const prompt: string = buildDeclinePrompt({
      question: question,
      cardId: effectiveCardId,
      transactionId: transactionId,
      storeName: storeName,
      amountCents: amountCents,
      declineReason: declineReason,
      capCents: capCents,
    });

    const sparkUrl: string = getEnv("LLAMA_SPARK_URL");
    const sparkKey: string = getEnv("LLAMA_SPARK_KEY");
    if (!sparkUrl || !sparkKey) {
      return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
    }

    let aiText: string = "";
    try {
      const aiRes = await fetch(sparkUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + sparkKey },
        body: JSON.stringify({ prompt: prompt, max_tokens: 400 }),
      });
      if (!aiRes.ok) {
        return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
      }
      const aiJson = (await aiRes.json()) as { text?: unknown; output?: unknown; explanation?: unknown };
      const candidate: unknown = aiJson.text ?? aiJson.output ?? aiJson.explanation ?? "";
      aiText = sanitizeAssistantOutput(typeof candidate === "string" ? candidate : JSON.stringify(candidate ?? ""));
    } catch {
      return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
    }
    if (!aiText) {
      return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
    }

    const explanation: string = aiText.slice(0, 1000);
    const nextSteps: string[] =
      capCents > 0 && amountCents > capCents - spentCents
        ? ["Lower the amount or split the test payment.", "Raise the " + cardName + " cap and retry in test mode."]
        : ["Check the decline reason and retry in test mode.", "Try a different test card or store."];

    const userContent: string = trimAndCollapseSpaces(question).slice(0, 500) || "Why was this declined?";
    const assistantContent: string = trimAndCollapseSpaces(explanation + " Next: " + nextSteps.join(" ")).slice(0, 2000);

    const insertRes = await fetch(supabaseUrl + "/rest/v1/assistant_messages", {
      method: "POST",
      headers: { ...dbHeaders, Prefer: "return=representation" },
      body: JSON.stringify([
        { user_id: userId, transaction_id: transactionId, role: "user", content: userContent },
        { user_id: userId, transaction_id: transactionId, role: "assistant", content: assistantContent },
      ]),
    });
    if (!insertRes.ok) {
      return jsonResponse({ explanation: explanation, nextSteps: nextSteps, messageId: null }, 200);
    }
    const inserted = (await insertRes.json()) as Array<{ id?: string }>;
    const assistantRow = inserted.find((r: { id?: string }) => typeof r.id === "string") ?? inserted[1] ?? inserted[0] ?? null;
    const messageId: string | null =
      assistantRow && typeof assistantRow.id === "string" ? assistantRow.id : null;

    return jsonResponse({ explanation: explanation, nextSteps: nextSteps, messageId: messageId }, 200);
  } catch {
    return jsonResponse({ error: "Assistant is unavailable. Please try again later." }, 502);
  }
}
