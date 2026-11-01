import { AssistantQuerySchema, DeclineExplanationSchema } from "@/modules/security/assistant-schemas";
import type { AssistantQueryInput, DeclineExplanationInput } from "@/modules/security/assistant-schemas";
import { requireUser, requireUserId } from "@/modules/security/require-user";
import { assertCardOwner, assertTransactionOwner } from "@/modules/security/ownership-guards";
import { trimAndCollapseSpaces, isValidStoreName } from "@/modules/security/text-validation";

/** Meta's Model API, reached with the owner's META_API_KEY. Muse Spark is the only AI this function uses. */
const META_MODEL_API = "https://api.meta.ai/v1/chat/completions";
const META_MODEL = "muse-spark-1.3";

type DeclineContext = {
  storeName: string;
  amountCents: number;
  declineReason: string;
  capCents: number;
};

type DeclineFacts = DeclineContext & {
  cardName: string;
  cardStatus: string;
  spentCents: number;
  balanceCents: number | null;
  endDate: string | null;
  occurredAt: string;
};

type BuildPromptInput = AssistantQueryInput & DeclineContext & {
  cardName?: string;
  cardStatus?: string;
  spentCents?: number;
  balanceCents?: number | null;
  occurredAt?: string;
};

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

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function plainDay(iso: string): string {
  if (!iso) return "recently";
  try {
    const d: Date = new Date(iso);
    if (Number.isNaN(d.getTime())) return "recently";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

export function buildDeclinePrompt(input: BuildPromptInput) {
  const question: string = trimAndCollapseSpaces(input.question).slice(0, 500);
  const store: string = isValidStoreName(input.storeName) ? trimAndCollapseSpaces(input.storeName) : "that place or business";
  const reason: string = trimAndCollapseSpaces(input.declineReason).slice(0, 200) || "unknown reason";
  const cardName: string = trimAndCollapseSpaces(input.cardName ?? "") || "their card";
  const cardStatus: string = trimAndCollapseSpaces(input.cardStatus ?? "") || "unknown status";
  const spent: string = typeof input.spentCents === "number" ? dollars(input.spentCents) : "unknown";
  const balance: string = typeof input.balanceCents === "number" ? dollars(input.balanceCents) : "unknown";
  return (
    "You are Digna's money assistant. Digna uses practice money only: no real card, bank, or business is involved, and no real money moves. " +
    "Explain in plain, friendly, everyday words why a practice-money card payment was declined. " +
    "Use only these facts, and only plain words (place or business, limit, practice money, Try paying): " +
    "place or business: " + store +
    ". Amount: $" + dollars(input.amountCents) +
    ". Date: " + plainDay(input.occurredAt ?? "") +
    ". Card: " + cardName + ", status " + cardStatus +
    ". Card limit: $" + dollars(input.capCents) +
    ". Already spent on the card: $" + spent +
    ". Practice money in the wallet: $" + balance +
    ". Saved decline reason: " + reason +
    ". Person's question: " + question +
    ". Reply in 2 to 5 short sentences: why it happened, and exactly one concrete next step " +
    "(turn the card back on, raise the limit, add practice money, or make a new card). " +
    "Never invent a reason the facts above do not support; if the facts do not pin down the reason, say what to check instead (the card's status, what is left of its limit, and the money in the wallet)."
  );
}

/**
 * The deterministic fallback: the same plain-words explanation built only from the
 * saved transaction and card facts, used whenever Muse Spark or META_API_KEY is unavailable.
 * It never invents a reason; when the facts do not pin one down, it says what to check.
 */
export function buildLocalDeclineExplanation(facts: DeclineFacts): { explanation: string; nextSteps: string[] } {
  const amount: string = "$" + dollars(facts.amountCents);
  const when: string = plainDay(facts.occurredAt);
  const reason: string = facts.declineReason.toLowerCase();
  const status: string = facts.cardStatus.toLowerCase();
  let expiredByDate: boolean = false;
  try {
    if (facts.endDate) {
      expiredByDate = new Date(facts.endDate).getTime() < Date.now() - 86400000;
    }
  } catch {
    expiredByDate = false;
  }
  let cause: string | null = null;
  let next: string = "Open the \"" + facts.cardName + "\" card and check whether it is paused, what is left of its limit, and the money in the wallet, then try the " + amount + " payment at " + facts.storeName + " again.";
  if (status === "frozen" || reason.includes("frozen") || reason.includes("paus")) {
    cause = "the \"" + facts.cardName + "\" card is paused or frozen";
    next = "Turn the \"" + facts.cardName + "\" card back on from the dashboard, then try the " + amount + " payment at " + facts.storeName + " again.";
  } else if (status === "closed" || reason.includes("closed")) {
    cause = "the \"" + facts.cardName + "\" card is closed";
    next = "Make a new card for " + facts.storeName + " and try the " + amount + " payment again.";
  } else if (expiredByDate || reason.includes("expir") || reason.includes("passed the day")) {
    cause = "the \"" + facts.cardName + "\" card has expired";
    next = "Make a new card for " + facts.storeName + " with a later date and try the " + amount + " payment again.";
  } else if (facts.capCents > 0 && facts.spentCents + facts.amountCents > facts.capCents) {
    cause = "it was over the limit on \"" + facts.cardName + "\": only $" + dollars(Math.max(0, facts.capCents - facts.spentCents)) + " was left of its $" + dollars(facts.capCents) + " limit";
    next = "Raise the limit on \"" + facts.cardName + "\" as far as the practice money in the wallet covers, then try the " + amount + " payment at " + facts.storeName + " again. Or make a new card just for " + facts.storeName + ".";
  } else if (
    reason.includes("limit") || reason.includes("over") ||
    (facts.balanceCents !== null && facts.balanceCents < facts.amountCents) ||
    reason.includes("wallet") || reason.includes("enough money") || reason.includes("add money") || reason.includes("balance")
  ) {
    if (reason.includes("limit") || reason.includes("over") || (facts.capCents > 0 && facts.spentCents + facts.amountCents > facts.capCents)) {
      cause = "it was over the limit on \"" + facts.cardName + "\"";
      next = "Raise the limit on \"" + facts.cardName + "\" as far as the practice money in the wallet covers, then try the " + amount + " payment at " + facts.storeName + " again. Or make a new card just for " + facts.storeName + ".";
    } else {
      cause = "the practice money in the wallet was too low for the " + amount + " payment";
      next = "Add practice money from the dashboard, then try " + facts.storeName + " again.";
    }
  }
  let explanation: string;
  if (cause) {
    explanation = "That " + amount + " payment at " + facts.storeName + " on " + when + " was declined because " + cause + ". Digna said no to protect you from spending more than you planned. Next step: " + next;
  } else {
    explanation = "That " + amount + " payment at " + facts.storeName + " on " + when + " was declined, but the saved details do not pin down why. Next step: " + next;
  }
  return { explanation: explanation, nextSteps: [next] };
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

async function askMuseSpark(prompt: string): Promise<string> {
  const metaKey: string = getEnv("META_API_KEY");
  if (!metaKey) return "";
  try {
    const aiRes = await fetch(META_MODEL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + metaKey },
      body: JSON.stringify({ model: META_MODEL, max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    if (!aiRes.ok) return "";
    const aiJson = (await aiRes.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
      text?: unknown;
      output?: unknown;
      explanation?: unknown;
    };
    const fromChoices: unknown = aiJson.choices?.[0]?.message?.content;
    const candidate: unknown = typeof fromChoices === "string" ? fromChoices : (aiJson.text ?? aiJson.output ?? aiJson.explanation ?? "");
    const clean: string = sanitizeAssistantOutput(typeof candidate === "string" ? candidate : JSON.stringify(candidate ?? ""));
    return clean;
  } catch {
    return "";
  }
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
    return jsonResponse({ error: "Please try again in a moment." }, 502);
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
    let cardStatus: string = "active";
    let capCents: number = 0;
    let spentCents: number = 0;
    let endDate: string | null = null;

    if (effectiveCardId) {
      const cardRes = await fetch(
        supabaseUrl + "/rest/v1/virtual_cards?id=eq." + encodeURIComponent(effectiveCardId) + "&select=id,user_id,name,cap_cents,spent_cents,status,end_date&limit=1",
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
        end_date: string | null;
      }>;
      const card = cardRows[0] ?? null;
      if (!card) return jsonResponse({ error: "That card was not found." }, 403);
      try {
        assertCardOwner(userId, toOwnerRecord({ user_id: card.user_id }));
      } catch {
        return jsonResponse({ error: "That card was not found." }, 403);
      }
      cardName = trimAndCollapseSpaces(card.name ?? "") || "your card";
      cardStatus = typeof card.status === "string" && card.status ? card.status : "active";
      capCents = typeof card.cap_cents === "number" ? card.cap_cents : 0;
      spentCents = typeof card.spent_cents === "number" ? card.spent_cents : 0;
      endDate = typeof card.end_date === "string" ? card.end_date : null;
    }

    let balanceCents: number | null = null;
    try {
      const walletRes = await fetch(
        supabaseUrl + "/rest/v1/wallets?user_id=eq." + encodeURIComponent(userId) + "&select=balance_cents&limit=1",
        { headers: dbHeaders }
      );
      if (walletRes.ok) {
        const walletRows = (await walletRes.json()) as Array<{ balance_cents: number | null }>;
        const first = walletRows[0] ?? null;
        if (first && typeof first.balance_cents === "number") balanceCents = first.balance_cents;
      }
    } catch {
      balanceCents = null;
    }

    const rawStore: string = trimAndCollapseSpaces(txn.store_name ?? "");
    const storeName: string = isValidStoreName(rawStore) ? rawStore : "that place or business";
    const amountCents: number = typeof txn.amount_cents === "number" ? txn.amount_cents : 0;
    const declineReason: string = trimAndCollapseSpaces(txn.decline_reason ?? "") || "the saved details do not say why";
    const occurredAt: string = typeof txn.created_at === "string" ? txn.created_at : "";

    const facts: DeclineFacts = {
      storeName: storeName,
      amountCents: amountCents,
      declineReason: declineReason,
      capCents: capCents,
      cardName: cardName,
      cardStatus: cardStatus,
      spentCents: spentCents,
      balanceCents: balanceCents,
      endDate: endDate,
      occurredAt: occurredAt,
    };

    const prompt: string = buildDeclinePrompt({
      question: question,
      cardId: effectiveCardId,
      transactionId: transactionId,
      storeName: storeName,
      amountCents: amountCents,
      declineReason: declineReason,
      capCents: capCents,
      cardName: cardName,
      cardStatus: cardStatus,
      spentCents: spentCents,
      balanceCents: balanceCents,
      occurredAt: occurredAt,
    });

    // Deterministic plain-words answer from the same facts, used whenever Muse Spark cannot answer.
    const local = buildLocalDeclineExplanation(facts);
    let explanation: string = local.explanation;
    const aiText: string = await askMuseSpark(prompt);
    if (aiText) {
      explanation = aiText.slice(0, 1000);
    }
    const nextSteps: string[] = local.nextSteps;

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
    return jsonResponse({ error: "Please try again in a moment." }, 502);
  }
}
