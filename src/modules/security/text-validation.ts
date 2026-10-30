export function trimAndCollapseSpaces(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ");
}

export function containsOnlySafeChars(value: string, extra: string): boolean {
  for (const ch of value) {
    if (
      (ch >= "A" && ch <= "Z") ||
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9")
    ) {
      continue;
    }
    if (extra.includes(ch)) {
      continue;
    }
    return false;
  }
  return true;
}

export function isValidCardName(value: unknown): boolean {
  const trimmed: string = trimAndCollapseSpaces(value);
  if (trimmed.length < 1 || trimmed.length > 60) {
    return false;
  }
  return containsOnlySafeChars(trimmed, " ' -.,()&");
}

export function isValidStoreName(value: unknown): boolean {
  const trimmed: string = trimAndCollapseSpaces(value);
  if (trimmed.length < 1 || trimmed.length > 80) {
    return false;
  }
  return containsOnlySafeChars(trimmed, " ' -.,()&!?:;");
}
