import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { validateCardName, validateCapCents, validateEndDateString, parseDollarsInputToCents } from "@/modules/ui/lib/validation";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

type CardFormErrors = {
  name: string | null;
  cap: string | null;
  endDate: string | null;
};

export function CardForm(props: { initialName?: string; initialCapDollars?: string; initialEndDate?: string; submitLabel?: string; isSubmitting?: boolean; onSubmit: (input: { name: string; capCents: number; endDate: string }) => void }) {
  const submitLabel: string = props.submitLabel ?? "Create card";
  const isSubmitting: boolean = props.isSubmitting ?? false;
  const [name, setName] = useState<string>(props.initialName ?? "");
  const [capDollars, setCapDollars] = useState<string>(props.initialCapDollars ?? "");
  const [endDate, setEndDate] = useState<string>(props.initialEndDate ?? "");
  const [errors, setErrors] = useState<CardFormErrors>({ name: null, cap: null, endDate: null });

  function handleNameChange(e: ChangeEvent<HTMLInputElement>): void {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev: CardFormErrors) => ({ ...prev, name: null }));
    }
  }

  function handleCapChange(e: ChangeEvent<HTMLInputElement>): void {
    setCapDollars(e.target.value);
    if (errors.cap) {
      setErrors((prev: CardFormErrors) => ({ ...prev, cap: null }));
    }
  }

  function handleEndDateChange(e: ChangeEvent<HTMLInputElement>): void {
    setEndDate(e.target.value);
    if (errors.endDate) {
      setErrors((prev: CardFormErrors) => ({ ...prev, endDate: null }));
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const nameError: string | null = validateCardName(name);
    const parsedCents: number | null = parseDollarsInputToCents(capDollars);
    let capError: string | null = null;
    if (parsedCents === null) {
      capError = "Enter a cap like 25 or 25.00.";
    } else {
      capError = validateCapCents(parsedCents);
    }
    const endError: string | null = validateEndDateString(endDate);
    setErrors({ name: nameError, cap: capError, endDate: endError });
    if (nameError || capError || endError) {
      return;
    }
    const cleanName: string = name.trim().replace(/\s+/g, " ");
    const cleanEndDate: string = endDate.trim();
    const capCents: number = parsedCents as number;
    props.onSubmit({ name: cleanName, capCents: capCents, endDate: cleanEndDate });
  }

  const palette: typeof theme = theme;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        boxShadow: shadows.soft,
        padding: spacing.lg,
        fontFamily: typography.fontFamily,
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        maxWidth: 440,
      }}
    >
      <div style={{ backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md }}>
        <label
          htmlFor="card-name"
          style={{ display: "block", fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.textMuted, marginBottom: spacing.sm }}
        >
          Card name
        </label>
        <input
          id="card-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Google Cloud"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: typography.fontFamily,
            fontSize: typography.sizeMd,
            color: colors.text,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            padding: spacing.sm,
          }}
        />
        {errors.name ? <p style={{ margin: `${spacing.sm}px 0 0`, fontSize: typography.sizeSm, color: colors.danger }}>{errors.name}</p> : null}
      </div>
      <div>
        <label
          htmlFor="card-cap"
          style={{ display: "block", fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.textMuted, marginBottom: spacing.sm }}
        >
          Spending cap (USD)
        </label>
        <input
          id="card-cap"
          type="text"
          inputMode="decimal"
          value={capDollars}
          onChange={handleCapChange}
          placeholder="25.00"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: palette.typography.fontFamily,
            fontSize: typography.sizeMd,
            color: colors.text,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            padding: spacing.sm,
          }}
        />
        {errors.cap ? <p style={{ margin: `${spacing.sm}px 0 0`, fontSize: typography.sizeSm, color: colors.danger }}>{errors.cap}</p> : null}
      </div>
      <div>
        <label
          htmlFor="card-end"
          style={{ display: "block", fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.textMuted, marginBottom: spacing.sm }}
        >
          End date
        </label>
        <input
          id="card-end"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: typography.fontFamily,
            fontSize: typography.sizeMd,
            color: colors.text,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            padding: spacing.sm,
          }}
        />
        {errors.endDate ? <p style={{ margin: `${spacing.sm}px 0 0`, fontSize: typography.sizeSm, color: colors.danger }}>{errors.endDate}</p> : null}
      </div>
      <p style={{ margin: 0, fontSize: typography.sizeSm, color: colors.textMuted }}>Test mode — No real money moves.</p>
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          marginTop: spacing.sm,
          backgroundColor: colors.primary,
          color: colors.white,
          border: "none",
          borderRadius: radii.md,
          padding: `${spacing.sm}px ${spacing.md}px`,
          fontFamily: typography.fontFamily,
          fontSize: typography.sizeMd,
          fontWeight: typography.weightBold,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? "Creating…" : submitLabel}
      </button>
    </form>
  );
}
