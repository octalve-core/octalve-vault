import { requiredEnv } from "../../config/env.server.ts";

export type TurnstileSiteverifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  "error-codes"?: string[];
};

export function verifyTurnstileResponse(
  result: Pick<TurnstileSiteverifyResponse, "success" | "action">,
  expectedAction: string,
): boolean {
  return result.success === true && result.action === expectedAction;
}

export async function verifyTurnstileToken(input: {
  token: string;
  action: string;
  remoteIp?: string | null;
  idempotencyKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileSiteverifyResponse> {
  const token = input.token.trim();
  if (!token || token.length > 4096) throw new Error("Invalid Turnstile token.");

  const form = new FormData();
  form.set("secret", requiredEnv("TURNSTILE_SECRET_KEY"));
  form.set("response", token);
  if (input.remoteIp) form.set("remoteip", input.remoteIp);
  if (input.idempotencyKey) form.set("idempotency_key", input.idempotencyKey);

  const response = await (input.fetchImpl ?? fetch)(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form, cache: "no-store" },
  );
  if (!response.ok) throw new Error("Turnstile verification service is unavailable.");
  const result = (await response.json()) as TurnstileSiteverifyResponse;
  if (!verifyTurnstileResponse(result, input.action)) {
    throw new Error("Human verification failed.");
  }
  return result;
}
