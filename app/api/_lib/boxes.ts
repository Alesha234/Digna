export type Box = { x1: number; y1: number; x2: number; y2: number; w: number; h: number };

/** Every box in SAM 3.1's text, read by key name: <|box;x1=12;y1=40;x2=300;y2=420;w=640;h=480|>. */
export function boxesIn(text: string): Box[] {
  const out: Box[] = [];
  for (const m of text.matchAll(/<\|box;([^|]*)\|>/g)) {
    const v: Record<string, number> = {};
    for (const part of m[1].split(";")) {
      const [k, n] = part.split("=");
      if (k && n !== undefined && Number.isFinite(Number(n))) v[k.trim()] = Number(n);
    }
    if (["x1", "y1", "x2", "y2", "w", "h"].every((k) => k in v) && v.x2 > v.x1 && v.y2 > v.y1 && v.w > 0 && v.h > 0) out.push(v as Box);
  }
  return out;
}

