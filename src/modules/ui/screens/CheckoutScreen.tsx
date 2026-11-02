import { useEffect, useRef, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import {
  MERCHANTS,
  YOUR_BILL,
  PRACTICE_WALLET,
  brandOf,
  formProblem,
  formatCardNumber,
  methodLabel,
  digitsOnly,
  type CheckoutForm,
  type CheckoutOutcome,
} from "@/modules/ui/lib/sandbox";
import type { BillScanResult, PracticeReceipt, SavedBill, VirtualCard } from "@/modules/ui/types";
import { readBillViaAi, shrinkToDataUrl } from "@/modules/ui/screens/SnapBillScreen";
import { BILL_FILE_ACCEPT, BILL_FILE_MAX_BYTES, PRACTICE_DOCS, billFileKind, docxText, downloadPracticeDoc, pdfText } from "@/modules/ui/lib/billFiles";
import { downloadPracticeReceipt } from "@/modules/ui/components/TransactionList";
import { downloadPracticeReceiptPdf } from "@/modules/ui/lib/practicePdf";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";
import { PayMoment, type Moment } from "@/modules/ui/components/PayMoment";
import { accessToken } from "@/modules/ui/lib/supabase";

/** Where SAM 3.1 found the bill, as parts of the picture (0 to 1), for the outline and the crop. */
type FoundBox = { left: number; top: number; width: number; height: number };

/**
 * Meta's SAM 3.1 finds the bill in a messy photo (Nov 2, 2026), through /api/find-bill; null when it can't be asked or
 * finds nothing, and the whole photo is read as before.
 */
async function findBill(image: string): Promise<FoundBox | null> {
  const token = await accessToken();
  if (!token) return null;
  const res = await fetch("/api/find-bill", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ image }) }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { box?: { x1: number; y1: number; x2: number; y2: number; w: number; h: number } | null };
  const b = data.box;
  if (!b || !(b.w > 0 && b.h > 0)) return null;
  const box = { left: b.x1 / b.w, top: b.y1 / b.h, width: (b.x2 - b.x1) / b.w, height: (b.y2 - b.y1) / b.h };
  // A box that is nearly the whole picture tells nothing new; a tiny one is more likely a mistake.
  if (box.width * box.height > 0.92 || box.width * box.height < 0.02) return null;
  return box;
}

/** The photo cut to the bill, with a small margin, as a JPEG data URL. */
function cropTo(image: string, box: FoundBox): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const m = 0.04;
      const x = Math.max(0, box.left - m) * img.width;
      const y = Math.max(0, box.top - m) * img.height;
      const w = Math.min(1, box.left + box.width + m) * img.width - x;
      const h = Math.min(1, box.top + box.height + m) * img.height - y;
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      c.getContext("2d")?.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(image);
    img.src = image;
  });
}

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
        <img src={`/api/picture/${name}?v=3`} alt="" onLoad={() => setOk(true)} onError={() => setOk(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", opacity: ok ? 1 : 0, transition: "opacity .4s" }} />
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

/** A part of the page that opens and folds away with a tap on its heading (Nov 2, 2026), to save room. */
function Fold(props: { title: string; count?: number; open?: boolean; children: React.ReactNode; level?: 2 | 3 }) {
  const [open, setOpen] = useState(props.open ?? true);
  const big = props.level === 2;
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, background: "transparent", border: 0, padding: big ? "2px 0" : "6px 0", cursor: "pointer", color: colors.ink, fontFamily: big ? typography.heading : typography.body, fontSize: big ? 18 : 14, fontWeight: 700, textAlign: "left", minHeight: 40 }}>
        <span>
          {props.title}
          {props.count !== undefined && <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 700, color: colors.muted, background: colors.page, border: `1px solid ${colors.line}`, borderRadius: 999, padding: "2px 9px" }}>{props.count}</span>}
        </span>
        <span aria-hidden="true" style={{ display: "inline-flex", width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 999, background: colors.page, border: `1px solid ${colors.line}`, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", fontSize: 13 }}>▼</span>
      </button>
      {open && <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>{props.children}</div>}
    </div>
  );
}

