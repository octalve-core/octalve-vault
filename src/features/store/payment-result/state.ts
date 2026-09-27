export type PaymentResultState =
  | { kind: "verifying"; attempt: number }
  | { kind: "pending"; attempt: number; reference: string }
  | { kind: "pending-final"; reference: string }
  | { kind: "success"; reference: string }
  | { kind: "failed"; reference: string | null };

export type PaymentVerificationPayload = {
  verified?: unknown;
  status?: unknown;
  reference?: unknown;
  error?: unknown;
};

export function nextPaymentResultState(
  current: PaymentResultState,
  payload: PaymentVerificationPayload,
  maxAttempts = 5,
): PaymentResultState {
  const reference = typeof payload.reference === "string" && payload.reference.trim() ? payload.reference : null;
  if (payload.verified === true && reference) return { kind: "success", reference };

  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  const retryable = ["pending", "processing", "ongoing", "queued", "initialized"].includes(status);
  const attempt = current.kind === "verifying" || current.kind === "pending" ? current.attempt : maxAttempts;

  if (payload.verified === false && retryable && reference) {
    return attempt < maxAttempts
      ? { kind: "pending", attempt: attempt + 1, reference }
      : { kind: "pending-final", reference };
  }
  return { kind: "failed", reference };
}
