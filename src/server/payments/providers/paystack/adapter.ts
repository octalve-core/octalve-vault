import { requiredEnv } from "@/config/env.server";
import { isCurrency } from "@/config/currencies";
import { PAYMENT_PROVIDER_CAPABILITIES } from "@/config/payments";
import type { CurrencyCode, PaymentEnvironment } from "@/domain/constants";
import { asNumber, asRecord, asString } from "@/server/payments/json";
import type {
  PaymentInitializeInput,
  PaymentInitializeResult,
  PaymentProviderAdapter,
  PaymentRefundInput,
  PaymentRefundResult,
  PaymentVerification,
} from "@/server/payments/types";
import { mapPaystackRefundStatus } from "../../refund-status";
import { verifyPaystackWebhookSignature } from "./signature";
import { paymentEnvironmentFromPaystackDomain, validatePaystackEnvironment } from "./environment";

function paystackConfig(): { secret: string; environment: PaymentEnvironment } {
  const secret = requiredEnv("PAYSTACK_SECRET_KEY");
  const environment = validatePaystackEnvironment(requiredEnv("PAYSTACK_ENVIRONMENT"), secret);
  return { secret, environment };
}

export class PaystackAdapter implements PaymentProviderAdapter {
  readonly id = "PAYSTACK" as const;

  configuredEnvironment(): PaymentEnvironment {
    return paystackConfig().environment;
  }

  supportsCurrency(currency: CurrencyCode): boolean {
    return PAYMENT_PROVIDER_CAPABILITIES.PAYSTACK.includes(currency);
  }

  async initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult> {
    const { secret } = paystackConfig();
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountMinor),
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: JSON.stringify(input.metadata),
      }),
      cache: "no-store",
    });

    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    const ok = root?.status === true;
    const authorizationUrl = asString(data?.authorization_url);
    const reference = asString(data?.reference);
    if (!response.ok || !ok || !authorizationUrl || !reference) {
      throw new Error(asString(root?.message) || "Paystack payment initialization failed.");
    }
    return {
      reference,
      authorizationUrl,
      accessCode: asString(data?.access_code),
      raw,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const { secret } = paystackConfig();
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
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
    const responseReference = asString(data?.reference) || reference;
    const currencyText = asString(data?.currency);
    const currency = currencyText && isCurrency(currencyText) ? currencyText : undefined;
    const amount = asNumber(data?.amount);
    return {
      successful: response.ok && root?.status === true && status === "success",
      status,
      reference: responseReference,
      providerTxId: data?.id !== undefined && data?.id !== null ? String(data.id) : null,
      amountMinor: amount !== null && Number.isSafeInteger(amount) ? amount : undefined,
      currency,
      email: asString(customer?.email),
      paidAt: asString(data?.paid_at) ? new Date(String(data?.paid_at)) : null,
      environment: paymentEnvironmentFromPaystackDomain(asString(data?.domain)),
      raw,
    };
  }

  async refund(input: PaymentRefundInput): Promise<PaymentRefundResult> {
    const { secret, environment } = paystackConfig();
    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: input.paymentReference,
        amount: input.amountMinor,
        currency: input.currency,
        customer_note: input.reason,
        merchant_note: input.reason,
      }),
      cache: "no-store",
    });
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    const providerReference = data?.id !== undefined && data?.id !== null ? String(data.id) : null;
    if (!response.ok || root?.status !== true || !providerReference) {
      throw new Error(asString(root?.message) || "Paystack refund initiation failed.");
    }
    const transaction = asRecord(data?.transaction);
    const responseEnvironment = paymentEnvironmentFromPaystackDomain(
      asString(data?.domain) ?? asString(transaction?.domain),
    );
    if (!responseEnvironment || responseEnvironment !== environment) {
      throw new Error("Paystack refund environment verification failed.");
    }
    return {
      providerReference,
      environment: responseEnvironment,
      status: mapPaystackRefundStatus(asString(data?.status)),
      raw,
    };
  }

  async fetchRefund(providerReference: string): Promise<PaymentRefundResult> {
    const { secret, environment } = paystackConfig();
    const response = await fetch(`https://api.paystack.co/refund/${encodeURIComponent(providerReference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const raw: unknown = await response.json();
    const root = asRecord(raw);
    const data = asRecord(root?.data);
    if (!response.ok || root?.status !== true || !data) {
      throw new Error(asString(root?.message) || "Unable to fetch Paystack refund status.");
    }
    const responseEnvironment = paymentEnvironmentFromPaystackDomain(asString(data.domain));
    if (!responseEnvironment || responseEnvironment !== environment) {
      throw new Error("Paystack refund environment verification failed.");
    }
    return {
      providerReference: data.id !== undefined && data.id !== null ? String(data.id) : providerReference,
      environment: responseEnvironment,
      status: mapPaystackRefundStatus(asString(data.status)),
      raw,
    };
  }

  verifyWebhookSignature(rawBody: string, request: Request): boolean {
    const { secret } = paystackConfig();
    return verifyPaystackWebhookSignature(
      rawBody,
      request.headers.get("x-paystack-signature"),
      secret,
    );
  }

  extractWebhookReference(payload: unknown): string | null {
    return asString(asRecord(asRecord(payload)?.data)?.reference);
  }

  extractWebhookEventType(payload: unknown): string | null {
    return asString(asRecord(payload)?.event);
  }

  extractWebhookEventId(payload: unknown): string | null {
    const root = asRecord(payload);
    const data = asRecord(root?.data);
    const event = asString(root?.event);
    const id = data?.id;
    return event && id !== undefined && id !== null ? `${event}:${String(id)}` : null;
  }
}
