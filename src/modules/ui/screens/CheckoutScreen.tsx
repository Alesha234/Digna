import { useEffect, useRef, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import {
  MERCHANTS,
  PRACTICE_WALLET,
  brandOf,
  formProblem,
  formatCardNumber,
  methodLabel,
  digitsOnly,
  type CheckoutForm,
  type CheckoutOutcome,
} from "@/modules/ui/lib/sandbox";
import type { BillScanResult, PracticeReceipt, VirtualCard } from "@/modules/ui/types";
import { practiceBills } from "@/modules/ui/data/demoData";
import { fallbackPracticeBill, matchPastedBill, practiceScan, readBillViaAi, shrinkToDataUrl } from "@/modules/ui/screens/SnapBillScreen";
import { downloadPracticeReceipt } from "@/modules/ui/components/TransactionList";
import { downloadPracticeReceiptPdf } from "@/modules/ui/lib/practicePdf";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

const box: React.CSSProperties = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20 };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const field: React.CSSProperties = { padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16, width: "100%", boxSizing: "border-box", fontFamily: typography.body, background: "#FFFFFF" };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 };
const pill = (primary: boolean): React.CSSProperties => ({
  background: primary ? colors.mint : colors.surface,
  color: colors.midnight,
  border: primary ? 0 : `1px solid ${colors.line}`,
  borderRadius: radii.pill,
  padding: "10px 18px",
  fontWeight: primary ? 700 : 600,
  fontSize: 14,
  cursor: "pointer",
});

/** What each sample business sells, so its checkout reads like a real one. */
const SHOP: Record<string, { picture: string; button: string; orders: { label: string; cents: number }[] }> = {
  nimbus_cloud: { picture: "cloud", button: "Pay", orders: [{ label: "Starter plan, this month's bill", cents: 3200 }, { label: "Pro plan, this month's bill", cents: 18000 }] },
  harborview_hotel: { picture: "hotel", button: "Place hold of", orders: [{ label: "Deposit hold at check-in, 1 night", cents: 15000 }, { label: "Deposit hold at check-in, 3 nights", cents: 42000 }] },
  roadready_rentals: { picture: "rental", button: "Place hold of", orders: [{ label: "Security deposit, compact car", cents: 20000 }, { label: "Security deposit, SUV", cents: 35000 }] },
  streambox: { picture: "stream", button: "Pay", orders: [{ label: "Monthly plan", cents: 1599 }, { label: "Yearly plan", cents: 15999 }] },
};

const EMPTY: CheckoutForm = { name: "", number: "", exp: "", cvc: "", zip: "" };

