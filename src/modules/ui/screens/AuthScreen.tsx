import * as React from "react";
import { useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { validateEmail, validatePassword } from "@/modules/ui/lib/validation";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

void PayProxyProvider;
void theme;

export function AuthScreen() {
  const { signInDemo, setScreen } = usePayProxy();
  const [mode, setMode] = useState<string>("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);

  const isSignup: boolean = mode === "signup";

  const emailValid: boolean = email.trim().length > 0 && validateEmail(email) === null;
  const passwordValid: boolean = password.length > 0 && validatePassword(password) === null;
  const nameValid: boolean = !isSignup || displayName.trim().length > 1;

  const emailError: string =
    !touched && email.length === 0
      ? ""
      : email.length === 0
        ? "Enter your email address."
        : validateEmail(email) === null
          ? ""
          : "Enter a valid email address, like you@example.com.";
  const passwordError: string =
    !touched && password.length === 0
      ? ""
      : password.length === 0
        ? "Enter your password."
        : validatePassword(password) === null
          ? ""
          : "Password needs at least 8 characters.";
  const nameError: string =
    !isSignup || (!touched && displayName.length === 0)
      ? ""
      : displayName.trim().length > 1
        ? ""
        : "Enter your name.";

  const invalid: boolean = !emailValid || !passwordValid || !nameValid;

  function handleDemo(): void {
    signInDemo();
    setScreen("dashboard");
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setTouched(true);
    if (!emailValid || !passwordValid || !nameValid) return;
    signInDemo();
    setScreen("dashboard");
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value: string = e.target.value;
    setEmail(value);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value: string = e.target.value;
    setPassword(value);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value: string = e.target.value;
    setDisplayName(value);
  }

  function switchToSignin(): void {
    setMode("signin");
  }

  function switchToSignup(): void {
    setMode("signup");
  }

  function goWelcome(): void {
    setScreen("welcome");
  }

  return (
    <div
      style={{
        background: colors.background,
        fontFamily: typography.fontFamily,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: spacing.lg,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <button
          type="button"
          onClick={goWelcome}
          style={{
            background: "transparent",
            border: "none",
            color: colors.textMuted,
            fontFamily: typography.fontFamily,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            marginBottom: spacing.md,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {"\u2190 Back"}
        </button>

        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            boxShadow: shadows.soft,
            padding: spacing.lg,
          }}
        >
          <h1
            style={{
              color: colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizeMd,
              fontWeight: typography.weightBold,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p
            style={{
              color: colors.textMuted,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              margin: 0,
              marginBottom: spacing.md,
            }}
          >
            Each person sees only their own cards.
          </p>

          <div
            role="tablist"
            aria-label="Sign in or sign up"
            style={{
              display: "flex",
              gap: spacing.sm,
              background: colors.primarySoft,
              borderRadius: radii.pill,
              padding: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              onClick={switchToSignin}
              style={{
                flex: 1,
                border: "none",
                borderRadius: radii.pill,
                padding: `${spacing.sm}px ${spacing.md}px`,
                background: !isSignup ? colors.primary : colors.white,
                color: !isSignup ? colors.white : colors.text,
                fontFamily: typography.fontFamily,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightBold,
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              onClick={switchToSignup}
              style={{
                flex: 1,
                border: "none",
                borderRadius: radii.pill,
                padding: `${spacing.sm}px ${spacing.md}px`,
                background: isSignup ? colors.primary : colors.white,
                color: isSignup ? colors.white : colors.text,
                fontFamily: typography.fontFamily,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightBold,
                cursor: "pointer",
              }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {isSignup ? (
              <div style={{ marginBottom: spacing.md }}>
                <label
                  htmlFor="auth-name"
                  style={{
                    display: "block",
                    color: colors.text,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.sizeSm,
                    fontWeight: typography.weightMedium,
                    marginBottom: spacing.sm,
                  }}
                >
                  Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={handleNameChange}
                  placeholder="Alex Rivera"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.sizeMd,
                    color: colors.text,
                    background: colors.white,
                  }}
                />
                {nameError ? (
                  <p
                    style={{
                      color: colors.danger,
                      fontFamily: typography.fontFamily,
                      fontSize: typography.sizeSm,
                      margin: `${spacing.sm}px 0 0`,
                    }}
                  >
                    {nameError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div style={{ marginBottom: spacing.md }}>
              <label
                htmlFor="auth-email"
                style={{
                  display: "block",
                  color: colors.text,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.sizeSm,
                  fontWeight: typography.weightMedium,
                  marginBottom: spacing.sm,
                }}
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.sizeMd,
                  color: colors.text,
                  background: colors.white,
                }}
              />
              {emailError ? (
                <p
                  style={{
                    color: colors.danger,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.sizeSm,
                    margin: `${spacing.sm}px 0 0`,
                  }}
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label
                htmlFor="auth-password"
                style={{
                  display: "block",
                  color: colors.text,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.sizeSm,
                  fontWeight: typography.weightMedium,
                  marginBottom: spacing.sm,
                }}
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="At least 8 characters"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.sizeMd,
                  color: colors.text,
                  background: colors.white,
                }}
              />
              {passwordError ? (
                <p
                  style={{
                    color: colors.danger,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.sizeSm,
                    margin: `${spacing.sm}px 0 0`,
                  }}
                >
                  {passwordError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={invalid}
              style={{
                width: "100%",
                border: "none",
                borderRadius: radii.pill,
                padding: spacing.md,
                background: colors.primary,
                color: colors.white,
                fontFamily: typography.fontFamily,
                fontSize: typography.sizeMd,
                fontWeight: typography.weightBold,
                cursor: invalid ? "not-allowed" : "pointer",
                opacity: invalid ? 0.5 : 1,
                marginBottom: spacing.sm,
              }}
            >
              {isSignup ? "Sign up" : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleDemo}
            style={{
              width: "100%",
              border: `1px solid ${colors.border}`,
              borderRadius: radii.pill,
              padding: spacing.md,
              background: colors.white,
              color: colors.text,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizeMd,
              fontWeight: typography.weightMedium,
              cursor: "pointer",
            }}
          >
            Continue with demo
          </button>

          <p
            style={{
              color: colors.textMuted,
              background: colors.primarySoft,
              borderRadius: radii.md,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizeSm,
              padding: spacing.md,
              marginTop: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            {testModeMessage}
          </p>
          <p
            style={{
              color: colors.textMuted,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizeSm,
              margin: 0,
            }}
          >
            Forgot your password? Contact support to reset in demo.
          </p>
        </div>
      </div>
    </div>
  );
}
