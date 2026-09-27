import { DOWNLOAD_TICKET_TTL_SECONDS } from "../../config/app.ts";
import { publicEnv } from "../../config/env.public.ts";
import { requiredEnv } from "../../config/env.server.ts";
import { normalizeEmail } from "../../domain/email.ts";
import { prisma } from "../../lib/prisma";
import { hashBearerToken } from "../auth/token-hash.ts";
import { createDownloadTicketToken } from "./download-ticket-core.ts";

function isExpired(date: Date | null, now: Date): boolean {
  return date !== null && date.getTime() <= now.getTime();
}

export async function issueDownloadTicket(input: {
  grantId: string;
  customerSessionId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const ticketSecret = requiredEnv("DOWNLOAD_TICKET_SECRET");

  return prisma.$transaction(async (tx) => {
    const session = await tx.customerSession.findUnique({ where: { id: input.customerSessionId } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= now.getTime()) {
      throw new Error("Customer session is not active.");
    }

    const grant = await tx.downloadGrant.findUnique({
      where: { id: input.grantId },
      include: { productAsset: true },
    });
    if (!grant) throw new Error("Download grant not found.");
    if (grant.revokedAt) throw new Error("Download grant has been revoked.");
    if (isExpired(grant.expiresAt, now)) throw new Error("Download grant has expired.");
    if (normalizeEmail(grant.email) !== normalizeEmail(session.email)) throw new Error("Download grant does not belong to this customer session.");
    if (grant.productAsset.status !== "PUBLISHED" && grant.productAsset.status !== "RETIRED") {
      throw new Error("Purchased asset is not available for delivery.");
    }

    const { token, tokenHash } = createDownloadTicketToken({ secret: ticketSecret, bytes: 32 });
    const expiresAt = new Date(now.getTime() + DOWNLOAD_TICKET_TTL_SECONDS * 1000);
    const ticket = await tx.downloadTicket.create({
      data: {
        tokenHash,
        grantId: grant.id,
        productAssetId: grant.productAssetId,
        customerSessionId: session.id,
        expiresAt,
      },
    });
    await tx.downloadGrant.update({
      where: { id: grant.id },
      data: {
        downloadCount: { increment: 1 },
        firstUsedAt: grant.firstUsedAt ?? now,
        lastUsedAt: now,
      },
    });
    await tx.downloadEvent.create({
      data: { grantId: grant.id, ticketId: ticket.id, outcome: "AUTHORIZED" },
    });

    const base = publicEnv.downloadsUrl.replace(/\/$/, "");
    return {
      url: `${base}/d/${token}`,
      expiresAt,
      ticketId: ticket.id,
    };
  });
}

export async function redeemDownloadTicket(input: { rawToken: string; now?: Date }) {
  const now = input.now ?? new Date();
  const tokenHash = hashBearerToken(input.rawToken, requiredEnv("DOWNLOAD_TICKET_SECRET"));

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.downloadTicket.findUnique({
      where: { tokenHash },
      include: {
        grant: true,
        customerSession: true,
        productAsset: true,
      },
    });
    if (!ticket) return null;

    const sessionActive = !ticket.customerSession.revokedAt && ticket.customerSession.expiresAt.getTime() > now.getTime();
    const grantActive = !ticket.grant.revokedAt && !isExpired(ticket.grant.expiresAt, now);
    const emailMatches = normalizeEmail(ticket.grant.email) === normalizeEmail(ticket.customerSession.email);
    const ticketActive = ticket.expiresAt.getTime() > now.getTime();
    const assetAllowed = ticket.productAsset.status === "PUBLISHED" || ticket.productAsset.status === "RETIRED";
    const assetMatches = ticket.grant.productAssetId === ticket.productAssetId;

    if (!ticketActive || !sessionActive || !grantActive || !emailMatches || !assetAllowed || !assetMatches) {
      await tx.downloadEvent.create({
        data: {
          grantId: ticket.grantId,
          ticketId: ticket.id,
          outcome: !ticketActive ? "EXPIRED" : ticket.grant.revokedAt ? "REVOKED" : "DENIED",
        },
      });
      return null;
    }

    await tx.downloadTicket.update({ where: { id: ticket.id }, data: { lastUsedAt: now } });
    await tx.downloadEvent.create({
      data: { grantId: ticket.grantId, ticketId: ticket.id, outcome: "STARTED" },
    });

    return {
      objectKey: ticket.productAsset.objectKey,
      downloadFilename: ticket.productAsset.downloadFilename,
      contentType: ticket.productAsset.contentType,
      sizeBytes: ticket.productAsset.sizeBytes.toString(),
    };
  });
}
