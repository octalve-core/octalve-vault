export type HealthStatus = "ok" | "degraded";

export function healthPayload(status: HealthStatus, timestamp = new Date().toISOString()) {
  return { status, service: "octalve-vault", timestamp } as const;
}
