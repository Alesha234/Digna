import { useState, type FormEvent } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { getSafeNextPath } from "@/modules/security/safe-redirect";
import { colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

const field: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${colors.line}`,
  fontFamily: typography.body,
  fontSize: 16,
  color: colors.ink,
  background: colors.surface,
};

/** Sign in, or create an account: email and a password. New accounts start with $250 of practice money. */
export function AuthScreen(props: { startWith?: "signin" | "signup"; returnTo?: string | null; onSuccess?: (next: string | null) => void }) {
  const { signIn, signUp, signInDemo, requestPasswordReset, screen } = usePayProxy();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(props.startWith ?? "signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const signingIn = mode === "signin";

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter your email address, like name@example.com.");
    if (mode !== "forgot" && password.length < 6) return setError("Use a password of at least 6 characters.");
    setBusy(true);
    // Where the person was when they started signing in: success stays there unless a safe saved page exists.
    const from = screen;
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setSent(email);
      } else if (signingIn) {
        await signIn(email, password);
        props.onSuccess?.(getSafeNextPath(props.returnTo ?? null, from));
      } else if ((await signUp(email, password)) === "check-email") {
        setSent(email);
      } else {
        props.onSuccess?.(getSafeNextPath(props.returnTo ?? null, from));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: 440, margin: "24px auto", background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.xl }}>
      <h1 style={{ fontFamily: typography.heading, fontSize: 28, margin: "0 0 6px", color: colors.ink }}>{mode === "forgot" ? "Reset your password" : signingIn ? "Sign in to Digna" : "Create your Digna account"}</h1>
      <p style={{ margin: "0 0 20px", color: colors.muted, fontSize: 15, lineHeight: 1.5 }}>
        {mode === "forgot" ? "Enter your account's email and we'll send you a link to set a new password." : signingIn ? "Welcome back." : "Free. You start with $250 in practice money to make cards and pay practice bills, with nothing real charged."}
      </p>
      {sent ? (
        <div role="status" style={{ background: "#FFF3D6", borderRadius: 10, padding: 16, color: colors.ink, lineHeight: 1.5 }}>
          Check <strong>{sent}</strong> for a link from Digna. {mode === "forgot" ? "Open it to set a new password." : "Open it, then sign in here."} It can take a minute; check spam too.
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => { setSent(null); setMode("signin"); }} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
              Go to sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14, color: colors.ink }}>
            Email
            <input name="email" type="email" autoComplete="email" required style={field} />
          </label>
          {mode !== "forgot" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14, color: colors.ink }}>
              Password
              <input name="password" type="password" autoComplete={signingIn ? "current-password" : "new-password"} minLength={6} required style={field} />
            </label>
          )}
          {signingIn && (
            <button type="button" onClick={() => { setMode("forgot"); setError(null); }} style={{ alignSelf: "flex-start", background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Forgot password?
            </button>
          )}
          {error && (
            <p role="alert" style={{ margin: 0, color: "#B42318", fontSize: 14, lineHeight: 1.5 }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} style={{ background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "14px 20px", fontWeight: 700, fontSize: 16, cursor: busy ? "wait" : "pointer", fontFamily: typography.body }}>
            {busy ? "One moment…" : mode === "forgot" ? "Send reset link" : signingIn ? "Sign in" : "Create account"}
          </button>
        </form>
      )}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: colors.muted }}>
        <span>
          {signingIn ? "New to Digna? " : "Already have an account? "}
          <button type="button" onClick={() => { setMode(signingIn ? "signup" : "signin"); setError(null); setSent(null); }} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            {signingIn ? "Create an account" : "Sign in"}
          </button>
        </span>
        <span>
          Just looking?{" "}
          <button type="button" onClick={signInDemo} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Look around with a sample account
          </button>
        </span>
      </div>
    </section>
  );
}

/** Opened from a "reset your password" email: the person picks a new password, then goes to their dashboard. */
export function NewPasswordScreen() {
  const { updatePassword } = usePayProxy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const a = String(form.get("password") ?? "");
    const b = String(form.get("again") ?? "");
    setError(null);
    if (a.length < 6) return setError("Use a password of at least 6 characters.");
    if (a !== b) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      await updatePassword(a);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section style={{ maxWidth: 440, margin: "24px auto", background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.xl }}>
      <h1 style={{ fontFamily: typography.heading, fontSize: 28, margin: "0 0 16px", color: colors.ink }}>Set a new password</h1>
      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
          New password
          <input name="password" type="password" autoComplete="new-password" style={field} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
          New password again
          <input name="again" type="password" autoComplete="new-password" style={field} />
        </label>
        {error && <p role="alert" style={{ margin: 0, color: "#B42318", fontSize: 14 }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "14px 20px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </section>
  );
}
