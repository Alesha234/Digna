/**
 * Practice PDFs for Digna: receipts and bills as real PDF files, made in the
 * browser only (a Blob download and a print window). No new packages.
 *
 * Every page says "Practice money: no real money moved" and shows the place
 * or business, the amount, the date and a receipt ID, in plain human words.
 */

export type PracticePdfDetails = {
  placeOrBusiness?: string;
  business?: string;
  place?: string;
  amountCents?: number;
  amount?: string;
  date?: string;
  dueDate?: string;
  paidAt?: string;
  receiptId?: string;
  receipt?: string;
};

function pickPlace(d: PracticePdfDetails): string {
  const v: string | undefined = d.placeOrBusiness ?? d.business ?? d.place;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : "—";
}

function pickAmount(d: PracticePdfDetails): string {
  if (typeof d.amount === "string" && d.amount.trim().length > 0) return d.amount.trim();
  if (typeof d.amountCents === "number" && Number.isFinite(d.amountCents)) {
    return `$${(d.amountCents / 100).toFixed(2)} in practice money`;
  }
  return "—";
}

function pickDate(d: PracticePdfDetails): string {
  const v: string | undefined = d.date ?? d.paidAt ?? d.dueDate;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : "—";
}

function pickReceiptId(d: PracticePdfDetails): string {
  const v: string | undefined = d.receiptId ?? d.receipt;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : "—";
}

/** Keep PDF text ASCII so the file's byte positions stay exact. */
function cleanLine(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, "?");
}

/** Escape a line for a PDF text string. */
function encodePdfText(s: string): string {
  return cleanLine(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * A one-page PDF with the given lines. Hand-built so the browser needs no
 * extra packages to save a real .pdf file.
 */
function buildPdf(title: string, lines: string[]): string {
  const safe: string[] = [title, ...lines].map(cleanLine);
  let y: number = 740;
  const text: string[] = [];
  text.push(`BT /F2 17 Tf 56 ${y} Td (${encodePdfText(safe[0])}) Tj ET`);
  y -= 30;
  for (const line of safe.slice(1)) {
    text.push(`BT /F1 11 Tf 56 ${y} Td (${encodePdfText(line)}) Tj ET`);
    y -= 18;
  }
  const stream: string = text.join("\n") + "\n";
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf: string = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i: number = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefAt: number = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const at of offsets) {
    pdf += `${String(at).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return pdf;
}

/** The shared words of every practice PDF. */
function practiceLines(kind: "receipt" | "bill", d: PracticePdfDetails): string[] {
  const placeLabel: string = kind === "receipt" ? "Paid to (place or business)" : "Place or business";
  const dateLabel: string = kind === "receipt" ? "When" : "Date";
  return [
    "Practice money: no real money moved",
    "",
    `${placeLabel}: ${pickPlace(d)}`,
    `Amount: ${pickAmount(d)}`,
    `${dateLabel}: ${pickDate(d)}`,
    `Receipt ID: ${pickReceiptId(d)}`,
    "",
    "This is a practice paper only. Nothing real was charged.",
  ];
}

/** Saves text as a .pdf download in the browser. */
function savePdf(fileName: string, pdf: string): void {
  try {
    const blob: Blob = new Blob([pdf], { type: "application/pdf" });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* downloading is a convenience only */
  }
}

function safeFileId(d: PracticePdfDetails): string {
  const id: string = pickReceiptId(d).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return id.length > 0 ? id : "practice";
}

/** Downloads any practice paper (a sample bill or invoice) as a one-page PDF with these lines. */
export function downloadPdf(fileName: string, title: string, lines: string[]): void {
  savePdf(fileName, buildPdf(title, lines));
}

/** Downloads the practice receipt for an approved payment as a PDF. */
export function downloadPracticeReceiptPdf(d: PracticePdfDetails): void {
  savePdf(
    `practice-receipt-${safeFileId(d)}.pdf`,
    buildPdf("Digna practice receipt", practiceLines("receipt", d)),
  );
}

/** Downloads a practice bill as a PDF. */
export function downloadPracticeBillPdf(d: PracticePdfDetails): void {
  savePdf(
    `practice-bill-${safeFileId(d)}.pdf`,
    buildPdf("Digna practice bill", practiceLines("bill", d)),
  );
}

/** Opens a print window with the practice bill, so it can be previewed or kept as a PDF. */
export function openPracticeBillPdf(d: PracticePdfDetails): void {
  try {
    if (typeof window === "undefined") return;
    const win: Window | null = window.open("", "_blank");
    if (!win) return;
    const rows: string = practiceLines("bill", d)
      .map((line) =>
        line.length === 0
          ? "<p>&nbsp;</p>"
          : `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
      )
      .join("\n");
    win.document.write(
      "<!doctype html><html><head><title>Digna practice bill</title></head>" +
        '<body style="font-family: sans-serif; max-width: 560px; margin: 40px auto; line-height: 1.6;">' +
        "<h1>Digna practice bill</h1>" +
        rows +
        "<p>To keep a PDF: choose Save as PDF in the print window.</p>" +
        "</body></html>",
    );
    win.document.close();
    win.focus();
    win.print();
  } catch {
    /* preview is a convenience only */
  }
}
