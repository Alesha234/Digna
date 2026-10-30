import * as React from "react";
import { useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { PhotoPicker } from "@/modules/ui/components/PhotoPicker";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import { testModeMessage } from "@/modules/ui/data/demoData";
import type { BillScanResult, AppScreen } from "@/modules/ui/types";

export function SnapBillScreen() {
  void PayProxyProvider;
  void theme;
  const { setLastScan, setScreen } = usePayProxy();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BillScanResult | null>(null);

  function handleFileChosen(next: File): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setFile(next);
    try {
      const url: string = URL.createObjectURL(next);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
    setError(null);
    setResult(null);
  }

  function handleClear(): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }

  function handleRead(): void {
    if (!file || isBusy) return;
    setIsBusy(true);
    setError(null);
    window.setTimeout(() => {
      void (async () => {
        try {
          await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: "Read this test bill" }] }),
          });
        } catch {
          // fallback to demo result below
        }
        try {
          const due: Date = new Date(Date.now() + 14 * 86400000);
          const iso: string = due.toISOString().slice(0, 10);
          const demo: BillScanResult = {
            id: "scan_" + String(Date.now()),
            storeName: "Demo Store",
            amountCents: 4500,
            dueDate: iso,
            confidence: "medium",
          };
          setResult(demo);
        } catch {
          setError("Could not read the bill. Please try again.");
        } finally {
          setIsBusy(false);
        }
      })();
    }, 800);
  }

  function handleUseForCard(): void {
    if (!result) return;
    setLastScan(result);
    const target: AppScreen = "create-card";
    setScreen(target);
  }

  function handleScanAnother(): void {
    handleClear();
  }

  const confidenceColor: string = result
    ? result.confidence === "high"
      ? colors.success
      : result.confidence === "medium"
        ? colors.primary
        : colors.danger
    : colors.textMuted;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: spacing.lg,
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: typography.fontFamily,
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: typography.sizeMd,
          fontWeight: typography.weightBold,
          margin: `0 0 ${spacing.sm}px 0`,
        }}
      >
        Snap a bill
      </h1>
      <p
        style={{
          fontSize: typography.sizeSm,
          fontWeight: typography.weightMedium,
          color: colors.textMuted,
          margin: `0 0 ${spacing.md}px 0`,
        }}
      >
        {testModeMessage} Your photo stays on this device.
      </p>

      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          boxShadow: shadows.soft,
          padding: spacing.md,
        }}
      >
        <PhotoPicker
          previewUrl={previewUrl}
          isBusy={isBusy}
          error={error}
          onFileChosen={handleFileChosen}
          onClear={handleClear}
        />
        <button
          type="button"
          disabled={!file || isBusy}
          onClick={handleRead}
          style={{
            marginTop: spacing.md,
            width: "100%",
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: radii.pill,
            border: "none",
            backgroundColor: !file || isBusy ? colors.border : colors.primary,
            color: colors.white,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            fontFamily: typography.fontFamily,
            cursor: !file || isBusy ? "not-allowed" : "pointer",
            opacity: !file || isBusy ? 0.7 : 1,
          }}
        >
          {isBusy ? "Reading…" : "Read bill"}
        </button>
      </div>

      {result ? (
        <div
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            boxShadow: shadows.soft,
            padding: spacing.md,
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              color: colors.primary,
              backgroundColor: colors.primarySoft,
              borderRadius: radii.pill,
              padding: `4px ${spacing.sm}px`,
              marginBottom: spacing.sm,
            }}
          >
            Bill found
          </div>
          <div style={{ fontSize: typography.sizeMd, fontWeight: typography.weightBold }}>{result.storeName}</div>
          <div style={{ fontSize: typography.sizeMd, fontWeight: typography.weightMedium, marginTop: spacing.sm }}>
            {formatCurrency(result.amountCents)}
          </div>
          <div style={{ fontSize: typography.sizeSm, color: colors.textMuted, marginTop: spacing.sm }}>
            Due {formatDate(result.dueDate)} · Confidence{" "}
            <span style={{ color: confidenceColor, fontWeight: typography.weightBold }}>{result.confidence}</span>
          </div>
          <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
            <button
              type="button"
              onClick={handleUseForCard}
              style={{
                flex: 1,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.pill,
                border: "none",
                backgroundColor: colors.primary,
                color: colors.white,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightBold,
                fontFamily: typography.fontFamily,
                cursor: "pointer",
              }}
            >
              Use for new card
            </button>
            <button
              type="button"
              onClick={handleScanAnother}
              style={{
                flex: 1,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.pill,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.white,
                color: colors.text,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                fontFamily: typography.fontFamily,
                cursor: "pointer",
              }}
            >
              Scan another
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
