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

/**
 * A new password's rules (Nov 2, 2026; 16 characters to match Digna's sign-in service): at least 16 characters, with letters and at least one number. Signing in only
 * needs the password the person already has, so older, shorter ones still work.
 */
export const PASSWORD_RULES: { label: string; ok: (p: string) => boolean }[] = [
  { label: "At least 16 characters", ok: (p) => p.length >= 16 },
  { label: "Letters", ok: (p) => /[A-Za-z]/.test(p) },
  { label: "At least one number", ok: (p) => /\d/.test(p) },
];
export const passwordProblem = (p: string): string | null =>
  PASSWORD_RULES.every((r) => r.ok(p)) ? null : "Choose a stronger password: at least 16 characters, with letters and at least one number.";

/** A password box with a Show/Hide switch, so people can check what they typed. */
function PasswordField(props: { name: string; label: string; autoComplete: string; value?: string; onChange?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14, color: colors.ink }}>
      {props.label}
      <span style={{ position: "relative", display: "block" }}>
        <input name={props.name} type={show ? "text" : "password"} autoComplete={props.autoComplete} required value={props.value} onChange={props.onChange ? (e) => props.onChange?.(e.target.value) : undefined} style={{ ...field, paddingRight: 72 }} />
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", minHeight: 36, padding: "0 10px", background: "transparent", border: 0, color: colors.mintDark, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

/** The new password's rules, ticked as they're met. */
function PasswordRules({ value }: { value: string }) {
  return (
    <ul aria-label="Password rules" style={{ listStyle: "none", margin: "-4px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 13 }}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.ok(value);
        return (
          <li key={r.label} style={{ color: ok ? "#067647" : colors.muted, fontWeight: ok ? 700 : 500 }}>
            {ok ? "✓" : "○"} {r.label}
          </li>
        );
      })}
    </ul>
  );
}

/** What keeps the account safe, said plainly under the form. */
const SAFE_NOTE = "Your password goes straight to Digna's sign-in service (Supabase), which keeps only a scrambled version of it: nobody at Digna can see it. Only you can see your cards, bills and history.";

/** Sign in, or create an account: email and a password. New accounts start with $250 of practice money. */
export function AuthScreen(props: { startWith?: "signin" | "signup"; returnTo?: string | null; onSuccess?: (next: string | null) => void }) {
  const { signIn, signUp, signInDemo, requestPasswordReset, screen } = usePayProxy();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(props.startWith ?? "signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const signingIn = mode === "signin";

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter your email address, like name@example.com.");
    if (signingIn && password.length === 0) return setError("Enter your password.");
    if (mode === "signup") {
      const weak = passwordProblem(password);
      if (weak) return setError(weak);
    }
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
          {signingIn && <PasswordField name="password" label="Password" autoComplete="current-password" />}
          {mode === "signup" && (
            <>
              <PasswordField name="password" label="Choose a password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} />
              <PasswordRules value={newPassword} />
              <p style={{ margin: "-4px 0 0", fontSize: 12.5, color: colors.muted, lineHeight: 1.5 }}>Tip: a short sentence is easy to remember and hard to guess, like &ldquo;blue bike rides fast 7&rdquo;.</p>
            </>
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
          {mode !== "forgot" && <p style={{ margin: 0, fontSize: 12.5, color: colors.muted, lineHeight: 1.55 }}>🔒 {SAFE_NOTE}</p>}
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
  const [typed, setTyped] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const a = String(form.get("password") ?? "");
    const b = String(form.get("again") ?? "");
    setError(null);
    const weak = passwordProblem(a);
    if (weak) return setError(weak);
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
        <PasswordField name="password" label="New password" autoComplete="new-password" value={typed} onChange={setTyped} />
        <PasswordRules value={typed} />
        <PasswordField name="again" label="New password again" autoComplete="new-password" />
        {error && <p role="alert" style={{ margin: 0, color: "#B42318", fontSize: 14 }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "14px 20px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </section>
  );
}
