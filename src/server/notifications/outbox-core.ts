export type NotificationOutboxState = {
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";
  nextAttemptAt: Date | null;
  attempts: number;
};

const MAX_NOTIFICATION_ATTEMPTS = 5;

export function notificationDedupeKey(type: string, subjectId: string): string {
  const normalizedType = type.trim().toLowerCase().replaceAll("_", "-");
  const normalizedSubject = subjectId.trim();
  if (!normalizedType || !normalizedSubject) throw new Error("Notification dedupe inputs are required.");
  return `${normalizedType}:${normalizedSubject}`;
}

export function notificationDue(job: NotificationOutboxState, now = new Date()): boolean {
  if (job.attempts >= MAX_NOTIFICATION_ATTEMPTS) return false;
  if (job.status === "PENDING") return job.nextAttemptAt === null || job.nextAttemptAt.getTime() <= now.getTime();
  if (job.status !== "FAILED") return false;
  return job.nextAttemptAt !== null && job.nextAttemptAt.getTime() <= now.getTime();
}

export function notificationRetryDelayMs(attemptsAfterFailure: number): number {
  const safeAttempt = Math.max(1, Math.min(MAX_NOTIFICATION_ATTEMPTS, Math.trunc(attemptsAfterFailure)));
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** (safeAttempt - 1));
}
