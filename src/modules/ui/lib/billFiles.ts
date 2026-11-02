/**
 * Bills and invoices as files (Nov 2, 2026). One upload takes a screenshot or photo, a PDF or a Word file. Pictures go
 * to Meta's Muse Spark as they are; a PDF's or Word file's words are read here in the browser first and sent as text.
 * Also the practice bills and invoices anyone can download as real PDFs, to try the upload with. No new packages: the
 * browser's own DecompressionStream opens the compressed parts of PDFs and Word files.
 */
import { downloadPdf } from "@/modules/ui/lib/practicePdf";

export type BillFileKind = "photo" | "pdf" | "word";

/** What the upload button accepts. */
export const BILL_FILE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/heic,application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";
/** The largest file the upload takes. */
export const BILL_FILE_MAX_BYTES = 10 * 1024 * 1024;

/** Which kind of bill file this is, or why it can't be read. */
export function billFileKind(file: { name: string; type: string }): BillFileKind | { problem: string } {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|heic)$/.test(name)) return "photo";
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) return "word";
  if (name.endsWith(".doc")) return { problem: "That's an older Word file (.doc). Save it as .docx or PDF, or upload a screenshot of it." };
  return { problem: "Upload a screenshot or photo, a PDF, or a Word file (.docx)." };
}

async function inflate(bytes: Uint8Array, format: "deflate" | "deflate-raw"): Promise<Uint8Array> {
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const latin1 = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return s;
};

/** A PDF string literal's text: escapes undone. */
function pdfLiteral(raw: string): string {
  return raw
    .replace(/\\([nrtbf()\\])/g, (_, c: string) => ({ n: "\n", r: "\r", t: "\t", b: "", f: "", "(": "(", ")": ")", "\\": "\\" })[c] ?? c)
    .replace(/\\([0-7]{1,3})/g, (_, o: string) => String.fromCharCode(parseInt(o, 8)));
}

/** The words of one page's drawing instructions: each Tj and TJ text, a new line at each line move. */
function textOfContent(content: string): string {
  const out: string[] = [];
  const ops = /\[((?:\\.|[^\]])*)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*(?:Tj|'|")|(T\*|Td|TD|ET)/g;
  let line = "";
  for (let m = ops.exec(content); m; m = ops.exec(content)) {
    if (m[1] !== undefined) {
      // Strings and the gaps between them: a wide gap (a big negative number) is a space between words.
      for (const t of m[1].match(/\(((?:\\.|[^\\)])*)\)|-?\d+(?:\.\d+)?/g) ?? []) {
        if (t.startsWith("(")) line += pdfLiteral(t.slice(1, -1));
        else if (Number(t) < -150 && !line.endsWith(" ")) line += " ";
      }
    } else if (m[2] !== undefined) line += pdfLiteral(m[2]);
    else if (line.trim()) {
      out.push(line.trim());
      line = "";
    }
  }
  if (line.trim()) out.push(line.trim());
  return out.join("\n");
}

/**
 * A PDF's words, read in the browser: each content stream (inflated when compressed) and its text instructions. Works
 * for PDFs made from text (most bills and invoices); a scanned PDF has none, and the person is asked for a screenshot.
 */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const raw = latin1(bytes);
  const texts: string[] = [];
  const streams = /<<([\s\S]*?)>>\s*stream\r?\n/g;
  for (let m = streams.exec(raw); m; m = streams.exec(raw)) {
    const dict = m[1];
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    if (/\/Subtype\s*\/Image|\/Type\s*\/XObject/.test(dict)) continue;
    // The line break before "endstream" isn't part of the data, and the unzipper refuses anything after the data.
    let stop = end;
    while (stop > start && (bytes[stop - 1] === 0x0a || bytes[stop - 1] === 0x0d)) stop--;
    let body = bytes.subarray(start, stop);
    try {
      if (/\/FlateDecode/.test(dict)) body = await inflate(body, "deflate");
      else if (/\/Filter/.test(dict)) continue;
    } catch {
      continue;
    }
    const t = textOfContent(latin1(body));
    if (t) texts.push(t);
    streams.lastIndex = end;
  }
  return texts.join("\n").replace(/[^\x09\x0A\x20-\x7E -ÿ]/g, "").trim();
}

/** A Word file's (.docx) words: its document.xml, unzipped in the browser, one line per paragraph. */
export async function docxText(bytes: Uint8Array): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The zip's directory: found from its end record.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("That Word file couldn't be opened.");
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  for (let n = 0; n < count && at + 46 <= bytes.length; n++) {
    if (view.getUint32(at, true) !== 0x02014b50) break;
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = latin1(bytes.subarray(at + 46, at + 46 + nameLen));
    at += 46 + nameLen + extraLen + commentLen;
    if (name !== "word/document.xml") continue;
    const dataAt = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(dataAt, dataAt + size);
    const xml = new TextDecoder().decode(method === 8 ? await inflate(data, "deflate-raw") : data);
    return xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  throw new Error("That Word file has no text in it.");
}

/** A practice bill or invoice to download and try the upload with. Every one says it's practice money. */
export type PracticeDoc = { id: string; kind: "Bill" | "Invoice"; business: string; amountCents: number; dueDate: string; lines: string[] };

export const PRACTICE_DOCS: PracticeDoc[] = [
  {
    id: "harbor-hotel-invoice",
    kind: "Invoice",
    business: "Harbor Hotel",
    amountCents: 14820,
    dueDate: "2026-11-20",
    lines: ["Invoice #HH-2041", "Guest: Alex Rivera", "Stay: Nov 2 - Nov 4, 2026 (2 nights)", "Room, 2 nights x $64.00: $128.00", "Taxes and fees: $20.20", "Amount due: $148.20", "Due date: 2026-11-20"],
  },
  {
    id: "nimbus-cloud-bill",
    kind: "Bill",
    business: "Nimbus Cloud",
    amountCents: 3200,
    dueDate: "2026-11-15",
    lines: ["Account: alex@example.com", "Billing period: Oct 1 - Oct 31, 2026", "Starter plan: $29.00", "Extra storage: $3.00", "Amount due: $32.00", "Due date: 2026-11-15"],
  },
  {
    id: "roadready-invoice",
    kind: "Invoice",
    business: "RoadReady Car Rental",
    amountCents: 20000,
    dueDate: "2026-11-08",
    lines: ["Invoice #RR-7730", "Renter: Alex Rivera", "Compact car, Nov 6 - Nov 8, 2026", "Refundable security deposit: $200.00", "Amount due at pickup: $200.00", "Due date: 2026-11-08"],
  },
  {
    id: "city-phone-bill",
    kind: "Bill",
    business: "City Phone",
    amountCents: 4500,
    dueDate: "2026-12-01",
    lines: ["Account: 555-0142", "Plan: Monthly 5G, November 2026", "Plan charge: $40.00", "Taxes: $5.00", "Amount due: $45.00", "Due date: 2026-12-01"],
  },
];

/** Saves a practice bill or invoice as a real PDF, ready to upload back. */
export function downloadPracticeDoc(doc: PracticeDoc): void {
  downloadPdf(`practice-${doc.id}.pdf`, `${doc.business} - practice ${doc.kind.toLowerCase()}`, [
    "Practice money: not a real bill. No real money moves.",
    "",
    ...doc.lines,
    "",
    "Pay with any card in your Digna practice wallet.",
  ]);
}
