export type PaymentStatusLike = "PENDING" | "INITIALIZED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";
export type OrderStatusLike = "PENDING" | "INITIALIZED" | "PAID" | "FAILED" | "CANCELLED" | "FULFILLED" | "PARTIALLY_FULFILLED" | "PARTIALLY_REFUNDED" | "REFUNDED";

export function settlementDisposition(paymentStatus: PaymentStatusLike, orderStatus: OrderStatusLike): "SETTLE" | "ALREADY_SETTLED" {
  if (paymentStatus === "SUCCEEDED" && ["PAID", "FULFILLED", "PARTIALLY_FULFILLED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(orderStatus)) {
    return "ALREADY_SETTLED";
  }
  return "SETTLE";
}
