export function isAllowedRedirect(path: unknown): boolean {
  if (typeof path !== "string") {
    return false;
  }
  if (path.length < 1 || path.length > 200) {
    return false;
  }
  if (!path.startsWith("/")) {
    return false;
  }
  if (path.startsWith("//")) {
    return false;
  }
  if (path.startsWith("/\\")) {
    return false;
  }
  if (path.includes("://")) {
    return false;
  }
  if (path.includes("\\")) {
    return false;
  }
  if (path.includes("..")) {
    return false;
  }
  if (path === "/") {
    return true;
  }
  const allowedPrefixes: string[] = [
    "/dashboard",
    "/cards",
    "/add-money",
    "/scan",
    "/history",
    "/settings",
    "/signin",
    "/signup",
    "/welcome",
  ];
  for (const prefix of allowedPrefixes) {
    if (path === prefix) {
      return true;
    }
    if (path.startsWith(prefix)) {
      const next: string | undefined = path.charAt(prefix.length);
      if (next === "/" || next === "?" || next === "#") {
        return true;
      }
    }
  }
  return false;
}

export function getSafeRedirect(path: unknown, fallback?: string): string {
  if (isAllowedRedirect(path)) {
    return path as string;
  }
  if (typeof fallback === "string" && isAllowedRedirect(fallback)) {
    return fallback;
  }
  return "/";
}

/** App screens a sign-in may return to. Nothing else is a valid target. */
const ALLOWED_SCREENS: ReadonlySet<string> = new Set([
  "welcome",
  "dashboard",
  "checkout",
  "snap-bill",
  "auth",
  "signup",
]);

function isUnsafeScreen(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.length === 0 || v.length > 200) return true;
  if (v.includes("://")) return true;
  if (v.includes("\\")) return true;
  if (v.startsWith("//")) return true;
  if (v.startsWith("http")) return true;
  if (v.startsWith("javascript:")) return true;
  return false;
}

/** Normalizes "dashboard", "/dashboard" or "/dashboard?x" to a screen name, or null when not allowed. */
function toAllowedScreen(value: string): string | null {
  let v = value.trim();
  if (v.startsWith("/")) v = v.slice(1);
  const cut = v.search(/[?#]/);
  if (cut >= 0) v = v.slice(0, cut);
  v = v.trim().toLowerCase();
  return ALLOWED_SCREENS.has(v) ? v : null;
}

/**
 * Where to go after a sign-in: the saved screen when it is an internal app
 * screen, otherwise back to the screen the person is already on (stay put).
 * External URLs, "//", http and javascript: targets are never returned, and
 * no path ever forces the dashboard.
 */
export function getSafeNextPath(requested: string | null, current: string): string | null {
  if (typeof requested === "string" && requested.trim().length > 0) {
    if (isUnsafeScreen(requested)) return current;
    return toAllowedScreen(requested) ?? current;
  }
  return current;
}
