import { useState, type FormEvent } from 'react';
import { usePayProxy } from '@/modules/ui/state/PayProxyProvider';
import { colors, spacing, radii, shadows, typography } from '@/modules/ui/theme';
export function AuthScreen() {
  const { signIn, signUp } = usePayProxy() as unknown as { signIn: (vone: string, vtwo: string) => Promise<void>; signUp: (vone: string, vtwo: string) => Promise<void> };
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [oops, setOops] = useState('');
  const ok = mode === 'signin';
  function pickA(): void {
    setMode('signin');
    setOops('');
  }
  function pickB(): void {
    setMode('signup');
    setOops('');
  }
  async function onGo(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setOops('');
    const d = new FormData(event.currentTarget);
    const v = String(d.get('field-one') ?? '');
    const w = String(d.get('field-two') ?? '');
    try {
      if (ok) {
        await signIn(v, w);
      } else {
        await signUp(v, w);
      }
    } catch {
      setOops('Could not continue. Please try again.');
    } finally {
      event.currentTarget.reset();
    }
  }
  return (
    <section
      className="pp-card"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: radii.card,
        boxShadow: shadows.soft,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h1
        style={{
          ...(typography.heading as unknown as object),
          color: colors.ink,
          margin: 0
        }}
      >
        PayProxy
      </h1>
      <p
        style={{
          ...(typography.body as unknown as object),
          color: colors.muted,
          margin: 0
        }}
      >
        No real money moves.
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: spacing.sm
        }}
      >
        <button
          type="button"
          aria-pressed={ok}
          onClick={pickA}
          style={{
            ...(typography.body as unknown as object),
            backgroundColor: colors.surface,
            color: colors.ink,
            borderColor: colors.line,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: radii.card,
            padding: spacing.md,
            minHeight: 44,
            flex: 1,
            cursor: 'pointer'
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={!ok}
          onClick={pickB}
          style={{
            ...(typography.body as unknown as object),
            backgroundColor: colors.surface,
            color: colors.ink,
            borderColor: colors.line,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: radii.card,
            padding: spacing.md,
            minHeight: 44,
            flex: 1,
            cursor: 'pointer'
          }}
        >
          Create account
        </button>
      </div>
      <form
        onSubmit={onGo}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}
        >
          <label
            htmlFor="field-one"
            style={{ ...(typography.body as unknown as object), color: colors.ink }}
          >
            Email
          </label>
          <input
            id="field-one"
            name="field-one"
            type="email"
            autoComplete="email"
            required
            style={{
              ...(typography.body as unknown as object),
              backgroundColor: colors.surface,
              color: colors.ink,
              borderColor: colors.line,
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: radii.card,
              padding: spacing.md,
              minHeight: 44,
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}
        >
          <label
            htmlFor="field-two"
            style={{ ...(typography.body as unknown as object), color: colors.ink }}
          >
            Password
          </label>
          <input
            id="field-two"
            name="field-two"
            type="password"
            autoComplete={ok ? 'current-password' : 'new-password'}
            required
            style={{
              ...(typography.body as unknown as object),
              backgroundColor: colors.surface,
              color: colors.ink,
              borderColor: colors.line,
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: radii.card,
              padding: spacing.md,
              minHeight: 44,
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {oops !== '' ? <p role="alert" style={{ ...(typography.body as unknown as object), color: colors.ink, margin: 0 }}>{oops}</p> : null}
        <button
          type="submit"
          className="pp-btn-mint"
          style={{
            ...(typography.body as unknown as object),
            padding: spacing.md,
            minHeight: 44,
            borderRadius: radii.card,
            cursor: 'pointer'
          }}
        >
          {ok ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </section>
  );
}
