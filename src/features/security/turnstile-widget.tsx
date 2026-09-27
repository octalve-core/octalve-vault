"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/config/env.public";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ action, onToken }: { action: string; onToken: (token: string) => void }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !elementRef.current || !window.turnstile || !publicEnv.turnstileSiteKey || widgetRef.current) return;
    widgetRef.current = window.turnstile.render(elementRef.current, {
      sitekey: publicEnv.turnstileSiteKey,
      action,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [action, onToken, ready]);

  if (!publicEnv.turnstileSiteKey) return <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Turnstile is not configured for this deployment.</p>;
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setReady(true)} /><div ref={elementRef} /></>;
}
