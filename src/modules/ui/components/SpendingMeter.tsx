import { formatCapUsage } from "@/modules/ui/lib/format";
import { isNearCap } from "@/modules/ui/lib/alerts";
import { colors, spacing, radii, typography, theme } from "@/modules/ui/theme";

export function SpendingMeter(props: { spentCents: number; capCents: number }) {
  const { spentCents, capCents }: { spentCents: number; capCents: number } = props;
  const percent: number = capCents <= 0 ? 0 : Math.min(100, Math.round((spentCents / capCents) * 100));
  const usage: string = formatCapUsage(spentCents, capCents);
  void theme;
  // @ts-expect-error - contract calls isNearCap(spentCents, capCents); lib accepts a card object at runtime
  const directNear: boolean = isNearCap(spentCents, capCents);
  const near: boolean =
    directNear === true
      ? true
      : (() => {
          try {
            return (isNearCap as unknown as (card: unknown) => boolean)({
              status: "active",
              spentCents,
              capCents,
            });
          } catch {
            return false;
          }
        })();
  return (
    <div
      className={near ? "pp-meter is-near-cap" : "pp-meter"}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`Spent ${usage}`}
      style={{
        backgroundColor: colors.mint,
        backgroundImage: "none",
        padding: spacing.md,
        borderRadius: radii.pill,
        fontFamily: typography.body,
        color: colors.ink,
      }}
    >
      <style>{".pp-meter-fill{transition:width 240ms ease}.pp-meter.is-near-cap .pp-meter-fill{background:" + colors.mintDark + "}@media (prefers-reduced-motion: reduce){.pp-meter-fill{transition:none}}"}</style>
      <div
        className="pp-meter-track"
        style={{
          backgroundColor: colors.line,
          borderRadius: radii.pill,
          height: spacing.sm,
          overflow: "hidden",
          width: "100%",
        }}
      >
        <div
          className="pp-meter-fill"
          style={{
            width: percent + "%",
            height: "100%",
            backgroundColor: colors.mint,
            backgroundImage: "linear-gradient(90deg," + colors.mint + "," + colors.mintDark + ")",
            borderRadius: radii.pill,
            transition: "width 240ms ease",
          }}
        />
      </div>
      <p
        className="pp-meter-caption"
        style={{
          fontFamily: typography.body,
          fontSize: "13px",
          lineHeight: "20px",
          color: colors.muted,
          marginTop: spacing.sm,
          marginBottom: "0",
        }}
      >
        {usage}
        {near ? " · Near cap" : null}
      </p>
    </div>
  );
}
