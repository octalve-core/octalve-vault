export function assertRefundAmount(orderTotal: number, alreadyRefunded: number, requestedAmount: number): number {
  for (const [name, value] of [["order total", orderTotal], ["already refunded", alreadyRefunded], ["requested refund", requestedAmount]] as const) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer amount.`);
  }
  if (requestedAmount <= 0) throw new Error("Refund amount must be positive.");
  const refundable = orderTotal - alreadyRefunded;
  if (refundable <= 0 || requestedAmount > refundable) throw new Error("Refund amount exceeds the remaining refundable balance.");
  return requestedAmount;
}

export function refundOrderDisposition(orderTotal: number, cumulativeRefunded: number): "FULL" | "PARTIAL" {
  if (!Number.isSafeInteger(orderTotal) || orderTotal <= 0 || !Number.isSafeInteger(cumulativeRefunded) || cumulativeRefunded <= 0) {
    throw new Error("Refund disposition requires positive integer amounts.");
  }
  if (cumulativeRefunded > orderTotal) throw new Error("Refund total cannot exceed order total.");
  return cumulativeRefunded === orderTotal ? "FULL" : "PARTIAL";
}
