import { createHash } from "node:crypto";

import { requiredEnv } from "@/config/env.server";
import { isCurrency } from "@/config/currencies";
import { PAYMENT_PROVIDER_CAPABILITIES } from "@/config/payments";
import type { CurrencyCode, PaymentEnvironment } from "@/domain/constants";
import { decimalMajorToMinor, minorToMajorString } from "@/domain/money";
import { asRecord, asString } from "@/server/payments/json";
import type {
  PaymentInitializeInput,
  PaymentInitializeResult,
  PaymentProviderAdapter,
  PaymentRefundInput,
  PaymentRefundResult,
  PaymentVerification,
} from "@/server/payments/types";
import { mapFlutterwaveRefundStatus } from "../../refund-status";
import { verifyFlutterwaveWebhookSignature } from "./signature";
import { validateFlutterwaveEnvironment } from "./environment";

function payloadHash(input: PaymentInitializeInput, secret: string): string {
  const amount = minorToMajorString(input.amountMinor);
  const hashedSecret = createHash("sha256").update(secret, "utf8").digest("hex");
  return createHash("sha256")
    .update(`${amount}${input.currency}${input.email}${input.reference}${hashedSecret}`, "utf8")
    .digest("hex");
}

function flutterwaveConfig(): { secret: string; environment: PaymentEnvironment } {
  const secret = requiredEnv("FLUTTERWAVE_SECRET_KEY");
  const environment = validateFlutterwaveEnvironment(requiredEnv("FLUTTERWAVE_ENVIRONMENT"), secret);
  return { secret, environment };
}

export class FlutterwaveAdapter implements PaymentProviderAdapter {
  readonly id = "FLUTTERWAVE" as const;

  configuredEnvironment(): PaymentEnvironment {
    return flutterwaveConfig().environment;
  }

  supportsCurrency(currency: CurrencyCode): boolean {
    return PAYMENT_PROVIDER_CAPABILITIES.FLUTTERWAVE.includes(currency);
  }

  async initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult> {
    const { secret } = flutterwaveConfig();
    const amount = minorToMajorString(input.amountMinor);
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.reference,
        amount,
        currency: input.currency,
        redirect_url: input.callbackUrl,
        customer: { email: input.email },
        customizations: {
          title: "Octalve Vault",
          description: "Secure digital products and business resources",
        },
        meta: input.metadata,
        payload_hash: payloadHash(input, secret),
      }),
      cache: "no-store",
    });
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    const authorizationUrl = asString(data?.link);
    if (!response.ok || root?.status !== "success" || !authorizationUrl) {
      throw new Error(asString(root?.message) || "Flutterwave payment initialization failed.");
    }
    return { reference: input.reference, authorizationUrl, raw };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const { secret, environment } = flutterwaveConfig();
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
      },
    );
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    const customer = asRecord(data?.customer);
    const status = asString(data?.status) || "unknown";
    const responseReference = asString(data?.tx_ref) || reference;
    const currencyText = asString(data?.currency);
    const currency = currencyText && isCurrency(currencyText) ? currencyText : undefined;
    let amountMinor: number | undefined;
    if (typeof data?.amount === "number" || typeof data?.amount === "string") {
      try {
        amountMinor = decimalMajorToMinor(data.amount);
      } catch {
        amountMinor = undefined;
      }
    }
    return {
      successful: response.ok && root?.status === "success" && status === "successful",
      status,
      reference: responseReference,
      providerTxId: data?.id !== undefined && data?.id !== null ? String(data.id) : null,
      amountMinor,
      currency,
      email: asString(customer?.email),
      paidAt: asString(data?.created_at) ? new Date(String(data?.created_at)) : null,
      environment,
      raw,
    };
  }

  async refund(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    const { secret, environment } = flutterwaveConfig();
    if (!input.providerTxId || !/^\d+$/.test(input.providerTxId)) {
      throw new Error("Flutterwave refund requires the verified provider transaction ID.");
    }
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.providerTxId)}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(minorToMajorString(input.amountMinor)),
        comments: input.reason,
      }),
      cache: "no-store",
    });
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    const providerReference = asString(data?.flw_ref) ?? (data?.id !== undefined && data?.id !== null ? String(data.id) : null);
    if (!response.ok || root?.status !== "success" || !providerReference) {
      throw new Error(asString(root?.message) || "Flutterwave refund initiation failed.");
    }
    return { providerReference, environment, status: mapFlutterwaveRefundStatus(asString(data?.status)), raw };
  }

  async fetchRefund(providerReference: string): Promise<PaymentRefundResult> {
    const { secret, environment } = flutterwaveConfig();
    const response = await fetch(`https://api.flutterwave.com/v3/refunds?flw_ref=${encodeURIComponent(providerReference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const rows = Array.isArray(root?.data) ? root.data : [];
    const data = asRecord(rows[0]);
    if (!response.ok || root?.status !== "success" || !data) {
      throw new Error(asString(root?.message) || "Unable to fetch Flutterwave refund status.");
    }
    return {
      providerReference: asString(data.flw_ref) ?? providerReference,
      environment,
      status: mapFlutterwaveRefundStatus(asString(data.status)),
      raw,
    };
  }

  verifyWebhookSignature(rawBody: string, request: Request): boolean {
    return verifyFlutterwaveWebhookSignature(
      rawBody,
      {
        currentSignature: request.headers.get("flutterwave-signature"),
        legacySignature: request.headers.get("verif-hash"),
      },
      requiredEnv("FLUTTERWAVE_WEBHOOK_SECRET"),
    );
  }

  extractWebhookReference(payload: unknown): string | null {
    const root = asRecord(payload);
    const data = asRecord(root?.data);
    return asString(data?.tx_ref) || asString(root?.tx_ref) || asString(data?.reference);
  }

  extractWebhookEventType(payload: unknown): string | null {
    const root = asRecord(payload);
    return asString(root?.event) || asString(root?.event_type);
  }

  extractWebhookEventId(payload: unknown): string | null {
    const root = asRecord(payload);
    const data = asRecord(root?.data);
    const event = this.extractWebhookEventType(payload);
    const id = data?.id ?? root?.id;
    return event && id !== undefined && id !== null ? `${event}:${String(id)}` : null;
  }
}
