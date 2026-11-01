import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import type { BillScanResult } from "@/modules/ui/types";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

/**
 * This pay section has moved: there is only one Pay a bill section now.
 * It renders a redirect notice instead of a duplicate bill form, and keeps
 * this file building so existing imports do not break.
 */
export function AddBillScreen(props: { onMakeCard?: (bill: BillScanResult) => void; onGoToPayBill?: () => void }) {
  void props.onMakeCard;
  const { setScreen } = usePayProxy();
  function go(): void {
    if (props.onGoToPayBill) {
      props.onGoToPayBill();
      return;
    }
    setScreen("checkout");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: typography.body, color: colors.ink, maxWidth: 760 }}>
      <section
        aria-label="Pay a bill moved"
        style={{ background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 22 }}
      >
        <h1 style={{ fontFamily: typography.heading, fontSize: 26, margin: "0 0 8px" }}>Pay a bill moved</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>
          Paying a bill now lives in one place: Pay a bill. Upload a screenshot or photo of the practice bill, or paste
          its text, and Meta&apos;s Muse Spark reads the amount, the place or business, and the due date. Practice money only.
        </p>
        <button
          type="button"
          onClick={go}
          style={{ marginTop: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 20px", borderRadius: radii.pill, fontWeight: 700, fontSize: 15, cursor: "pointer", border: 0, background: colors.mint, color: colors.ink }}
        >
          Go to Pay a bill
        </button>
      </section>
    </div>
  );
}
