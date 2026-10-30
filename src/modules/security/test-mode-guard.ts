export function assertTestMode(input: { testMode?: unknown }): void {
  if (input.testMode === true) {
    return;
  }
  throw new Error("Demo runs in test mode only.");
}

export function rejectRealPaymentFields(input: Record<string, unknown>): void {
  const forbidden: Set<string> = new Set([
    "cardnumber",
    "cvv",
    "cvc",
    "pan",
    "cardcvv",
    "stripetoken",
    "bankaccount",
    "routingnumber",
    "accountnumber",
  ]);
  const keys: string[] = Object.keys(input);
  for (const key of keys) {
    const lowered: string = key.toLowerCase();
    if (forbidden.has(lowered)) {
      throw new Error("Test mode does not use real payments.");
    }
  }
}
