"use client";

import Image from "next/image";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/features/security/turnstile-widget";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, turnstileToken: token }) });
      const data = (await response.json()) as { authenticated?: boolean; error?: string };
      if (!response.ok || !data.authenticated) throw new Error(data.error || "Unable to sign in.");
      router.replace("/admin"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in."); setBusy(false); }
  }

  return <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl sm:p-9"><div className="flex items-center gap-3"><Image src="/brand/vault-logo.png" alt="Octalve Vault" width={48} height={48} className="h-12 w-12 object-contain" /><div><p className="font-extrabold text-white">Octalve Vault</p><p className="text-xs text-white/45">Secure Administration</p></div></div><h1 className="mt-9 text-3xl font-black tracking-[-0.045em] text-white">Welcome back.</h1><p className="mt-2 text-sm leading-6 text-white/45">Sign in with your authorised Admin account.</p><label className="mt-7 block text-sm font-bold text-white/70">Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-white outline-none placeholder:text-white/25 focus:border-[#4C8FFF]" placeholder="admin@octalve.com" /></label><label className="mt-4 block text-sm font-bold text-white/70">Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-white outline-none focus:border-[#4C8FFF]" /></label><div className="mt-5"><TurnstileWidget action="admin_login" onToken={setToken} /></div>{error ? <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}<button type="button" onClick={login} disabled={busy || !email || !password || !token} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-blue-50 disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{busy ? "Signing in…" : "Sign in securely"}</button></div>;
}
