import type { CurrencyCode, PaymentEnvironment, PaymentProviderId } from "../../domain/constants";

export type PaymentInitializeInput = {
  reference: string;
  email: string;
  amountMinor: number;
  currency: CurrencyCode;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

export type PaymentInitializeResult = {
  reference: string;
  authorizationUrl: string;
  accessCode?: string | null;
  raw: unknown;
};


export type PaymentRefundInput = {
  paymentReference: string;
  providerTxId?: string | null;
  amountMinor: number;
  currency: CurrencyCode;
  reason: string;
};

export type PaymentRefundResult = {
  providerReference: string;
  environment: PaymentEnvironment;
  status: "PROCESSING" | "SUCCEEDED" | "FAILED";
  raw: unknown;
};

export type PaymentVerification = {
  successful: boolean;
  status: string;
  reference: string;
  providerTxId?: string | null;
  amountMinor?: number;
  currency?: CurrencyCode;
  email?: string | null;
  paidAt?: Date | null;
  environment?: PaymentEnvironment;
  raw: unknown;
};

export interface PaymentProviderAdapter {
  readonly id: PaymentProviderId;
  configuredEnvironment(): PaymentEnvironment;
  supportsCurrency(currency: CurrencyCode): boolean;
  initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult>;
  verify(reference: string): Promise<PaymentVerification>;
  refund(input: PaymentRefundInput): Promise<PaymentRefundResult>;
  fetchRefund(providerReference: string): Promise<PaymentRefundResult>;
  verifyWebhookSignature(rawBody: string, request: Request): boolean;
  extractWebhookReference(payload: unknown): string | null;
  extractWebhookEventId(payload: unknown): string | null;
  extractWebhookEventType(payload: unknown): string | null;
}
