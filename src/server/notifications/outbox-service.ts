import { requiredEnv } from "../../config/env.server.ts";
import { sendTransactionalEmail } from "./resend.ts";
import { formatMoney } from "../../domain/money.ts";
import { prisma } from "../../lib/prisma";
import { notificationDue, notificationRetryDelayMs } from "./outbox-core.ts";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function localeCopy(locale: string, type: string) {
  if (type === "DOWNLOAD_READY") {
    if (locale === "fr") return { subject: "Vos achats Octalve Vault sont prêts", heading: "Vos téléchargements sont prêts", body: "Votre paiement a été vérifié. Accédez à votre Vault privé pour télécharger vos achats." };
    if (locale === "ar") return { subject: "مشتريات Octalve Vault جاهزة", heading: "تنزيلاتك جاهزة", body: "تم التحقق من دفعتك. ادخل إلى خزنتك الخاصة لتنزيل مشترياتك." };
    return { subject: "Your Octalve Vault purchases are ready", heading: "Your downloads are ready", body: "Your payment has been verified. Access your private Vault to download your purchases." };
  }
  if (type === "REFUND_CONFIRMATION") {
    if (locale === "fr") return { subject: "Mise à jour de votre remboursement Octalve Vault", heading: "Remboursement confirmé", body: "Votre remboursement a été confirmé par le prestataire de paiement." };
    if (locale === "ar") return { subject: "تحديث استرداد Octalve Vault", heading: "تم تأكيد الاسترداد", body: "تم تأكيد استرداد المبلغ من مزود الدفع." };
    return { subject: "Your Octalve Vault refund update", heading: "Refund confirmed", body: "Your refund has been confirmed by the payment provider." };
  }
  return { subject: "Octalve Vault notification", heading: "Octalve Vault", body: "There is an update to your Octalve Vault activity." };
}

async function renderNotification(job: { type: string; payload: unknown; recipientEmail: string }) {
  const payload = job.payload && typeof job.payload === "object" ? job.payload as Record<string, unknown> : {};
  const orderId = typeof payload.orderId === "string" ? payload.orderId : null;
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { locale: true, reference: true, currency: true } }) : null;
  const locale = order?.locale ?? "en";
  const copy = localeCopy(locale, job.type);
  const vaultUrl = `${requiredEnv("APP_URL").replace(/\/$/, "")}/${locale}/vault`;
  let detail = "";
  if (job.type === "REFUND_CONFIRMATION" && typeof payload.amountMinor === "number" && typeof payload.currency === "string") {
    detail = ` Refund amount: ${formatMoney(payload.amountMinor, payload.currency as "NGN" | "USD" | "GBP" | "EUR", locale as "en" | "fr" | "ar")}.`;
  }
  const reference = order?.reference ? ` Order ${order.reference}.` : "";
  const text = `${copy.heading}\n\n${copy.body}${detail}${reference}\n\nOpen your Vault: ${vaultUrl}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b">OCTALVE VAULT</p><h1 style="font-size:26px;color:#0f172a">${escapeHtml(copy.heading)}</h1><p style="font-size:16px;line-height:1.7;color:#475569">${escapeHtml(copy.body + detail + reference)}</p><p style="margin-top:28px"><a href="${escapeHtml(vaultUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700">Open Octalve Vault</a></p></div>`;
  return { to: job.recipientEmail, subject: copy.subject, text, html };
}

export async function processNotificationJob(id: string): Promise<"SENT" | "SKIPPED" | "FAILED"> {
  const now = new Date();
  const job = await prisma.notificationJob.findUnique({ where: { id } });
  if (!job || !notificationDue(job, now)) return "SKIPPED";
  const claimed = await prisma.notificationJob.updateMany({ where: { id, status: job.status, attempts: job.attempts }, data: { status: "PROCESSING", attempts: { increment: 1 }, nextAttemptAt: null } });
  if (claimed.count !== 1) return "SKIPPED";
  try {
    const content = await renderNotification(job);
    await sendTransactionalEmail(content);
    await prisma.notificationJob.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), lastError: null, nextAttemptAt: null } });
    return "SENT";
  } catch (error) {
    const attempts = job.attempts + 1;
    await prisma.notificationJob.update({ where: { id }, data: { status: "FAILED", lastError: (error instanceof Error ? error.message : "Email delivery failed").slice(0, 500), nextAttemptAt: attempts >= 5 ? null : new Date(Date.now() + notificationRetryDelayMs(attempts)) } });
    return "FAILED";
  }
}

export async function processPendingNotifications(limit = 10) {
  const now = new Date();
  const jobs = await prisma.notificationJob.findMany({
    where: {
      attempts: { lt: 5 },
      OR: [
        { status: "PENDING", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
        { status: "FAILED", nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(50, limit)),
    select: { id: true },
  });
  const results = [];
  for (const job of jobs) results.push(await processNotificationJob(job.id));
  return results;
}
