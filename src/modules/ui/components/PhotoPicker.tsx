import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function PhotoPicker(props: {
  previewUrl: string | null;
  isBusy?: boolean;
  error?: string | null;
  onFileChosen: (file: File) => void;
  onClear: () => void;
}) {
  void theme;
  const { previewUrl, isBusy = false, error = null, onFileChosen, onClear } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  function openPicker(): void {
    if (isBusy) {
      return;
    }
    setTypeError(null);
    inputRef.current?.click();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const file: File | undefined = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setTypeError("Please choose an image file (PNG, JPEG or WebP).");
      return;
    }
    setTypeError(null);
    onFileChosen(file);
  }

  const shownError: string | null = typeError ?? error;

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        padding: spacing.lg,
        width: "100%",
      }}
    >
      <p
        style={{
          margin: 0,
          color: colors.text,
          fontSize: typography.sizeMd,
          fontWeight: typography.weightBold,
        }}
      >
        Snap or upload your bill
      </p>
      <p
        style={{
          margin: 0,
          marginTop: spacing.sm,
          color: colors.textMuted,
          fontSize: typography.sizeSm,
          fontWeight: typography.weightMedium,
        }}
      >
        No real charge - photo stays on device for demo.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={isBusy}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {previewUrl ? (
        <div style={{ marginTop: spacing.md }}>
          <img
            src={previewUrl}
            alt="Bill preview"
            style={{
              width: "100%",
              borderRadius: radii.md,
              border: `1px solid ${colors.border}`,
              display: "block",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            <button
              type="button"
              onClick={openPicker}
              disabled={isBusy}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                padding: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              Retake
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={isBusy}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                padding: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          <button
            type="button"
            onClick={openPicker}
            disabled={isBusy}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
              borderRadius: radii.md,
              padding: spacing.sm,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            Choose photo
          </button>
          <button
            type="button"
            onClick={openPicker}
            disabled={isBusy}
            style={{
              flex: 1,
              backgroundColor: colors.white,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              padding: spacing.sm,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            Take photo
          </button>
        </div>
      )}

      {isBusy ? (
        <p
          style={{
            margin: 0,
            marginTop: spacing.md,
            color: colors.textMuted,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
          }}
        >
          Reading bill...
        </p>
      ) : null}

      {shownError ? (
        <p
          style={{
            margin: 0,
            marginTop: spacing.md,
            color: colors.danger,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
          }}
        >
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
