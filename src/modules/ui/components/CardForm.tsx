import { useState } from "react";
import type { ChangeEvent, FormEvent, FocusEvent } from "react";
import { validateCardName, validateCapCents, validateEndDateString } from "@/modules/ui/lib/validation";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

type CardFormProps = {
  initialName?: string;
  initialCapDollars?: string;
  initialEndDate?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (input: { name: string; capCents: number; endDate: string }) => void;
};

function parseCapDollarsToCents(raw: string): number | null {
  const trimmed: string = raw.trim().replace(/[$,\s]/g, "");
  if (trimmed === "") {
    return null;
  }
  const parsed: number = parseFloat(trimmed);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return null;
  }
  return Math.round(parsed * 100);
}

export function CardForm(props: CardFormProps) {
  const label: string = props.submitLabel ?? "Create card";
  const busy: boolean = props.isSubmitting ?? false;
  const [name, setName] = useState<string>(props.initialName ?? "");
  const [capDollars, setCapDollars] = useState<string>(props.initialCapDollars ?? "");
  const [endDate, setEndDate] = useState<string>(props.initialEndDate ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [capError, setCapError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

  const palette: typeof theme = theme;

  function handleNameChange(e: ChangeEvent<HTMLInputElement>): void {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  }

  function handleCapChange(e: ChangeEvent<HTMLInputElement>): void {
    setCapDollars(e.target.value);
    if (capError) {
      setCapError(null);
    }
  }

  function handleEndChange(e: ChangeEvent<HTMLInputElement>): void {
    setEndDate(e.target.value);
    if (endDateError) {
      setEndDateError(null);
    }
  }

  function handleNameBlur(_e: FocusEvent<HTMLInputElement>): void {
    setNameError(validateCardName(name));
  }

  function handleCapBlur(_e: FocusEvent<HTMLInputElement>): void {
    const cents: number | null = parseCapDollarsToCents(capDollars);
    if (cents === null) {
      setCapError("Enter a cap like 25 or 25.00.");
      return;
    }
    setCapError(validateCapCents(cents));
  }

  function handleEndBlur(_e: FocusEvent<HTMLInputElement>): void {
    setEndDateError(validateEndDateString(endDate));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const nErr: string | null = validateCardName(name);
    const cents: number | null = parseCapDollarsToCents(capDollars);
    const cErr: string | null = cents === null ? "Enter a cap like 25 or 25.00." : validateCapCents(cents);
    const dErr: string | null = validateEndDateString(endDate);
    setNameError(nErr);
    setCapError(cErr);
    setEndDateError(dErr);
    if (nErr || cErr || dErr) {
      return;
    }
    const cleanName: string = name.trim().replace(/\s+/g, " ");
    const cleanEnd: string = endDate.trim();
    const capCents: number = cents as number;
    props.onSubmit({ name: cleanName, capCents: capCents, endDate: cleanEnd });
  }

  const inputStyle: Record<string, string> = {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: typography.body,
    fontSize: "15px",
    color: colors.ink,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: `${radii.card - 6}px`,
    padding: spacing.sm,
  };

  const labelStyle: Record<string, string> = {
    display: "block",
    fontFamily: typography.body,
    fontSize: "13px",
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
  };

  return (
    <section
      className="pp-card pp-lift"
      style={{
        backgroundColor: palette.colors.surface,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.card,
        boxShadow: shadows.soft,
        padding: spacing.lg,
        maxWidth: "440px",
      }}
    >
      <h2 style={{ margin: `0 0 ${spacing.md}`, fontFamily: typography.heading, color: colors.ink, fontSize: "20px" }}>
        New card
      </h2>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        <div>
          <label htmlFor="name" style={labelStyle}>
            Card name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Google Cloud"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            aria-invalid={nameError ? true : false}
            aria-describedby={nameError ? "name-error" : undefined}
            style={inputStyle}
          />
          {nameError ? (
            <p id="name-error" role="alert" style={{ margin: `${spacing.sm} 0 0`, fontFamily: typography.body, fontSize: "13px", color: colors.ink }}>
              {nameError}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="cap" style={labelStyle}>
            Spending cap (USD)
          </label>
          <input
            id="cap"
            name="cap"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="25.00"
            value={capDollars}
            onChange={handleCapChange}
            onBlur={handleCapBlur}
            aria-invalid={capError ? true : false}
            aria-describedby={capError ? "cap-error" : undefined}
            style={inputStyle}
          />
          {capError ? (
            <p id="cap-error" role="alert" style={{ margin: `${spacing.sm} 0 0`, fontFamily: typography.body, fontSize: "13px", color: colors.ink }}>
              {capError}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="endDate" style={labelStyle}>
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            onChange={handleEndChange}
            onBlur={handleEndBlur}
            aria-invalid={endDateError ? true : false}
            aria-describedby={endDateError ? "endDate-error" : undefined}
            style={inputStyle}
          />
          {endDateError ? (
            <p id="endDate-error" role="alert" style={{ margin: `${spacing.sm} 0 0`, fontFamily: typography.body, fontSize: "13px", color: colors.ink }}>
              {endDateError}
            </p>
          ) : null}
        </div>
        {props.serverError ? (
          <p role="alert" style={{ margin: 0, fontFamily: typography.body, fontSize: "13px", color: colors.ink }}>
            {props.serverError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="pp-btn-mint"
          style={{
            backgroundColor: busy ? colors.mintDark : colors.mint,
            color: "#06332A",
            border: "none",
            borderRadius: radii.card,
            padding: `${spacing.sm} ${spacing.md}`,
            fontFamily: typography.body,
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {label}
        </button>
      </form>
    </section>
  );
}
