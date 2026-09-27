import type { Locale } from "../../domain/constants.ts";
import { requiredEnv } from "../../config/env.server.ts";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function sendTransactionalEmail(input: { to: string; subject: string; text: string; html: string; fetchImpl?: typeof fetch }) {
  const response = await (input.fetchImpl ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`, "content-type": "application/json" },
    body: JSON.stringify({ from: requiredEnv("EMAIL_FROM"), to: [input.to], subject: input.subject, text: input.text, html: input.html }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Transactional email delivery failed.");
  return (await response.json()) as { id?: string };
}

function otpCopy(locale: Locale, otp: string) {
  if (locale === "fr") return { subject: "Votre code d’accès Octalve Vault", heading: "Votre code de vérification", body: `Votre code Octalve Vault est ${otp}. Il expire dans 10 minutes.` };
  if (locale === "ar") return { subject: "رمز الدخول إلى Octalve Vault", heading: "رمز التحقق الخاص بك", body: `رمز Octalve Vault الخاص بك هو ${otp}. تنتهي صلاحيته خلال 10 دقائق.` };
  return { subject: "Your Octalve Vault access code", heading: "Your verification code", body: `Your Octalve Vault code is ${otp}. It expires in 10 minutes.` };
}

export async function sendVaultAccessOtpEmail(input: { email: string; otp: string; locale: Locale; fetchImpl?: typeof fetch }) {
  const copy = otpCopy(input.locale, input.otp); const otp = escapeHtml(input.otp);
  return sendTransactionalEmail({
    to: input.email, subject: copy.subject,
    text: `${copy.heading}\n\n${copy.body}\n\nIf you did not request this code, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b">OCTALVE VAULT</p><h1 style="font-size:26px;color:#0f172a">${escapeHtml(copy.heading)}</h1><p style="font-size:16px;line-height:1.7;color:#475569">${escapeHtml(copy.body)}</p><div style="margin:26px 0;padding:18px;border-radius:18px;background:#0f172a;color:white;font-size:30px;font-weight:800;letter-spacing:.18em;text-align:center">${otp}</div><p style="font-size:13px;line-height:1.6;color:#94a3b8">If you did not request this code, you can ignore this email.</p></div>`,
    fetchImpl: input.fetchImpl,
  });
}
