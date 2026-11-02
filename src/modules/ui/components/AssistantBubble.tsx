import * as React from "react";
import { AssistantScreen } from "@/modules/ui/screens/AssistantScreen";
import { colors, typography } from "@/modules/ui/theme";

/**
 * The money assistant, one tap away on every screen (Nov 2, 2026): a floating button opens it in a panel over the page
 * (the whole screen on a phone), instead of a page of its own in the menu. Escape or the close button puts it away.
 */
export function AssistantBubble(props: { open: boolean; question?: string; signedIn: boolean; onOpen: () => void; onClose: () => void; onSignUp: () => void; onTryDemo: () => void }) {
  const { open, question, signedIn, onOpen, onClose, onSignUp, onTryDemo } = props;
  const close = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose]);
  return (
    <>
      {open && (
        <div className="pp-ask-panel" role="dialog" aria-modal="false" aria-label="Money assistant">
          <div className="pp-ask-head">
            <div>
              <strong>Money assistant</strong>
              <span>Why a card was declined, in plain words · Meta's Muse Spark</span>
            </div>
            <button ref={close} type="button" className="pp-ask-close" onClick={onClose} aria-label="Close the money assistant">
              ×
            </button>
          </div>
          <div className="pp-ask-body">
            {signedIn ? (
              <AssistantScreen key={question ?? "assistant"} initialPrompt={question} inPanel />
            ) : (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, fontFamily: typography.body }}>
                <p style={{ margin: 0, fontFamily: typography.heading, fontSize: 20, fontWeight: 600, color: colors.ink }}>Ask about any decline</p>
                <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>
                  The assistant looks at your own cards and payments, so it needs an account. Make one free (it starts with $250 in practice money), or look around a sample account first.
                </p>
                <button type="button" className="pp-btn-mint" onClick={onSignUp} style={{ background: colors.mint, color: colors.midnight, border: 0, borderRadius: 999, minHeight: 44, padding: "12px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Create a free account
                </button>
                <button type="button" className="pp-btn-secondary" onClick={onTryDemo}>
                  Look around first
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <button type="button" className="pp-ask-fab" onClick={open ? onClose : onOpen} aria-expanded={open} aria-label={open ? "Close the money assistant" : "Open the money assistant"}>
        <span className="pp-ask-fab-dot" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
        </span>
        <span className="pp-ask-fab-label">{open ? "Close" : "Ask Digna"}</span>
      </button>
    </>
  );
}
