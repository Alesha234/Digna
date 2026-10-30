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
  return "/dashboard";
}