const FILE_LABEL: Record<SavedBill["fileKind"], string> = { photo: "Photo", pdf: "PDF", word: "Word", text: "Text" };

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
export function CheckoutScreen(props: { onAskAssistant?: (question: string) => void; onCreateCard?: () => void; onAddMoney?: () => void; onMakeCard?: (bill: BillScanResult) => void; onMakeCardForBill?: (bill: SavedBill) => void; payBillId?: string | null }) {
  const { cards, payments, balance, mode, checkout, setCardLimit, bills, addBill, removeBill, payBill, billFileUrl } = usePayProxy();
  const [merchantId, setMerchantId] = useState(MERCHANTS[0].id);
  // A bill you added can be where you pay (Nov 2, 2026): then the checkout is that bill's, for its amount.
  const [billId, setBillId] = useState<string | null>(props.payBillId ?? null);
  const payingBill = billId ? (bills.find((b) => b.id === billId) ?? null) : null;
  const merchant = payingBill ? { ...YOUR_BILL, name: payingBill.business, kind: `Your ${FILE_LABEL[payingBill.fileKind] === "Photo" ? "bill" : "bill or invoice"}${payingBill.dueDate ? ` · due ${payingBill.dueDate}` : ""}` } : MERCHANTS.find((m) => m.id === merchantId)!;
  const shop = payingBill ? { picture: "", button: "Pay", orders: [{ label: `Amount due${payingBill.dueDate ? `, due ${payingBill.dueDate}` : ""}`, cents: payingBill.amountCents }] } : SHOP[merchantId];
  const [orderIx, setOrderIx] = useState(0);
  const amountCents = shop.orders[Math.min(orderIx, shop.orders.length - 1)].cents;
  const [form, setForm] = useState<CheckoutForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<(CheckoutOutcome & { merchant: string; amountCents: number; receipt: string; at: string; atIso: string }) | null>(null);
  const [billBusy, setBillBusy] = useState<string | null>(null);
  const [billError, setBillError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  // SAM 3.1 finding the bill in a photo (Nov 2, 2026): the photo, the box it found, and which step is done.
  const [sam, setSam] = useState<{ src: string; box: FoundBox | null; step: number; missed?: boolean } | null>(null);
  const checkoutRefEl = useRef<HTMLDivElement | null>(null);
  // The Digna moment after each payment (Nov 2, 2026).
  const [moment, setMoment] = useState<Moment | null>(null);
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
    setBillId(null);
    setOrderIx(0);
    setLast(null);
    setError(null);
  }
  function pickBill(id: string): void {
    setBillId(id);
    setOrderIx(0);
    setLast(null);
    setError(null);
    setTimeout(() => checkoutRefEl.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  // Opened right after making a card for a bill: that bill is ready to pay.
  useEffect(() => {
    if (props.payBillId) setTimeout(() => checkoutRefEl.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [props.payBillId]);
  function set<K extends keyof CheckoutForm>(k: K, v: string): void {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }
  function fill(number: string, exp: string, cvc: string): void {
    setForm((f) => ({ name: f.name || "Alex Rivera", number: formatCardNumber(number), exp, cvc, zip: f.zip || "10001" }));
    setError(null);
    setLast(null);
  }

  /**
   * One upload for every kind of bill (Nov 2, 2026): a screenshot or photo goes to Meta's Muse Spark as a picture; a
   * PDF's or Word file's words are read in the browser and sent as text. What it reads is kept in Your bills, with
   * the file itself, ready to get its own card and be paid.
   */
  async function onBillFile(file: File | undefined): Promise<void> {
    if (!file) return;
    setBillError(null);
    setJustAdded(null);
    setSam(null);
    const kind = billFileKind(file);
    if (typeof kind !== "string") return setBillError(kind.problem);
    if (file.size > BILL_FILE_MAX_BYTES) return setBillError("That file is over 10 MB. Try a smaller one, or a screenshot of the bill.");
    setBillBusy(`Reading ${file.name} with Meta's Muse Spark…`);
    try {
      let image: string | null = null;
      let text = "";
      if (kind === "photo") {
        image = await shrinkToDataUrl(file);
        if (!image) throw new Error("Couldn't open that picture. Try a PNG or JPEG screenshot.");
        if (image.length > 2000000) throw new Error("That photo is too big. Try a smaller screenshot.");
        if (mode === "live") {
          // Step 1: SAM 3.1 looks for the bill; found, the photo is cut to it before Muse Spark reads it.
          setSam({ src: image, box: null, step: 0 });
          setBillBusy("Finding the bill in your photo with Meta's SAM 3.1…");
          const box = await findBill(image);
          setSam({ src: image, box, step: 1, missed: !box });
          if (box) image = await cropTo(image, box);
          setBillBusy(`Reading ${file.name} with Meta's Muse Spark…`);
        }
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        text = kind === "pdf" ? await pdfText(bytes) : await docxText(bytes);
        if (text.trim().length < 10) throw new Error(kind === "pdf" ? "That PDF has no words to read (it may be a scan). Upload a screenshot or photo of it instead." : "That Word file has no words to read.");
      }
      const out = await readBillViaAi({ image, text });
      setSam((s) => (s ? { ...s, step: 2 } : s));
      let read = { business: out.scan.storeName, amountCents: out.scan.amountCents, dueDate: out.scan.dueDate };
      if (out.practice) {
        // Without an account Muse Spark isn't asked: Digna's own practice papers are still recognized, nothing else.
        const doc = PRACTICE_DOCS.find((d) => text.includes(d.business));
        if (!doc) throw new Error("Make a free account to have Meta's Muse Spark read any bill. The sample account reads Digna's practice bills and invoices only.");
        read = { business: doc.business, amountCents: doc.amountCents, dueDate: doc.dueDate };
      }
      const saved = await addBill({ business: read.business, amountCents: read.amountCents, dueDate: /^\d{4}-\d{2}-\d{2}$/.test(read.dueDate) ? read.dueDate : null, fileName: file.name, fileKind: kind, file });
      setJustAdded(saved.id);
      setSam((s) => (s ? { ...s, step: 3 } : s));
      if (out.scan.confidence === "low") setBillError(`It was hard to read. Please check ${money(saved.amountCents)} from ${saved.business} before paying.`);
    } catch (e: unknown) {
      setBillError(e instanceof Error && e.message ? e.message : "Muse Spark couldn't read that bill. Try again in a moment.");
    } finally {
      setBillBusy(null);
    }
  }

  async function openBillFile(b: SavedBill): Promise<void> {
    const url = await billFileUrl(b).catch(() => null);
    if (url) window.open(url, "_blank", "noopener");
    else setBillError("This bill's file wasn't kept, only what was read from it.");
  }

  async function run(f: CheckoutForm, cents: number): Promise<void> {
    setBusy(true);
    setError(null);
    const started = Date.now();
    try {
      const out = payingBill ? await payBill(payingBill.id, f) : await checkoutRef.current(merchantId, cents, f);
      // A real card network takes a moment; so does this one, so the answer doesn't feel instant and fake.
      await new Promise((r) => setTimeout(r, Math.max(0, 1300 - (Date.now() - started))));
      const at = new Date();
      // What was left on the Digna card, read back after the payment, for the moment's countdown.
      const paidCard = out.method === "payproxy" ? cardsRef.current.find((c) => c.id === out.cardId) : undefined;
      const leftAfter = paidCard ? Math.max(0, paidCard.capCents - paidCard.spentCents) : null;
      setMoment({
        result: out.result,
        merchant: merchant.name,
        amountCents: cents,
        cardName: out.method === "payproxy" ? `Digna card: ${out.cardName}` : out.cardName.replace(" (sample)", ""),
        last4: out.last4,
        digna: out.method === "payproxy",
        leftAfter: out.result === "approved" ? leftAfter : null,
        leftBefore: out.result === "approved" && leftAfter !== null ? leftAfter + cents : null,
        reason: out.reason,
      });
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
          Add a bill or invoice (a screenshot, a photo, a PDF or a Word file) and Meta&apos;s Muse Spark reads who it&apos;s from, how much and when it&apos;s due. It&apos;s kept in Your bills, where you can make a card just for it and pay it. Or pick a sample business and pay at its checkout. It&apos;s all practice money, so nothing real is charged.
        </p>
      </header>

      {/* 1. Your bills (Nov 2, 2026): one upload for every kind of bill, the practice ones to try, and every bill kept. */}
      <section aria-label="Your bills" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 6px" }}>1. Your bills</h2>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>
          Upload a bill or invoice: a screenshot, a photo, a PDF or a Word file. Meta&apos;s Muse Spark reads it and keeps it here, ready for its own card.
        </p>
        <label style={{ ...pill(true), display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", fontSize: 15, opacity: billBusy ? 0.6 : 1, pointerEvents: billBusy ? "none" : "auto" }}>
          <span aria-hidden="true">⬆</span> {billBusy ? "Reading…" : "Upload a bill or invoice"}
          <input type="file" accept={BILL_FILE_ACCEPT} hidden onChange={(e) => { void onBillFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: colors.muted }}>Screenshots or photos (PNG, JPEG), PDFs and Word files (.docx), up to 10 MB.</p>
        {billBusy && <p role="status" style={{ margin: "10px 0 0", fontSize: 14, color: colors.muted }}>{billBusy}</p>}
        {billError && <p role="alert" style={{ margin: "10px 0 0", fontSize: 14, color: "#B42318" }}>{billError}</p>}
        {sam && (
          <div className="pp-sam" aria-label="How your photo was read">
            <div className="pp-sam-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sam.src} alt="Your bill photo" />
              {sam.box && (
                <span className="pp-sam-box" style={{ left: `${sam.box.left * 100}%`, top: `${sam.box.top * 100}%`, width: `${sam.box.width * 100}%`, height: `${sam.box.height * 100}%` }}>
                  <span className="pp-sam-label">SAM 3.1 · found the bill</span>
                </span>
              )}
            </div>
            <ol className="pp-steps">
              {[sam.missed ? "Couldn't spot the bill's edges, so the whole photo was read" : "Found it · SAM 3.1", "Read it · Muse Spark", "Saved · Your bills"].map((t, i) => (
                <li key={t} className={sam.step > i ? "is-done" : sam.step === i ? "is-now" : ""}>
                  <span aria-hidden="true">{sam.step > i ? "✓" : ""}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <Fold title="Practice bills and invoices to try" count={PRACTICE_DOCS.length} open={bills.length === 0}>
            <p style={{ margin: 0, fontSize: 13.5, color: colors.muted, lineHeight: 1.55 }}>Download one as a PDF, then upload it above to see Muse Spark read it. Practice papers only: nothing here is a real bill.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
              {PRACTICE_DOCS.map((d) => (
                <div key={d.id} style={{ border: `1px solid ${colors.line}`, borderRadius: 12, padding: 12, background: colors.page, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.muted }}>Practice {d.kind.toLowerCase()} · PDF</span>
                  <strong style={{ fontSize: 15 }}>{d.business}</strong>
                  <span style={{ fontSize: 13.5, color: colors.muted }}>{money(d.amountCents)} · due {d.dueDate}</span>
                  <button type="button" onClick={() => downloadPracticeDoc(d)} style={{ ...pill(false), alignSelf: "flex-start", padding: "7px 14px", fontSize: 13 }}>Download PDF</button>
                </div>
              ))}
            </div>
          </Fold>
        </div>

        <div style={{ marginTop: 14 }}>
          <Fold title="Saved bills" count={bills.length}>
            {bills.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: colors.muted }}>No bills yet. Upload one above, or try a practice invoice.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {[...bills].sort((a, b) => (a.status === b.status ? (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") : a.status === "unpaid" ? -1 : 1)).map((b) => {
                  const card = b.cardId ? cards.find((c) => c.id === b.cardId) : undefined;
                  const fresh = b.id === justAdded;
                  return (
                    <li key={b.id} style={{ border: `1px solid ${fresh ? colors.mint : colors.line}`, background: fresh ? "#FFF9EB" : colors.surface, borderRadius: 14, padding: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 16 }}>{b.business}</strong>
                          <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "2px 9px", background: b.status === "paid" ? "#ECFDF3" : "#FFF3D6", color: b.status === "paid" ? "#067647" : colors.mintDark }}>{b.status === "paid" ? "Paid" : "To pay"}</span>
                          {fresh && <span style={{ fontSize: 12, fontWeight: 700, color: colors.mintDark }}>Just read by Muse Spark</span>}
                        </div>
                        <div style={{ fontSize: 14, marginTop: 4 }}>
                          <strong>{money(b.amountCents)}</strong>
                          <span style={{ color: colors.muted }}>{b.dueDate ? ` · due ${b.dueDate}` : ""}{b.paidAt ? ` · paid ${new Date(b.paidAt).toLocaleDateString()}` : ""}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 4 }}>
                          {FILE_LABEL[b.fileKind]}{b.fileName ? ` · ${b.fileName}` : ""}{card ? ` · Card: ${card.name}` : ""}
                          {b.filePath && <button type="button" onClick={() => void openBillFile(b)} style={{ marginLeft: 8, background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>Open file</button>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {b.status === "unpaid" && !card && props.onMakeCardForBill && (
                          <button type="button" onClick={() => props.onMakeCardForBill?.(b)} style={{ ...pill(true), padding: "9px 16px" }}>Make a card for it</button>
                        )}
                        {b.status === "unpaid" && (
                          <button type="button" onClick={() => pickBill(b.id)} style={{ ...pill(!!card), padding: "9px 16px" }}>Pay this bill</button>
                        )}
                        {b.status === "paid" && (
                          <button type="button" onClick={() => downloadPracticeReceiptPdf({ placeOrBusiness: b.business, amountCents: b.amountCents, date: b.paidAt ?? "", receiptId: "DGB-" + b.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() })} style={{ ...pill(false), padding: "9px 16px" }}>Receipt PDF</button>
                        )}
                        <button type="button" aria-label={`Remove the ${b.business} bill`} onClick={() => void removeBill(b.id).catch((e: unknown) => setBillError(e instanceof Error ? e.message : "That bill couldn't be removed."))} style={{ background: "transparent", border: 0, color: colors.muted, cursor: "pointer", fontSize: 13, padding: "8px 6px" }}>Remove</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Fold>
        </div>
      </section>

      {/* 2. Where are you paying: a bill you added, or one of the sample businesses. Right above the checkout and wallet. */}
      <section aria-label="Where you're paying" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>2. Where are you paying?</h2>
        {bills.filter((b) => b.status === "unpaid").length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "0 0 8px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your bills</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
              {bills.filter((b) => b.status === "unpaid").map((b) => (
                <button key={b.id} type="button" aria-pressed={b.id === billId} onClick={() => pickBill(b.id)}
                  style={{ textAlign: "left", padding: 14, borderRadius: 12, cursor: "pointer", fontFamily: typography.body, background: b.id === billId ? "#FFF3D6" : colors.surface, border: `2px solid ${b.id === billId ? colors.mint : colors.line}` }}>
                  <strong style={{ display: "block", fontSize: 16, color: colors.ink }}>{b.business}</strong>
                  <span style={{ fontSize: 13, color: colors.muted }}>{money(b.amountCents)}{b.dueDate ? ` · due ${b.dueDate}` : ""}</span>
                </button>
              ))}
            </div>
            <h3 style={{ fontSize: 13, margin: "0 0 8px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sample businesses</h3>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {MERCHANTS.map((m) => {
            const on = !payingBill && m.id === merchantId;
            return (
              <button key={m.id} type="button" aria-pressed={on} onClick={() => pickMerchant(m.id)}
                style={{ textAlign: "left", padding: 14, borderRadius: 12, cursor: "pointer", fontFamily: typography.body, background: on ? "#FFF3D6" : colors.surface, border: `2px solid ${on ? colors.mint : colors.line}` }}>
                <strong style={{ display: "block", fontSize: 16, color: colors.ink }}>{m.name}</strong>
                <span style={{ fontSize: 13, color: colors.muted }}>{m.kind}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="pp-co-grid" ref={checkoutRefEl} style={{ scrollMarginTop: 110 }}>
        {/* The business's checkout page */}
        <section aria-label={`${merchant.name} checkout`} style={{ ...box, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "8px 16px", fontSize: 12, color: colors.muted, background: colors.page, borderBottom: `1px solid ${colors.line}` }}>
            Sample business · practice checkout
          </div>
          {/* Tall enough, and kept on the picture's upper part, that people's faces show whole (Nov 2, 2026). */}
          <div style={{ position: "relative", height: "clamp(200px, 26vw, 260px)" }}>
            {shop.picture ? <BizPicture name={shop.picture} /> : <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #17405C, #0E1726 70%)" }} />}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,23,38,0) 55%, rgba(14,23,38,0.78))" }} />
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
          <Fold title="Your Digna cards" count={usable.length}>
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
          </Fold>
          <Fold title="Everyday cards (examples)" count={PRACTICE_WALLET.length}>
          {PRACTICE_WALLET.map((c) => (
            <WalletCard key={c.method} title={c.label.replace(" (sample)", "")} sub={c.kind} number={c.number} exp={c.exp} cvc={c.cvc} onUse={() => fill(c.number, c.exp, c.cvc)} />
          ))}
          <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Example cards stand in for the cards people already carry. They only work on Digna's practice checkouts.</p>
          </Fold>
        </aside>
      </div>

      <section aria-label="Recent tries" style={box}>
        <Fold title="Your recent payments" count={Math.min(payments.length, 20)} open={false} level={2}>
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
        </Fold>
      </section>

      {moment && <PayMoment moment={moment} onClose={() => setMoment(null)} />}

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