/** A sample business's picture by Meta's Muse Image, shown once it has loaded; a soft gradient until then. */
function BizPicture({ name }: { name: string }) {
  const [ok, setOk] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #FFF3D6, #DDEAF3)" }}>
      {mounted && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/picture/${name}?v=2`} alt="" onLoad={() => setOk(true)} onError={() => setOk(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: ok ? 1 : 0, transition: "opacity .4s" }} />
      )}
    </div>
  );
}

function copy(text: string): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {
    /* copying is a convenience only */
  }
}

/** One card in the practice wallet: its details to type in (or copy), and a button that fills them in. */
function WalletCard(props: { title: string; sub: string; number: string; exp: string; cvc: string; dark?: boolean; hidden?: boolean; onUse: () => void }) {
  const [show, setShow] = useState(!props.hidden);
  const ink = props.dark ? "#FFFFFF" : colors.ink;
  const muted = props.dark ? "#C9CFDB" : colors.muted;
  const small: React.CSSProperties = { background: "transparent", border: 0, padding: 0, color: props.dark ? "#FFC94D" : colors.mintDark, fontWeight: 700, fontSize: 12, cursor: "pointer" };
  return (
    <div style={{ borderRadius: 14, padding: 14, background: props.dark ? "linear-gradient(135deg, #0E1726, #17405C)" : colors.page, border: props.dark ? 0 : `1px solid ${colors.line}`, color: ink }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <strong style={{ fontSize: 15 }}>{props.title}</strong>
        <span style={{ fontSize: 12, color: muted }}>{brandOf(props.number)} · {props.sub}</span>
      </div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 15, letterSpacing: 1, margin: "10px 0 6px" }}>
        {show ? formatCardNumber(props.number) : `•••• •••• •••• ${props.number.slice(-4)}`}
        {show && <button type="button" style={{ ...small, marginLeft: 8 }} onClick={() => copy(props.number)} aria-label={`Copy the card number for ${props.title}`}>Copy</button>}
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 13, color: muted, flexWrap: "wrap", alignItems: "center" }}>
        <span>Expires <strong style={{ color: ink }}>{show ? props.exp : "••/••"}</strong></span>
        <span>Code <strong style={{ color: ink }}>{show ? props.cvc : "•••"}</strong></span>
        {props.hidden && <button type="button" style={small} onClick={() => setShow(!show)}>{show ? "Hide" : "Show details"}</button>}
        <button type="button" style={{ ...small, marginLeft: "auto" }} onClick={props.onUse} aria-label={`Fill in ${props.title}`}>Fill in for me</button>
      </div>
    </div>
  );
}

/**
 * "Pay a bill": read a practice bill, then pay at a sample business's own checkout page. People type a card in,
 * the way they would anywhere: one of their Digna cards (its details are on the card's page and in the wallet
 * here) or a sample everyday card from the practice wallet. The database checks the card, its expiry and code,
 * the business's rules, the card's limit and the wallet, then answers like a real checkout, with Digna's
 * plain-words reason and a fix when it says no.
 */
export function CheckoutScreen(props: { onAskAssistant?: (question: string) => void; onCreateCard?: () => void; onAddMoney?: () => void; onMakeCard?: (bill: BillScanResult) => void }) {
  const { cards, payments, balance, mode, checkout, setCardLimit } = usePayProxy();
  const [merchantId, setMerchantId] = useState(MERCHANTS[0].id);
  const merchant = MERCHANTS.find((m) => m.id === merchantId)!;
  const shop = SHOP[merchantId];
  const [orderIx, setOrderIx] = useState(0);
  const amountCents = shop.orders[orderIx].cents;
  const [form, setForm] = useState<CheckoutForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<(CheckoutOutcome & { merchant: string; amountCents: number; receipt: string; at: string; atIso: string }) | null>(null);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [billText, setBillText] = useState("");
  const [billSampleId, setBillSampleId] = useState<string | null>(null);
  const [billBusy, setBillBusy] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [billScan, setBillScan] = useState<BillScanResult | null>(null);
  const [billPractice, setBillPractice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  // The latest checkout, so a retry right after raising a limit uses the raised limit.
  const checkoutRef = useRef(checkout);
  checkoutRef.current = checkout;
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const usable = cards.filter((c) => c.status !== "closed" && c.cardNumber);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  function pickMerchant(id: string): void {
    setMerchantId(id);
    setOrderIx(0);
    setLast(null);
    setError(null);
  }
  function set<K extends keyof CheckoutForm>(k: K, v: string): void {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }
  function fill(number: string, exp: string, cvc: string): void {
    setForm((f) => ({ name: f.name || "Alex Rivera", number: formatCardNumber(number), exp, cvc, zip: f.zip || "10001" }));
    setError(null);
    setLast(null);
  }

  /** Filling the paste box with a practice bill's text, so Meta's Muse Spark reads it back exactly. */
  function choosePracticeBill(id: string): void {
    const found = practiceBills.find((b) => b.id === id);
    if (!found) return;
    setBillSampleId(id);
    setBillText(found.billText);
    setBillImage(null);
    setBillScan(null);
    setBillError(null);
  }

  async function onBillFile(file: File | undefined): Promise<void> {
    if (!file) return;
    const dataUrl = await shrinkToDataUrl(file);
    if (!dataUrl) {
      setBillError("Couldn't open that picture. Try a screenshot (PNG or JPEG), or paste the bill text.");
      return;
    }
    if (dataUrl.length > 2000000) {
      setBillError("That photo is too big. Try a smaller screenshot, or paste the bill text.");
      return;
    }
    setBillImage(dataUrl);
    setBillSampleId(null);
    setBillScan(null);
    setBillError(null);
  }

  /** Meta's Muse Spark reads the bill photo or pasted text; signed out, a practice example shows instead. */
  async function onReadBill(): Promise<void> {
    const pasted = billText.trim();
    if (!billImage && pasted.length < 10) return;
    setBillBusy(true);
    setBillError(null);
    try {
      const out = await readBillViaAi({ image: billImage, text: pasted });
      setBillScan(out.scan);
      setBillPractice(out.practice);
      if (out.practice) {
        setBillError("Sign in to have Meta's Muse Spark read your bill. Showing a practice example instead: a practice bill with its amount as the limit.");
      }
    } catch (e: unknown) {
      const matched = matchPastedBill(pasted) ?? fallbackPracticeBill();
      setBillScan(practiceScan(matched));
      setBillPractice(true);
      setBillError(`${e instanceof Error && e.message ? e.message : "Muse Spark is busy — try again in a moment."} Showing a practice example instead.`);
    } finally {
      setBillBusy(false);
    }
  }

  async function run(f: CheckoutForm, cents: number): Promise<void> {
    setBusy(true);
    setError(null);
    const started = Date.now();
    try {
      const out = await checkoutRef.current(merchantId, cents, f);
      // A real card network takes a moment; so does this one, so the answer doesn't feel instant and fake.
      await new Promise((r) => setTimeout(r, Math.max(0, 1300 - (Date.now() - started))));
      const at = new Date();
      setLast({ ...out, merchant: merchant.name, amountCents: cents, receipt: `DG-${at.getTime().toString(36).toUpperCase().slice(-8)}`, at: at.toLocaleString(), atIso: at.toISOString() });
      if (out.method === "payproxy") {
        // By now the card has been read back after the payment, so what's left is what the database holds.
        const card = cardsRef.current.find((c) => c.id === out.cardId);
        const left = card ? card.capCents - card.spentCents : null;
        setToast(
          out.result === "approved"
            ? `${out.cardName}: ${money(cents)} at ${merchant.name} approved.${left !== null ? ` ${money(Math.max(0, left))} left on this card.` : ""}`
            : `${out.cardName}: ${money(cents)} at ${merchant.name} declined. Tap the checkout to see why.`,
        );
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    } catch (e: unknown) {
      await new Promise((r) => setTimeout(r, Math.max(0, 600 - (Date.now() - started))));
      setError(e instanceof Error ? e.message : "That payment didn't go through on our side. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onPay(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const problem = formProblem({ ...form, exp: form.exp.replace(/\s/g, "") });
    if (problem) return setError(problem);
    setLast(null);
    await run(form, amountCents);
  }

  // The practice receipt for an approved payment, kept with past bills and receipts.
  const receipt: PracticeReceipt | null = last && last.result === "approved"
    ? { id: last.receipt, placeOrBusiness: last.merchant, amountCents: last.amountCents, dueDate: last.atIso.slice(0, 10), paidAt: last.atIso, receiptId: last.receipt, status: "paid" }
    : null;

  // A limit decline on a Digna card can be fixed on the spot, but only if the wallet really has the money.
  const lastCard: VirtualCard | undefined = last?.cardId ? cards.find((c) => c.id === last.cardId) : undefined;
  const raiseTo = last && lastCard && last.code === "over_cap" ? lastCard.spentCents + last.amountCents : null;
  const canRaise = raiseTo !== null && last !== null && raiseTo <= 1_000_000 && last.amountCents <= balance.availableCents;

  async function raiseAndRetry(): Promise<void> {
    if (!last || !lastCard || raiseTo === null) return;
    setBusy(true);
    try {
      await setCardLimit(lastCard.id, raiseTo);
    } catch (e: unknown) {
      setBusy(false);
      return setError(e instanceof Error ? e.message : "The limit couldn't be changed. Try again.");
    }
    const cents = last.amountCents;
    setLast(null);
    await new Promise((r) => setTimeout(r, 0));
    await run(form, cents);
  }

  const brand = brandOf(form.number);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: typography.body, color: colors.ink }}>
      <style>{`.pp-co-grid{display:grid;gap:20px;grid-template-columns:1fr}@media(min-width:900px){.pp-co-grid{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start}}.pp-co-row{display:grid;gap:12px;grid-template-columns:1fr 1fr 1fr}@media(max-width:520px){.pp-co-row{grid-template-columns:1fr 1fr}}@keyframes pp-spin{to{transform:rotate(360deg)}}@keyframes pp-toast{from{transform:translateY(-12px);opacity:0}to{transform:none;opacity:1}}`}</style>

      <header>
        <h1 style={{ fontFamily: typography.heading, fontSize: 30, margin: "0 0 6px" }}>Pay a bill</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6, maxWidth: 720 }}>
          Have a practice bill? Upload a screenshot or photo of it, or paste its text below, and Meta&apos;s Muse Spark reads the amount, the place or business, and the due date. Then pick a place and pay at its checkout just like you would for real, with a card from your wallet on the right. It&apos;s all practice money, so nothing real is charged.
        </p>
      </header>

      <section aria-label="Where you're paying" style={box}>
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
      </section>

      <section aria-label="Your practice bill" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 6px" }}>Your practice bill</h2>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>
          New here? Pick a practice bill to fill the paste box. Or upload a screenshot or photo of your own practice bill. Practice money only: no real money moves.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          {practiceBills.map((bill) => {
            const active = billSampleId === bill.id;
            return (
              <button
                key={bill.id}
                type="button"
                onClick={() => choosePracticeBill(bill.id)}
                aria-pressed={active}
                style={{ ...pill(!active), background: active ? colors.mint : colors.surface }}
              >
                {bill.title} · {money(bill.amountCents)}
              </button>
            );
          })}
        </div>
        <h3 style={{ fontFamily: typography.heading, fontSize: 15, margin: "0 0 8px" }}>A picture of the bill</h3>
        <label style={{ ...pill(false), display: "inline-flex" }}>
          Upload a screenshot or photo
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void onBillFile(e.target.files?.[0])} />
        </label>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: colors.muted }}>On a computer, a screenshot of the bill or its email works best. Pictures are read once and not kept.</p>
        {billImage && <img src={billImage} alt="The bill you added" style={{ marginTop: 12, maxWidth: "100%", maxHeight: 260, borderRadius: 12, border: `1px solid ${colors.line}` }} />}
        <h3 style={{ fontFamily: typography.heading, fontSize: 15, margin: "16px 0 8px" }}>Or paste the bill&apos;s text</h3>
        <textarea
          value={billText}
          onChange={(e) => { setBillText(e.target.value); setBillSampleId(null); setBillScan(null); }}
          rows={5}
          placeholder="Paste the bill or its email here instead of adding a photo"
          aria-label="Paste the bill's text"
          style={{ ...field, minHeight: 110, resize: "vertical" }}
        />
        <button type="button" disabled={billBusy || (!billImage && billText.trim().length < 10)} onClick={() => void onReadBill()} style={{ ...pill(true), marginTop: 10, opacity: billBusy || (!billImage && billText.trim().length < 10) ? 0.6 : 1 }}>
          {billBusy ? "Reading…" : "Read bill"}
        </button>
        {billBusy && <p role="status" style={{ margin: "8px 0 0", fontSize: 14, color: colors.muted }}>Reading the bill…</p>}
        {billError && <p role="alert" style={{ margin: "8px 0 0", fontSize: 14, color: "#B42318" }}>{billError}</p>}
        {billScan && (
          <div role="status" aria-label="What the bill reading found" style={{ marginTop: 14, borderRadius: 14, padding: 18, border: `1px solid ${colors.mint}`, background: "#FFF9EB" }}>
            {billPractice && <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: colors.muted }}>Practice example</p>}
            <h3 style={{ fontFamily: typography.heading, fontSize: 20, margin: "0 0 8px" }}>{billScan.storeName}</h3>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              <strong>{money(billScan.amountCents)}</strong>
              {billScan.dueDate ? ` · due ${billScan.dueDate}` : ""} · {billScan.confidence === "high" ? "read clearly" : billScan.confidence === "medium" ? "mostly clear, worth a check" : "hard to read, please check"}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>
              The place or business is {billScan.storeName}, due{billScan.dueDate ? ` ${billScan.dueDate}` : ""}. A card just for this practice bill would use {money(billScan.amountCents)} as its limit.
            </p>
            {billScan.confidence === "low" && (
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>Please check the amount and due date before making a card.</p>
            )}
            {props.onMakeCard && (
              <button type="button" onClick={() => props.onMakeCard?.(billScan)} style={{ ...pill(true), marginTop: 14 }}>
                Make a card with this limit
              </button>
            )}
          </div>
        )}
      </section>

      <div className="pp-co-grid">
        {/* The business's checkout page */}
        <section aria-label={`${merchant.name} checkout`} style={{ ...box, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "8px 16px", fontSize: 12, color: colors.muted, background: colors.page, borderBottom: `1px solid ${colors.line}` }}>
            Sample business · practice checkout
          </div>
          <div style={{ position: "relative", height: 150 }}>
            <BizPicture name={shop.picture} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,23,38,0) 30%, rgba(14,23,38,0.75))" }} />
            <div style={{ position: "absolute", left: 20, bottom: 14, color: "#FFFFFF" }}>
              <div style={{ fontFamily: typography.heading, fontSize: 24, fontWeight: 700 }}>{merchant.name}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{merchant.kind}</div>
            </div>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontFamily: typography.heading, fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Your order</legend>
              {shop.orders.map((o, i) => (
                <label key={o.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8, borderRadius: 10, cursor: "pointer", border: `1px solid ${i === orderIx ? colors.mint : colors.line}`, background: i === orderIx ? "#FFF9EB" : colors.surface }}>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="radio" name="order" checked={i === orderIx} onChange={() => { setOrderIx(i); setLast(null); }} />
                    {o.label}
                  </span>
                  <strong>{money(o.cents)}</strong>
                </label>
              ))}
              <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.muted }}>
                <strong style={{ color: colors.ink }}>Cards it takes:</strong> {merchant.rule}
              </p>
            </fieldset>

            <form onSubmit={(e) => void onPay(e)} noValidate aria-label="Card details" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: typography.heading, fontSize: 17, margin: 0 }}>Pay by card</h3>
                <span style={{ fontSize: 12, color: colors.muted, display: "flex", gap: 10, alignItems: "baseline" }}>
                  {brand ? `${brand} card` : "Visa · Mastercard"}
                  <a href="#pp-wallet" style={{ color: colors.mintDark, fontWeight: 700 }}>Use a card from your wallet</a>
                </span>
              </div>
              <label style={labelStyle}>
                Name on card
                <input style={field} autoComplete="off" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alex Rivera" />
              </label>
              <label style={labelStyle}>
                Card number
                <input style={{ ...field, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: 1 }} inputMode="numeric" autoComplete="off"
                  value={form.number} onChange={(e) => set("number", formatCardNumber(e.target.value))} placeholder="1234 5678 9012 3456" />
              </label>
              <div className="pp-co-row">
                <label style={labelStyle}>
                  Expiry
                  <input style={field} inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={form.exp}
                    onChange={(e) => {
                      const d = digitsOnly(e.target.value).slice(0, 4);
                      set("exp", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }} />
                </label>
                <label style={labelStyle}>
                  Security code
                  <input style={field} inputMode="numeric" autoComplete="off" placeholder="123" value={form.cvc} onChange={(e) => set("cvc", digitsOnly(e.target.value).slice(0, 4))} />
                </label>
                <label style={labelStyle}>
                  ZIP code
                  <input style={field} inputMode="numeric" autoComplete="off" placeholder="10001" value={form.zip} onChange={(e) => set("zip", digitsOnly(e.target.value).slice(0, 5))} />
                </label>
              </div>
              {error && <p role="alert" style={{ color: "#B42318", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={busy} style={{ background: colors.midnight, color: "#FFFFFF", border: 0, borderRadius: 12, padding: "15px 20px", fontWeight: 700, fontSize: 16, cursor: busy ? "wait" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                {busy ? (
                  <>
                    <span aria-hidden style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#FFFFFF", borderRadius: "50%", animation: "pp-spin .8s linear infinite" }} />
                    Processing…
                  </>
                ) : (
                  `${shop.button} ${money(amountCents)}`
                )}
              </button>
              <p style={{ margin: 0, fontSize: 12, color: colors.muted, textAlign: "center" }}>Practice checkout: no real card is charged.</p>
            </form>

            {last && (
              <div ref={resultRef} role="status" aria-label="Result" style={{ borderRadius: 14, padding: 18, border: `1px solid ${last.result === "approved" ? "#12B76A" : "#F4B4AE"}`, background: last.result === "approved" ? "#F0FBF7" : "#FFF5F4" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span aria-hidden style={{ width: 30, height: 30, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, background: last.result === "approved" ? "#12B76A" : "#D92D20" }}>
                    {last.result === "approved" ? "✓" : "!"}
                  </span>
                  <h3 style={{ fontFamily: typography.heading, fontSize: 20, margin: 0 }}>
                    {last.result === "approved" ? (shop.button === "Pay" ? "Payment approved" : "Hold approved") : "Your card was declined"}
                  </h3>
                </div>
                {last.result === "approved" ? (
                  <>
                    <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#067647" }}>Your money&apos;s good here. This is your practice receipt.</p>
                    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", margin: 0, fontSize: 14 }}>
                      <dt style={{ color: colors.muted }}>Paid to</dt><dd style={{ margin: 0 }}>{last.merchant}</dd>
                      <dt style={{ color: colors.muted }}>Amount</dt><dd style={{ margin: 0 }}>{money(last.amountCents)} in practice money</dd>
                      <dt style={{ color: colors.muted }}>Card</dt><dd style={{ margin: 0 }}>{last.method === "payproxy" ? `Digna card: ${last.cardName}` : last.cardName} ···· {last.last4}</dd>
                      <dt style={{ color: colors.muted }}>Practice receipt</dt><dd style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace" }}>{last.receipt}</dd>
                      <dt style={{ color: colors.muted }}>When</dt><dd style={{ margin: 0 }}>{last.at}</dd>
                    </dl>
                    {receipt && (
                      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                        <button type="button" onClick={() => downloadPracticeReceipt(receipt)} style={pill(true)}>
                          Download practice receipt
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPracticeReceiptPdf({
                              placeOrBusiness: last.merchant,
                              amountCents: last.amountCents,
                              date: last.at,
                              receiptId: last.receipt,
                            })
                          }
                          style={pill(false)}
                        >
                          Download receipt PDF
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 4px", lineHeight: 1.6 }}>
                      {money(last.amountCents)} at {last.merchant} with your {last.method === "payproxy" ? `Digna card: ${last.cardName}` : last.cardName} ···· {last.last4}.
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.6 }}><strong>Why:</strong> {last.reason}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                      {canRaise && raiseTo !== null && (
                        <button type="button" onClick={() => void raiseAndRetry()} disabled={busy} style={pill(true)}>
                          Raise this card's limit to {money(raiseTo)} and try again
                        </button>
                      )}
                      {(last.code === "insufficient_balance" || (last.code === "over_cap" && !canRaise)) && props.onAddMoney && (
                        <button type="button" onClick={props.onAddMoney} style={pill(true)}>Add money</button>
                      )}
                      {last.code === "other" && last.method !== "payproxy" && usable.length > 0 && (
                        <button type="button" onClick={() => fill(usable[0].cardNumber!, usable[0].exp ?? "", usable[0].cvc ?? "")} style={pill(true)}>
                          Try my Digna card instead
                        </button>
                      )}
                      {props.onAskAssistant && (
                        <button type="button" style={pill(false)}
                          onClick={() => props.onAskAssistant?.(`Why was my ${money(last.amountCents)} payment to ${last.merchant} with my ${last.cardName} declined, and what should I do?`)}>
                          Ask the money assistant
                        </button>
                      )}
                    </div>
                    {last.code === "over_cap" && !canRaise && (
                      <p style={{ margin: "10px 0 0", fontSize: 14, color: colors.muted }}>
                        Your wallet has {money(balance.availableCents)}, not enough to cover {money(last.amountCents)}. Add money first, then raise the limit.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* The practice wallet */}
        <aside id="pp-wallet" aria-label="Your practice wallet" style={{ ...box, scrollMarginTop: 120, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 4px" }}>Your practice wallet</h2>
            <p style={{ margin: 0, fontSize: 13, color: colors.muted, lineHeight: 1.5 }}>
              Type these into the checkout like a real card, or tap Fill in for me. Wallet: {money(balance.availableCents)} in practice money{mode === "demo" ? " (sample account)" : ""}.
            </p>
          </div>
          <h3 style={{ fontSize: 14, margin: "6px 0 0" }}>Your Digna cards</h3>
          {usable.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: colors.muted }}>
              You have no Digna cards yet.{" "}
              <button type="button" onClick={props.onCreateCard} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Make one</button>
              , then come back.
            </p>
          ) : (
            usable.map((c) => (
              <WalletCard key={c.id} dark hidden title={c.name} sub={`${money(Math.max(0, c.capCents - c.spentCents))} left${c.status === "frozen" ? " · paused" : ""}`}
                number={c.cardNumber!} exp={c.exp ?? ""} cvc={c.cvc ?? ""} onUse={() => fill(c.cardNumber!, c.exp ?? "", c.cvc ?? "")} />
            ))
          )}
          <h3 style={{ fontSize: 14, margin: "6px 0 0" }}>Everyday cards (examples)</h3>
          {PRACTICE_WALLET.map((c) => (
            <WalletCard key={c.method} title={c.label.replace(" (sample)", "")} sub={c.kind} number={c.number} exp={c.exp} cvc={c.cvc} onUse={() => fill(c.number, c.exp, c.cvc)} />
          ))}
          <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Example cards stand in for the cards people already carry. They only work on Digna's practice checkouts.</p>
        </aside>
      </div>

      <section aria-label="Recent tries" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>Your recent payments</h2>
        {payments.length === 0 ? (
          <p style={{ margin: 0, color: colors.muted }}>Nothing yet. Your payments show here, approved or declined.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {payments.slice(0, 20).map((p) => (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: `1px solid ${colors.line}` }}>
                <span>
                  <strong>{p.merchant}</strong> · {methodLabel(p.method, cards.find((c) => c.id === p.cardId)?.name)}
                  {p.reason && <span style={{ display: "block", fontSize: 13, color: colors.muted }}>{p.reason}</span>}
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ whiteSpace: "nowrap", fontWeight: 700, color: p.result === "approved" ? "#067647" : "#B42318" }}>
                    {money(p.amountCents)} · {p.result}
                  </span>
                  {/* Every approved payment keeps its practice receipt as a PDF, right here. */}
                  {p.result === "approved" && (
                    <button
                      type="button"
                      onClick={() => downloadPracticeReceiptPdf({ placeOrBusiness: p.merchant, amountCents: p.amountCents, date: p.createdAt, receiptId: "DGN-" + p.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() })}
                      style={{ background: "transparent", border: `1px solid ${colors.line}`, borderRadius: 999, padding: "4px 10px", fontSize: 12.5, fontWeight: 700, color: colors.ink, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Receipt PDF
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div role="status" aria-label="Digna notification" style={{ position: "fixed", top: 116, right: 16, left: "auto", maxWidth: 360, zIndex: 50, background: colors.midnight, color: "#FFFFFF", borderRadius: 14, padding: "12px 16px", boxShadow: "0 12px 30px rgba(14,23,38,0.35)", animation: "pp-toast .25s ease-out", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, background: "#FFB020", color: colors.midnight, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>D</span>
          <span style={{ fontSize: 14, lineHeight: 1.45 }}>
            <strong style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Digna · now</strong>
            {toast}
          </span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" style={{ background: "transparent", border: 0, color: "#C9CFDB", cursor: "pointer", fontSize: 16, marginLeft: 4 }}>×</button>
        </div>
      )}
    </div>
  );
}
