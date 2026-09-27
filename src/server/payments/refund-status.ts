import type { PaymentRefundResult } from "./types.ts";

export function mapPaystackRefundStatus(status: string | null): PaymentRefundResult["status"] {
  const value = status?.toLowerCase() ?? "";
  if (["processed", "completed", "successful", "success"].includes(value)) return "SUCCEEDED";
  if (["failed", "cancelled", "canceled"].includes(value)) return "FAILED";
  return "PROCESSING";
}

export function mapFlutterwaveRefundStatus(status: string | null): PaymentRefundResult["status"] {
  const value = status?.toLowerCase() ?? "";
  if (["completed-bank-transfer", "completed-momo", "completed-mpgs", "completed-offline", "completed-preauth", "successful", "success"].includes(value)) return "SUCCEEDED";
  if (["failed", "cancelled", "canceled", "error"].includes(value)) return "FAILED";
  return "PROCESSING";
}
