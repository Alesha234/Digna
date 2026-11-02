export function mapAuthError(raw: unknown): string {
  const text: string = normalize(raw);
  if (
    text.includes("invalid credentials") ||
    text.includes("invalid login") ||
    text.includes("user not found") ||
    text.includes("wrong password") ||
    text.includes("incorrect password") ||
    text.includes("invalid email or password")
  ) {
    return "Check your email and password and try again.";
  }
  if (
    text.includes("email not confirmed") ||
    text.includes("not verified") ||
    text.includes("confirm your email") ||
    text.includes("email not verified")
  ) {
    return "Check your inbox to confirm your email, then try again.";
  }
  if (
    text.includes("rate limit") ||
    text.includes("rate_limit") ||
    text.includes("too many requests") ||
    text.includes("throttled") ||
    text.includes("too many tries")
  ) {
    return "Too many tries. Wait a minute and try again.";
  }
  if (
    text.includes("network") ||
    text.includes("fetch failed") ||
    text.includes("failed to fetch") ||
    text.includes("connection") ||
    text.includes("offline")
  ) {
    return "Check your connection and try again.";
  }
  if (text.includes("weak password") || text.includes("password is too short")) {
    return "Choose a password with at least 16 characters.";
  }
  return "Something went wrong. Please try again.";
}

export function mapSigninError(raw: unknown): string {
  return mapAuthError(raw);
}

export function mapSignupError(raw: unknown): string {
  return mapAuthError(raw);
}

function normalize(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.toLowerCase();
  }
  if (raw instanceof Error) {
    return raw.message.toLowerCase();
  }
  if (typeof raw === "object" && raw !== null) {
    const record: Record<string, unknown> = raw as Record<string, unknown>;
    const code: unknown = record["code"];
    const message: unknown = record["message"];
    const parts: string[] = [];
    if (typeof code === "string" && code.length > 0) {
      parts.push(code.toLowerCase());
    }
    if (typeof message === "string" && message.length > 0) {
      parts.push(message.toLowerCase());
    }
    return parts.join(" ");
  }
  return "";
}
