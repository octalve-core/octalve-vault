"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/domain/constants";
import { getMessages } from "@/i18n/messages";

import { AccessPanel } from "./sections/access-panel";
import { DownloadsPanel } from "./sections/downloads-panel";
import { OtpPanel } from "./sections/otp-panel";
import type { CustomerGrant } from "./types";

type Stage = "loading" | "access" | "otp" | "ready";

type VaultSnapshot =
  | { authenticated: false }
  | {
      authenticated: true;
      email: string | null;
      grants: CustomerGrant[];
    };

async function fetchVaultSnapshot(locale: Locale): Promise<VaultSnapshot> {
  const [sessionResponse, grantsResponse] = await Promise.all([
    fetch("/api/vault/session", { cache: "no-store" }),
    fetch(`/api/vault/grants?locale=${encodeURIComponent(locale)}`, {
      cache: "no-store",
    }),
  ]);

  if (!sessionResponse.ok || !grantsResponse.ok) {
    return { authenticated: false };
  }

  const session = (await sessionResponse.json()) as {
    authenticated?: boolean;
    email?: string;
  };

  if (!session.authenticated) {
    return { authenticated: false };
  }

  const data = (await grantsResponse.json()) as {
    grants?: CustomerGrant[];
  };

  return {
    authenticated: true,
    email: session.email ?? null,
    grants: data.grants ?? [],
  };
}

export function CustomerVault({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);

  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [grants, setGrants] = useState<CustomerGrant[]>([]);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyGrantId, setBusyGrantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyVaultSnapshot(snapshot: VaultSnapshot) {
    if (!snapshot.authenticated) {
      setGrants([]);
      setMaskedEmail(null);
      setStage("access");
      return;
    }

    setMaskedEmail(snapshot.email);
    setGrants(snapshot.grants);
    setStage("ready");
  }

  useEffect(() => {
    let cancelled = false;

    void fetchVaultSnapshot(locale)
      .then((snapshot) => {
        if (cancelled) return;

        if (!snapshot.authenticated) {
          setStage("access");
          return;
        }

        setMaskedEmail(snapshot.email);
        setGrants(snapshot.grants);
        setStage("ready");
      })
      .catch(() => {
        if (!cancelled) setStage("access");
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  async function requestAccess() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/vault/access/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          turnstileToken,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        challengeId?: string;
        error?: string;
      };

      if (!response.ok || !data.challengeId) {
        throw new Error(data.error || "Unable to request access.");
      }

      setChallengeId(data.challengeId);
      setMessage(messages["vault.genericMessage"]);
      setOtp("");
      setStage("otp");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to request access.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/vault/access/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId, otp }),
      });

      const data = (await response.json()) as {
        verified?: boolean;
        error?: string;
      };

      if (!response.ok || !data.verified) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      const snapshot = await fetchVaultSnapshot(locale);
      applyVaultSnapshot(snapshot);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to verify code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function download(grantId: string) {
    setBusyGrantId(grantId);
    setError(null);

    try {
      const response = await fetch("/api/vault/downloads/authorize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grantId }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to authorize download.");
      }

      window.location.assign(data.url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to authorize download.",
      );
      setBusyGrantId(null);
    }
  }

  async function logout() {
    await fetch("/api/vault/logout", { method: "POST" });
    setGrants([]);
    setMaskedEmail(null);
    setStage("access");
  }

  if (stage === "loading") {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-[0_24px_70px_rgba(0,10,22,.05)]">
        {messages["vault.loading"]}
      </div>
    );
  }

  if (stage === "access") {
    return (
      <AccessPanel
        locale={locale}
        email={email}
        setEmail={setEmail}
        token={turnstileToken}
        setToken={setTurnstileToken}
        busy={busy}
        error={error}
        onSubmit={requestAccess}
      />
    );
  }

  if (stage === "otp") {
    return (
      <OtpPanel
        locale={locale}
        otp={otp}
        setOtp={setOtp}
        message={message}
        busy={busy}
        error={error}
        onVerify={verifyOtp}
        onRestart={() => {
          setStage("access");
          setTurnstileToken("");
          setError(null);
        }}
      />
    );
  }

  return (
    <DownloadsPanel
      locale={locale}
      grants={grants}
      email={maskedEmail}
      busyGrantId={busyGrantId}
      error={error}
      onDownload={download}
      onLogout={logout}
    />
  );
}
