import { useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { MERCHANTS, OUTSIDE_METHODS, methodLabel, type PayMethod } from "@/modules/ui/lib/sandbox";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

const box: React.CSSProperties = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20 };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * The test checkout: pick a sandbox merchant, an amount and a card, and see what a real checkout would say. Outside
 * cards are sample cards checked against the merchant's rule; Digna cards also follow their caps and the wallet.
 */
export function CheckoutScreen(props: { onAskAssistant?: (question: string) => void; onCreateCard?: () => void }) {
  const { cards, payments, pay, balance, mode } = usePayProxy();
  const [merchantId, setMerchantId] = useState(MERCHANTS[0].id);
  const merchant = MERCHANTS.find((m) => m.id === merchantId)!;
  const [amount, setAmount] = useState((merchant.suggestCents / 100).toFixed(2));
  const usable = cards.filter((c) => c.status !== "closed");
  const [method, setMethod] = useState<string>("chime_debit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ result: "approved" | "declined"; reason: string | null; merchant: string; amountCents: number; label: string } | null>(null);

  function pickMerchant(id: string): void {
    setMerchantId(id);
    setAmount((MERCHANTS.find((m) => m.id === id)!.suggestCents / 100).toFixed(2));
    setLast(null);
  }

  async function onPay(): Promise<void> {
    setError(null);
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0 || cents > 500000) return setError("Enter an amount between $0.01 and $5,000.");
    const isCard = method.startsWith("card:");
    const cardId = isCard ? method.slice(5) : null;
    const payMethod: PayMethod = isCard ? "payproxy" : (method as PayMethod);
    setBusy(true);
    try {
      const out = await pay(merchantId, cents, payMethod, cardId);
      setLast({ ...out, merchant: merchant.name, amountCents: cents, label: methodLabel(payMethod, cards.find((c) => c.id === cardId)?.name) });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "The payment couldn't be tried. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: typography.body, color: colors.ink }}>
      <header>
        <h1 style={{ fontFamily: typography.heading, fontSize: 30, margin: "0 0 6px" }}>Test checkout</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6, maxWidth: 680 }}>
          Try paying the kinds of places that turn away debit and prepaid cards. Pick a merchant, an amount and a card, then press Pay. Sample money only: no real card, bank or merchant is contacted.
        </p>
      </header>

      <section aria-label="Merchant" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>1. Where are you paying?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {MERCHANTS.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === merchantId} onClick={() => pickMerchant(m.id)}
              style={{ textAlign: "left", padding: 14, borderRadius: 12, cursor: "pointer", fontFamily: typography.body, background: m.id === merchantId ? "#FFF3D6" : colors.surface, border: `2px solid ${m.id === merchantId ? colors.mint : colors.line}` }}>
              <strong style={{ display: "block", fontSize: 16, color: colors.ink }}>{m.name}</strong>
              <span style={{ fontSize: 13, color: colors.muted }}>{m.kind}</span>
            </button>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14, color: colors.muted }}>
          <strong style={{ color: colors.ink }}>Its rule:</strong> {merchant.rule} Sample merchant; real checkouts' rules vary.
        </p>
      </section>

      <section aria-label="Amount and card" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>2. How much, and with which card?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
            Amount (USD)
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
            Card
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16, background: colors.surface }}>
              <optgroup label="Your everyday cards (samples)">
                {OUTSIDE_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label} · {m.kind}</option>
                ))}
              </optgroup>
              <optgroup label="Your Digna capped cards">
                {usable.map((c) => (
                  <option key={c.id} value={`card:${c.id}`}>{c.name} ···· {c.last4} · {money(c.capCents - c.spentCents)} left{c.status === "frozen" ? " · frozen" : ""}</option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
        {usable.length === 0 && (
          <p style={{ margin: "12px 0 0", fontSize: 14, color: colors.muted }}>
            You have no Digna cards yet.{" "}
            <button type="button" onClick={props.onCreateCard} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Make a capped card</button>
            , then come back.
          </p>
        )}
        <p style={{ margin: "12px 0 0", fontSize: 14, color: colors.muted }}>Wallet: {money(balance.availableCents)} sample money{mode === "demo" ? " (demo)" : ""}.</p>
        {error && <p role="alert" style={{ color: "#B42318", margin: "12px 0 0" }}>{error}</p>}
        <button type="button" onClick={onPay} disabled={busy} style={{ marginTop: 16, background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "14px 28px", fontWeight: 700, fontSize: 16, cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Paying…" : `Pay ${merchant.name}`}
        </button>
      </section>

      {last && (
        <section role="status" aria-label="Result" style={{ ...box, borderColor: last.result === "approved" ? "#12B76A" : "#F4B4AE", background: last.result === "approved" ? "#F0FBF7" : "#FFF5F4" }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 22, margin: "0 0 6px" }}>{last.result === "approved" ? "Approved. Your money's good here." : "Declined"}</h2>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {money(last.amountCents)} at {last.merchant} with your {last.label}. {last.reason ?? "It went through."}
          </p>
          {last.result === "declined" && props.onAskAssistant && (
            <button type="button" onClick={() => props.onAskAssistant?.(`Why was my ${money(last.amountCents)} payment to ${last.merchant} with my ${last.label} declined, and what should I do?`)}
              style={{ marginTop: 12, background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.pill, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
              Ask the money assistant why
            </button>
          )}
        </section>
      )}

      <section aria-label="Recent tries" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>Your recent tries</h2>
        {payments.length === 0 ? (
          <p style={{ margin: 0, color: colors.muted }}>Nothing yet. Your tries show here, approved or declined.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {payments.slice(0, 20).map((p) => (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: `1px solid ${colors.line}` }}>
                <span>
                  <strong>{p.merchant}</strong> · {methodLabel(p.method, cards.find((c) => c.id === p.cardId)?.name)}
                  {p.reason && <span style={{ display: "block", fontSize: 13, color: colors.muted }}>{p.reason}</span>}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 700, color: p.result === "approved" ? "#067647" : "#B42318" }}>
                  {money(p.amountCents)} · {p.result}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
